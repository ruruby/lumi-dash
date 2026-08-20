/**
 * One time-ordered feed mixing security news, papers, and trusted-org
 * publications — a glance-level preview, not the Research Inbox triage
 * screen. See docs/specs/news-and-signals/spec.md.
 */
export type SignalLane = "security" | "research" | "industry" | "community";

export type SignalItem = {
  id: string;
  lane: SignalLane;
  title: string;
  url: string;
  /** The outlet/venue/organization name, shown next to the relative time. */
  sourceLabel: string;
  /** Publish time when known, collection time otherwise — always real, never estimated. */
  at: number;
};

export type SignalFeed = {
  /** Merged across lanes, newest first, capped to the feed-wide limit. */
  items: SignalItem[];
  /** How many items each lane actually had before the per-lane cap. */
  laneCounts: Record<SignalLane, number>;
  /** True when a lane had more items than the per-lane cap allowed through. */
  laneTruncated: Record<SignalLane, boolean>;
};
