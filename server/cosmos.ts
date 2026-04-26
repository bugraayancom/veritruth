/**
 * VeriTruth — Cosmos Blockchain Integration
 *
 * Anchors verification results on-chain via Cosmos Hub Testnet (theta-testnet-001).
 * Each completed verification is recorded as a MsgSend memo containing a
 * compact JSON proof: { id, claim_hash, score, verdict, timestamp }.
 *
 * Architecture note: This module runs server-side only. The client-side Keplr
 * wallet flow is handled in the frontend CosmosWallet component, which signs
 * transactions locally and broadcasts them through the user's own wallet.
 */

import { StargateClient } from "@cosmjs/stargate";
import { createHash } from "crypto";

// Cosmos Hub Testnet (theta-testnet-001) — public RPC endpoint
export const COSMOS_CHAIN_ID = "theta-testnet-001";
export const COSMOS_RPC_ENDPOINT = "https://rpc.sentry-01.theta-testnet.polypore.xyz";
export const COSMOS_RPC_FALLBACK = "https://cosmos-rpc.publicnode.com:443";
export const COSMOS_REST_ENDPOINT = "https://rest.sentry-01.theta-testnet.polypore.xyz";
export const COSMOS_EXPLORER = "https://explorer.polypore.xyz/theta-testnet-001";
export const COSMOS_DENOM = "uatom";

/**
 * Builds a compact, deterministic proof object for a verification result.
 * This is stored as the memo of a Cosmos transaction.
 */
export function buildVerificationProof(params: {
  verificationId: number;
  claim: string;
  reliabilityScore: number;
  verdict: string;
  agentCount: number;
}): string {
  const claimHash = createHash("sha256").update(params.claim).digest("hex");
  const proof = {
    app: "veritruth",
    version: "1.0",
    id: params.verificationId,
    claim_hash: claimHash.slice(0, 16), // First 8 bytes for brevity
    score: params.reliabilityScore,
    verdict: params.verdict,
    agents: params.agentCount,
    ts: Math.floor(Date.now() / 1000),
  };
  return JSON.stringify(proof);
}

/**
 * Fetches current chain status from the Cosmos testnet RPC.
 * Returns block height, chain ID, and network info.
 */
async function tryConnect(endpoint: string) {
  const client = await StargateClient.connect(endpoint);
  const height = await client.getHeight();
  const chainId = await client.getChainId();
  await client.disconnect();
  return { height, chainId };
}

export async function getChainStatus(): Promise<{
  connected: boolean;
  chainId: string;
  blockHeight: number;
  rpcEndpoint: string;
  explorerUrl: string;
}> {
  const endpoints = [COSMOS_RPC_ENDPOINT, COSMOS_RPC_FALLBACK];
  for (const endpoint of endpoints) {
    try {
      const { height, chainId } = await tryConnect(endpoint);
      return {
        connected: true,
        chainId,
        blockHeight: height,
        rpcEndpoint: endpoint,
        explorerUrl: COSMOS_EXPLORER,
      };
    } catch {
      // try next endpoint
    }
  }
  console.warn("[Cosmos] All RPC endpoints unreachable");
  return {
    connected: false,
    chainId: COSMOS_CHAIN_ID,
    blockHeight: 0,
    rpcEndpoint: COSMOS_RPC_ENDPOINT,
    explorerUrl: COSMOS_EXPLORER,
  };
}

/**
 * Verifies that a given transaction hash exists on-chain and
 * returns its memo (the anchored proof).
 */
export async function verifyOnChainAnchor(txHash: string): Promise<{
  found: boolean;
  memo?: string;
  height?: number;
  timestamp?: string;
}> {
  try {
    const client = await StargateClient.connect(COSMOS_RPC_ENDPOINT);
    const tx = await client.getTx(txHash);
    await client.disconnect();

    if (!tx) return { found: false };

    // Extract memo from raw transaction
    const memo = tx.rawLog ?? "";
    return {
      found: true,
      height: tx.height,
      memo,
    };
  } catch (error) {
    console.error("[Cosmos] Failed to verify anchor:", error);
    return { found: false };
  }
}

/**
 * Generates the Keplr-compatible transaction object for the frontend to sign.
 * The client signs this with their Keplr wallet and broadcasts it.
 */
export function buildAnchorTxParams(params: {
  senderAddress: string;
  proof: string;
}): {
  chainId: string;
  rpcEndpoint: string;
  memo: string;
  senderAddress: string;
  instructions: string;
} {
  return {
    chainId: COSMOS_CHAIN_ID,
    rpcEndpoint: COSMOS_RPC_ENDPOINT,
    memo: params.proof,
    senderAddress: params.senderAddress,
    instructions: `Send a 0 ATOM self-transfer with the following memo to anchor this verification on the Cosmos Hub Testnet: ${params.proof}`,
  };
}
