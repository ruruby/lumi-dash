import { isLocalClaudeCliAvailable, runClaudeCli } from "@/lib/local-claude-cli";
import type { Candidate, WikiNoteDraft } from "@/lib/research-types";

/**
 * Builds the note Add to Wiki proposes. The original material is never copied
 * wholesale — the AI writes the analytical sections, and the Source section is
 * assembled from real metadata so provenance survives.
 *
 * Nothing here writes to disk. The draft is shown first and only saved after
 * the user confirms — see docs/decisions/external-source-vs-vault.md.
 */

const MAX_EXCERPT_CHARS = 2500;
const DRAFT_TIMEOUT_MS = 120_000;

function buildSystemPrompt(topicName: string, relatedNotes: string[]): string {
  return [
    "너는 사용자의 Obsidian 지식 베이스에 들어갈 노트를 쓴다. 외부 자료 하나를 받아 그 자료에서 의미 있는 내용만 뽑아 구조화한다.",
    `사용자의 관심 주제: ${topicName}`,
    relatedNotes.length > 0
      ? `사용자의 기존 노트 제목: ${relatedNotes.join(", ")}`
      : "사용자의 기존 노트 목록은 주어지지 않았다.",
    "",
    "규칙:",
    "- 원문을 그대로 옮기지 않는다. 핵심만 요약하고 재구성한다.",
    "- 자료에 실제로 없는 내용은 쓰지 않는다. 모르면 그 항목을 비운다.",
    "- Related Knowledge에는 위에 주어진 기존 노트 제목만 `[[제목]]` 형식으로 쓴다. 목록에 없는 제목은 만들지 않는다.",
    "- Related Topics에는 이 자료의 주제 개념을 `[[개념]]` 형식으로 3~5개 쓴다.",
    "- 출처 정보(제목·저자·발행일·링크)는 쓰지 않는다. 그 부분은 시스템이 따로 붙인다.",
    "",
    "아래 마크다운 구조만 출력한다. 다른 설명이나 코드펜스는 쓰지 않는다.",
    "",
    "## Summary",
    "(2~4문장)",
    "",
    "## Key Findings",
    "- (자료의 핵심 내용 3~5개)",
    "",
    "## Research / Industry Implications",
    "(이 자료가 연구나 실무에 시사하는 점 2~3문장)",
    "",
    "## Related Topics",
    "[[개념]]",
    "",
    "## Related Knowledge",
    "[[기존 노트 제목]]",
    "",
    "모든 내용은 한국어로 쓴다.",
  ].join("\n");
}

function buildPrompt(candidate: Candidate): string {
  const lines = [
    `제목: ${candidate.title}`,
    candidate.sourceType === "paper" ? "자료 종류: 학술 논문" : "자료 종류: 기관 발행물",
    candidate.authors.length > 0 ? `저자: ${candidate.authors.join(", ")}` : "",
    candidate.organization ? `발행 기관: ${candidate.organization}` : "",
    candidate.venue ? `게재처: ${candidate.venue}` : "",
    candidate.publishedAt ? `발행일: ${candidate.publishedAt}` : "",
    candidate.excerpt ? `초록/본문 발췌:\n${candidate.excerpt.slice(0, MAX_EXCERPT_CHARS)}` : "초록 없음",
  ];
  return `${lines.filter(Boolean).join("\n")}\n\n이 자료로 노트를 작성해줘.`;
}

/** Provenance block, built from metadata only — never from AI output. */
function buildSourceSection(candidate: Candidate): string {
  const rows = [
    `- Type: ${candidate.sourceType === "paper" ? "학술 논문" : "기관 발행물"}`,
    `- Title: ${candidate.title}`,
    candidate.authors.length > 0 ? `- Authors: ${candidate.authors.join(", ")}` : "",
    candidate.organization ? `- Organization: ${candidate.organization}` : "",
    candidate.venue ? `- Venue: ${candidate.venue}` : "",
    candidate.publishedAt ? `- Published: ${candidate.publishedAt}` : "",
    candidate.doi ? `- DOI: ${candidate.doi}` : "",
    `- URL: ${candidate.url}`,
    typeof candidate.citedByCount === "number" ? `- Cited by: ${candidate.citedByCount}` : "",
    `- Collected by: Lumi Research Collector`,
  ];
  return `## Source\n\n${rows.filter(Boolean).join("\n")}`;
}

function frontmatter(candidate: Candidate): string {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "---",
    `updated: ${today}`,
    `source_type: ${candidate.sourceType}`,
    `source_url: ${candidate.url}`,
    candidate.doi ? `doi: ${candidate.doi}` : "",
    "collected_by: lumi-research-collector",
    "---",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Fallback body when no AI runtime is reachable: metadata only, stated plainly. */
function buildMetadataOnlyBody(candidate: Candidate): string {
  const sections = ["## Summary", "", "> AI 분석을 사용할 수 없어 요약이 비어 있습니다. 원문을 확인한 뒤 직접 채워주세요.", ""];

  if (candidate.excerpt) {
    sections.push("## 원문 발췌", "", `> ${candidate.excerpt.slice(0, MAX_EXCERPT_CHARS)}`, "");
  }

  return sections.join("\n");
}

export type DraftOptions = {
  candidate: Candidate;
  topicName: string;
  /** Existing note titles, so Related Knowledge can only link to real notes. */
  relatedNotes?: string[];
};

export async function buildNoteDraft(options: DraftOptions): Promise<WikiNoteDraft> {
  const { candidate, topicName, relatedNotes = [] } = options;

  let body: string | null = null;
  if (await isLocalClaudeCliAvailable()) {
    try {
      const reply = await runClaudeCli(
        buildPrompt(candidate),
        buildSystemPrompt(topicName, relatedNotes),
        DRAFT_TIMEOUT_MS,
      );
      const cleaned = reply.replace(/^```(?:markdown)?\s*/i, "").replace(/```\s*$/, "").trim();
      if (cleaned) body = cleaned;
    } catch (error) {
      body = null;
      console.error("[research-note] draft generation failed:", error);
    }
  }

  const aiGenerated = body !== null;
  const markdown = [
    frontmatter(candidate),
    "",
    `# ${candidate.title}`,
    "",
    body ?? buildMetadataOnlyBody(candidate),
    "",
    buildSourceSection(candidate),
    "",
  ].join("\n");

  return { candidateId: candidate.id, title: candidate.title, markdown, aiGenerated };
}
