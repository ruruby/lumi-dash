export type TopicStatus = "Hot" | "Emerging" | "Stable" | "Declining";

export type TopicMetrics = {
  topic: string;
  folder: string;
  /** Total notes in this topic's folder. */
  noteCount: number;
  /** Notes whose updatedAt falls in the recent window. */
  recentNotes: number;
  /** News items published in the recent window. */
  recentNews: number;
  /** Same counts for the window immediately before the recent one. */
  priorNotes: number;
  priorNews: number;
  /**
   * Percentage change from prior to recent window, or null when there is no
   * basis to compute one. Never estimated — see docs/decisions/derived-metrics-honesty.md.
   */
  trendPercent: number | null;
  status: TopicStatus;
};

type CountableItem = { at: number };

function countInWindow(items: CountableItem[], from: number, to: number): number {
  return items.filter((item) => item.at >= from && item.at < to).length;
}

/**
 * Percent change between two window counts.
 * Returns null when both windows are empty (nothing to compare) or when the
 * prior window is empty but the recent one is too small to be meaningful.
 */
export function computeTrendPercent(recent: number, prior: number): number | null {
  if (recent === 0 && prior === 0) return null;
  if (prior === 0) return null;
  return Math.round(((recent - prior) / prior) * 100);
}

export function classifyStatus(metrics: {
  recent: number;
  prior: number;
  trendPercent: number | null;
  noteCount: number;
}): TopicStatus {
  const { recent, prior, trendPercent, noteCount } = metrics;

  // Brand-new activity with no prior baseline reads as Emerging, not as a spike.
  if (prior === 0 && recent > 0) return "Emerging";
  if (trendPercent === null) return noteCount > 0 ? "Stable" : "Emerging";
  if (trendPercent >= 25) return "Hot";
  if (trendPercent > 0) return "Emerging";
  if (trendPercent < -25) return "Declining";
  return "Stable";
}

export function buildTopicMetrics(input: {
  topic: string;
  folder: string;
  noteCount: number;
  noteTimestamps: number[];
  newsTimestamps: number[];
  now: number;
  windowDays: number;
}): TopicMetrics {
  const { topic, folder, noteCount, noteTimestamps, newsTimestamps, now, windowDays } = input;

  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recentFrom = now - windowMs;
  const priorFrom = now - windowMs * 2;

  const notes = noteTimestamps.map((at) => ({ at }));
  const news = newsTimestamps.map((at) => ({ at }));

  const recentNotes = countInWindow(notes, recentFrom, now + 1);
  const recentNews = countInWindow(news, recentFrom, now + 1);
  const priorNotes = countInWindow(notes, priorFrom, recentFrom);
  const priorNews = countInWindow(news, priorFrom, recentFrom);

  const recent = recentNotes + recentNews;
  const prior = priorNotes + priorNews;
  const trendPercent = computeTrendPercent(recent, prior);

  return {
    topic,
    folder,
    noteCount,
    recentNotes,
    recentNews,
    priorNotes,
    priorNews,
    trendPercent,
    status: classifyStatus({ recent, prior, trendPercent, noteCount }),
  };
}
