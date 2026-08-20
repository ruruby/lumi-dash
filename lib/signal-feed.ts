import { fetchNewsForKeywords } from "@/lib/news";
import { listCandidates } from "@/lib/research-store";
import type { Candidate } from "@/lib/research-types";
import type { SignalFeed, SignalItem, SignalLane } from "@/lib/signal-types";

/**
 * Builds the News & Signals feed: security news, Research Collector papers,
 * and Research Collector trusted-org publications, merged into one
 * time-ordered list. Community (X/LinkedIn) collects nothing — that lane is
 * UI-only until an official API path exists (docs/decisions/news-source-scope.md).
 *
 * This reads the same news pipeline and the same Research Collector store
 * everything else uses; it does not run a second collection.
 */
const MAX_PER_LANE = 5;
const MAX_TOTAL = 15;

function parsePubDate(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function buildSecurityLane(keywords: string[]): Promise<SignalItem[]> {
  if (keywords.length === 0) return [];

  const items = await fetchNewsForKeywords(keywords).catch(() => []);
  return items
    .map((item): SignalItem | null => {
      const at = parsePubDate(item.pubDate);
      if (at === null) return null;
      return {
        id: `security:${item.link}`,
        lane: "security",
        title: item.title,
        url: item.link,
        sourceLabel: item.source || "뉴스",
        at,
      };
    })
    .filter((item): item is SignalItem => item !== null);
}

function candidateToSignalItem(candidate: Candidate, lane: "research" | "industry"): SignalItem {
  const publishedAtMs = candidate.publishedAt ? Date.parse(candidate.publishedAt) : NaN;
  const at = Number.isNaN(publishedAtMs) ? candidate.collectedAt : publishedAtMs;
  const sourceLabel =
    lane === "research" ? candidate.venue ?? "논문" : candidate.organization ?? "신뢰 기관";

  return {
    id: `candidate:${candidate.id}`,
    lane,
    title: candidate.title,
    url: candidate.url,
    sourceLabel,
    at,
  };
}

async function buildCollectorLanes(): Promise<{ research: SignalItem[]; industry: SignalItem[] }> {
  const candidates = await listCandidates().catch(() => []);

  const research = candidates
    .filter((candidate) => candidate.sourceType === "paper")
    .map((candidate) => candidateToSignalItem(candidate, "research"));

  const industry = candidates
    .filter((candidate) => candidate.sourceType === "organization")
    .map((candidate) => candidateToSignalItem(candidate, "industry"));

  return { research, industry };
}

/** Caps each lane, then merges and caps the whole feed — always newest first. */
function assembleFeed(lanes: Record<SignalLane, SignalItem[]>): SignalFeed {
  const laneCounts: Record<SignalLane, number> = { security: 0, research: 0, industry: 0, community: 0 };
  const laneTruncated: Record<SignalLane, boolean> = {
    security: false,
    research: false,
    industry: false,
    community: false,
  };

  const capped: SignalItem[] = [];
  for (const lane of Object.keys(lanes) as SignalLane[]) {
    const sorted = [...lanes[lane]].sort((a, b) => b.at - a.at);
    laneCounts[lane] = sorted.length;
    laneTruncated[lane] = sorted.length > MAX_PER_LANE;
    capped.push(...sorted.slice(0, MAX_PER_LANE));
  }

  const items = capped.sort((a, b) => b.at - a.at).slice(0, MAX_TOTAL);
  return { items, laneCounts, laneTruncated };
}

export async function buildSignalFeed(keywords: string[]): Promise<SignalFeed> {
  const [security, collectorLanes] = await Promise.all([buildSecurityLane(keywords), buildCollectorLanes()]);

  return assembleFeed({
    security,
    research: collectorLanes.research,
    industry: collectorLanes.industry,
    community: [],
  });
}
