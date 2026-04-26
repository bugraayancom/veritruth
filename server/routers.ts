import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createVerification,
  updateVerificationStatus,
  getVerificationById,
  getVerificationHistory,
  createAgentResult,
  updateAgentResult,
  getAgentResultsByVerificationId,
  anchorVerificationOnChain,
} from "./db";
import { runAllAgents } from "./agents";
import { computeConsensus } from "./consensus";
import {
  getChainStatus,
  buildVerificationProof,
  buildAnchorTxParams,
  verifyOnChainAnchor,
  hashClaim,
  queryContractVerification,
  queryContractStats,
  COSMOS_EXPLORER,
  COSMOS_CONTRACT_ADDRESS,
  COSMOS_CHAIN_ID,
} from "./cosmos";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  verify: router({
    submit: publicProcedure
      .input(z.object({ claim: z.string().min(10).max(2000) }))
      .mutation(async ({ input }) => {
        const verificationId = await createVerification(input.claim);
        await updateVerificationStatus(verificationId, { status: "processing" });

        const agentTypes = ["source", "logic", "crosscheck"] as const;
        const agentNames: Record<string, string> = {
          source: "Source Verification Agent",
          logic: "Logical Consistency Agent",
          crosscheck: "Cross-Verification Agent",
        };
        const agentIds: Record<string, number> = {};
        for (const type of agentTypes) {
          const id = await createAgentResult({
            verificationId,
            agentType: type,
            agentName: agentNames[type],
            score: 0,
            findings: "",
            sources: "",
            status: "running",
          });
          agentIds[type] = id;
        }

        runAllAgents(input.claim)
          .then(async (results) => {
            for (const result of results) {
              const agentId = agentIds[result.agentType];
              if (agentId) {
                await updateAgentResult(agentId, {
                  score: result.score,
                  findings: result.findings,
                  sources: result.sources,
                  status: result.status,
                });
              }
            }
            const consensus = computeConsensus(results);
            await updateVerificationStatus(verificationId, {
              status: "completed",
              verdict: consensus.verdict,
              reliabilityScore: consensus.reliabilityScore,
              summary: consensus.summary,
            });
          })
          .catch(async (err) => {
            console.error("[verify.submit] Agent run failed:", err);
            await updateVerificationStatus(verificationId, { status: "failed" });
          });

        return { verificationId };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const verification = await getVerificationById(input.id);
        if (!verification) throw new Error("Verification not found");
        const agents = await getAgentResultsByVerificationId(input.id);
        return { verification, agents };
      }),

    history: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getVerificationHistory(input.limit ?? 20);
      }),
  }),

  cosmos: router({
    /**
     * Returns current Cosmos chain status + contract deployment info.
     */
    getChainStatus: publicProcedure.query(async () => {
      return getChainStatus();
    }),

    /**
     * Returns on-chain registry stats (total verifications, verdicts breakdown).
     * Queries the CosmWasm contract if deployed.
     */
    getContractStats: publicProcedure.query(async () => {
      const stats = await queryContractStats();
      return {
        contractDeployed: COSMOS_CONTRACT_ADDRESS.length > 0,
        contractAddress: COSMOS_CONTRACT_ADDRESS,
        stats,
      };
    }),

    /**
     * Checks if a verification has been anchored on-chain by querying the contract.
     */
    checkOnChain: publicProcedure
      .input(z.object({ verificationId: z.number() }))
      .query(async ({ input }) => {
        const verification = await getVerificationById(input.verificationId);
        if (!verification) throw new Error("Verification not found");

        const claimHash = hashClaim(verification.claim);
        const onChainRecord = await queryContractVerification(claimHash);

        return {
          isAnchored: !!onChainRecord || !!verification.txHash,
          txHash: verification.txHash,
          cosmosAddress: verification.cosmosAddress,
          anchoredAt: verification.anchoredAt,
          onChainRecord,
          claimHash,
          explorerUrl: verification.txHash
            ? `${COSMOS_EXPLORER}/txs/${verification.txHash}`
            : null,
        };
      }),

    /**
     * Builds the proof object and Keplr/CosmWasm transaction params for the frontend.
     * Supports both memo-based (lightweight) and CosmWasm contract anchoring.
     */
    buildAnchorParams: publicProcedure
      .input(
        z.object({
          verificationId: z.number(),
          cosmosAddress: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const verification = await getVerificationById(input.verificationId);
        if (!verification) throw new Error("Verification not found");
        if (verification.status !== "completed") {
          throw new Error("Verification must be completed before anchoring");
        }

        const claimHash = hashClaim(verification.claim);
        const proof = buildVerificationProof({
          verificationId: verification.id,
          claim: verification.claim,
          reliabilityScore: verification.reliabilityScore ?? 0,
          verdict: verification.verdict ?? "Suspicious",
          agentCount: 3,
        });

        const txParams = buildAnchorTxParams({
          senderAddress: input.cosmosAddress,
          proof,
          claimHash,
          reliabilityScore: verification.reliabilityScore ?? 0,
          verdict: verification.verdict ?? "Suspicious",
          agentCount: 3,
        });

        return { proof, txParams, claimHash };
      }),

    /**
     * After the user broadcasts the transaction via Keplr, they submit the
     * txHash here so we can record it in the database.
     */
    recordAnchor: publicProcedure
      .input(
        z.object({
          verificationId: z.number(),
          txHash: z.string().min(1),
          cosmosAddress: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await anchorVerificationOnChain(
          input.verificationId,
          input.txHash,
          input.cosmosAddress
        );
        return {
          success: true,
          txHash: input.txHash,
          explorerUrl: `${COSMOS_EXPLORER}/txs/${input.txHash}`,
          chainId: COSMOS_CHAIN_ID,
        };
      }),

    /**
     * Verifies an on-chain anchor by looking up the transaction.
     */
    verifyAnchor: publicProcedure
      .input(z.object({ txHash: z.string() }))
      .query(async ({ input }) => {
        return verifyOnChainAnchor(input.txHash);
      }),
  }),
});

export type AppRouter = typeof appRouter;
