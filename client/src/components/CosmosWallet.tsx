/**
 * CosmosWallet — Keplr wallet integration for VeriTruth
 *
 * Supports two anchoring modes:
 *   1. CosmWasm contract: execute AnchorVerification on the registry contract (when deployed)
 *   2. Memo-based: lightweight self-transfer with proof in memo (fallback)
 *
 * Network: Osmosis Testnet (osmo-test-5) — CosmWasm enabled
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Wallet,
  ExternalLink,
  CheckCircle,
  Loader2,
  Link2,
  AlertTriangle,
  Blocks,
  FileCode2,
} from "lucide-react";

// ─── Osmosis Testnet Chain Config ─────────────────────────────────────────────

const OSMO_TESTNET_CHAIN_INFO = {
  chainId: "osmo-test-5",
  chainName: "Osmosis Testnet",
  rpc: "https://rpc.testnet.osmosis.zone",
  rest: "https://lcd.testnet.osmosis.zone",
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: "osmo",
    bech32PrefixAccPub: "osmopub",
    bech32PrefixValAddr: "osmovaloper",
    bech32PrefixValPub: "osmovaloperpub",
    bech32PrefixConsAddr: "osmovalcons",
    bech32PrefixConsPub: "osmovalconspub",
  },
  currencies: [{ coinDenom: "OSMO", coinMinimalDenom: "uosmo", coinDecimals: 6 }],
  feeCurrencies: [
    {
      coinDenom: "OSMO",
      coinMinimalDenom: "uosmo",
      coinDecimals: 6,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
    },
  ],
  stakeCurrency: { coinDenom: "OSMO", coinMinimalDenom: "uosmo", coinDecimals: 6 },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CosmosWalletProps {
  verificationId: number;
  isVerificationComplete?: boolean;
  onAnchored?: (txHash: string, explorerUrl: string) => void;
  existingTxHash?: string | null;
  existingCosmosAddress?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CosmosWallet({
  verificationId,
  isVerificationComplete = true,
  onAnchored,
  existingTxHash,
  existingCosmosAddress,
}: CosmosWalletProps) {
  const [address, setAddress] = useState<string | null>(existingCosmosAddress ?? null);
  const [txHash, setTxHash] = useState<string | null>(existingTxHash ?? null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [keplrAvailable, setKeplrAvailable] = useState<boolean | null>(null);

  // Chain status + contract info
  const { data: chainStatus } = trpc.cosmos.getChainStatus.useQuery(undefined, {
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  // On-chain status for this verification
  const { data: onChainStatus, refetch: refetchOnChain } =
    trpc.cosmos.checkOnChain.useQuery(
      { verificationId },
      { enabled: isVerificationComplete, staleTime: 10_000 }
    );

  const buildAnchorMutation = trpc.cosmos.buildAnchorParams.useMutation();
  const recordAnchorMutation = trpc.cosmos.recordAnchor.useMutation();

  useEffect(() => {
    const checkKeplr = () => setKeplrAvailable(!!(window as { keplr?: unknown }).keplr);
    if (document.readyState === "complete") checkKeplr();
    else {
      window.addEventListener("load", checkKeplr);
      return () => window.removeEventListener("load", checkKeplr);
    }
  }, []);

  // ─── Connect Keplr ──────────────────────────────────────────────────────────

  const connectKeplr = useCallback(async () => {
    const keplr = (window as { keplr?: { experimentalSuggestChain: (c: object) => Promise<void>; enable: (id: string) => Promise<void>; getOfflineSigner: (id: string) => { getAccounts: () => Promise<Array<{ address: string }>> } } }).keplr;
    if (!keplr) {
      toast.error("Keplr wallet not found. Please install the Keplr browser extension.");
      return;
    }
    setIsConnecting(true);
    try {
      await keplr.experimentalSuggestChain(OSMO_TESTNET_CHAIN_INFO);
      await keplr.enable(OSMO_TESTNET_CHAIN_INFO.chainId);
      const signer = keplr.getOfflineSigner(OSMO_TESTNET_CHAIN_INFO.chainId);
      const accounts = await signer.getAccounts();
      if (!accounts.length) throw new Error("No accounts found in Keplr");
      setAddress(accounts[0].address);
      toast.success("Keplr wallet connected!", {
        description: `${accounts[0].address.slice(0, 14)}...${accounts[0].address.slice(-6)}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to connect Keplr: " + msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ─── Anchor to Cosmos ────────────────────────────────────────────────────────

  const anchorOnChain = useCallback(async () => {
    if (!address) { toast.error("Connect your Keplr wallet first."); return; }
    const keplr = (window as { keplr?: { getOfflineSigner: (id: string) => unknown } }).keplr;
    if (!keplr) { toast.error("Keplr wallet not found."); return; }

    setIsAnchoring(true);
    try {
      // 1. Get proof + tx params from backend
      const { proof, txParams } = await buildAnchorMutation.mutateAsync({
        verificationId,
        cosmosAddress: address,
      });

      // 2. Import CosmJS dynamically
      const { GasPrice } = await import("@cosmjs/stargate");
      const offlineSigner = keplr.getOfflineSigner(OSMO_TESTNET_CHAIN_INFO.chainId);
      let broadcastedTxHash: string;

      if (txParams.contractDeployed && txParams.contractAddress) {
        // ── Mode A: CosmWasm contract execution ──────────────────────────────
        const { SigningCosmWasmClient } = await import("@cosmjs/cosmwasm-stargate");
        const client = await SigningCosmWasmClient.connectWithSigner(
          txParams.rpcEndpoint,
          offlineSigner as Parameters<typeof SigningCosmWasmClient.connectWithSigner>[1],
          { gasPrice: GasPrice.fromString(`0.025${txParams.denom}`) }
        );
        const result = await client.execute(
          address,
          txParams.contractAddress,
          txParams.executeMsg,
          "auto",
          `VeriTruth Registry | Verification #${verificationId}`
        );
        broadcastedTxHash = result.transactionHash;
        toast.success("Anchored via CosmWasm contract!", {
          description: `TX: ${broadcastedTxHash.slice(0, 16)}...`,
        });
      } else {
        // ── Mode B: Memo-based self-transfer ─────────────────────────────────
        const { SigningStargateClient } = await import("@cosmjs/stargate");
        const client = await SigningStargateClient.connectWithSigner(
          txParams.rpcEndpoint,
          offlineSigner as Parameters<typeof SigningStargateClient.connectWithSigner>[1],
          { gasPrice: GasPrice.fromString(`0.025${txParams.denom}`) }
        );
        const result = await client.sendTokens(
          address,
          address,
          [{ denom: txParams.denom, amount: "1" }],
          "auto",
          proof
        );
        broadcastedTxHash = result.transactionHash;
        toast.success("Anchored on Cosmos via memo!", {
          description: `TX: ${broadcastedTxHash.slice(0, 16)}...`,
        });
      }

      // 3. Record in database
      const recorded = await recordAnchorMutation.mutateAsync({
        verificationId,
        txHash: broadcastedTxHash,
        cosmosAddress: address,
      });

      setTxHash(broadcastedTxHash);
      await refetchOnChain();
      onAnchored?.(broadcastedTxHash, recorded.explorerUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Anchoring failed: " + msg);
    } finally {
      setIsAnchoring(false);
    }
  }, [address, verificationId, buildAnchorMutation, recordAnchorMutation, onAnchored, refetchOnChain]);

  // ─── Derived state ───────────────────────────────────────────────────────────

  const isAnchored = !!(txHash || onChainStatus?.isAnchored);
  const explorerUrl = onChainStatus?.explorerUrl ?? (txHash ? `https://testnet.mintscan.io/osmosis-testnet/txs/${txHash}` : null);
  const contractDeployed = chainStatus?.contractDeployed ?? false;
  const displayTxHash = txHash ?? onChainStatus?.txHash ?? null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isAnchored && displayTxHash) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-chart-2/10 border border-chart-2/20">
        <CheckCircle className="w-5 h-5 text-chart-2 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-chart-2">Anchored on Cosmos</span>
            {contractDeployed && (
              <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-400 px-1.5 py-0">
                <FileCode2 className="h-2.5 w-2.5 mr-1" />
                CosmWasm
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">{displayTxHash}</div>
        </div>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-chart-2 hover:text-chart-2/80 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Anchor to Cosmos</div>
            <div className="text-xs text-muted-foreground">Record this verification on-chain</div>
          </div>
        </div>
        {chainStatus?.connected && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                #{chainStatus.blockHeight.toLocaleString()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {chainStatus.chainId}
              {contractDeployed ? " · CosmWasm contract active" : " · Memo anchoring"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Chain info */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 mb-4">
        <Blocks className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-muted-foreground">
          Osmosis Testnet (osmo-test-5)
          {contractDeployed && (
            <span className="ml-1.5 text-violet-400">· CosmWasm Registry</span>
          )}
        </span>
      </div>

      {keplrAvailable === false && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive">
            Keplr extension not detected.{" "}
            <a href="https://www.keplr.app/download" target="_blank" rel="noopener noreferrer" className="underline">
              Install Keplr
            </a>{" "}
            to anchor verifications on-chain.
          </div>
        </div>
      )}

      {!address ? (
        <Button
          onClick={connectKeplr}
          disabled={isConnecting || keplrAvailable === false}
          variant="outline"
          className="w-full border-primary/30 hover:border-primary/60 hover:bg-primary/5 gap-2"
        >
          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          {isConnecting ? "Connecting..." : "Connect Keplr Wallet"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-mono text-foreground/80 truncate">{address}</span>
          </div>
          <Button
            onClick={anchorOnChain}
            disabled={isAnchoring || !isVerificationComplete}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {isAnchoring ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Anchoring on Cosmos...</>
            ) : (
              <><Link2 className="w-4 h-4" />{contractDeployed ? "Anchor via Contract" : "Anchor Verification On-Chain"}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {contractDeployed
              ? "Results will be stored in the on-chain CosmWasm registry."
              : "A minimal self-transfer with a proof memo will be signed via Keplr."}
          </p>
        </div>
      )}
    </div>
  );
}
