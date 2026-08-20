import type { Candidate, SourceType } from "@/lib/research-types";
import { candidateId } from "@/lib/research-store";

/**
 * Academic paper collector. OpenAlex needs no API key, but the free tier is
 * metered by credits (a search costs 10 of ~1000 per window), so the caller
 * caps how many searches one collection run may issue.
 */
const OPENALEX_WORKS = "https://api.openalex.org/works";

const SELECT_FIELDS = [
  "id",
  "doi",
  "display_name",
  "publication_date",
  "authorships",
  "primary_location",
  "cited_by_count",
  "abstract_inverted_index",
].join(",");

const MAX_AUTHORS = 5;
const MAX_EXCERPT_CHARS = 900;

type OpenAlexWork = {
  id?: string;
  doi?: string | null;
  display_name?: string | null;
  publication_date?: string | null;
  cited_by_count?: number | null;
  authorships?: Array<{ author?: { display_name?: string | null } | null }> | null;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
};

/** OpenAlex ships abstracts as a word→positions map; put the words back in order. */
export function reconstructAbstract(inverted: Record<string, number[]> | null | undefined): string | null {
  if (!inverted) return null;
  const byPosition: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const position of positions) byPosition.push([position, word]);
  }
  if (byPosition.length === 0) return null;
  byPosition.sort((a, b) => a[0] - b[0]);
  return byPosition.map(([, word]) => word).join(" ").slice(0, MAX_EXCERPT_CHARS);
}

/**
 * Multi-word keywords are quoted. Verified against the live API: the unquoted
 * form matches any word, so `vulnerability exploitability exchange` returned
 * building-insulation papers, while the quoted form returned only VEX work.
 */
export function buildSearchTerm(keyword: string): string {
  const trimmed = keyword.trim().replace(/["]/g, "");
  if (!trimmed) return "";
  return trimmed.includes(" ") ? `"${trimmed}"` : trimmed;
}

export function buildWorksUrl(keyword: string, since: string | null, perPage: number): string {
  const term = buildSearchTerm(keyword);
  const filters = [`title_and_abstract.search:${term}`];
  if (since) filters.push(`from_publication_date:${since}`);

  const params = new URLSearchParams({
    filter: filters.join(","),
    select: SELECT_FIELDS,
    sort: "publication_date:desc",
    "per-page": String(perPage),
  });

  // OpenAlex's polite pool keys off a contact address. Opt-in only — never a
  // hardcoded address, since that would send a real email to a third party.
  const mailto = process.env.OPENALEX_MAILTO?.trim();
  if (mailto) params.set("mailto", mailto);

  return `${OPENALEX_WORKS}?${params.toString()}`;
}

function toCandidate(work: OpenAlexWork, topicKey: string, foundVia: string, collectedAt: number): Candidate | null {
  const title = work.display_name?.trim();
  if (!title) return null;

  const openAlexId = work.id?.replace(/^https?:\/\/openalex\.org\//i, "") ?? null;
  const doi = work.doi ?? null;
  const url = doi ?? work.primary_location?.landing_page_url ?? (work.id ?? "");
  if (!url) return null;

  const identity = { doi, openAlexId, url, title };
  const sourceType: SourceType = "paper";

  return {
    id: candidateId(topicKey, identity),
    topicKey,
    sourceType,
    title,
    url,
    doi,
    openAlexId,
    publishedAt: work.publication_date ?? null,
    authors: (work.authorships ?? [])
      .map((authorship) => authorship?.author?.display_name?.trim())
      .filter((name): name is string => Boolean(name))
      .slice(0, MAX_AUTHORS),
    venue: work.primary_location?.source?.display_name ?? null,
    organization: null,
    citedByCount: work.cited_by_count ?? null,
    excerpt: reconstructAbstract(work.abstract_inverted_index),
    foundVia: foundVia,
    analysis: null,
    status: "new",
    collectedAt,
  };
}

export type PaperSearchResult = {
  candidates: Candidate[];
  /** Set when OpenAlex refused the call, so the run can report it instead of showing zero. */
  warning?: string;
};

export async function searchPapers(
  keyword: string,
  topicKey: string,
  options: { since?: string | null; perPage?: number; collectedAt?: number } = {},
): Promise<PaperSearchResult> {
  const term = buildSearchTerm(keyword);
  if (!term) return { candidates: [] };

  const url = buildWorksUrl(keyword, options.since ?? null, options.perPage ?? 10);
  const collectedAt = options.collectedAt ?? Date.now();

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    return { candidates: [], warning: `OpenAlex 요청이 실패했어요 (${keyword}).` };
  }

  if (response.status === 429) {
    return { candidates: [], warning: "OpenAlex 무료 사용량을 모두 썼어요. 잠시 후 다시 시도해주세요." };
  }
  if (!response.ok) {
    return { candidates: [], warning: `OpenAlex가 ${response.status}를 반환했어요 (${keyword}).` };
  }

  let payload: { results?: OpenAlexWork[] };
  try {
    payload = await response.json();
  } catch {
    return { candidates: [], warning: `OpenAlex 응답을 읽지 못했어요 (${keyword}).` };
  }

  const candidates = (payload.results ?? [])
    .map((work) => toCandidate(work, topicKey, keyword, collectedAt))
    .filter((candidate): candidate is Candidate => candidate !== null);

  return { candidates };
}
