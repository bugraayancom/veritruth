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
    name: "Kaynak Doğrulama Ajanı",
    systemPrompt: `Sen bir Kaynak Doğrulama Uzmanısın. Görevin, verilen bir iddia veya haber metninin kaynaklarını analiz etmektir.
Şunları değerlendir:
1. İddia güvenilir kaynaklara dayanıyor mu?
2. Kaynaklar doğrulanabilir mi?
3. İddia, bilinen güvenilir kuruluşların açıklamalarıyla uyuşuyor mu?
4. Kaynak manipülasyonu veya bağlam çarpıtması var mı?

Yanıtını MUTLAKA şu JSON formatında ver:
{
  "score": <0-100 arası güvenilirlik skoru>,
  "findings": "<Türkçe detaylı bulgular, 2-3 paragraf>",
  "sources": "<Analiz için kullanılan veya önerilen kaynaklar, virgülle ayrılmış>"
}`,
  },
  logic: {
    name: "Mantıksal Tutarlılık Ajanı",
    systemPrompt: `Sen bir Mantıksal Analiz Uzmanısın. Görevin, verilen bir iddia veya haber metninin mantıksal tutarlılığını analiz etmektir.
Şunları değerlendir:
1. İddiada mantıksal safsatalar (logical fallacies) var mı?
2. Argümanlar iç tutarlı mı?
3. Yanıltıcı veya manipülatif dil kullanılmış mı?
4. İddia, bağlamdan koparılmış mı?

Yanıtını MUTLAKA şu JSON formatında ver:
{
  "score": <0-100 arası mantıksal tutarlılık skoru>,
  "findings": "<Türkçe detaylı bulgular, 2-3 paragraf>",
  "sources": "<Analiz için başvurulan mantık ilkeleri veya metodolojiler>"
}`,
  },
  crosscheck: {
    name: "Çapraz Doğrulama Ajanı",
    systemPrompt: `Sen bir Çapraz Doğrulama Uzmanısın. Görevin, verilen bir iddia veya haber metnini farklı perspektiflerden karşılaştırmalı olarak analiz etmektir.
Şunları değerlendir:
1. İddia, farklı bağımsız kaynaklarda nasıl yer alıyor?
2. İddiaya karşı çıkan güvenilir görüşler var mı?
3. İddia, bilimsel konsensüsle veya belgelenmiş olgularla çelişiyor mu?
4. Dezenformasyon kalıpları (AI üretimi içerik, koordineli yanlış bilgi vb.) tespit edildi mi?

Yanıtını MUTLAKA şu JSON formatında ver:
{
  "score": <0-100 arası çapraz doğrulama skoru>,
  "findings": "<Türkçe detaylı bulgular, 2-3 paragraf>",
  "sources": "<Çapraz doğrulama için kullanılan veya önerilen kaynaklar>"
}`,
  },
};

async function runAgent(agentType: AgentType, claim: string): Promise<AgentAnalysisResult> {
  const config = AGENT_CONFIGS[agentType];
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: `Lütfen şu iddiayı analiz et:\n\n"${claim}"` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", description: "0-100 arası güvenilirlik skoru" },
              findings: { type: "string", description: "Detaylı bulgular" },
              sources: { type: "string", description: "Kullanılan veya önerilen kaynaklar" },
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
      findings: parsed.findings || "Analiz tamamlandı.",
      sources: parsed.sources || "",
      status: "completed",
    };
  } catch (error) {
    console.error(`[Agent:${agentType}] Error:`, error);
    return {
      agentType,
      agentName: config.name,
      score: 50,
      findings: "Ajan analizi sırasında bir hata oluştu. Sonuç belirsiz.",
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
