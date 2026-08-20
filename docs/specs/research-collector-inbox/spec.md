# Research Collector & Research Inbox (Phase 1)

## User-visible outcome

사용자가 카테고리를 고르고 `자료 수집`을 실행하면, Lumi가 논문 데이터베이스와 신뢰 기관 발행물에서 그 카테고리와 관련된 외부 자료를 찾아 **Research Inbox**에 후보로 쌓는다. 각 후보에는 AI가 판단한 관련성과 그 판단 근거, 짧은 요약이 붙는다. 사용자는 후보를 하나씩 보고 `Add to Wiki` / `Important` / `Read Later` / `Ignore` 중 하나를 고른다. `Add to Wiki`를 고르면 구조화된 노트 초안이 먼저 화면에 뜨고, 사용자가 확정한 뒤에만 Vault에 새 노트로 저장된다. 수집된 자료가 사용자 확인 없이 Vault에 들어가는 경로는 없다.

## Approved scope

### 수집

- 카테고리별로 `자료 수집`을 실행하면 두 종류의 Collector가 각각 후보 자료를 가져온다.
  - **논문**: OpenAlex에서 카테고리의 Topic Profile 키워드로 검색한다. 제목·저자·발행일·Venue·DOI·인용 수·원문 링크를 함께 가져온다.
  - **신뢰 기관 발행물**: 기관 목록(레지스트리)에 등록된 공식 RSS/Atom Feed에서 새 발행물을 가져온다. Phase 1은 NIST, CISA, OWASP로 동작을 실증하고, 기관 추가는 목록에 항목을 더하는 것만으로 되게 한다.
- 공식 API와 Feed만 쓴다. 웹 검색으로 자료를 찾지 않는다.
- 각 후보 자료에는 **Source Type**(논문 / 기관 발행물)과 **출처 기관**을 함께 기록한다.
- 수집 실행 결과로 "N건 발견, M건 신규"와 마지막 실행 시각을 보여준다.

### 중복 제거

- DOI, 원문 URL, OpenAlex ID가 같으면 같은 자료로 보고 하나만 남긴다.
- 이미 Inbox에 있거나 사용자가 이전에 처리(`Add`/`Ignore`)한 자료는 다시 후보로 올라오지 않는다.

### AI 관련성 분석

- 수집된 후보마다 AI가 **관련성 점수(0~100)**, **그렇게 본 근거 한 줄**, **짧은 요약**을 만든다.
- 점수는 측정값이 아니라 AI 판단임을 화면에서 구분해 표시하고, 근거를 항상 함께 보여준다.
- 관련성 점수가 기준 미만인 후보는 Inbox 기본 목록에서 감춘다(사용자가 펼쳐 볼 수 있다).
- AI 런타임을 쓸 수 없으면 후보 자료는 그대로 수집·표시하되, 요약과 점수 자리에 "AI 분석 없음"을 표시한다. 수집 자체는 계속 동작한다.

### Research Inbox

- 후보 자료 목록을 관련성 순으로 보여준다. 각 항목은 제목, Source Type, 출처 기관, 발행일, 저자/기관, 관련 카테고리, 관련성 점수와 근거, AI 요약, 원문 링크를 포함한다.
- 하단 내비게이션에 `Research Inbox` 항목을 추가하고, 처리하지 않은 신규 후보 개수를 배지로 표시한다.
- 카테고리 상세 화면에서는 그 카테고리의 후보만 볼 수 있고, 신규 후보가 있으면 개수와 함께 검토로 넘어가는 진입점을 보여준다.

### 사용자 액션

- `Add to Wiki` — 노트 초안을 만들어 Vault에 저장하는 흐름으로 넘어간다.
- `Important` — 중요 자료로 표시하고 Inbox에 남긴다. 논문이면 Seed Paper가 된다.
- `Read Later` — Inbox에 그대로 남기고 나중에 검토할 것으로 표시한다.
- `Ignore` — 목록에서 내리고, 이후 수집에서 다시 올라오지 않는다.
- 네 액션 모두 기록으로 남아 다음 수집에 반영된다.

### Add to Wiki

- LLM이 후보 자료에서 Summary / Key Findings / Related Topics / Related Knowledge / Source 절을 갖춘 노트 초안을 만든다. 원문을 그대로 옮기지 않는다.
- 초안을 화면에 먼저 보여주고, 사용자가 확정해야 저장한다. 저장 위치는 그 카테고리의 Vault 폴더이며, 신규 파일만 만든다. 같은 이름의 파일이 이미 있으면 다른 이름으로 저장하고 기존 파일은 건드리지 않는다.
- 노트에는 AI가 생성한 내용과 원문 출처 정보가 구분되어 들어가고, 원문 링크와 DOI는 반드시 남는다.
- 저장된 노트는 기존 Knowledge DB 탐색과 그래프에서 다른 노트와 똑같이 보인다.
- AI 런타임을 쓸 수 없으면 제목·출처·링크·메타데이터만 채운 초안을 보여주고, AI 요약이 없다는 것을 명시한다.

### Topic Profile

- 카테고리마다 Topic Profile을 유지한다. 사용자가 이미 관리하는 키워드가 **Core Keywords**가 된다.
- Profile은 Core Keywords 외에 AI가 넓힌 키워드, 중요 저자, 중요 기관, Seed Paper, 제외 주제를 담는다.
- AI가 추가한 항목은 사용자가 확인·삭제할 수 있고, 누가 추가한 항목인지(사용자 / AI) 화면에서 구분된다.
- 사용자가 `Important`로 표시한 논문은 Seed Paper에 들어가고, `Ignore`가 반복된 주제는 제외 주제 후보로 올라온다.

### 샘플 모드

- 내장 샘플을 쓸 때는 미리 준비된 샘플 후보 자료가 Inbox에 채워져 네 액션과 초안 확인까지 전부 체험된다.
- 샘플 모드에서는 실제 외부 요청을 보내지 않고, Vault에 파일도 쓰지 않는다. 데모 데이터임이 화면에 표시된다.

## Acceptance criteria

- [ ] 카테고리를 고르고 `자료 수집`을 실행하면, OpenAlex에서 실제 논문 후보가 수집되어 Inbox에 나타난다.
- [ ] 신뢰 기관 Feed에서 실제 발행물 후보가 수집되어, Source Type과 출처 기관이 논문과 구분되어 표시된다.
- [ ] 같은 자료를 두 번 수집해도 Inbox에 중복으로 쌓이지 않는다.
- [ ] 각 후보에 관련성 점수와 그 판단 근거, AI 요약이 함께 표시되고, 점수가 AI 판단이라는 것이 화면에서 구분된다.
- [ ] 원문 링크를 열면 실제 논문/발행물 페이지로 연결된다.
- [ ] `Ignore`한 자료는 다시 수집을 실행해도 Inbox에 다시 나타나지 않는다.
- [ ] `Important`로 표시한 논문이 해당 카테고리의 Topic Profile에서 Seed Paper로 보인다.
- [ ] `Add to Wiki`를 누르면 노트 초안이 먼저 화면에 표시되고, 확정하기 전에는 Vault에 파일이 생기지 않는다.
- [ ] 초안을 확정하면 카테고리 폴더에 새 노트 파일이 생기고, 그 노트가 Knowledge DB 탐색에서 열린다. 기존 노트는 변경되지 않는다.
- [ ] 저장된 노트에 원문 링크와 출처 정보가 남아 있고, AI가 쓴 부분과 원문 정보가 구분된다.
- [ ] 하단 내비게이션의 `Research Inbox` 배지 숫자가 처리하지 않은 신규 후보 수와 일치하고, 액션을 수행하면 줄어든다.
- [ ] 카테고리 상세 화면에서 그 카테고리의 후보만 걸러 볼 수 있다.
- [ ] 샘플 모드에서 외부 요청이나 API 키 없이 Inbox → 네 액션 → 초안 확인까지 흐름이 끊기지 않고, Vault에 파일이 생기지 않는다.
- [ ] AI 런타임을 쓸 수 없는 상태에서도 수집과 Inbox 표시가 에러 없이 동작하고, 분석 없음이 명시된다.
- [ ] 앱을 새로 띄워도 Inbox의 후보와 이전에 수행한 액션이 남아 있다.

## Settled constraints and rationale

- 후보 자료는 Vault 밖에 쌓이고, Vault로 넘어가는 유일한 경로는 사용자의 `Add to Wiki`다. 초안 확인 후 신규 파일만 만든다 — [docs/decisions/external-source-vs-vault.md](../../decisions/external-source-vs-vault.md).
- 화면에 표시되는 지식의 출처 구분은 기존 결정을 그대로 따른다. 후보 자료는 Vault 지식이 아니며 연구 동향 그래프나 기술 동향을 만들지 않는다 — [docs/decisions/knowledge-source-precedence.md](../../decisions/knowledge-source-precedence.md).
- AI 요약·관련성 분석·노트 초안은 로컬 `claude` CLI로 생성한다 — [docs/decisions/local-claude-cli-runtime.md](../../decisions/local-claude-cli-runtime.md).
- 관련성 점수는 AI 판단이므로 측정값처럼 보이지 않게 표시하고 근거를 함께 낸다 — [docs/decisions/derived-metrics-honesty.md](../../decisions/derived-metrics-honesty.md)의 정직성 원칙 적용.
- 공식 API/Feed를 웹 검색보다 먼저 쓴다(요구사항 원칙 3). 트위터(X)·링크드인은 [docs/decisions/news-source-scope.md](../../decisions/news-source-scope.md)의 이유로 계속 제외한다.
- 기존 메인 화면 패널 여섯 개(Research Radar, Trend Panorama, What Changed, Major Security Issues, LUMI Insights, Continue Research)와 기존 뉴스 패널은 이번 범위에서 건드리지 않고 병행 추가한다(요구사항 원칙 10).
- 개인용 단일 사용자 도구이며 공유·협업은 범위 밖이다(PRODUCT.md 경계 계승).

## Assumptions

- 논문 백엔드는 OpenAlex 하나로 시작한다. 실제 호출로 API 키 없이 동작함을 확인했고, 검색당 10크레딧·창당 1000크레딧(약 100회)의 무료 한도가 있다. 한 번의 수집 실행이 쓰는 검색 횟수에 상한을 두고, 한도에 걸리면 사용자에게 알린다.
- 후보 자료와 액션 기록, Topic Profile은 Vault 밖 앱 로컬 저장소에 파일로 보관하고 버전 관리에는 포함하지 않는다. 서버 쪽 수집기가 읽고 쓰므로 브라우저 저장소에 두지 않는다.
- 관련성 점수는 0~100으로 표시하고, 기본 노출 기준선은 초기값을 두되 이후 조정 가능하게 한다.
- 카테고리 상세 화면은 기존 3단 구조를 유지하고, Inbox는 별도 화면으로 두면서 카테고리 필터로 연결한다.
- 수집은 사용자가 실행할 때만 돈다(on-demand). 마지막 실행 시각을 기록해 다음 수집이 그 이후 자료만 가져온다.
- 화면 문구는 한국어로 표시한다.

## Off-limits (and why)

- Semantic Scholar, arXiv, Crossref 연동 — 요구사항 20이 Phase 1을 논문 백엔드 하나로 정했다. 한 백엔드로 수집→Inbox→저장 흐름이 끝까지 도는 것을 먼저 검증한다.
- Citation / Reference / Related Paper 확장 탐색, Venue Watcher — Phase 2. Seed Paper는 이번에 쌓기 시작하지만 그것으로 탐색하지는 않는다.
- Authority / Novelty / Impact 점수 — Phase 2. 이번에는 Relevance만 낸다. 다만 Phase 2가 쓸 Source Type과 출처 기관은 지금부터 기록한다.
- Security Advisory / Vulnerability Collector, Security News Collector, Event Clustering — Phase 3. 기존 뉴스 패널이 그 자리를 임시로 채우고 있다.
- Weak Signal(X/LinkedIn), Emerging Topic Detection, AI Search Planner, Trend Analysis 연계 — Phase 3.
- LUMI 채팅의 `My Knowledge only` / `+ Recent External Sources` 범위 선택 — 요구사항 19가 "확장 가능한 구조"만 요구했다. 후보 자료에 출처와 상태를 기록해 두는 것까지만 하고 채팅은 건드리지 않는다.
- 자동 주기 실행(요구사항 16의 Source별 수집 주기) — 아래 Deferred 참고.
- 기존 노트 수정·삭제, 기존 노트에 링크 추가 — [external-source-vs-vault](../../decisions/external-source-vs-vault.md)가 금지한다.

## Deferred

- **요구사항 16의 Source별 자동 수집 주기는 이번 범위에서 구현하지 않는다.** Phase 1은 사용자가 누르면 도는 on-demand 수집만 넣는다. 주기 자동 실행은 상시 실행되는 스케줄러가 필요해 이 앱의 실행 모델(사용자가 로컬에서 띄우는 개발 서버)과 맞지 않는다. 상시 실행 환경이 정해지면 다시 다룬다.
- 관련성 기준선을 사용자가 조정하는 설정 화면.
- 후보 자료의 Semantic Duplicate 묶음(요구사항 14) — Phase 1은 Exact Duplicate만 처리한다. 같은 연구의 Preprint/Conference 버전이 둘 다 올라올 수 있다.
- 신뢰 기관 목록을 사용자가 화면에서 편집하는 기능. Phase 1은 기본 목록으로 시작한다.

## Remaining risks

- 관련성 점수를 사용자가 측정값으로 오독할 수 있다. AI 판단 표시와 근거 노출로 완화하지만, 숫자를 보여주는 것 자체의 위험은 남는다.
- OpenAlex 키워드 검색의 정밀도가 낮다는 것이 실제 호출로 확인됐다(`vulnerability exploitability exchange` 검색에 건물 단열 논문이 최신순 상위로 나옴). AI 관련성 게이트가 부실하면 Inbox가 무관한 자료로 찬다. Phase 1의 실질적 품질은 이 게이트에 달려 있다.
- OpenAlex 무료 크레딧이 창당 약 100회 검색이므로, 카테고리와 키워드가 많으면 한 번의 수집으로 한도에 닿을 수 있다.
- 로컬 `claude` CLI가 없는 환경에서는 요약·점수·초안이 모두 빠진 상태로 동작한다. 기능은 끊기지 않지만 Inbox의 선별 가치는 크게 떨어진다.
- Vault 쓰기가 이 앱에서 처음 생기는 동작이다. 사용자의 실제 Vault에 파일을 만들기 때문에, 경로 처리나 파일명 충돌 처리가 잘못되면 사용자 데이터가 있는 폴더에 영향이 간다. 신규 파일 생성만 허용하고 기존 파일을 열지 않는 것으로 범위를 좁혔다.
- 기관 RSS/Atom Feed 구조나 주소가 바뀌면 해당 기관 수집이 조용히 0건이 될 수 있다.
