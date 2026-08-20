import type { OverviewMetrics, OverviewNarrative } from "@/lib/overview-types";
import { TECH_STAGES, type TechProgressResult } from "@/lib/tech-progress-types";
import type { NewsResult } from "@/lib/useCategoryNews";
import type { Candidate, TopicProfile } from "@/lib/research-types";
import type { CollectionSummary, TopicCollectorStatus } from "@/lib/research-store";
import type { SignalFeed } from "@/lib/signal-types";

export function isSampleVaultPath(vaultPath: string): boolean {
  const normalized = vaultPath.trim().replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();
  return normalized === "sample_vault" || normalized.endsWith("/sample_vault");
}

export function getSampleNews(keywords: string[]): NewsResult[] {
  const tools = keywords.some((keyword) => /tool|coding|langgraph|observability/i.test(keyword));
  const items = tools
    ? [
        ["코딩 에이전트의 검증 루프가 개발 도구의 핵심으로 부상", "에이전트가 코드를 작성하는 단계를 넘어 테스트와 실행 결과까지 확인하는 흐름을 다루는 샘플 기사입니다."],
        ["LLM 관측성 도구가 프롬프트·검색·비용을 하나의 trace로 연결", "모델 호출뿐 아니라 RAG 검색 결과와 도구 실행을 함께 추적하는 동향을 설명하는 데모 데이터입니다."],
        ["상태 그래프 기반 에이전트 오케스트레이션 확산", "중단과 재개, 사람 승인, 실패 복구가 필요한 워크플로에서 상태 그래프가 활용되는 흐름을 담았습니다."],
      ]
    : [
        ["긴 문맥과 RAG를 함께 사용하는 하이브리드 설계 증가", "긴 문맥만 확장하기보다 검색과 재정렬을 결합해 근거성과 비용을 함께 관리하는 흐름을 다루는 샘플 기사입니다."],
        ["멀티모달 모델 평가가 화면·문서 작업 중심으로 세분화", "OCR 정확도와 시각적 추론을 분리해 측정하는 평가 방식의 필요성을 설명하는 데모 데이터입니다."],
        ["효율적인 LLM 추론을 위한 양자화와 캐시 최적화", "품질 회귀를 확인하면서 메모리와 첫 토큰 지연을 줄이는 접근을 정리한 샘플 기사입니다."],
      ];

  return items.map(([title, summary], index) => ({
    title: `[샘플] ${title}`,
    summary,
    source: "Lumi 데모 데이터",
    link: `https://example.com/lumi-demo/${tools ? "tools" : "core"}/${index + 1}`,
    pubDate: new Date(Date.UTC(2026, 7, 20 - index)).toUTCString(),
  }));
}

export function getSampleNarrative(metrics: OverviewMetrics): OverviewNarrative {
  return {
    radar: metrics.topics.map((topic) => ({
      topic: topic.topic,
      why: topic.topic.includes("도구")
        ? "코딩 에이전트와 관측성 노트가 연결되며 실행과 검증 중심의 도구 흐름이 보입니다."
        : "에이전트, RAG, 평가 노트가 연결되며 모델 자체보다 시스템 품질을 함께 보는 흐름이 보입니다.",
    })),
    // Grounded in the same real keyword-radar entries the AI pass would receive,
    // so the demo "why" always matches a keyword that actually surfaced. Sample
    // news titles already carry their own "[샘플]" tag, so it is stripped here
    // to avoid doubling up with this line's own prefix.
    keywordRadar: metrics.keywordRadar.map((entry) => {
      const title = entry.sampleTitles[0]?.replace(/^\[샘플\]\s*/, "");
      return {
        keyword: entry.keyword,
        why: title
          ? `[샘플] "${title}" 등 최근 자료에서 다뤄지며 부각되고 있습니다.`
          : `[샘플] 최근 ${entry.recentCount}건의 자료에서 언급되며 부각되고 있습니다.`,
      };
    }),
    whatChanged: metrics.topics.map((topic) => ({
      topic: topic.topic,
      summary: topic.topic.includes("도구")
        ? "오케스트레이션과 관측성을 평가 자동화에 연결하는 방향이 최근 샘플 노트에서 강화됐습니다."
        : "에이전트 시스템과 효율적인 추론을 평가 체계로 검증하는 방향이 최근 샘플 노트에서 강화됐습니다.",
    })),
    securityIssues: [
      {
        title: "에이전트 도구 권한과 실행 추적",
        issueType: "샘플 보안 이슈",
        impact: "도구 실행 범위",
        summary: "에이전트가 외부 도구를 호출할 때 최소 권한과 승인 지점을 명시하고 실행 trace를 남겨야 합니다.",
        articleLinks: [],
        severity: "medium",
      },
    ],
    insights: {
      emergingTopic: "[샘플] LLM 관측성 관련 연구가 최근 빠르게 늘고 있습니다.",
      newConnection: "[샘플] LLM 관측성 연구와 평가 자동화 연구 사이에 강한 연관성이 있습니다 — 둘 다 실행 trace를 근거로 삼습니다.",
      researchGap: "[샘플] 코딩 에이전트 관련 자료는 작업 루프 설계에 집중되어 있지만, 실패 복구(failure recovery) 관련 자료는 상대적으로 부족합니다.",
      suggestedKeyword: "agentic failure recovery",
    },
    signalSummary:
      "[샘플] 이번 주에는 LLM 관측성과 에이전트 도구 권한 관련 논의가 눈에 띄게 늘었습니다.",
  };
}

export function getSampleTechProgress(folder: string): TechProgressResult & { demo: true } {
  const tools = folder.includes("도구");
  return {
    demo: true,
    overview: tools
      ? "샘플 노트에서는 관측성과 평가 자동화가 적용 단계에 가깝고, 에이전트 오케스트레이션은 프로토타입 검증이 진행 중입니다."
      : "샘플 노트에서는 RAG와 추론 최적화가 프로토타입 단계이며, 에이전트 시스템과 멀티모달 평가는 연구가 진행 중입니다.",
    items: tools
      ? [
          { keyword: "LLM 관측성", stage: TECH_STAGES[3], reason: "trace에 프롬프트, 검색, 비용을 함께 기록하는 운영 기준이 정리돼 있습니다." },
          { keyword: "평가 자동화", stage: TECH_STAGES[2], reason: "실패 trace를 회귀 데이터셋으로 전환하는 실행 원칙이 구체화돼 있습니다." },
          { keyword: "코딩 에이전트", stage: TECH_STAGES[1], reason: "작업 루프와 검증 기준은 있으나 대표 과업 실험이 더 필요합니다." },
        ]
      : [
          { keyword: "검색 증강 생성", stage: TECH_STAGES[2], reason: "검색, 재정렬, 근거 노출까지 파이프라인 설계가 구체화돼 있습니다." },
          { keyword: "에이전트 시스템", stage: TECH_STAGES[1], reason: "권한과 복구 원칙은 정리됐지만 실제 작업 성공률 검증이 필요합니다." },
          { keyword: "멀티모달 평가", stage: TECH_STAGES[0], reason: "평가 기준 후보를 수집하는 탐색 단계입니다." },
        ],
  };
}

/**
 * Sample 후보 자료. The Research Inbox flow — four actions and the draft
 * preview — has to be walkable before the user connects a vault or has a local
 * `claude` CLI, so these stand in for a real collection run. No external
 * request is made and no file is ever written in sample mode.
 */
export function getSampleCandidates(topicKey: string): Candidate[] {
  const tools = topicKey.includes("도구");
  const collectedAt = Date.UTC(2026, 7, 19);

  const rows: Array<
    [string, string, "paper" | "organization", string, string, number, string, string, string[]]
  > = tools
    ? [
        [
          "Agentic Coding Assistants: A Survey of Verification Loops",
          "2026-07-28",
          "paper",
          "ACM Computing Surveys",
          "10.1145/lumi.demo.3021",
          88,
          "코딩 에이전트가 생성한 코드를 테스트·실행으로 검증하는 루프를 정리한 서베이로, 개발 도구 카테고리의 핵심 주제와 직접 겹칩니다.",
          "코딩 에이전트의 검증 루프를 정적 분석, 테스트 생성, 실행 샌드박스 세 축으로 분류하고 각 축의 실패 유형을 정리한 서베이입니다. 검증 없는 생성은 회귀를 만든다는 결론을 데이터로 뒷받침합니다.",
          ["J. Park", "M. Osei", "L. Fabbri"],
        ],
        [
          "Tracing LLM Applications: Cost, Retrieval, and Tool Calls in One Span Tree",
          "2026-06-11",
          "paper",
          "USENIX ATC",
          "10.5555/lumi.demo.4412",
          74,
          "관측성 도구가 프롬프트·검색·비용을 하나의 trace로 묶는 구조를 다뤄 이 카테고리의 관측성 키워드와 관련됩니다.",
          "LLM 애플리케이션의 호출을 하나의 span tree로 묶어 검색 단계와 도구 실행까지 추적하는 계측 방식을 제안합니다. 비용 귀속을 span 단위로 계산해 병목을 찾습니다.",
          ["R. Ilves", "S. Nakamura"],
        ],
        [
          "OWASP Top 10 for LLM Applications: 2026 Refresh",
          "2026-08-05",
          "organization",
          "OWASP",
          "",
          81,
          "LLM 애플리케이션 보안 항목이 개발 도구 체인의 검증·관측성 요구와 직접 연결됩니다.",
          "LLM 애플리케이션의 상위 위험 10개를 갱신하며 에이전트 도구 권한과 공급망 항목을 새로 넣었습니다. 각 항목에 검증 지점을 제시합니다.",
          [],
        ],
        [
          "Thermal Comfort Modeling in Retrofitted Office Buildings",
          "2026-07-02",
          "paper",
          "Building and Environment",
          "10.1016/lumi.demo.998",
          8,
          "키워드 약어가 우연히 겹쳤을 뿐 건축 열환경 연구로, 이 카테고리와 관련이 없습니다.",
          "리트로핏 오피스 건물의 열 쾌적성을 시뮬레이션한 연구입니다.",
          ["A. Bianchi"],
        ],
      ]
    : [
        [
          "Retrieval-Augmented Generation Under Long Context: A Controlled Comparison",
          "2026-08-02",
          "paper",
          "NeurIPS",
          "10.5555/lumi.demo.1187",
          91,
          "긴 문맥과 RAG를 같은 조건에서 비교해 이 카테고리의 RAG 키워드와 정면으로 맞물립니다.",
          "동일 데이터셋에서 긴 문맥 단독과 RAG 결합을 비교해, 문서 수가 늘어날 때 검색·재정렬 결합이 근거성과 비용에서 우위를 보인다고 보고합니다.",
          ["H. Lindqvist", "T. Abebe", "Y. Sun"],
        ],
        [
          "Failure Modes of Tool-Using Language Agents",
          "2026-07-19",
          "paper",
          "ICLR",
          "10.5555/lumi.demo.2245",
          85,
          "도구를 쓰는 에이전트의 실패 유형을 분류해 에이전트 시스템 키워드와 직접 관련됩니다.",
          "도구 호출 에이전트의 실패를 계획 오류, 도구 오사용, 복구 실패로 나누고 각 유형의 탐지 신호를 제시합니다. 자율성보다 상태 관리가 성공률을 좌우한다고 결론합니다.",
          ["D. Moreau", "K. Ranganathan"],
        ],
        [
          "NIST AI Risk Management: Generative AI Profile Update",
          "2026-07-30",
          "organization",
          "NIST",
          "",
          72,
          "생성형 AI 위험 관리 지침이 평가·검증 주제와 연결되지만 기술 세부보다 정책 층위입니다.",
          "생성형 AI 시스템의 위험 관리 항목을 갱신하며 평가 증거와 문서화 요구를 구체화했습니다.",
          [],
        ],
        [
          "Multimodal Evaluation Beyond OCR Accuracy",
          "2026-06-24",
          "paper",
          "CVPR",
          "10.5555/lumi.demo.7731",
          68,
          "멀티모달 평가 기준을 세분화해 이 카테고리의 멀티모달 키워드와 관련됩니다.",
          "화면·문서 작업에서 OCR 정확도와 시각적 추론을 분리해 측정해야 한다고 주장하며 분리형 평가 세트를 제안합니다.",
          ["N. Okonkwo"],
        ],
      ];

  return rows.map(([title, publishedAt, sourceType, venue, doi, score, reason, summary, authors], index) => ({
    id: `sample-${tools ? "tools" : "core"}-${index + 1}`,
    topicKey,
    sourceType,
    title,
    url: doi ? `https://doi.org/${doi}` : `https://example.com/lumi-demo/${index + 1}`,
    doi: doi || null,
    openAlexId: null,
    publishedAt,
    authors,
    venue,
    organization: sourceType === "organization" ? venue : null,
    citedByCount: sourceType === "paper" ? 12 - index * 3 : null,
    excerpt: summary,
    foundVia: sourceType === "organization" ? `${venue} 공식 피드` : "샘플 키워드 검색",
    analysis: { score, reason, summary },
    status: "new",
    collectedAt: collectedAt - index * 86_400_000,
  }));
}

export function getSampleTopicProfile(topicKey: string): TopicProfile {
  const tools = topicKey.includes("도구");
  return {
    topicKey,
    expandedKeywords: tools
      ? [
          { value: "agentic code review", origin: "ai" },
          { value: "LLM tracing", origin: "ai" },
        ]
      : [
          { value: "long context retrieval", origin: "ai" },
          { value: "tool-using agents", origin: "ai" },
        ],
    importantAuthors: tools ? [{ value: "J. Park", origin: "ai" }] : [{ value: "H. Lindqvist", origin: "ai" }],
    importantOrganizations: [{ value: tools ? "OWASP" : "NIST", origin: "ai" }],
    seedPaperIds: [],
    excludedTopics: [{ value: tools ? "건축 열환경" : "전통적 침투 테스트", origin: "ai" }],
  };
}

export function getSampleNoteDraft(candidate: Candidate): string {
  // Conditional rows are dropped with `?? []` so intentional blank lines survive.
  return [
    "---",
    "updated: 2026-08-20",
    `source_type: ${candidate.sourceType}`,
    `source_url: ${candidate.url}`,
    ...(candidate.doi ? [`doi: ${candidate.doi}`] : []),
    "collected_by: lumi-research-collector",
    "---",
    "",
    `# ${candidate.title}`,
    "",
    "## Summary",
    "",
    `[샘플 초안] ${candidate.analysis?.summary ?? ""}`,
    "",
    "## Key Findings",
    "",
    "- 샘플 모드에서는 실제 AI 생성 대신 준비된 초안을 보여줍니다.",
    "- 확정을 눌러도 파일은 만들어지지 않습니다.",
    "- 자신의 Vault를 연결하면 같은 흐름이 실제 노트로 저장됩니다.",
    "",
    "## Research / Industry Implications",
    "",
    "이 자료는 카테고리의 핵심 주제와 연결되며, 기존 노트의 판단을 갱신할 근거가 됩니다.",
    "",
    "## Related Topics",
    "",
    "[[검색 증강 생성]]",
    "[[에이전트 시스템]]",
    "",
    "## Source",
    "",
    `- Type: ${candidate.sourceType === "paper" ? "학술 논문" : "기관 발행물"}`,
    `- Title: ${candidate.title}`,
    ...(candidate.authors.length > 0 ? [`- Authors: ${candidate.authors.join(", ")}`] : []),
    ...(candidate.venue ? [`- Venue: ${candidate.venue}`] : []),
    ...(candidate.publishedAt ? [`- Published: ${candidate.publishedAt}`] : []),
    ...(candidate.doi ? [`- DOI: ${candidate.doi}`] : []),
    `- URL: ${candidate.url}`,
    "- Collected by: Lumi Research Collector",
    "",
  ].join("\n");
}

/** Demo collector status for the profile view's summary card. */
export function getSampleCollectorStatus(): TopicCollectorStatus[] {
  return [
    {
      topicKey: "LLM 개발 도구",
      lastRunAt: Date.UTC(2026, 7, 19, 9, 30),
      total: 4,
      new: 3,
      important: 0,
      readLater: 0,
      added: 0,
      ignored: 1,
    },
    {
      topicKey: "LLM 핵심 기술",
      lastRunAt: Date.UTC(2026, 7, 18, 21, 10),
      total: 4,
      new: 3,
      important: 0,
      readLater: 0,
      added: 0,
      ignored: 1,
    },
  ];
}

/** Demo cross-category totals for the stat card next to Research Radar. */
export function getSampleCollectionSummary(): CollectionSummary {
  return {
    papers: 6,
    organizations: 2,
    addedToWiki: 0,
    lastCollectedAt: Date.UTC(2026, 7, 19, 9, 30),
  };
}

/** Demo News & Signals feed — matches the real feed's three collected lanes plus the uncollected Community lane. */
export function getSampleSignalFeed(): SignalFeed {
  const hour = 60 * 60 * 1000;
  const now = Date.UTC(2026, 7, 20, 9, 0);

  const items = [
    {
      id: "sample-security-1",
      lane: "security" as const,
      title: "[샘플] Critical vulnerability discovered in MCP reference server",
      url: "https://example.com/lumi-demo/security/1",
      sourceLabel: "SecurityNews",
      at: now - 2 * hour,
    },
    {
      id: "sample-research-1",
      lane: "research" as const,
      title: "[샘플] Securing Agentic AI Systems: A Survey",
      url: "https://example.com/lumi-demo/research/1",
      sourceLabel: "arXiv",
      at: now - 5 * hour,
    },
    {
      id: "sample-industry-1",
      lane: "industry" as const,
      title: "[샘플] NIST releases draft guidance on agentic AI risk",
      url: "https://example.com/lumi-demo/industry/1",
      sourceLabel: "NIST",
      at: now - 8 * hour,
    },
    {
      id: "sample-security-2",
      lane: "security" as const,
      title: "[샘플] Vendor advisory: authentication bypass in popular LLM gateway",
      url: "https://example.com/lumi-demo/security/2",
      sourceLabel: "보안뉴스",
      at: now - 14 * hour,
    },
    {
      id: "sample-research-2",
      lane: "research" as const,
      title: "[샘플] Tool Poisoning Attacks Against LLM Agents",
      url: "https://example.com/lumi-demo/research/2",
      sourceLabel: "USENIX Security",
      at: now - 20 * hour,
    },
  ];

  return {
    items,
    laneCounts: { security: 2, research: 2, industry: 1, community: 0 },
    laneTruncated: { security: false, research: false, industry: false, community: false },
  };
}

export function getSampleChatReply(source: "wiki" | "news", question: string): string {
  const prefix = "[샘플 응답]";
  if (/평가|검증/.test(question)) {
    return `${prefix} 샘플 노트는 구성 요소 평가, 시나리오 평가, 운영 평가를 나누고 있습니다. 특히 실패 trace를 회귀 세트로 편입하고 품질·지연시간·비용을 함께 기록하는 방향을 권합니다.`;
  }
  if (/에이전트|agent/i.test(question)) {
    return `${prefix} 에이전트 시스템의 핵심은 자율성보다 상태, 도구 권한, 실패 복구입니다. 샘플에서는 짧은 계획-실행-검증 루프와 위험한 행동의 사람 승인을 우선 원칙으로 정리했습니다.`;
  }
  if (/rag|검색/i.test(question)) {
    return `${prefix} RAG는 검색 실패와 생성 실패를 분리해서 봐야 합니다. hybrid search, reranker, 출처 노출을 적용하고 검색 recall과 최종 답변 근거성을 별도로 평가하는 흐름이 적합합니다.`;
  }
  return source === "news"
    ? `${prefix} 현재 뉴스 탭은 실시간 기사가 아닌 Lumi 데모 데이터입니다. 샘플 흐름에서는 에이전트 운영, 관측성, 평가 자동화가 서로 연결되는 주제로 나타납니다.`
    : `${prefix} sample_vault의 노트를 기준으로 보면 LLM 핵심 기술은 RAG·에이전트·평가가, 개발 도구는 오케스트레이션·관측성·평가 자동화가 중심 연결입니다. 더 구체적인 주제를 질문해 주세요.`;
}
