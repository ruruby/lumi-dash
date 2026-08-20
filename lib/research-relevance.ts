import { isLocalClaudeCliAvailable, runClaudeCli } from "@/lib/local-claude-cli";
import { RELEVANCE_THRESHOLD, type Candidate, type RelevanceAnalysis } from "@/lib/research-types";

export { RELEVANCE_THRESHOLD };

/**
 * The AI gate that decides what reaches the Research Inbox. Keyword search
 * alone is too noisy to show the user directly — verified against the live
 * OpenAlex API, where a quoted-phrase search still returns off-field papers —
 * so this is load-bearing, not decoration.
 *
 * Runtime is the local `claude` CLI, per docs/decisions/local-claude-cli-runtime.md.
 * When it is unavailable, candidates keep `analysis: null` and the UI says so
 * instead of inventing a score.
 */

/** Judged per call. One call per candidate would make a collection run take minutes. */
const BATCH_SIZE = 6;
const MAX_EXCERPT_CHARS = 500;
const BATCH_TIMEOUT_MS = 120_000;

function buildSystemPrompt(topicName: string, keywords: string[], excluded: string[]): string {
  return [
    "너는 연구 자료 선별 담당이다. 사용자의 관심 주제와 외부 자료 목록을 받고, 각 자료가 그 주제와 얼마나 직접 관련되는지 판단한다.",
    `관심 주제: ${topicName}`,
    `핵심 키워드: ${keywords.join(", ") || "(없음)"}`,
    excluded.length > 0 ? `관련 없음으로 처리할 주제: ${excluded.join(", ")}` : "",
    "",
    "판단 기준:",
    "- 키워드가 문자열로 겹치는 것보다 주제가 실제로 같은지를 본다.",
    "- 같은 약어가 다른 분야에서 쓰인 자료(의학·건축 논문 등)는 낮게 준다.",
    "- 제목만 그럴듯하고 내용이 주제와 무관하면 낮게 준다.",
    "",
    "score 기준: 80 이상은 주제의 핵심 자료, 60~79는 관련 있음, 40~59는 주변적, 40 미만은 관련 없음.",
    "",
    "아래 JSON 배열로만 답한다. 다른 문장이나 코드펜스는 쓰지 않는다.",
    '[{"index": 입력에 적힌 번호, "score": 0-100 정수, "reason": "이 점수를 준 이유 한 문장", "summary": "자료 내용 2문장 이내 요약"}]',
    "입력에 있는 모든 번호를 빠짐없이 포함한다. reason과 summary는 한국어로 쓴다.",
  ]
    .filter(Boolean)
    .join("\n");
}

function describeCandidate(candidate: Candidate, index: number): string {
  const lines = [
    `[${index}]`,
    `제목: ${candidate.title}`,
    candidate.publishedAt ? `발행일: ${candidate.publishedAt}` : "",
    candidate.authors.length > 0 ? `저자: ${candidate.authors.slice(0, 3).join(", ")}` : "",
    candidate.venue ? `출처: ${candidate.venue}` : "",
    candidate.sourceType === "paper" ? "종류: 학술 논문" : "종류: 기관 발행물",
    candidate.excerpt ? `초록/설명: ${candidate.excerpt.slice(0, MAX_EXCERPT_CHARS)}` : "초록 없음",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Pulls the JSON array out of a reply that may carry stray prose or fences. */
export function parseRelevanceReply(raw: string): Map<number, RelevanceAnalysis> {
  const result = new Map<number, RelevanceAnalysis>();

  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return result;

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return result;
  }
  if (!Array.isArray(parsed)) return result;

  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;

    const index = Number(record.index);
    const score = Number(record.score);
    if (!Number.isInteger(index) || !Number.isFinite(score)) continue;

    const reason = typeof record.reason === "string" ? record.reason.trim() : "";
    const summary = typeof record.summary === "string" ? record.summary.trim() : "";
    if (!reason && !summary) continue;

    result.set(index, {
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason,
      summary,
    });
  }

  return result;
}

export type AnalyzeOptions = {
  topicName: string;
  keywords: string[];
  excludedTopics?: string[];
};

/**
 * Returns the same candidates with `analysis` filled where the runtime
 * answered. `analyzed: false` means no AI runtime was reachable at all, which
 * the UI reports rather than hiding.
 */
export type AnalyzeResult = {
  candidates: Candidate[];
  /** False only when no runtime binary was reachable at all. */
  analyzed: boolean;
  /**
   * Set when the runtime looked available (`claude --version` answered) but
   * every judgement call still failed — e.g. the binary exists but the
   * session behind it has no subscription access. Distinct from `analyzed:
   * false` because the UI's "AI 분석 없음" message would otherwise be wrong:
   * the runtime was there, it just could not produce an answer.
   */
  callsFailed: boolean;
};

export async function analyzeCandidates(
  candidates: Candidate[],
  options: AnalyzeOptions,
): Promise<AnalyzeResult> {
  if (candidates.length === 0) return { candidates, analyzed: true, callsFailed: false };

  if (!(await isLocalClaudeCliAvailable())) {
    return { candidates, analyzed: false, callsFailed: false };
  }

  const systemPrompt = buildSystemPrompt(options.topicName, options.keywords, options.excludedTopics ?? []);
  const analyzed = [...candidates];
  let batchCount = 0;
  let failedBatchCount = 0;

  for (let start = 0; start < analyzed.length; start += BATCH_SIZE) {
    const batch = analyzed.slice(start, start + BATCH_SIZE);
    const prompt = `${batch
      .map((candidate, offset) => describeCandidate(candidate, start + offset))
      .join("\n\n")}\n\n위 자료들을 각각 평가해줘.`;

    batchCount += 1;
    try {
      const reply = await runClaudeCli(prompt, systemPrompt, BATCH_TIMEOUT_MS);
      const judgements = parseRelevanceReply(reply);
      if (judgements.size === 0) failedBatchCount += 1;
      for (const [index, analysis] of judgements) {
        if (analyzed[index]) analyzed[index] = { ...analyzed[index], analysis };
      }
    } catch (error) {
      failedBatchCount += 1;
      // A failed batch loses its scores, not its candidates — but the failure
      // itself is worth a server-side trace, since the caller only sees a
      // boolean and would otherwise have no way to tell why scores are missing.
      console.error("[research-relevance] batch judgement failed:", error);
    }
  }

  return { candidates: analyzed, analyzed: true, callsFailed: batchCount > 0 && failedBatchCount === batchCount };
}
