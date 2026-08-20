/**
 * External material the collectors found, and the topic conditions they search with.
 *
 * These live outside the vault. A 후보 자료 only becomes a note when the user
 * confirms a draft — see docs/decisions/external-source-vs-vault.md.
 */

/** Which collector produced a candidate. Phase 2's authority scoring reads this. */
export type SourceType = "paper" | "organization";

export type CandidateStatus =
  /** Collected, not yet acted on. Drives the Research Inbox badge. */
  | "new"
  /** Kept as a Seed Paper / important reference. */
  | "important"
  /** Deliberately postponed, stays in the inbox. */
  | "readLater"
  /** Turned into a vault note. */
  | "added"
  /** Dismissed. Never resurfaces from a later collection run. */
  | "ignored";

export const INBOX_STATUSES: CandidateStatus[] = ["new", "important", "readLater"];

/**
 * Below this the candidate is collapsed out of the default inbox list.
 * Lives here (not in research-relevance.ts) so client components can read it
 * without pulling in the local-claude-cli server module.
 */
export const RELEVANCE_THRESHOLD = 40;

/** AI judgement about one candidate. Never a measurement — always shown with its reason. */
export type RelevanceAnalysis = {
  /** 0–100. AI judgement, not a measured quantity. */
  score: number;
  /** One line explaining the score, shown next to it. */
  reason: string;
  /** Short AI summary of the material. */
  summary: string;
};

export type Candidate = {
  /** Stable across collection runs: derived from the dedup key. */
  id: string;
  /** Vault folder of the category this candidate belongs to. */
  topicKey: string;
  sourceType: SourceType;
  title: string;
  url: string;
  /** Normalized DOI (`10.xxxx/yyy`) when the source has one. */
  doi: string | null;
  openAlexId: string | null;
  /** ISO date (YYYY-MM-DD) when known. */
  publishedAt: string | null;
  authors: string[];
  /** Journal, conference, or publishing organization. */
  venue: string | null;
  /** Publishing organization, for `organization` candidates and Phase 2 authority. */
  organization: string | null;
  citedByCount: number | null;
  /** Raw abstract/description from the source, kept separate from AI text. */
  excerpt: string | null;
  /** Which keyword or feed surfaced it, so the user can see why it showed up. */
  foundVia: string;
  /** null when no AI runtime was available. */
  analysis: RelevanceAnalysis | null;
  status: CandidateStatus;
  collectedAt: number;
  /** Relative path of the note created by Add to Wiki, once it exists. */
  noteRelativePath?: string;
};

/** An entry the AI proposed or the user added, tracked separately so AI additions stay reviewable. */
export type ProfileEntry = {
  value: string;
  origin: "user" | "ai";
};

/**
 * What one category is currently looking for. Core keywords come from the
 * category the user already manages; everything else accumulates here.
 */
export type TopicProfile = {
  topicKey: string;
  /** AI-widened keywords. Core keywords stay in the category itself. */
  expandedKeywords: ProfileEntry[];
  importantAuthors: ProfileEntry[];
  importantOrganizations: ProfileEntry[];
  /** Candidate ids the user marked Important, used as Seed Papers from Phase 2 on. */
  seedPaperIds: string[];
  excludedTopics: ProfileEntry[];
};

export function emptyTopicProfile(topicKey: string): TopicProfile {
  return {
    topicKey,
    expandedKeywords: [],
    importantAuthors: [],
    importantOrganizations: [],
    seedPaperIds: [],
    excludedTopics: [],
  };
}

export type CollectRunResult = {
  /** How many candidates the collectors returned before dedup. */
  found: number;
  /** How many survived dedup and were stored as new. */
  added: number;
  /** How many were dropped as already known. */
  duplicates: number;
  /** Searches actually issued, so the user can see the API budget being spent. */
  searchesUsed: number;
  /** Set when the run stopped early against the per-run search cap. */
  budgetExhausted: boolean;
  /** True when no AI runtime was reachable, so candidates carry no analysis. */
  analysisSkipped: boolean;
  /**
   * True when the runtime was reachable but every judgement call still failed
   * (e.g. no subscription access behind the CLI). Distinct from
   * analysisSkipped: the runtime was there, it just could not answer.
   */
  analysisCallsFailed: boolean;
  /** Per-collector failures, surfaced instead of silently returning zero. */
  warnings: string[];
  finishedAt: number;
};

/** The structured note Add to Wiki proposes. Shown before anything is written. */
export type WikiNoteDraft = {
  candidateId: string;
  /** Note title, also the basis for the filename. */
  title: string;
  /** Full markdown body, AI sections plus a Source section built from real metadata. */
  markdown: string;
  /** False when no AI runtime was available and only metadata could be filled in. */
  aiGenerated: boolean;
};
