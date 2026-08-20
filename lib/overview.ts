import { readVault } from "@/lib/vault";
import { fetchNewsForKeywords, type NewsItem } from "@/lib/news";
import { buildTopicMetrics } from "@/lib/trend-metrics";
import { buildKeywordRadar, type EvidenceItem, type KeywordOwner } from "@/lib/keyword-radar";
import { runClaudeCli } from "@/lib/local-claude-cli";
import { getTopicProfile, listCandidates } from "@/lib/research-store";
import type {
  KeywordExplanation,
  OverviewMetrics,
  OverviewNarrative,
  SecurityIssue,
  TopicMapNode,
} from "@/lib/overview-types";
import { getSampleNews, isSampleVaultPath } from "@/lib/sample-mode";

export type OverviewCategoryInput = {
  name: string;
  folder: string;
  keywords: string[];
};

type GatheredTopic = {
  name: string;
  folder: string;
  noteTitles: string[];
  noteContext: string;
  news: NewsItem[];
};

const MAX_CHILDREN = 6;
const MAX_NEWS_FOR_AI = 24;
const MAX_NOTE_CHARS_PER_TOPIC = 2500;

function parsePubDate(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function gatherTopic(
  vaultPath: string,
  category: OverviewCategoryInput,
): Promise<{
  gathered: GatheredTopic;
  noteTimestamps: number[];
  newsTimestamps: number[];
  noteCount: number;
  /** Full note title/content/timestamp, kept only long enough to scan for keyword mentions. */
  noteEvidence: EvidenceItem[];
  newsEvidence: EvidenceItem[];
}> {
  const [vaultResult, news] = await Promise.all([
    readVault(vaultPath, category.folder).catch(() => ({ notes: [], truncated: false, totalFound: 0 })),
    category.keywords.length > 0
      ? isSampleVaultPath(vaultPath)
        ? Promise.resolve(
            getSampleNews(category.keywords).map((item) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              source: item.source,
              snippet: item.summary,
            })),
          )
        : fetchNewsForKeywords(category.keywords).catch(() => [] as NewsItem[])
      : Promise.resolve([] as NewsItem[]),
  ]);

  const noteTimestamps = vaultResult.notes.map((note) => note.updatedAt);
  const newsTimestamps = news
    .map((item) => parsePubDate(item.pubDate))
    .filter((value): value is number => value !== null);

  const noteContext = vaultResult.notes
    .map((note) => `- ${note.title}: ${note.content.replace(/\s+/g, " ").slice(0, 300)}`)
    .join("\n")
    .slice(0, MAX_NOTE_CHARS_PER_TOPIC);

  const noteEvidence: EvidenceItem[] = vaultResult.notes.map((note) => ({
    topicKey: category.folder,
    title: note.title,
    text: note.content,
    at: note.updatedAt,
  }));

  const newsEvidence: EvidenceItem[] = news
    .map((item) => {
      const at = parsePubDate(item.pubDate);
      return at === null ? null : { topicKey: category.folder, title: item.title, text: item.snippet, at };
    })
    .filter((item): item is EvidenceItem => item !== null);

  return {
    gathered: {
      name: category.name,
      folder: category.folder,
      noteTitles: vaultResult.notes.map((note) => note.title),
      noteContext,
      news,
    },
    noteTimestamps,
    newsTimestamps,
    noteCount: vaultResult.notes.length,
    noteEvidence,
    newsEvidence,
  };
}

/** Core keywords the user manages, plus any AI-expanded ones from that category's Topic Profile. */
async function gatherKeywordOwners(categories: OverviewCategoryInput[]): Promise<KeywordOwner[]> {
  return Promise.all(
    categories.map(async (category) => {
      // The Topic Profile only exists once a collection has run; absent is normal, not an error.
      const profile = await getTopicProfile(category.folder).catch(() => null);
      const expanded = profile?.expandedKeywords.map((entry) => entry.value) ?? [];
      return { topicKey: category.folder, keywords: [...category.keywords, ...expanded] };
    }),
  );
}

/** Research Collector candidates as keyword-radar evidence, scoped to categories the user actually has. */
async function gatherCandidateEvidence(categories: OverviewCategoryInput[]): Promise<EvidenceItem[]> {
  const folders = new Set(categories.map((c) => c.folder));
  const candidates = await listCandidates().catch(() => []);

  return candidates
    .filter((candidate) => folders.has(candidate.topicKey))
    .map((candidate) => {
      const publishedAtMs = candidate.publishedAt ? Date.parse(candidate.publishedAt) : NaN;
      const at = Number.isNaN(publishedAtMs) ? candidate.collectedAt : publishedAtMs;
      return { topicKey: candidate.topicKey, title: candidate.title, text: candidate.excerpt ?? "", at };
    });
}

export async function computeOverviewMetrics(
  vaultPath: string,
  categories: OverviewCategoryInput[],
  windowDays: number,
  now: number,
): Promise<{ metrics: OverviewMetrics; gathered: GatheredTopic[] }> {
  const [results, keywordOwners, candidateEvidence] = await Promise.all([
    Promise.all(categories.map((category) => gatherTopic(vaultPath, category))),
    gatherKeywordOwners(categories),
    gatherCandidateEvidence(categories),
  ]);

  const topics = results.map((result, index) =>
    buildTopicMetrics({
      topic: categories[index].name,
      folder: categories[index].folder,
      noteCount: result.noteCount,
      noteTimestamps: result.noteTimestamps,
      newsTimestamps: result.newsTimestamps,
      now,
      windowDays,
    }),
  );

  const topicMap: TopicMapNode[] = results.map((result, index) => ({
    topic: categories[index].name,
    folder: categories[index].folder,
    status: topics[index].status,
    children: result.gathered.noteTitles.slice(0, MAX_CHILDREN),
  }));

  const gathered = results.map((r) => r.gathered);
  const securityNewsCount = gathered.reduce((sum, topic) => sum + topic.news.length, 0);

  const keywordRadar = buildKeywordRadar({
    owners: keywordOwners,
    evidence: [...results.flatMap((r) => r.noteEvidence), ...results.flatMap((r) => r.newsEvidence), ...candidateEvidence],
    windowDays,
    now,
  });

  return {
    metrics: { windowDays, topics, topicMap, securityNewsCount, keywordRadar },
    gathered,
  };
}

/**
 * Google News links are ~400 chars of base64 each, which crowds the prompt out of
 * its time budget. Send short numeric refs instead and resolve them back afterwards.
 */
function buildNewsIndex(gathered: GatheredTopic[]): NewsItem[] {
  const seen = new Set<string>();
  const indexed: NewsItem[] = [];
  for (const topic of gathered) {
    for (const item of topic.news) {
      if (seen.has(item.link)) continue;
      seen.add(item.link);
      indexed.push(item);
      if (indexed.length >= MAX_NEWS_FOR_AI) return indexed;
    }
  }
  return indexed;
}

const MAX_KEYWORDS_FOR_AI = 8;

function buildKeywordEvidenceBlock(metrics: OverviewMetrics): string {
  if (metrics.keywordRadar.length === 0) return "(최근 언급된 키워드 없음)";

  return metrics.keywordRadar
    .slice(0, MAX_KEYWORDS_FOR_AI)
    .map((entry) => {
      const trend = entry.trendPercent === null ? "증감 비교 근거 없음" : `${entry.trendPercent}%`;
      return `- ${entry.keyword} (${entry.status}) · 최근 언급 ${entry.recentCount}건, 직전 ${entry.priorCount}건, 증감 ${trend} · 대표 자료: ${entry.sampleTitles.join(" / ") || "(없음)"}`;
    })
    .join("\n");
}

function buildNarrativePrompt(
  metrics: OverviewMetrics,
  gathered: GatheredTopic[],
  newsIndex: NewsItem[],
): string {
  const refByLink = new Map(newsIndex.map((item, i) => [item.link, i + 1]));

  const topicBlocks = gathered
    .map((topic, index) => {
      const m = metrics.topics[index];
      const trend = m.trendPercent === null ? "비교 근거 없음" : `${m.trendPercent}%`;
      const newsList = topic.news
        .slice(0, 8)
        .map((item) => {
          const ref = refByLink.get(item.link);
          return `  · ${ref ? `[${ref}] ` : ""}${item.title} (${item.source})`;
        })
        .join("\n");

      return `### ${topic.name}
상태: ${m.status} · 최근 ${metrics.windowDays}일 노트 ${m.recentNotes}건, 뉴스 ${m.recentNews}건 (직전 동기간 노트 ${m.priorNotes}건, 뉴스 ${m.priorNews}건) · 증감 ${trend}
노트 요약:
${topic.noteContext || "  (노트 없음)"}
관련 뉴스:
${newsList || "  (뉴스 없음)"}`;
    })
    .join("\n\n");

  const allNews = newsIndex.map((item, i) => `[${i + 1}] ${item.title} | ${item.source}`).join("\n");

  return `너는 사용자의 개인 연구 대시보드를 분석하는 어시스턴트야. 아래는 사용자의 관심 주제별 노트와 뉴스야.

주어진 자료에 실제로 있는 내용만 근거로 삼아. 자료에 없는 사실이나 수치를 지어내지 마. 숫자는 이미 계산되어 주어졌으니 새로 만들지 말고, 서술만 담당해.

다음 다섯 가지를 만들어:

1. radar — 각 주제가 왜 지금 그런 상태인지 한국어 한 문장씩. 위에 주어진 노트와 뉴스 내용을 근거로.
2. keywordRadar — 아래 [키워드별 언급 현황]에 나온 키워드마다, 왜 지금 주목할 만한지 한국어 한 문장. 반드시 그 키워드에 표시된 "대표 자료" 제목을 근거로 삼고, 목록에 없는 키워드는 만들지 마. 예: "최근 Tool Poisoning 관련 연구가 늘고 있습니다."
3. whatChanged — 각 주제에서 최근 어떤 논의나 연구 방향이 늘었는지 한국어 한 문장씩.
4. securityIssues — 아래 뉴스 목록에서 **같은 사건을 다룬 기사들을 하나로 묶어서**, 실제로 중요한 사건만 최대 4개 뽑아. 기사 한 건짜리 일반 소식은 제외하고, 여러 곳에서 다뤄졌거나 영향 범위가 큰 것만. articleRefs에는 그 사건을 다룬 기사의 대괄호 번호만 숫자로 넣어. 묶을 만한 중요한 사건이 없으면 빈 배열로 둬.
5. insights — 전체 주제를 가로질러 본 Emerging Topic, Suggested Keyword, Research Gap, New Connection.

반드시 아래 JSON 형식으로만 답해. 마크다운 코드블록 없이 순수 JSON만:
{"radar":[{"topic":"주제명","why":"한 문장"}],"keywordRadar":[{"keyword":"키워드","why":"한 문장"}],"whatChanged":[{"topic":"주제명","summary":"한 문장"}],"securityIssues":[{"title":"사건명","issueType":"유형","impact":"영향 범위","summary":"핵심 내용 한두 문장","articleRefs":[1,2],"severity":"high|medium|low"}],"insights":{"emergingTopic":"한 문장","suggestedKeyword":"키워드","researchGap":"한 문장","newConnection":"한 문장"}}

[주제별 자료]
${topicBlocks}

[키워드별 언급 현황]
${buildKeywordEvidenceBlock(metrics)}

[전체 뉴스 목록 - 사건 묶기용]
${allNews || "(뉴스 없음)"}`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseNarrative(raw: string, newsIndex: NewsItem[]): OverviewNarrative {
  const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  const radar = Array.isArray(parsed.radar)
    ? parsed.radar
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({ topic: asString(x.topic), why: asString(x.why) }))
        .filter((x) => x.topic && x.why)
    : [];

  const keywordRadar: KeywordExplanation[] = Array.isArray(parsed.keywordRadar)
    ? parsed.keywordRadar
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({ keyword: asString(x.keyword), why: asString(x.why) }))
        .filter((x) => x.keyword && x.why)
    : [];

  const whatChanged = Array.isArray(parsed.whatChanged)
    ? parsed.whatChanged
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({ topic: asString(x.topic), summary: asString(x.summary) }))
        .filter((x) => x.topic && x.summary)
    : [];

  const securityIssues: SecurityIssue[] = Array.isArray(parsed.securityIssues)
    ? parsed.securityIssues
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({
          title: asString(x.title),
          issueType: asString(x.issueType, "보안 이슈"),
          impact: asString(x.impact),
          summary: asString(x.summary),
          // Refs are 1-based indices into newsIndex; resolve them to the real links here
          // so the model never has to reproduce a long URL.
          articleLinks: Array.isArray(x.articleRefs)
            ? x.articleRefs
                .map((ref) => newsIndex[Number(ref) - 1]?.link)
                .filter((link): link is string => typeof link === "string")
            : [],
          severity: (x.severity === "high" || x.severity === "low"
            ? x.severity
            : "medium") as SecurityIssue["severity"],
        }))
        .filter((x) => x.title)
    : [];

  const insightsRaw =
    typeof parsed.insights === "object" && parsed.insights !== null
      ? (parsed.insights as Record<string, unknown>)
      : {};

  return {
    radar,
    keywordRadar,
    whatChanged,
    securityIssues,
    insights: {
      emergingTopic: asString(insightsRaw.emergingTopic),
      suggestedKeyword: asString(insightsRaw.suggestedKeyword),
      researchGap: asString(insightsRaw.researchGap),
      newConnection: asString(insightsRaw.newConnection),
    },
  };
}

export async function generateOverviewNarrative(
  metrics: OverviewMetrics,
  gathered: GatheredTopic[],
): Promise<OverviewNarrative> {
  const newsIndex = buildNewsIndex(gathered);

  // This pass covers every topic at once, so it needs more headroom than a chat turn.
  const raw = await runClaudeCli(
    "위 자료를 바탕으로 지정한 JSON을 만들어줘.",
    buildNarrativePrompt(metrics, gathered, newsIndex),
    180_000,
  );

  try {
    return parseNarrative(raw, newsIndex);
  } catch {
    throw new Error("분석 결과를 해석하지 못했어요.");
  }
}
