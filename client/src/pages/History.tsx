import { trpc } from "@/lib/trpc";
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (verdict === "Doğrulandı") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full verdict-verified text-xs font-medium">
      <CheckCircle className="w-3 h-3" /> Doğrulandı
    </span>
  );
  if (verdict === "Şüpheli") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full verdict-suspicious text-xs font-medium">
      <AlertTriangle className="w-3 h-3" /> Şüpheli
    </span>
  );
  if (verdict === "Yanlış") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full verdict-false text-xs font-medium">
      <XCircle className="w-3 h-3" /> Yanlış
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
      <Clock className="w-3 h-3" /> İşleniyor
    </span>
  );
}

export default function History() {
  const { data: verifications, isLoading } = trpc.verify.history.useQuery({});

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
            <span className="text-sm text-muted-foreground">Geçmiş</span>
          </div>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <a href="/">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Yeni Analiz
            </a>
          </Button>
        </div>
      </nav>

      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1">Geçmiş Analizler</h1>
            <p className="text-muted-foreground text-sm">Daha önce doğrulanan iddiaların listesi</p>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
                  <div className="h-3 bg-secondary rounded w-1/4" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!verifications || verifications.length === 0) && (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-muted-foreground text-sm mb-4">Henüz hiç analiz yapılmamış.</div>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="/">İlk Analizini Başlat</a>
              </Button>
            </div>
          )}

          {!isLoading && verifications && verifications.length > 0 && (
            <div className="space-y-3">
              {verifications.map((v) => (
                <a
                  key={v.id}
                  href={v.status === "completed" ? `/result/${v.id}` : v.status === "processing" ? `/verify/${v.id}` : `/result/${v.id}`}
                  className="block glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-foreground/90 line-clamp-2 mb-3">{v.claim}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <VerdictBadge verdict={v.verdict ?? null} />
                        {v.reliabilityScore !== null && v.reliabilityScore !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            PoR: <strong className="text-foreground">{v.reliabilityScore}/100</strong>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground/60">
                          {new Date(v.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
