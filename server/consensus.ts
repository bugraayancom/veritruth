import { AgentAnalysisResult } from "./agents";

export type Verdict = "Doğrulandı" | "Şüpheli" | "Yanlış";

export interface ConsensusResult {
  verdict: Verdict;
  reliabilityScore: number;
  summary: string;
}

export function computeConsensus(agentResults: AgentAnalysisResult[]): ConsensusResult {
  if (agentResults.length === 0) {
    return { verdict: "Şüpheli", reliabilityScore: 50, summary: "Yeterli ajan sonucu bulunamadı." };
  }

  // Ağırlıklı ortalama: kaynak %35, mantık %30, çapraz %35
  const weights: Record<string, number> = { source: 0.35, logic: 0.30, crosscheck: 0.35 };
  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of agentResults) {
    const w = weights[result.agentType] ?? 0.33;
    weightedSum += result.score * w;
    totalWeight += w;
  }

  const reliabilityScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

  let verdict: Verdict;
  if (reliabilityScore >= 70) {
    verdict = "Doğrulandı";
  } else if (reliabilityScore >= 40) {
    verdict = "Şüpheli";
  } else {
    verdict = "Yanlış";
  }

  const agentSummaries = agentResults
    .map((r) => `${r.agentName}: ${r.score}/100`)
    .join(", ");

  const summary = `Çoklu ajan konsensüs analizi tamamlandı. Proof of Reliability skoru: ${reliabilityScore}/100. Ajan skorları — ${agentSummaries}. Nihai karar: ${verdict}.`;

  return { verdict, reliabilityScore, summary };
}
