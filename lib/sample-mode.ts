import type { OverviewMetrics, OverviewNarrative } from "@/lib/overview-types";
import { TECH_STAGES, type TechProgressResult } from "@/lib/tech-progress-types";
import type { NewsResult } from "@/lib/useCategoryNews";

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
      emergingTopic: "관측성과 평가가 결합된 에이전트 운영",
      suggestedKeyword: "agent evaluation",
      researchGap: "샘플 노트에는 멀티모달 에이전트의 실패 복구 사례가 부족합니다.",
      newConnection: "효율적인 추론 지표를 LLM 평가 자동화와 같은 실행에서 수집할 수 있습니다.",
    },
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
