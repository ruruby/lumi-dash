# Two-State Dashboard (Panorama / Deep Dive)

## User-visible outcome

카테고리를 선택하지 않으면 관심 분야 **전체**에서 지금 무엇이 중요하고 무엇이 변했는지 한눈에 보이고, 특정 카테고리를 선택하면 그 기술 **내부**의 지식 구조와 부족한 부분을 깊이 파고드는 화면으로 전환된다.

## Approved scope

### 화면 상태 분리

- 대시보드는 두 상태를 가진다: 카테고리 미선택(전체 파노라마)과 카테고리 선택(상세 심화).
- Obsidian 지식 그래프는 **전체 화면에서 제거**하고 상세 화면의 `연구 동향`에만 둔다.
- Vault는 단일 루트를 쓰고, 카테고리는 그 하위 폴더에 대응한다(기존 구조 유지).

### 전체 화면 구성

- **Research Radar**: 관심 주제별 상태(Hot / Emerging / Stable / Declining)와 증감 추세, 그리고 왜 주목받는지에 대한 AI 설명.
- **Trend Panorama**: 상위 기술 ↔ 세부 주제 관계를 주제 수준 토픽 맵으로 표현한다. 개별 문서 그래프가 아니다. 노드를 선택하면 그 상세 카테고리로 이동한다.
- **What Changed**: 최근 기간 동안 주제별로 새로 늘어난 자료 수와, 어떤 논의가 증가했는지에 대한 AI 요약. 기간은 변경 가능하다.
- **Major Security Issues**: 개별 기사 나열이 아니라, 같은 사건을 다룬 기사들을 하나의 사건으로 묶고 중요한 것만 노출한다. 사건별로 핵심 내용·영향·관련 기사·AI 요약을 보여준다.
- **LUMI Insights**: 전체 분야 기준 Emerging Topic / Suggested Keyword / Research Gap / New Connection.
- **Continue Research**: 최근 접근한 주제, 주제별 축적 노트 수, 마지막 접근 이후 늘어난 자료 수.

### 상세 화면 구성

- **연구 동향**이 중심 영역이며 다음을 포함한다.
  - 해당 카테고리 노트 기반 Knowledge Graph(문서 간 링크 시각화). 전체 vault가 아니라 선택한 카테고리 범위로 한정한다.
  - **Knowledge 분석**: Strongly Connected / Growing / Knowledge Gap / New Connection.
- 기존 기술 동향(성숙도 단계)과 뉴스, LUMI 채팅은 상세 화면에 유지한다.

### 수치의 출처

- 증감률과 "새로 늘어난 자료 수"는 **실제 타임스탬프에서 계산한다**: 뉴스는 RSS `pubDate`, 노트는 파일 수정 시각과 frontmatter `updated`.
- 최근 구간과 직전 동일 길이 구간을 비교해 증감을 낸다.
- 비교할 자료가 부족하면 숫자를 지어내지 않고 값 없음으로 표시한다.

## Acceptance criteria

- [ ] 카테고리를 선택하지 않으면 전체 파노라마 화면이 보이고, Obsidian 지식 그래프는 이 화면에 나타나지 않는다.
- [ ] 카테고리를 선택하면 상세 화면으로 전환되고, 그 카테고리 범위의 Knowledge Graph가 `연구 동향` 안에 표시된다.
- [ ] Trend Panorama의 노드를 선택하면 해당 카테고리의 상세 화면으로 이동한다.
- [ ] Research Radar의 증감률과 What Changed의 자료 수가 실제 뉴스 `pubDate` 및 노트 수정 시각에서 계산된 값이며, 근거가 없을 때는 숫자 대신 값 없음으로 표시된다.
- [ ] What Changed의 기준 기간을 바꾸면 표시되는 수치가 그에 맞게 다시 계산된다.
- [ ] Major Security Issues에서 같은 사건을 다룬 여러 기사가 하나의 항목으로 묶여 표시되고, 각 항목에 관련 기사들이 함께 딸려 있다.
- [ ] Continue Research의 노트 수가 각 카테고리 폴더의 실제 노트 수와 일치하고, 마지막 접근 이후 증가분이 표시된다.
- [ ] 상세 화면의 Knowledge 분석 네 항목이 그 카테고리 노트에 실제로 있는 내용을 근거로 채워진다.
- [ ] vault가 연결되지 않았거나 카테고리가 없으면 각 영역이 그 사실을 안내하고 화면이 깨지지 않는다.
- [ ] `claude` CLI가 없으면 AI 서술 영역은 안내를 표시하고, 계산으로 얻는 수치 영역은 그대로 동작한다.

## Settled constraints and rationale

- 중심 지식 소스는 vault, 뉴스는 별도 — [docs/decisions/knowledge-source-precedence.md](../../decisions/knowledge-source-precedence.md). Major Security Issues는 뉴스에서 오는 것이 맞으며, 이는 뉴스를 "바깥 흐름"으로 두는 그 결정과 어긋나지 않는다.
- AI 서술은 로컬 `claude` CLI로 생성한다 — [docs/decisions/local-claude-cli-runtime.md](../../decisions/local-claude-cli-runtime.md).
- 수치는 실제 타임스탬프에서만 도출하며 추정치를 지어내지 않는다 — [docs/decisions/derived-metrics-honesty.md](../../decisions/derived-metrics-honesty.md).

## Assumptions

- 전체 화면의 AI 서술(Radar 설명, What Changed 요약, Insights, 사건 묶기)은 매번 자동 실행하지 않고 사용자가 실행할 때 한 번에 계산한다. CLI 호출이 느리기 때문이며, 호출 횟수를 줄이려 한 번의 호출로 묶는다.
- 계산으로 얻는 값(노트 수, 증감, 토픽 맵, Continue Research)은 AI 실행 없이 즉시 표시한다.
- What Changed의 기본 기간은 최근 7일이다.
- Trend Panorama의 상위 노드는 카테고리, 하위 노드는 그 폴더의 노트 제목으로 구성한다.
- Continue Research의 마지막 접근 시점과 그때의 노트 수는 브라우저 `localStorage`에 저장한다.
- Major Security Issues는 카테고리들의 뉴스 중 보안 관련 기사를 모아 대상으로 삼는다.

## Off-limits (and why)

- 논문 데이터베이스(arXiv 등) 직접 연동 — 요구사항의 "new papers"에 해당하나, 뉴스 소스 범위를 정한 기존 결정([news-source-scope](../../decisions/news-source-scope.md))을 넘어선다. 지금은 노트와 뉴스만으로 자료 수를 센다.
- 사건 상세 화면(Incident Timeline → 관련 CVE → 영향 기술 → LUMI 분석) — 메인 화면의 사건 묶기가 먼저 검증된 뒤 별도로 다룬다.
- vault에 노트를 쓰는 기능 — 여전히 읽기 전용이다.

## Deferred

- 사건 선택 시 열리는 상세 화면과 CVE 연계.
- 논문 소스 연동으로 "new papers"를 실제 논문 수로 채우는 것.
- 이력 스냅샷을 별도로 저장해, 파일 시각이 없는 자료에도 장기 추세를 계산하는 것.

## Remaining risks

- 증감률은 자료에 담긴 타임스탬프에만 의존하므로, vault 노트를 한꺼번에 만들었거나 frontmatter가 없으면 추세가 의미 없게 나올 수 있다. 이 경우 값 없음으로 표시되지만 사용자가 기대한 그림과 다를 수 있다.
- 전체 화면 AI 분석은 여러 카테고리의 노트와 뉴스를 한 번에 컨텍스트로 넘기므로, 카테고리가 많아지면 느려지거나 일부가 누락될 수 있다.
- 요구사항의 "new papers / industry sources" 구분은 현재 소스만으로는 정확히 나눌 수 없어, 노트와 뉴스 기준의 자료 수로 대체해 표시한다.
