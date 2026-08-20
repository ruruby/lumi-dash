import { searchPapers } from "@/lib/collectors/openalex";
import { fetchTrustedSource, TRUSTED_SOURCES } from "@/lib/collectors/trusted-feeds";
import { analyzeCandidates } from "@/lib/research-relevance";
import { getLastRun, getTopicProfile, setLastRun, upsertCandidates } from "@/lib/research-store";
import type { Candidate, CollectRunResult } from "@/lib/research-types";

/**
 * One collection run for one category: search, dedup, judge, store.
 *
 * The caps below exist because OpenAlex's free tier is metered (a search costs
 * 10 of ~1000 credits per window) and because every judged candidate costs an
 * AI call. They keep one run inside a single request's lifetime.
 */
const MAX_SEARCHES_PER_RUN = 4;
const PAPERS_PER_SEARCH = 6;
const MAX_ANALYZED_PER_RUN = 18;
/** First run reaches back this far; later runs start from the previous run. */
const FIRST_RUN_LOOKBACK_DAYS = 180;

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Core keywords (the ones the user manages on the category) come first, then
 * AI-expanded ones, so the user's own terms always get searched inside budget.
 */
export function buildSearchKeywords(coreKeywords: string[], expandedKeywords: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const keyword of [...coreKeywords, ...expandedKeywords]) {
    const trimmed = keyword.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(trimmed);
  }

  return ordered;
}

/** Drops candidates that repeat within the same run before anything is stored. */
export function dedupeWithinRun(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const unique: Candidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    unique.push(candidate);
  }
  return unique;
}

export type CollectOptions = {
  topicKey: string;
  topicName: string;
  coreKeywords: string[];
};

export async function runCollection(options: CollectOptions): Promise<CollectRunResult> {
  const { topicKey, topicName, coreKeywords } = options;
  const startedAt = Date.now();
  const warnings: string[] = [];

  const profile = await getTopicProfile(topicKey);
  const lastRun = await getLastRun(topicKey);
  const since = isoDate(lastRun ?? startedAt - FIRST_RUN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const keywords = buildSearchKeywords(
    coreKeywords,
    profile.expandedKeywords.map((entry) => entry.value),
  );

  const collected: Candidate[] = [];
  let searchesUsed = 0;

  // --- Papers -------------------------------------------------------------
  const searchable = keywords.slice(0, MAX_SEARCHES_PER_RUN);
  const budgetExhausted = keywords.length > searchable.length;

  const paperResults = await Promise.all(
    searchable.map((keyword) =>
      searchPapers(keyword, topicKey, { since, perPage: PAPERS_PER_SEARCH, collectedAt: startedAt }),
    ),
  );
  for (const result of paperResults) {
    searchesUsed += 1;
    if (result.warning) warnings.push(result.warning);
    collected.push(...result.candidates);
  }

  // --- Trusted organizations ---------------------------------------------
  const feedResults = await Promise.all(
    TRUSTED_SOURCES.map((source) => fetchTrustedSource(source, topicKey, { since, collectedAt: startedAt })),
  );
  for (const result of feedResults) {
    if (result.warning) warnings.push(result.warning);
    collected.push(...result.candidates);
  }

  const unique = dedupeWithinRun(collected);

  // Judge the freshest material first, so the AI budget goes where it matters.
  const ordered = [...unique].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const toAnalyze = ordered.slice(0, MAX_ANALYZED_PER_RUN);
  const rest = ordered.slice(MAX_ANALYZED_PER_RUN);

  const { candidates: judged, analyzed, callsFailed } = await analyzeCandidates(toAnalyze, {
    topicName,
    keywords: coreKeywords,
    excludedTopics: profile.excludedTopics.map((entry) => entry.value),
  });

  if (rest.length > 0) {
    warnings.push(`${rest.length}건은 이번 실행에서 AI 분석을 건너뛰었어요 (한 번에 ${MAX_ANALYZED_PER_RUN}건까지 분석).`);
  }
  if (callsFailed) {
    warnings.push(
      "로컬 claude CLI를 찾았지만 실제 호출이 모두 실패해 점수와 요약을 만들지 못했어요 (구독 접근 등 인증 문제일 수 있어요).",
    );
  }

  const { added, duplicates } = await upsertCandidates([...judged, ...rest]);
  await setLastRun(topicKey, startedAt);

  return {
    found: unique.length,
    added,
    duplicates,
    searchesUsed,
    budgetExhausted,
    analysisSkipped: !analyzed,
    analysisCallsFailed: callsFailed,
    warnings,
    finishedAt: Date.now(),
  };
}
