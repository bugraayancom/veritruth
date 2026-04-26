import { AgentAnalysisResult } from "./agents";

export type Verdict = "Verified" | "Suspicious" | "False";

export interface ConsensusResult {
  verdict: Verdict;
  reliabilityScore: number;
  summary: string;
}

export function computeConsensus(agentResults: AgentAnalysisResult[]): ConsensusResult {
  if (agentResults.length === 0) {
    return { verdict: "Suspicious", reliabilityScore: 50, summary: "Insufficient agent results available." };
  }

  // Weighted average: source 35%, logic 30%, crosscheck 35%
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
    verdict = "Verified";
  } else if (reliabilityScore >= 40) {
    verdict = "Suspicious";
  } else {
    verdict = "False";
  }

  const agentSummaries = agentResults
    .map((r) => `${r.agentName}: ${r.score}/100`)
    .join(", ");

  const summary = `Multi-agent consensus analysis complete. Proof of Reliability score: ${reliabilityScore}/100. Agent scores — ${agentSummaries}. Final verdict: ${verdict}.`;

  return { verdict, reliabilityScore, summary };
}
