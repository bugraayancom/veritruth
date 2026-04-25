import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Zap, Search, ChevronRight, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function Home() {
  const [claim, setClaim] = useState("");
  const [, navigate] = useLocation();

  const submitMutation = trpc.verify.submit.useMutation({
    onSuccess: (data) => {
      navigate(`/verify/${data.verificationId}`);
    },
    onError: (err) => {
      toast.error("Analiz başlatılamadı: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (claim.trim().length < 10) {
      toast.error("Lütfen en az 10 karakter uzunluğunda bir iddia girin.");
      return;
    }
    submitMutation.mutate({ claim: claim.trim() });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">VeriTruth</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Geçmiş
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
              <Zap className="w-3 h-3" />
              Çok Ajanlı AI Doğrulama Sistemi
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Gerçeği{" "}
              <span className="gradient-text font-serif italic">Doğrula</span>
              <br />
              Dezenformasyonu{" "}
              <span className="gradient-text font-serif italic">Engelle</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              VeriTruth, uzmanlaşmış AI ajanlarının paralel analiz yaptığı merkeziyetsiz bir doğrulama ağıdır.
              Her iddia, kaynak, mantık ve çapraz doğrulama perspektiflerinden değerlendirilerek{" "}
              <strong className="text-foreground">Proof of Reliability</strong> skoru hesaplanır.
            </p>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 text-left">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Doğrulanmasını istediğiniz iddia veya haberi girin
              </label>
              <Textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Örnek: 'Türkiye'nin nüfusu 2025 yılında 90 milyonu aştı.' veya herhangi bir haber başlığı, sosyal medya paylaşımı..."
                className="min-h-[120px] bg-background/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 text-sm leading-relaxed"
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{claim.length}/2000 karakter</span>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || claim.trim().length < 10}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 gap-2 glow-animate"
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Analiz Başlatılıyor...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analiz Et
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-3">Nasıl Çalışır?</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">
            NANDA mimarisi ve SREE metodolojisi ile güçlendirilmiş çok ajanlı analiz sistemi
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-5 h-5" />,
                title: "Kaynak Doğrulama",
                desc: "İddianın kaynakları, güvenilirliği ve bağlamı analiz edilir. Kaynak manipülasyonu tespit edilir.",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Mantıksal Tutarlılık",
                desc: "Argümanların iç tutarlılığı, mantıksal safsatalar ve manipülatif dil kalıpları incelenir.",
                color: "text-chart-2",
                bg: "bg-chart-2/10",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Çapraz Doğrulama",
                desc: "İddia farklı bağımsız kaynaklarla karşılaştırılır. AI üretimi dezenformasyon kalıpları aranır.",
                color: "text-chart-3",
                bg: "bg-chart-3/10",
              },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-6">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center ${item.color} mb-4`}>
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verdict legend */}
      <section className="container pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Karar Kriterleri</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Doğrulandı", icon: <CheckCircle className="w-4 h-4" />, cls: "verdict-verified", desc: "Proof of Reliability ≥ 70" },
                { label: "Şüpheli", icon: <AlertTriangle className="w-4 h-4" />, cls: "verdict-suspicious", desc: "Proof of Reliability 40–69" },
                { label: "Yanlış", icon: <XCircle className="w-4 h-4" />, cls: "verdict-false", desc: "Proof of Reliability < 40" },
              ].map((v) => (
                <div key={v.label} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${v.cls}`}>
                  {v.icon}
                  <div>
                    <div className="font-semibold text-sm">{v.label}</div>
                    <div className="text-xs opacity-70">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>VeriTruth — Merkeziyetsiz Epistemik Doğrulama Ağı</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Cosmos Grants Projesi</span>
            <span>·</span>
            <a href="https://github.com" className="hover:text-foreground transition-colors">Açık Kaynak</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
