# News & Signals

## User-visible outcome

사용자가 하단 독의 새 아이콘을 누르면 `News & Signals` 화면으로 이동한다. 화면 중앙에는 여러 소스(보안 뉴스, 논문, 신뢰 기관 발행물)의 최신 항목이 하나의 시간순 피드로 섞여 나오고, 각 항목에는 소스 유형 배지·발행 매체·상대 시간이 붙는다. 오른쪽에는 AI가 그 피드 전체를 훑어 "이번 주 무엇이 뜨고 있는지"를 한두 문장으로 요약한 카드가 함께 뜬다. 이 화면은 개별 기사를 나열하는 RSS 리더가 아니라, 흩어진 신호를 사용자가 읽기 전에 하나의 흐름으로 미리 정리해 보여주는 화면이다.

## Approved scope

- 하단 독에 `News & Signals` 항목을 추가한다. 다른 dock 목적지(Research Inbox, 환경설정)와 같은 방식으로 카테고리 선택을 해제하고 전체 화면으로 이동한다.
- Signal Feed는 다음 세 레인의 항목을 시간순으로 합쳐 보여준다.
  - **Security News**: 사용자가 등록한 카테고리 키워드로 수집되는 기존 Google 뉴스 항목(카테고리별 "관련 뉴스"와 같은 파이프라인, 전체 카테고리를 합친 결과).
  - **Research**: Research Collector가 모은 논문 후보(OpenAlex) 중 최신 항목.
  - **Industry**: Research Collector가 모은 신뢰 기관 발행물 후보(NIST/OWASP/CISA) 중 최신 항목.
- **Community**(X/LinkedIn 소셜 신호)는 실제로 수집하지 않는다. 레인 자체는 화면에 보이되 "아직 수집하지 않음" 상태로 표시하고, 클릭 가능한 항목은 없다.
- 각 피드 항목은 소스 레인 배지, 제목, 원문 매체명, 발행 시각의 상대 표현("N시간 전"/"N일 전")을 보여준다. 원문 링크를 열면 실제 기사/논문/발행물로 연결된다.
- 레인마다 최신 항목 일부만 노출하고(레인당 상한), 전체 피드도 총 개수 상한을 둔다. 항목이 상한을 넘으면 잘렸다는 것을 화면에서 알 수 있게 한다.
- 오른쪽 AI Summary 카드는 그 시점의 피드 전체(세 레인의 실제 항목 제목)를 근거로 최근 두드러지는 주제를 한두 문장으로 서술한다. 이 요약은 기존 "AI 분석 실행" 흐름(카테고리 전체를 훑어 radar/insights 등을 만드는 한 번의 로컬 claude CLI 호출)에 한 항목을 추가하는 방식으로 만든다. 아직 실행하지 않았거나 실패했을 때는 그 상태를 그대로 보여준다.
- 샘플 모드에서는 세 레인 모두 미리 준비된 예시 항목과 예시 AI Summary로 채워지고, 실제 외부 요청은 전혀 나가지 않는다.

## Acceptance criteria

- [ ] 하단 독에서 `News & Signals`를 누르면 카테고리 선택이 풀리고 전용 화면이 뜬다.
- [ ] Security News 레인에 실제 카테고리 키워드 기반 뉴스 항목이 나타나고, 각 항목의 원문 링크를 열면 실제 기사로 연결된다.
- [ ] Research 레인에 실제 OpenAlex 논문 후보가 나타나고, Industry 레인에 실제 NIST/OWASP/CISA 발행물 후보가 나타난다. 두 레인 모두 Research Collector가 이미 수집해 둔 후보와 같은 데이터다(중복 수집을 새로 만들지 않는다).
- [ ] Community 레인은 항목 없이 "아직 수집하지 않음" 상태만 보이고, 클릭 가능한 링크나 가짜 데이터가 없다.
- [ ] 각 피드 항목에 소스 레인 배지·매체명·상대 시간이 함께 보이고, 상대 시간은 실제 발행/수집 시각을 근거로 계산된다(추정하지 않는다).
- [ ] AI Summary를 실행하면, 그 시점 피드에 실제로 있는 항목 제목을 근거로 만든 한두 문장이 나타난다. 실행 전에는 실행 버튼이, 실패하면 에러 안내가 보인다.
- [ ] 세 레인 중 어느 하나가 비어 있어도(예: 그 카테고리에 논문 후보가 아직 없음) 화면이 깨지지 않고 "아직 없음"류 안내가 보인다.
- [ ] 레인별/전체 상한을 넘는 항목이 있으면 잘렸다는 표시가 보인다.
- [ ] 샘플 모드에서는 실제 API 키·외부 요청 없이 세 레인과 AI Summary가 예시 데이터로 전부 채워진다.
- [ ] 카테고리를 하나도 만들지 않은 상태에서도 화면이 에러 없이 안내를 보여준다.

## Settled constraints and rationale

- Twitter/X, LinkedIn 실 수집은 하지 않는다 — [docs/decisions/news-source-scope.md](../../decisions/news-source-scope.md)(공식 무료 검색 API 없음, 스크래핑은 약관 위반 위험)가 여전히 유효하다. Community 레인은 그 결정이 풀리기 전까지 자리만 마련한다.
- "Industry" 레인은 실제로 신뢰 기관(NIST/OWASP/CISA) 공식 발행물이며, 예시의 "기업 발표" 문구와는 다르다. 배지 이름을 정확히 표시해 사용자가 실제 출처를 오인하지 않게 한다(사용자 확인 사항).
- Research/Industry 레인은 Research Collector가 이미 수집한 후보를 그대로 읽는다. 이 화면 때문에 별도 수집 파이프라인을 새로 만들지 않는다 — 같은 자료가 Research Inbox와 이 피드에 동시에 나타날 수 있으며, 이 피드는 읽기용 미리보기이고 Add/Important/Read Later/Ignore 액션은 여전히 Research Inbox에서만 한다.
- Signal Feed의 개별 항목은 Vault 지식이 아니라 외부 정보다 — [docs/decisions/knowledge-source-precedence.md](../../decisions/knowledge-source-precedence.md)의 "뉴스는 지식 소스가 아니라 바깥 흐름을 파악하는 패널"이라는 경계를 그대로 따른다.
- AI Summary는 로컬 `claude` CLI로 만든다 — [docs/decisions/local-claude-cli-runtime.md](../../decisions/local-claude-cli-runtime.md).
- 하단 독에 새 화면을 추가하는 방식은 이번 세션에서 Research Inbox·환경설정을 추가할 때 이미 쓴 패턴을 그대로 따른다(카테고리 매니저 컬럼 + 본문 + 보조 컬럼의 3단 구성).
- Major Security Issues 패널(메인 화면에 이미 있음)과는 역할을 분리한다: Major Security Issues는 여러 기사를 사건 단위로 묶은 "중요한 것만" 큐레이션이고, 이 Signal Feed는 세 소스를 시간순으로 섞은 "지금 들어오는 것"의 미리보기다. 하나를 없애거나 합치지 않는다.

## Assumptions

- 레인당 최신 5건, 전체 피드 상한 15건 정도로 시작한다(추후 조정 가능).
- 상대 시간 표기는 프로젝트의 기존 한글 표기 관례를 따른다("2시간 전", "3일 전" 등, 예시의 "2h" 같은 영문 축약형은 쓰지 않는다).
- 화면 배치는 기존 dock 화면들과 같은 3단 그리드를 쓰고, 가운데는 Signal Feed, 오른쪽은 AI Summary가 맡는다.
- Security News 레인은 사용자가 등록한 모든 카테고리의 키워드를 합쳐서 가져온다(카테고리 상세 화면의 "관련 뉴스"는 그 카테고리 키워드만 쓰는 것과 다름).

## Off-limits (and why)

- Twitter/X, LinkedIn 실제 수집 — 위 결정 사항 참고. 공식 API가 열리면 재검토.
- 여러 기사를 하나의 사건으로 묶는 클러스터링 — 그건 이미 있는 Major Security Issues의 역할이다. 이 피드는 클러스터링 없이 시간순으로만 보여준다.
- Signal Feed 항목에서 바로 `Add to Wiki`나 `Important` 등 Research Inbox 액션을 수행하는 것 — 이 화면은 미리보기이고, 실제 선별 행동은 Research Inbox에서만 한다. 두 화면의 책임을 섞지 않는다.
- 카테고리 상세 화면의 기존 "관련 뉴스" 패널(NewsPanel) 변경 — 이번 스펙과 병행하며 손대지 않는다.

## Deferred

- Community 레인의 실제 수집은 공식 API 접근 경로가 열리면 다시 다룬다.
- 레인별/전체 상한 값을 사용자가 조정하는 설정.
- 피드를 자동으로 주기 갱신하는 것 — Research Collector와 마찬가지로 이번 범위는 사용자가 화면을 열 때 보이는 현재 상태만 다룬다.

## Remaining risks

- Research/Industry 레인이 비어 있을 수 있다(카테고리에 아직 Research Collector를 한 번도 실행하지 않았다면). 그 경우 "자료 수집을 먼저 실행해주세요" 같은 안내로 연결해야 사용자가 막히지 않는다.
- 세 레인을 하나의 시간순 피드로 합칠 때, 소스마다 시각 정밀도가 다르다(뉴스는 pubDate, 논문은 발행일 또는 수집일, 발행물은 발행일 또는 수집일). 정렬은 되지만 "몇 시간 전"이 실제 발행 시각이 아니라 수집 시각을 반영하는 항목이 섞일 수 있다.
