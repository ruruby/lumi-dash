import type { TopicMetrics } from "@/lib/trend-metrics";
import type { KeywordRadarEntry } from "@/lib/keyword-radar";

export type TopicMapNode = {
  topic: string;
  folder: string;
  status: TopicMetrics["status"];
  children: string[];
};

/** Everything computed from real data, with no AI involved. */
export type OverviewMetrics = {
  windowDays: number;
  topics: TopicMetrics[];
  topicMap: TopicMapNode[];
  /** Security-relevant news gathered across all categories, newest first. */
  securityNewsCount: number;
  /** Research Radar's keyword-level view — real mention counts, ranked by frequency. */
  keywordRadar: KeywordRadarEntry[];
};

export type RadarExplanation = { topic: string; why: string };
export type KeywordExplanation = { keyword: string; why: string };
export type ChangeSummary = { topic: string; summary: string };
export type SecurityIssue = {
  title: string;
  issueType: string;
  impact: string;
  summary: string;
  articleLinks: string[];
  severity: "high" | "medium" | "low";
};
export type LumiInsights = {
  emergingTopic: string;
  suggestedKeyword: string;
  researchGap: string;
  newConnection: string;
};

/** The single AI pass over everything above. */
export type OverviewNarrative = {
  radar: RadarExplanation[];
  keywordRadar: KeywordExplanation[];
  whatChanged: ChangeSummary[];
  securityIssues: SecurityIssue[];
  insights: LumiInsights;
};
