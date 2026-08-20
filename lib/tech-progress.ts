import { runClaudeCli } from "@/lib/local-claude-cli";
import { readVault, buildVaultContext } from "@/lib/vault";
import { TECH_STAGES, type TechStage, type TechProgressItem, type TechProgressResult } from "@/lib/tech-progress-types";

function isTechStage(value: unknown): value is TechStage {
  return typeof value === "string" && (TECH_STAGES as readonly string[]).includes(value);
}

export async function analyzeTechProgress(vaultPath: string, folder = ""): Promise<TechProgressResult> {
  const { notes } = await readVault(vaultPath, folder);

  if (notes.length === 0) {
    throw new Error("vault에서 노트를 찾지 못했어요.");
  }

  const systemPrompt = `너는 사용자의 개인 위키(Obsidian vault)를 읽고 기술 동향을 정리하는 분석가야. 아래는 사용자가 직접 정리해 둔 노트들이야.

각 노트가 다루는 주제의 기술 성숙도를 "탐색", "연구", "프로토타입", "상용화" 중 하나로 판단해. 반드시 **노트에 실제로 적힌 사용자의 판단과 근거**를 따라야 하고, 노트 밖의 일반 상식으로 임의 판단하지 마. 노트에 성숙도 관련 언급이 없으면 "탐색"으로 두고 이유에 그렇게 밝혀.

reason에는 그 노트에 적힌 표현을 근거로 한 한국어 한 문장을 써.

반드시 아래 JSON 형식으로만 답해. 다른 설명이나 마크다운 코드블록 없이 순수 JSON 텍스트만 출력해:
{"overview": "전체 흐름을 한국어 한 문장으로 요약", "items": [{"keyword": "노트 제목", "stage": "탐색|연구|프로토타입|상용화", "reason": "한국어 한 문장 근거"}]}

[사용자의 노트]
${buildVaultContext(notes)}`;

  const raw = await runClaudeCli(
    `위 노트들을 바탕으로 각 주제의 기술 동향을 분석해줘. 노트 제목: ${notes.map((n) => n.title).join(", ")}`,
    systemPrompt,
  );

  let parsed: unknown;
  try {
    const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("분석 결과를 해석하지 못했어요.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).overview !== "string" ||
    !Array.isArray((parsed as Record<string, unknown>).items)
  ) {
    throw new Error("분석 결과 형식이 올바르지 않아요.");
  }

  const result = parsed as { overview: string; items: unknown[] };

  const items: TechProgressItem[] = result.items
    .filter(
      (item): item is { keyword: string; stage: string; reason: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).keyword === "string" &&
        typeof (item as Record<string, unknown>).reason === "string" &&
        isTechStage((item as Record<string, unknown>).stage),
    )
    .map((item) => ({ keyword: item.keyword, stage: item.stage as TechStage, reason: item.reason }));

  return { overview: result.overview, items };
}
