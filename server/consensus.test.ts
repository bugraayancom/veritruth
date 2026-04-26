import { describe, expect, it } from "vitest";
import { computeConsensus } from "./consensus";
import type { AgentAnalysisResult } from "./agents";

const makeAgent = (type: AgentAnalysisResult["agentType"], score: number): AgentAnalysisResult => ({
  agentType: type,
  agentName: `${type} agent`,
  score,
  findings: "Test findings",
  sources: "Test sources",
  status: "completed",
});

describe("computeConsensus", () => {
  it("returns Verified when all agents score high", () => {
    const results = [
      makeAgent("source", 85),
      makeAgent("logic", 80),
      makeAgent("crosscheck", 90),
    ];
    const consensus = computeConsensus(results);
    expect(consensus.verdict).toBe("Verified");
    expect(consensus.reliabilityScore).toBeGreaterThanOrEqual(70);
  });

  it("returns Suspicious when scores are in middle range", () => {
    const results = [
      makeAgent("source", 55),
      makeAgent("logic", 50),
      makeAgent("crosscheck", 60),
    ];
    const consensus = computeConsensus(results);
    expect(consensus.verdict).toBe("Suspicious");
    expect(consensus.reliabilityScore).toBeGreaterThanOrEqual(40);
    expect(consensus.reliabilityScore).toBeLessThan(70);
  });

  it("returns False when all agents score low", () => {
    const results = [
      makeAgent("source", 20),
      makeAgent("logic", 15),
      makeAgent("crosscheck", 25),
    ];
    const consensus = computeConsensus(results);
    expect(consensus.verdict).toBe("False");
    expect(consensus.reliabilityScore).toBeLessThan(40);
  });

  it("handles empty results gracefully", () => {
    const consensus = computeConsensus([]);
    expect(consensus.verdict).toBe("Suspicious");
    expect(consensus.reliabilityScore).toBe(50);
  });

  it("includes all agent names in summary", () => {
    const results = [
      makeAgent("source", 70),
      makeAgent("logic", 75),
      makeAgent("crosscheck", 80),
    ];
    const consensus = computeConsensus(results);
    expect(consensus.summary).toContain("source agent");
    expect(consensus.summary).toContain("logic agent");
    expect(consensus.summary).toContain("crosscheck agent");
  });

  it("applies correct weighted scoring", () => {
    // source: 100 * 0.35 = 35, logic: 0 * 0.30 = 0, crosscheck: 100 * 0.35 = 35 → total 70
    const results = [
      makeAgent("source", 100),
      makeAgent("logic", 0),
      makeAgent("crosscheck", 100),
    ];
    const consensus = computeConsensus(results);
    expect(consensus.reliabilityScore).toBe(70);
  });
});
