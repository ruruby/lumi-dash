import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
};

const GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search";
const MAX_ITEMS = 10;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchNewsByKeyword(keyword: string): Promise<NewsItem[]> {
  const url = `${GOOGLE_NEWS_RSS_URL}?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!response.ok) {
    throw new Error(`Google News RSS 요청이 실패했습니다 (status: ${response.status})`);
  }

  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);

  const rawItems = parsed?.rss?.channel?.item;
  if (!rawItems) return [];

  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.slice(0, MAX_ITEMS).map((item): NewsItem => ({
    title: stripHtml(String(item.title ?? "")),
    link: String(item.link ?? ""),
    pubDate: String(item.pubDate ?? ""),
    source: typeof item.source === "object" ? String(item.source["#text"] ?? "") : String(item.source ?? ""),
    snippet: stripHtml(String(item.description ?? "")),
  }));
}

const MAX_MERGED_ITEMS = 10;

export async function fetchNewsForKeywords(keywords: string[]): Promise<NewsItem[]> {
  const uniqueKeywords = Array.from(new Set(keywords.map((k) => k.trim()).filter(Boolean)));
  if (uniqueKeywords.length === 0) return [];

  const perKeywordResults = await Promise.all(
    uniqueKeywords.map((keyword) =>
      fetchNewsByKeyword(keyword).catch(() => [] as NewsItem[]),
    ),
  );

  const seenLinks = new Set<string>();
  const merged: NewsItem[] = [];

  for (const items of perKeywordResults) {
    for (const item of items) {
      if (seenLinks.has(item.link)) continue;
      seenLinks.add(item.link);
      merged.push(item);
    }
  }

  return merged.slice(0, MAX_MERGED_ITEMS);
}
