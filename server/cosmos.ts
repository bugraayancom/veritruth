/**
 * VeriTruth — Cosmos Blockchain Integration
 *
 * Two-layer on-chain anchoring:
 *   1. Memo-based (Keplr wallet, client-side): lightweight, no gas cost for server
 *   2. CosmWasm contract (server-side or Keplr): full on-chain registry with queryable state
 *
 * Contract: veritruth-registry (deployed on Osmosis Testnet osmo-test-5)
 * The contract stores: claim_hash, reliability_score, verdict, agent_count, anchored_by, timestamp
 */

import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StargateClient } from "@cosmjs/stargate";
import { createHash } from "crypto";

// ─── Chain Configuration ──────────────────────────────────────────────────────

/** Primary: Osmosis Testnet — CosmWasm enabled */
export const COSMOS_CHAIN_ID = "osmo-test-5";
export const COSMOS_RPC_ENDPOINT = "https://rpc.testnet.osmosis.zone";
export const COSMOS_REST_ENDPOINT = "https://lcd.testnet.osmosis.zone";
export const COSMOS_DENOM = "uosmo";
export const COSMOS_EXPLORER = "https://testnet.mintscan.io/osmosis-testnet";
export const COSMOS_FAUCET = "https://faucet.testnet.osmosis.zone";

/** Fallback: Cosmos Hub Mainnet (read-only, no CosmWasm) */
export const COSMOS_RPC_FALLBACK = "https://cosmos-rpc.publicnode.com:443";

/**
 * CosmWasm contract address on Osmosis Testnet.
 * Set COSMOS_CONTRACT_ADDRESS env var after deploying with:
 *   cd contracts/veritruth-registry && MNEMONIC="..." node deploy.mjs
 */
export const COSMOS_CONTRACT_ADDRESS =
  process.env.COSMOS_CONTRACT_ADDRESS ?? "";

// ─── Proof Utilities ──────────────────────────────────────────────────────────

/**
 * Builds a compact, deterministic proof object for a verification result.
 * Used as the memo of a Cosmos transaction (memo-based anchoring).
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
    claim_hash: claimHash.slice(0, 16),
    score: params.reliabilityScore,
    verdict: params.verdict,
    agents: params.agentCount,
    ts: Math.floor(Date.now() / 1000),
  };
  return JSON.stringify(proof);
}

/** Returns the SHA-256 hash of a claim string (hex, full 64 chars). */
export function hashClaim(claim: string): string {
  return createHash("sha256").update(claim).digest("hex");
}

// ─── Chain Status ─────────────────────────────────────────────────────────────

async function tryConnectStargate(endpoint: string) {
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
  contractAddress: string;
  contractDeployed: boolean;
}> {
  const endpoints = [COSMOS_RPC_ENDPOINT, COSMOS_RPC_FALLBACK];
  for (const endpoint of endpoints) {
    try {
      const { height, chainId } = await tryConnectStargate(endpoint);
      return {
        connected: true,
        chainId,
        blockHeight: height,
        rpcEndpoint: endpoint,
        explorerUrl: COSMOS_EXPLORER,
        contractAddress: COSMOS_CONTRACT_ADDRESS,
        contractDeployed: COSMOS_CONTRACT_ADDRESS.length > 0,
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
    contractAddress: COSMOS_CONTRACT_ADDRESS,
    contractDeployed: false,
  };
}

// ─── CosmWasm Contract Queries ────────────────────────────────────────────────

/**
 * Queries the on-chain registry for a specific verification by its claim hash.
 * Returns null if the contract is not deployed or the entry is not found.
 */
export async function queryContractVerification(claimHash: string): Promise<{
  claim_hash: string;
  reliability_score: number;
  verdict: string;
  agent_count: number;
  anchored_by: string;
  timestamp: number;
} | null> {
  if (!COSMOS_CONTRACT_ADDRESS) return null;
  try {
    const client = await CosmWasmClient.connect(COSMOS_RPC_ENDPOINT);
    const result = await client.queryContractSmart(COSMOS_CONTRACT_ADDRESS, {
      get_verification: { claim_hash: claimHash },
    });
    await client.disconnect();
    return result;
  } catch {
    return null;
  }
}

/**
 * Queries aggregate stats from the on-chain registry.
 */
export async function queryContractStats(): Promise<{
  total_verifications: number;
  verified_count: number;
  suspicious_count: number;
  false_count: number;
} | null> {
  if (!COSMOS_CONTRACT_ADDRESS) return null;
  try {
    const client = await CosmWasmClient.connect(COSMOS_RPC_ENDPOINT);
    const result = await client.queryContractSmart(COSMOS_CONTRACT_ADDRESS, {
      stats: {},
    });
    await client.disconnect();
    return result;
  } catch {
    return null;
  }
}

/**
 * Lists recent verifications from the on-chain registry.
 */
export async function queryContractList(
  limit = 10,
  startAfter?: string
): Promise<Array<{
  claim_hash: string;
  verdict: string;
  reliability_score: number;
  timestamp: number;
}> | null> {
  if (!COSMOS_CONTRACT_ADDRESS) return null;
  try {
    const client = await CosmWasmClient.connect(COSMOS_RPC_ENDPOINT);
    const result = await client.queryContractSmart(COSMOS_CONTRACT_ADDRESS, {
      list_verifications: { limit, start_after: startAfter },
    });
    await client.disconnect();
    return result?.verifications ?? [];
  } catch {
    return null;
  }
}

// ─── Transaction Verification ─────────────────────────────────────────────────

/**
 * Verifies that a given transaction hash exists on-chain.
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
    return {
      found: true,
      height: tx.height,
      memo: tx.rawLog ?? "",
    };
  } catch (error) {
    console.error("[Cosmos] Failed to verify anchor:", error);
    return { found: false };
  }
}

// ─── Frontend Tx Builder ──────────────────────────────────────────────────────

/**
 * Generates the Keplr-compatible transaction parameters for the frontend to sign.
 * The client signs this with their Keplr wallet and broadcasts it.
 *
 * Two modes:
 *   - memo: lightweight self-transfer with proof in memo (no contract required)
 *   - contract: execute AnchorVerification on the CosmWasm registry
 */
export function buildAnchorTxParams(params: {
  senderAddress: string;
  proof: string;
  claimHash: string;
  reliabilityScore: number;
  verdict: string;
  agentCount: number;
}): {
  chainId: string;
  rpcEndpoint: string;
  denom: string;
  memo: string;
  senderAddress: string;
  contractAddress: string;
  contractDeployed: boolean;
  executeMsg: object;
  explorerUrl: string;
  faucetUrl: string;
} {
  return {
    chainId: COSMOS_CHAIN_ID,
    rpcEndpoint: COSMOS_RPC_ENDPOINT,
    denom: COSMOS_DENOM,
    memo: params.proof,
    senderAddress: params.senderAddress,
    contractAddress: COSMOS_CONTRACT_ADDRESS,
    contractDeployed: COSMOS_CONTRACT_ADDRESS.length > 0,
    executeMsg: {
      anchor_verification: {
        claim_hash: params.claimHash,
        reliability_score: params.reliabilityScore,
        verdict: params.verdict,
        agent_count: params.agentCount,
      },
    },
    explorerUrl: COSMOS_EXPLORER,
    faucetUrl: COSMOS_FAUCET,
  };
}
