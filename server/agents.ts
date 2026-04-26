import { invokeLLM } from "./_core/llm";

export type AgentType = "source" | "logic" | "crosscheck";

export interface AgentAnalysisResult {
  agentType: AgentType;
  agentName: string;
  score: number; // 0-100
  findings: string;
  sources: string;
  status: "completed" | "failed";
}

const AGENT_CONFIGS: Record<AgentType, { name: string; systemPrompt: string }> = {
  source: {
    name: "Source Verification Agent",
    systemPrompt: `You are a Source Verification Expert. Your task is to analyze the sources behind a given claim or news headline.

Evaluate the following:
1. Is the claim based on credible, verifiable sources?
2. Can the sources be independently confirmed?
3. Does the claim align with statements from known reliable institutions?
4. Is there source manipulation, fabricated citations, or context distortion?

You MUST respond in the following JSON format:
{
  "score": <reliability score from 0 to 100>,
  "findings": "<detailed findings in English, 2-3 paragraphs>",
  "sources": "<sources used or recommended for analysis, comma-separated>"
}`,
  },
  logic: {
    name: "Logical Consistency Agent",
    systemPrompt: `You are a Logical Analysis Expert. Your task is to analyze the logical consistency of a given claim or news headline.

Evaluate the following:
1. Does the claim contain logical fallacies?
2. Are the arguments internally coherent?
3. Is misleading or manipulative language used?
4. Has the claim been taken out of context?

You MUST respond in the following JSON format:
{
  "score": <logical consistency score from 0 to 100>,
  "findings": "<detailed findings in English, 2-3 paragraphs>",
  "sources": "<logic principles or methodologies referenced in the analysis>"
}`,
  },
  crosscheck: {
    name: "Cross-Verification Agent",
    systemPrompt: `You are a Cross-Verification Expert. Your task is to analyze a given claim or news headline by comparing it across multiple independent perspectives.

Evaluate the following:
1. How does the claim appear across different independent sources?
2. Are there credible counter-arguments or opposing evidence?
3. Does the claim contradict scientific consensus or documented facts?
4. Are disinformation patterns detected (AI-generated content, coordinated misinformation, etc.)?

You MUST respond in the following JSON format:
{
  "score": <cross-verification score from 0 to 100>,
  "findings": "<detailed findings in English, 2-3 paragraphs>",
  "sources": "<sources used or recommended for cross-verification>"
}`,
  },
};

async function runAgent(agentType: AgentType, claim: string): Promise<AgentAnalysisResult> {
  const config = AGENT_CONFIGS[agentType];
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: `Please analyze the following claim:\n\n"${claim}"` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", description: "Reliability score from 0 to 100" },
              findings: { type: "string", description: "Detailed findings" },
              sources: { type: "string", description: "Sources used or recommended" },
            },
            required: ["score", "findings", "sources"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    if (!content) throw new Error("No content from LLM");

    const parsed = JSON.parse(content);
    return {
      agentType,
      agentName: config.name,
      score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      findings: parsed.findings || "Analysis completed.",
      sources: parsed.sources || "",
      status: "completed",
    };
  } catch (error) {
    console.error(`[Agent:${agentType}] Error:`, error);
    return {
      agentType,
      agentName: config.name,
      score: 50,
      findings: "An error occurred during agent analysis. Result is inconclusive.",
      sources: "",
      status: "failed",
    };
  }
}

export async function runAllAgents(claim: string): Promise<AgentAnalysisResult[]> {
  const [sourceResult, logicResult, crosscheckResult] = await Promise.all([
    runAgent("source", claim),
    runAgent("logic", claim),
    runAgent("crosscheck", claim),
  ]);
  return [sourceResult, logicResult, crosscheckResult];
}
