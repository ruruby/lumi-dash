import { classifyStatus, computeTrendPercent, type TopicStatus } from "@/lib/trend-metrics";

/**
 * Research Radar, at keyword granularity instead of category granularity.
 *
 * The user asked for individual technologies ("MCP Security", "Post-Quantum
 * TLS") rather than whole categories, but a precise trend percentage per
 * keyword usually has no honest basis yet — Phase 1 has too little history.
 * So this counts real mentions across vault notes, news, and Research
 * Collector candidates, and lets raw frequency (not a forced percentage)
 * decide what gets emphasized. A percentage still appears whenever it can be
 * computed honestly — see docs/decisions/derived-metrics-honesty.md.
 */

export type KeywordOwner = {
  topicKey: string;
  /** Core keywords the user manages, plus any AI-expanded keywords from the Topic Profile. */
  keywords: string[];
};

export type EvidenceItem = {
  topicKey: string;
  title: string;
  /** Body text to search, in addition to the title. */
  text: string;
  /** When this evidence was published/updated, in ms. */
  at: number;
};

export type KeywordRadarEntry = {
  keyword: string;
  /** Categories that own this keyword and contributed evidence. */
  topicKeys: string[];
  recentCount: number;
  priorCount: number;
  trendPercent: number | null;
  status: TopicStatus;
  /** Up to 3 real titles that mention the keyword, newest first — grounding for "why". */
  sampleTitles: string[];
};

const MAX_SAMPLE_TITLES = 3;
const DEFAULT_MAX_ENTRIES = 10;

function includesKeyword(haystack: string, keyword: string): boolean {
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

export type BuildKeywordRadarInput = {
  owners: KeywordOwner[];
  evidence: EvidenceItem[];
  windowDays: number;
  now: number;
  maxEntries?: number;
};

export function buildKeywordRadar({
  owners,
  evidence,
  windowDays,
  now,
  maxEntries = DEFAULT_MAX_ENTRIES,
}: BuildKeywordRadarInput): KeywordRadarEntry[] {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recentFrom = now - windowMs;
  const priorFrom = now - windowMs * 2;

  const byKeyword = new Map<string, KeywordRadarEntry>();

  for (const owner of owners) {
    const evidenceForTopic = evidence.filter((item) => item.topicKey === owner.topicKey);
    const seenOnThisTopic = new Set<string>();

    for (const rawKeyword of owner.keywords) {
      const keyword = rawKeyword.trim();
      if (!keyword) continue;
      const dedupeKey = keyword.toLowerCase();
      if (seenOnThisTopic.has(dedupeKey)) continue;
      seenOnThisTopic.add(dedupeKey);

      const hits = evidenceForTopic.filter(
        (item) => includesKeyword(item.title, keyword) || includesKeyword(item.text, keyword),
      );
      if (hits.length === 0) continue;

      const recentHits = hits.filter((item) => item.at >= recentFrom && item.at < now + 1);
      const priorHits = hits.filter((item) => item.at >= priorFrom && item.at < recentFrom);
      // Nothing to emphasize when it wasn't mentioned recently, even if it was in the past.
      if (recentHits.length === 0) continue;

      const existing = byKeyword.get(dedupeKey);
      const recentCount = (existing?.recentCount ?? 0) + recentHits.length;
      const priorCount = (existing?.priorCount ?? 0) + priorHits.length;
      const trendPercent = computeTrendPercent(recentCount, priorCount);
      const status = classifyStatus({ recent: recentCount, prior: priorCount, trendPercent, noteCount: recentCount + priorCount });

      const newTitles = [...recentHits].sort((a, b) => b.at - a.at).map((item) => item.title);
      const sampleTitles = Array.from(new Set([...(existing?.sampleTitles ?? []), ...newTitles])).slice(
        0,
        MAX_SAMPLE_TITLES,
      );

      byKeyword.set(dedupeKey, {
        keyword: existing?.keyword ?? keyword,
        topicKeys: Array.from(new Set([...(existing?.topicKeys ?? []), owner.topicKey])),
        recentCount,
        priorCount,
        trendPercent,
        status,
        sampleTitles,
      });
    }
  }

  const statusRank: Record<TopicStatus, number> = { Hot: 0, Emerging: 1, Stable: 2, Declining: 3 };

  return Array.from(byKeyword.values())
    .sort((a, b) => b.recentCount - a.recentCount || statusRank[a.status] - statusRank[b.status])
    .slice(0, maxEntries);
}
