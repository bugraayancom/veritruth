import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Shield, Search, Zap, CheckCircle, Clock, AlertCircle } from "lucide-react";

const AGENT_META = {
  source: { label: "Source Verification Agent", icon: <Search className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
  logic: { label: "Logical Consistency Agent", icon: <Zap className="w-4 h-4" />, color: "text-chart-2", bg: "bg-chart-2/10" },
  crosscheck: { label: "Cross-Verification Agent", icon: <Shield className="w-4 h-4" />, color: "text-chart-3", bg: "bg-chart-3/10" },
};

export default function VerificationLive() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.verify.getById.useQuery(
    { id },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.verification?.status;
        if (status === "completed" || status === "failed") return false;
        return 2000;
      },
      enabled: !!id,
    }
  );

  useEffect(() => {
    if (data?.verification?.status === "completed") {
      setTimeout(() => navigate(`/result/${id}`), 1200);
    }
  }, [data?.verification?.status, id, navigate]);

  const verification = data?.verification;
  const agents = data?.agents ?? [];

  const completedCount = agents.filter((a) => a.status === "completed").length;
  const totalAgents = 3;
  const progress = Math.round((completedCount / totalAgents) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center h-16 gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">VeriTruth</span>
          </a>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm text-muted-foreground">Analysis #{id}</span>
        </div>
      </nav>

      <div className="container py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <div className="w-2 h-2 rounded-full bg-primary agent-running" />
              Analysis in Progress
            </div>
            <h1 className="text-2xl font-semibold mb-2">AI Agents Working</h1>
            <p className="text-muted-foreground text-sm">
              Specialized agents are analyzing your claim in parallel
            </p>
          </div>

          {/* Claim */}
          {verification && (
            <div className="glass-card rounded-xl p-5 mb-8">
              <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Claim Being Analyzed</div>
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{verification.claim}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{completedCount}/{totalAgents} agents completed</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Agent cards */}
          <div className="space-y-4">
            {(["source", "logic", "crosscheck"] as const).map((agentType) => {
              const meta = AGENT_META[agentType];
              const agentData = agents.find((a) => a.agentType === agentType);
              const status = agentData?.status ?? "pending";

              return (
                <div key={agentType} className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center ${meta.color} shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{meta.label}</div>
                    </div>
                    <div className="shrink-0">
                      {status === "completed" && (
                        <div className="flex items-center gap-1.5 text-xs text-chart-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Completed</span>
                        </div>
                      )}
                      {status === "running" && (
                        <div className="flex items-center gap-1.5 text-xs text-primary agent-running">
                          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span>Running</span>
                        </div>
                      )}
                      {status === "pending" && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Waiting</span>
                        </div>
                      )}
                      {status === "failed" && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>Error</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {status === "completed" && agentData && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Reliability Score</span>
                        <span className={`font-semibold ${meta.color}`}>{agentData.score}/100</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            agentData.score >= 70 ? "bg-chart-2" : agentData.score >= 40 ? "bg-chart-3" : "bg-destructive"
                          }`}
                          style={{ width: `${agentData.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {verification?.status === "completed" && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-chart-2 text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Analysis complete! Redirecting to results...</span>
              </div>
            </div>
          )}

          {verification?.status === "failed" && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>An error occurred during analysis.</span>
              </div>
              <a href="/" className="block mt-4 text-sm text-primary hover:underline">
                Return to home
              </a>
            </div>
          )}

          {isLoading && !verification && (
            <div className="text-center text-muted-foreground text-sm mt-8">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
}
