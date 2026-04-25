import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Shield, Search, Zap, CheckCircle, Clock, AlertCircle } from "lucide-react";

const AGENT_META = {
  source: { label: "Kaynak Doğrulama Ajanı", icon: <Search className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
  logic: { label: "Mantıksal Tutarlılık Ajanı", icon: <Zap className="w-4 h-4" />, color: "text-chart-2", bg: "bg-chart-2/10" },
  crosscheck: { label: "Çapraz Doğrulama Ajanı", icon: <Shield className="w-4 h-4" />, color: "text-chart-3", bg: "bg-chart-3/10" },
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
          <span className="text-sm text-muted-foreground">Analiz #{id}</span>
        </div>
      </nav>

      <div className="container py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <div className="w-2 h-2 rounded-full bg-primary agent-running" />
              Analiz Devam Ediyor
            </div>
            <h1 className="text-2xl font-semibold mb-2">AI Ajanları Çalışıyor</h1>
            <p className="text-muted-foreground text-sm">
              Uzmanlaşmış ajanlar iddianızı paralel olarak analiz ediyor
            </p>
          </div>

          {/* Claim */}
          {verification && (
            <div className="glass-card rounded-xl p-5 mb-8">
              <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Analiz Edilen İddia</div>
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{verification.claim}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{completedCount}/{totalAgents} ajan tamamlandı</span>
              <span>%{progress}</span>
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
                          <span>Tamamlandı</span>
                        </div>
                      )}
                      {status === "running" && (
                        <div className="flex items-center gap-1.5 text-xs text-primary agent-running">
                          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span>Çalışıyor</span>
                        </div>
                      )}
                      {status === "pending" && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Bekliyor</span>
                        </div>
                      )}
                      {status === "failed" && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>Hata</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score bar when completed */}
                  {status === "completed" && agentData && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Güvenilirlik Skoru</span>
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

          {/* Completed state */}
          {verification?.status === "completed" && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-chart-2 text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Analiz tamamlandı! Sonuç sayfasına yönlendiriliyorsunuz...</span>
              </div>
            </div>
          )}

          {/* Failed state */}
          {verification?.status === "failed" && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Analiz sırasında bir hata oluştu.</span>
              </div>
              <a href="/" className="block mt-4 text-sm text-primary hover:underline">
                Ana sayfaya dön
              </a>
            </div>
          )}

          {isLoading && !verification && (
            <div className="text-center text-muted-foreground text-sm mt-8">Yükleniyor...</div>
          )}
        </div>
      </div>
    </div>
  );
}
