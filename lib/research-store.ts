import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  emptyTopicProfile,
  type Candidate,
  type CandidateStatus,
  type TopicProfile,
} from "@/lib/research-types";

/**
 * Candidates live outside the vault, so collecting more never pollutes the
 * user's notes — see docs/decisions/external-source-vs-vault.md. The server
 * collector reads and writes this, so it cannot live in browser storage.
 */
const DATA_DIR = path.join(process.cwd(), ".lumi");
const STORE_FILE = path.join(DATA_DIR, "research.json");

type StoreShape = {
  candidates: Candidate[];
  profiles: Record<string, TopicProfile>;
  /** Last successful collection per topic, so the next run only asks for newer material. */
  lastRuns: Record<string, number>;
};

function emptyStore(): StoreShape {
  return { candidates: [], profiles: {}, lastRuns: {} };
}

/** Strip the resolver prefix so the same DOI from two sources compares equal. */
export function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  const trimmed = doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  return trimmed.startsWith("10.") ? trimmed : null;
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    const normalized = `${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
    return normalized || null;
  } catch {
    return url.trim().toLowerCase() || null;
  }
}

/**
 * Exact-duplicate identity, in order of trust: DOI, then the OpenAlex work id,
 * then the URL. Semantic duplicates (preprint vs conference version) are out of
 * scope for Phase 1 and can both appear.
 */
export function dedupKey(candidate: Pick<Candidate, "doi" | "openAlexId" | "url" | "title">): string {
  const doi = normalizeDoi(candidate.doi);
  if (doi) return `doi:${doi}`;
  if (candidate.openAlexId) return `openalex:${candidate.openAlexId.trim().toLowerCase()}`;
  const url = normalizeUrl(candidate.url);
  if (url) return `url:${url}`;
  return `title:${candidate.title.trim().toLowerCase()}`;
}

/** Same material in the same topic always lands on the same id across runs. */
export function candidateId(topicKey: string, candidate: Parameters<typeof dedupKey>[0]): string {
  return createHash("sha1").update(`${topicKey}::${dedupKey(candidate)}`).digest("hex").slice(0, 16);
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      candidates: parsed.candidates ?? [],
      profiles: parsed.profiles ?? {},
      lastRuns: parsed.lastRuns ?? {},
    };
  } catch {
    // Missing or malformed store starts empty rather than failing the request.
    return emptyStore();
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Serializes read-modify-write so two requests (a collection run and an inbox
 * action) cannot clobber each other's changes.
 */
let queue: Promise<unknown> = Promise.resolve();

function withStore<T>(mutate: (store: StoreShape) => T | Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    const store = await readStore();
    const result = await mutate(store);
    await writeStore(store);
    return result;
  });
  // Keep the chain alive even when one caller rejects.
  queue = next.catch(() => undefined);
  return next;
}

export async function listCandidates(topicKey?: string): Promise<Candidate[]> {
  const store = await readStore();
  const all = topicKey === undefined ? store.candidates : store.candidates.filter((c) => c.topicKey === topicKey);
  return [...all].sort((a, b) => {
    const scoreA = a.analysis?.score ?? -1;
    const scoreB = b.analysis?.score ?? -1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return b.collectedAt - a.collectedAt;
  });
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const store = await readStore();
  return store.candidates.find((c) => c.id === id) ?? null;
}

export type UpsertResult = { added: number; duplicates: number };

/**
 * Stores freshly collected candidates. A candidate the user already acted on is
 * never resurrected — that is what makes Ignore stick across runs.
 */
export async function upsertCandidates(incoming: Candidate[]): Promise<UpsertResult> {
  return withStore((store) => {
    const known = new Set(store.candidates.map((c) => c.id));
    let added = 0;
    let duplicates = 0;

    for (const candidate of incoming) {
      if (known.has(candidate.id)) {
        duplicates += 1;
        continue;
      }
      known.add(candidate.id);
      store.candidates.push(candidate);
      added += 1;
    }

    return { added, duplicates };
  });
}

export async function setCandidateStatus(id: string, status: CandidateStatus): Promise<Candidate | null> {
  return withStore((store) => {
    const candidate = store.candidates.find((c) => c.id === id);
    if (!candidate) return null;
    candidate.status = status;

    // Important papers become Seed Papers for the topic's profile.
    if (status === "important" && candidate.sourceType === "paper") {
      const profile = (store.profiles[candidate.topicKey] ??= emptyTopicProfile(candidate.topicKey));
      if (!profile.seedPaperIds.includes(candidate.id)) profile.seedPaperIds.push(candidate.id);
    }
    if (status !== "important") {
      const profile = store.profiles[candidate.topicKey];
      if (profile) profile.seedPaperIds = profile.seedPaperIds.filter((seed) => seed !== candidate.id);
    }

    return candidate;
  });
}

export async function markCandidateAdded(id: string, noteRelativePath: string): Promise<void> {
  await withStore((store) => {
    const candidate = store.candidates.find((c) => c.id === id);
    if (!candidate) return;
    candidate.status = "added";
    candidate.noteRelativePath = noteRelativePath;
  });
}

export async function getTopicProfile(topicKey: string): Promise<TopicProfile> {
  const store = await readStore();
  return store.profiles[topicKey] ?? emptyTopicProfile(topicKey);
}

export async function saveTopicProfile(profile: TopicProfile): Promise<void> {
  await withStore((store) => {
    store.profiles[profile.topicKey] = profile;
  });
}

/** Removes one AI-proposed entry, so AI additions stay under user control. */
export async function removeProfileEntry(
  topicKey: string,
  field: "expandedKeywords" | "importantAuthors" | "importantOrganizations" | "excludedTopics",
  value: string,
): Promise<TopicProfile> {
  return withStore((store) => {
    const profile = (store.profiles[topicKey] ??= emptyTopicProfile(topicKey));
    profile[field] = profile[field].filter((entry) => entry.value !== value);
    return profile;
  });
}

export async function getLastRun(topicKey: string): Promise<number | null> {
  const store = await readStore();
  return store.lastRuns[topicKey] ?? null;
}

export async function setLastRun(topicKey: string, at: number): Promise<void> {
  await withStore((store) => {
    store.lastRuns[topicKey] = at;
  });
}

export type TopicCollectorStatus = {
  topicKey: string;
  lastRunAt: number | null;
  total: number;
  new: number;
  important: number;
  readLater: number;
  added: number;
  ignored: number;
};

/**
 * Per-topic collector activity: when it last ran and where every candidate it
 * ever produced currently stands. Drives the collector summary shown from the
 * profile view — every number here comes straight from stored records, never
 * estimated, per docs/decisions/derived-metrics-honesty.md.
 */
export async function getCollectorStatus(): Promise<TopicCollectorStatus[]> {
  const store = await readStore();
  const topicKeys = new Set<string>([...Object.keys(store.lastRuns), ...store.candidates.map((c) => c.topicKey)]);

  return [...topicKeys]
    .map((topicKey) => {
      const candidates = store.candidates.filter((c) => c.topicKey === topicKey);
      return {
        topicKey,
        lastRunAt: store.lastRuns[topicKey] ?? null,
        total: candidates.length,
        new: candidates.filter((c) => c.status === "new").length,
        important: candidates.filter((c) => c.status === "important").length,
        readLater: candidates.filter((c) => c.status === "readLater").length,
        added: candidates.filter((c) => c.status === "added").length,
        ignored: candidates.filter((c) => c.status === "ignored").length,
      };
    })
    .sort((a, b) => (b.lastRunAt ?? 0) - (a.lastRunAt ?? 0));
}
