import { runClaudeCli } from "@/lib/local-claude-cli";
import { readVault } from "@/lib/vault";

export type KnowledgeAnalysis = {
  stronglyConnected: string[];
  growing: string[];
  knowledgeGap: string[];
  newConnection: string;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function analyzeKnowledge(vaultPath: string, folder: string): Promise<KnowledgeAnalysis> {
  const { notes } = await readVault(vaultPath, folder);
  if (notes.length === 0) {
    throw new Error("이 카테고리에서 노트를 찾지 못했어요.");
  }

  const linkSummary = notes
    .map((note) => `- ${note.title} → [${note.links.join(", ") || "연결 없음"}]`)
    .join("\n");

  const noteBodies = notes
    .map((note) => `## ${note.title}\n${note.content.replace(/\s+/g, " ").slice(0, 700)}`)
    .join("\n\n");

  const systemPrompt = `너는 사용자의 Obsidian 노트를 분석해 지식 구조의 강점과 빈틈을 찾아주는 어시스턴트야.

주어진 노트에 실제로 있는 내용과 링크 관계만 근거로 삼아. 노트에 없는 주제를 지어내지 마.

다음 네 가지를 판단해:
- stronglyConnected: 노트가 충분하고 다른 노트와 잘 연결된 세부 주제들
- growing: 노트에서 최근 논의가 늘고 있다고 언급되거나 발전 중이라고 적힌 세부 주제들
- knowledgeGap: 노트에서 "아직 없음", "남은 질문", "확인 안 됨" 등으로 언급되었거나, 다뤄야 하는데 문서가 없는 영역
- newConnection: 노트끼리 명시적으로 링크되어 있지 않지만 내용상 이어지는 지점 한 가지를 한국어 한 문장으로

반드시 아래 JSON 형식으로만 답해. 마크다운 코드블록 없이 순수 JSON만:
{"stronglyConnected":["주제"],"growing":["주제"],"knowledgeGap":["주제"],"newConnection":"한 문장"}

[노트 링크 관계]
${linkSummary}

[노트 내용]
${noteBodies}`;

  const raw = await runClaudeCli("위 노트들의 지식 구조를 분석해줘.", systemPrompt);

  try {
    const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    return {
      stronglyConnected: asStringArray(parsed.stronglyConnected),
      growing: asStringArray(parsed.growing),
      knowledgeGap: asStringArray(parsed.knowledgeGap),
      newConnection: typeof parsed.newConnection === "string" ? parsed.newConnection : "",
    };
  } catch {
    throw new Error("분석 결과를 해석하지 못했어요.");
  }
}
