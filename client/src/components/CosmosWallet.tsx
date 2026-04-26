/**
 * CosmosWallet — Keplr wallet integration for VeriTruth
 *
 * Handles:
 * 1. Keplr detection and chain suggestion (theta-testnet-001)
 * 2. Address retrieval and display
 * 3. Signing and broadcasting anchor transactions
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wallet, ExternalLink, CheckCircle, Loader2, Link2, AlertTriangle } from "lucide-react";

// Cosmos Hub Testnet chain config for Keplr
const THETA_TESTNET_CHAIN_INFO = {
  chainId: "theta-testnet-001",
  chainName: "Cosmos Hub Testnet",
  rpc: "https://rpc.sentry-01.theta-testnet.polypore.xyz",
  rest: "https://rest.sentry-01.theta-testnet.polypore.xyz",
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: "cosmos",
    bech32PrefixAccPub: "cosmospub",
    bech32PrefixValAddr: "cosmosvaloper",
    bech32PrefixValPub: "cosmosvaloperpub",
    bech32PrefixConsAddr: "cosmosvalcons",
    bech32PrefixConsPub: "cosmosvalconspub",
  },
  currencies: [{ coinDenom: "ATOM", coinMinimalDenom: "uatom", coinDecimals: 6 }],
  feeCurrencies: [
    {
      coinDenom: "ATOM",
      coinMinimalDenom: "uatom",
      coinDecimals: 6,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.03 },
    },
  ],
  stakeCurrency: { coinDenom: "ATOM", coinMinimalDenom: "uatom", coinDecimals: 6 },
};

interface CosmosWalletProps {
  verificationId: number;
  onAnchored?: (txHash: string, explorerUrl: string) => void;
  existingTxHash?: string | null;
}

export function CosmosWallet({ verificationId, onAnchored, existingTxHash }: CosmosWalletProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [keplrAvailable, setKeplrAvailable] = useState<boolean | null>(null);

  const buildAnchorMutation = trpc.cosmos.buildAnchorParams.useMutation();
  const recordAnchorMutation = trpc.cosmos.recordAnchor.useMutation();

  useEffect(() => {
    // Check if Keplr is available after page load
    const checkKeplr = () => {
      setKeplrAvailable(!!(window as any).keplr);
    };
    if (document.readyState === "complete") {
      checkKeplr();
    } else {
      window.addEventListener("load", checkKeplr);
      return () => window.removeEventListener("load", checkKeplr);
    }
  }, []);

  const connectKeplr = useCallback(async () => {
    const keplr = (window as any).keplr;
    if (!keplr) {
      toast.error("Keplr wallet not found. Please install the Keplr browser extension.");
      return;
    }

    setIsConnecting(true);
    try {
      // Suggest the testnet chain to Keplr
      await keplr.experimentalSuggestChain(THETA_TESTNET_CHAIN_INFO);
      await keplr.enable(THETA_TESTNET_CHAIN_INFO.chainId);

      const offlineSigner = keplr.getOfflineSigner(THETA_TESTNET_CHAIN_INFO.chainId);
      const accounts = await offlineSigner.getAccounts();
      if (accounts.length === 0) throw new Error("No accounts found in Keplr");

      setAddress(accounts[0].address);
      toast.success("Keplr wallet connected successfully.");
    } catch (err: any) {
      console.error("[Keplr] Connection error:", err);
      toast.error("Failed to connect Keplr: " + (err?.message ?? "Unknown error"));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const anchorOnChain = useCallback(async () => {
    if (!address) {
      toast.error("Please connect your Keplr wallet first.");
      return;
    }

    const keplr = (window as any).keplr;
    if (!keplr) {
      toast.error("Keplr wallet not found.");
      return;
    }

    setIsAnchoring(true);
    try {
      // 1. Get proof and tx params from backend
      const { proof, txParams } = await buildAnchorMutation.mutateAsync({
        verificationId,
        cosmosAddress: address,
      });

      // 2. Dynamically import CosmJS SigningStargateClient
      const { SigningStargateClient, coins } = await import("@cosmjs/stargate");

      const offlineSigner = keplr.getOfflineSigner(THETA_TESTNET_CHAIN_INFO.chainId);

      // 3. Connect signing client
      const client = await SigningStargateClient.connectWithSigner(
        txParams.rpcEndpoint,
        offlineSigner
      );

      // 4. Broadcast a 0-ATOM self-transfer with the proof as memo
      const result = await client.sendTokens(
        address,
        address,
        coins(0, "uatom"),
        { amount: coins(500, "uatom"), gas: "100000" },
        proof // memo = the VeriTruth proof JSON
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed with code ${result.code}: ${result.rawLog}`);
      }

      const txHash = result.transactionHash;

      // 5. Record the tx hash in our database
      const recorded = await recordAnchorMutation.mutateAsync({
        verificationId,
        txHash,
        cosmosAddress: address,
      });

      toast.success("Verification anchored on Cosmos Hub Testnet!");
      onAnchored?.(txHash, recorded.explorerUrl);
    } catch (err: any) {
      console.error("[Cosmos] Anchor error:", err);
      toast.error("Anchoring failed: " + (err?.message ?? "Unknown error"));
    } finally {
      setIsAnchoring(false);
    }
  }, [address, verificationId, buildAnchorMutation, recordAnchorMutation, onAnchored]);

  // Already anchored
  if (existingTxHash) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-chart-2/10 border border-chart-2/20">
        <CheckCircle className="w-5 h-5 text-chart-2 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-chart-2">Anchored on Cosmos</div>
          <div className="text-xs text-muted-foreground font-mono truncate">{existingTxHash}</div>
        </div>
        <a
          href={`https://explorer.polypore.xyz/theta-testnet-001/tx/${existingTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-chart-2 hover:text-chart-2/80 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-primary/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold">Anchor to Cosmos</div>
          <div className="text-xs text-muted-foreground">Record this verification on-chain</div>
        </div>
      </div>

      {/* Chain info */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-xs text-muted-foreground">Cosmos Hub Testnet (theta-testnet-001)</span>
      </div>

      {keplrAvailable === false && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive">
            Keplr extension not detected.{" "}
            <a
              href="https://www.keplr.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
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
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
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
            disabled={isAnchoring}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {isAnchoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Anchoring on Cosmos...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Anchor Verification On-Chain
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            A minimal self-transfer with a proof memo will be signed via Keplr.
          </p>
        </div>
      )}
    </div>
  );
}
