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
} from "./db";
import { runAllAgents } from "./agents";
import { computeConsensus } from "./consensus";

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
    // Yeni iddia gönder ve analiz başlat
    submit: publicProcedure
      .input(z.object({ claim: z.string().min(10).max(2000) }))
      .mutation(async ({ input }) => {
        // 1. Verification kaydı oluştur
        const verificationId = await createVerification(input.claim);
        await updateVerificationStatus(verificationId, { status: "processing" });

        // 2. Ajan placeholder kayıtları oluştur
        const agentTypes = ["source", "logic", "crosscheck"] as const;
        const agentNames: Record<string, string> = {
          source: "Kaynak Doğrulama Ajanı",
          logic: "Mantıksal Tutarlılık Ajanı",
          crosscheck: "Çapraz Doğrulama Ajanı",
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

        // 3. Ajanları çalıştır (arka planda, sonucu DB'ye yaz)
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
            // 4. Konsensüs hesapla
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

    // Tek bir verification'ı getir (polling için)
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const verification = await getVerificationById(input.id);
        if (!verification) throw new Error("Verification not found");
        const agents = await getAgentResultsByVerificationId(input.id);
        return { verification, agents };
      }),

    // Geçmiş doğrulamalar
    history: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getVerificationHistory(input.limit ?? 20);
      }),
  }),
});

export type AppRouter = typeof appRouter;
