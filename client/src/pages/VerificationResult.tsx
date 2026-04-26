import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Shield, Search, Zap, CheckCircle, AlertTriangle, XCircle, ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import { CosmosWallet } from "@/components/CosmosWallet";
import { useState } from "react";

const AGENT_META = {
  source: { label: "Source Verification Agent", icon: <Search className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  logic: { label: "Logical Consistency Agent", icon: <Zap className="w-4 h-4" />, color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/20" },
  crosscheck: { label: "Cross-Verification Agent", icon: <Shield className="w-4 h-4" />, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" },
};

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "Verified") return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full verdict-verified text-sm font-semibold">
      <CheckCircle className="w-4 h-4" /> Verified
    </span>
  );
  if (verdict === "Suspicious") return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full verdict-suspicious text-sm font-semibold">
      <AlertTriangle className="w-4 h-4" /> Suspicious
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full verdict-false text-sm font-semibold">
      <XCircle className="w-4 h-4" /> False
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "oklch(0.65 0.18 155)" : score >= 40 ? "oklch(0.75 0.18 75)" : "oklch(0.60 0.22 25)";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="absolute">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="oklch(0.22 0.015 260)" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1.5s ease" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold">{score}</div>
        <div className="text-xs text-muted-foreground">/100</div>
      </div>
    </div>
  );
}

export default function VerificationResult() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const [anchoredTxHash, setAnchoredTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.verify.getById.useQuery({ id }, { enabled: !!id });
  const { data: chainStatus } = trpc.cosmos.getChainStatus.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading results...</div>
      </div>
    );
  }

  if (!data?.verification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Verification not found.</div>
          <a href="/" className="text-primary hover:underline text-sm">Return to home</a>
        </div>
      </div>
    );
  }

  const { verification, agents } = data;
  const currentTxHash = anchoredTxHash ?? verification.txHash ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-lg tracking-tight">VeriTruth</span>
            </a>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm text-muted-foreground">Result #{id}</span>
          </div>
          {/* Chain status pill */}
          {chainStatus && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
              <div className={`w-2 h-2 rounded-full ${chainStatus.connected ? "bg-chart-2" : "bg-destructive"}`} />
              <span className="text-xs text-muted-foreground">
                {chainStatus.connected
                  ? `Cosmos Testnet · Block #${chainStatus.blockHeight.toLocaleString()}`
                  : "Cosmos Offline"}
              </span>
            </div>
          )}
        </div>
      </nav>

      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </a>

          {/* Summary card */}
          <div className="glass-card rounded-2xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <ScoreRing score={verification.reliabilityScore ?? 0} />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  Proof of Reliability
                </div>
                <div className="text-4xl font-bold mb-3">
                  {verification.reliabilityScore ?? 0}
                  <span className="text-lg text-muted-foreground font-normal">/100</span>
                </div>
                {verification.verdict && <VerdictBadge verdict={verification.verdict} />}
              </div>
            </div>

            {/* Claim */}
            <div className="mt-6 pt-6 border-t border-border/30">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Analyzed Claim</div>
              <p className="text-sm leading-relaxed text-foreground/90">{verification.claim}</p>
            </div>

            {/* Summary */}
            {verification.summary && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Consensus Summary</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{verification.summary}</p>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Clock className="w-3 h-3" />
              {new Date(verification.createdAt).toLocaleString("en-US")}
            </div>
          </div>

          {/* Cosmos Anchor section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Blockchain Anchor
              <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Cosmos Hub Testnet
              </span>
            </h2>

            {currentTxHash ? (
              <div className="glass-card rounded-xl p-5 border border-chart-2/20">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-chart-2 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-chart-2">Anchored on Cosmos Hub Testnet</div>
                    <div className="text-xs text-muted-foreground">This verification result is permanently recorded on-chain</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 mb-3">
                  <span className="text-xs text-muted-foreground font-medium">TX Hash:</span>
                  <span className="text-xs font-mono text-foreground/80 truncate flex-1">{currentTxHash}</span>
                </div>
                <a
                  href={explorerUrl ?? `https://explorer.polypore.xyz/theta-testnet-001/tx/${currentTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Cosmos Explorer
                </a>
              </div>
            ) : (
              <CosmosWallet
                verificationId={id}
                existingTxHash={null}
                onAnchored={(txHash, url) => {
                  setAnchoredTxHash(txHash);
                  setExplorerUrl(url);
                  refetch();
                }}
              />
            )}
          </div>

          {/* Agent results */}
          <h2 className="text-lg font-semibold mb-4">Agent Findings</h2>
          <div className="space-y-4 mb-10">
            {(["source", "logic", "crosscheck"] as const).map((agentType) => {
              const meta = AGENT_META[agentType];
              const agent = agents.find((a) => a.agentType === agentType);
              if (!agent) return null;

              return (
                <div key={agentType} className={`glass-card rounded-xl p-6 border ${meta.border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center ${meta.color} shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{meta.label}</div>
                    </div>
                    <div className={`text-lg font-bold ${meta.color}`}>{agent.score}<span className="text-xs text-muted-foreground font-normal">/100</span></div>
                  </div>

                  <div className="mb-4">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${agent.score >= 70 ? "bg-chart-2" : agent.score >= 40 ? "bg-chart-3" : "bg-destructive"}`}
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                  </div>

                  {agent.findings && (
                    <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
                      <Streamdown>{agent.findings}</Streamdown>
                    </div>
                  )}

                  {agent.sources && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Sources</div>
                      <p className="text-xs text-muted-foreground/70">{agent.sources}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1 border-border/50">
              <a href="/history">
                <Clock className="w-4 h-4 mr-2" />
                View History
              </a>
            </Button>
            <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/">
                <Search className="w-4 h-4 mr-2" />
                New Analysis
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
