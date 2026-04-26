import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Zap, Search, ChevronRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function Home() {
  const [claim, setClaim] = useState("");
  const [, navigate] = useLocation();

  const submitMutation = trpc.verify.submit.useMutation({
    onSuccess: (data) => {
      navigate(`/verify/${data.verificationId}`);
    },
    onError: (err) => {
      toast.error("Failed to start analysis: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (claim.trim().length < 10) {
      toast.error("Please enter a claim of at least 10 characters.");
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
              History
            </a>
            <a
              href="https://github.com/bugraayancom/veritruth"
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
              <Zap className="w-3 h-3" />
              Multi-Agent AI Verification System
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              <span className="gradient-text font-serif italic">Verify</span>{" "}
              the Truth
              <br />
              <span className="gradient-text font-serif italic">Combat</span>{" "}
              Disinformation
            </h1>

            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              VeriTruth is a decentralized verification network where specialized AI agents analyze
              every claim in parallel — evaluating source credibility, logical consistency, and
              cross-referenced evidence to produce a transparent{" "}
              <strong className="text-foreground">Proof of Reliability</strong> score.
            </p>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 text-left">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Enter the claim or news headline you want to verify
              </label>
              <Textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g. 'Scientists confirm coffee reverses aging effects' or any news headline, social media post, or statement..."
                className="min-h-[120px] bg-background/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 text-sm leading-relaxed"
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{claim.length}/2000 characters</span>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || claim.trim().length < 10}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 gap-2 glow-animate"
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Starting Analysis...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyze Claim
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
          <h2 className="text-2xl font-semibold text-center mb-3">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">
            Powered by NANDA architecture and SREE epistemic methodology
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-5 h-5" />,
                title: "Source Verification",
                desc: "Analyzes the origin, credibility, and context of the claim. Detects source manipulation and fabricated citations.",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Logical Consistency",
                desc: "Examines internal coherence of arguments, logical fallacies, and manipulative language patterns.",
                color: "text-chart-2",
                bg: "bg-chart-2/10",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Cross-Verification",
                desc: "Compares the claim against independent sources. Detects AI-generated disinformation patterns.",
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
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Verdict Criteria</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Verified", icon: <CheckCircle className="w-4 h-4" />, cls: "verdict-verified", desc: "Proof of Reliability ≥ 70" },
                { label: "Suspicious", icon: <AlertTriangle className="w-4 h-4" />, cls: "verdict-suspicious", desc: "Proof of Reliability 40–69" },
                { label: "False", icon: <XCircle className="w-4 h-4" />, cls: "verdict-false", desc: "Proof of Reliability < 40" },
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
            <span>VeriTruth — Decentralized Epistemic Verification Network</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Cosmos Grants Project</span>
            <span>·</span>
            <a href="https://github.com/bugraayancom/veritruth" className="hover:text-foreground transition-colors">Open Source</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
