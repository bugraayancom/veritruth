import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Shield, Search, Zap, CheckCircle, AlertTriangle, XCircle, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";

const AGENT_META = {
  source: { label: "Kaynak Doğrulama Ajanı", icon: <Search className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  logic: { label: "Mantıksal Tutarlılık Ajanı", icon: <Zap className="w-4 h-4" />, color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/20" },
  crosscheck: { label: "Çapraz Doğrulama Ajanı", icon: <Shield className="w-4 h-4" />, color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20" },
};

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "Doğrulandı") return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full verdict-verified text-sm font-semibold">
      <CheckCircle className="w-4 h-4" /> Doğrulandı
    </span>
  );
  if (verdict === "Şüpheli") return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full verdict-suspicious text-sm font-semibold">
      <AlertTriangle className="w-4 h-4" /> Şüpheli
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full verdict-false text-sm font-semibold">
      <XCircle className="w-4 h-4" /> Yanlış
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

  const { data, isLoading } = trpc.verify.getById.useQuery({ id }, { enabled: !!id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Sonuçlar yükleniyor...</div>
      </div>
    );
  }

  if (!data?.verification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Doğrulama bulunamadı.</div>
          <a href="/" className="text-primary hover:underline text-sm">Ana sayfaya dön</a>
        </div>
      </div>
    );
  }

  const { verification, agents } = data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">VeriTruth</span>
          </a>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm text-muted-foreground">Sonuç #{id}</span>
        </div>
      </nav>

      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Yeni Analiz
          </a>

          {/* Summary card */}
          <div className="glass-card rounded-2xl p-8 mb-8">
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
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Analiz Edilen İddia</div>
              <p className="text-sm leading-relaxed text-foreground/90">{verification.claim}</p>
            </div>

            {/* Summary */}
            {verification.summary && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Konsensüs Özeti</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{verification.summary}</p>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Clock className="w-3 h-3" />
              {new Date(verification.createdAt).toLocaleString("tr-TR")}
            </div>
          </div>

          {/* Agent results */}
          <h2 className="text-lg font-semibold mb-4">Ajan Bulguları</h2>
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

                  {/* Score bar */}
                  <div className="mb-4">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          agent.score >= 70 ? "bg-chart-2" : agent.score >= 40 ? "bg-chart-3" : "bg-destructive"
                        }`}
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Findings */}
                  {agent.findings && (
                    <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
                      <Streamdown>{agent.findings}</Streamdown>
                    </div>
                  )}

                  {/* Sources */}
                  {agent.sources && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Kaynaklar</div>
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
                Geçmiş Analizler
              </a>
            </Button>
            <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/">
                <Search className="w-4 h-4 mr-2" />
                Yeni Analiz
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
