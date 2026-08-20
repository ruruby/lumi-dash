import { XMLParser } from "fast-xml-parser";
import type { Candidate } from "@/lib/research-types";
import { candidateId } from "@/lib/research-store";
import { TRUSTED_SOURCES, type TrustedSource } from "@/lib/collectors/trusted-sources-config";

/**
 * Trusted-organization collector. Official feeds only — no web search, per the
 * spec's source-precedence rule. Adding an organization is a data change in
 * trusted-sources-config.ts, not new code here.
 */
export { TRUSTED_SOURCES, type TrustedSource };

const MAX_ITEMS_PER_FEED = 15;
const MAX_EXCERPT_CHARS = 900;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record["#text"] ?? "");
  }
  return String(value);
}

/** Atom entries put the address in `link[@href]`; RSS puts it in the element text. */
function linkOf(entry: Record<string, unknown>): string {
  const raw = entry.link;
  if (Array.isArray(raw)) {
    const alternate = raw.find((item) => {
      const record = item as Record<string, unknown>;
      const rel = record["@_rel"];
      return rel === undefined || rel === "alternate";
    });
    const record = (alternate ?? raw[0]) as Record<string, unknown> | undefined;
    return String(record?.["@_href"] ?? textOf(record) ?? "");
  }
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    return String(record["@_href"] ?? textOf(record));
  }
  return String(raw ?? "");
}

function dateOf(entry: Record<string, unknown>): string | null {
  const raw = textOf(entry.pubDate ?? entry.published ?? entry.updated ?? entry["dc:date"]);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

export type FeedFetchResult = {
  candidates: Candidate[];
  warning?: string;
};

export async function fetchTrustedSource(
  source: TrustedSource,
  topicKey: string,
  options: { since?: string | null; collectedAt?: number } = {},
): Promise<FeedFetchResult> {
  const collectedAt = options.collectedAt ?? Date.now();

  let response: Response;
  try {
    response = await fetch(source.feedUrl, {
      // Some government feeds reject clients without a browser-like agent.
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/rss+xml, application/atom+xml, application/xml" },
    });
  } catch {
    return { candidates: [], warning: `${source.organization} 피드에 접속하지 못했어요.` };
  }

  if (!response.ok) {
    return {
      candidates: [],
      warning: `${source.organization} 피드가 ${response.status}를 반환했어요 (이 네트워크에서 차단될 수 있어요).`,
    };
  }

  type ParsedFeed = {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };

  let parsed: ParsedFeed;
  try {
    const xml = await response.text();
    parsed = new XMLParser({ ignoreAttributes: false }).parse(xml) as ParsedFeed;
  } catch {
    return { candidates: [], warning: `${source.organization} 피드를 해석하지 못했어요.` };
  }

  const rawEntries = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? null;
  if (!rawEntries) return { candidates: [] };
  const entries: Record<string, unknown>[] = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  const candidates: Candidate[] = [];

  for (const entry of entries.slice(0, MAX_ITEMS_PER_FEED)) {
    const title = stripHtml(textOf(entry.title));
    const url = linkOf(entry).trim();
    if (!title || !url) continue;

    const publishedAt = dateOf(entry);
    // Skip material already seen in an earlier run for this topic.
    if (options.since && publishedAt && publishedAt < options.since) continue;

    const identity = { doi: null, openAlexId: null, url, title };
    const description = stripHtml(
      textOf(entry.description ?? entry.summary ?? entry.content ?? entry["content:encoded"]),
    );

    candidates.push({
      id: candidateId(topicKey, identity),
      topicKey,
      sourceType: "organization",
      title,
      url,
      doi: null,
      openAlexId: null,
      publishedAt,
      authors: [],
      venue: source.organization,
      organization: source.organization,
      citedByCount: null,
      excerpt: description ? description.slice(0, MAX_EXCERPT_CHARS) : null,
      foundVia: `${source.organization} 공식 피드`,
      analysis: null,
      status: "new",
      collectedAt,
    });
  }

  return { candidates };
}
