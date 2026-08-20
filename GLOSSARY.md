# Glossary

Lumi는 사용자가 Obsidian에 정리해 둔 개인 지식(LLM Wiki)을 중심에 두고, 그 지식을 그래프·기술 동향·AI 대화로 다시 꺼내 쓰게 해주는 개인용 대시보드다. 뉴스는 그 바깥의 흐름을 따로 파악하는 보조 수단이다.

**LLM Wiki**:
사용자가 Obsidian에 마크다운으로 정리해 둔 개인 지식 저장소를 가리키며, LLM이 참고하는 세컨드 브레인으로 쓰인다. 별도의 외부 서비스가 아니라 Obsidian vault 그 자체를 부르는 이름이다.
_Avoid_: 위키, 지식 DB

**Vault**:
LLM Wiki의 실체가 되는 로컬 폴더. 마크다운 파일들과 그 사이의 `[[위키링크]]`로 이루어진다.
_Avoid_: 볼트, 노트 폴더

**노트**:
Vault 안의 마크다운 파일 하나. 파일 이름이 곧 노트 제목이며, 다른 노트를 `[[노트 제목]]` 형태로 참조한다.
_Avoid_: 문서, 페이지

**정리본**:
뉴스 원문을 짧게 정리한 텍스트. OpenAI API 키가 설정되어 있으면 AI가 생성하고, 키가 없으면 RSS 원문의 설명(description)을 그대로 보여준다.
_Avoid_: 요약, 요약본

**Collector**:
외부 Source에서 후보 자료를 가져오는 수집기. Source 종류(논문, 신뢰 기관 발행물 등)마다 따로 두며, 공식 API와 Feed를 웹 검색보다 먼저 쓴다.
_Avoid_: 크롤러, 스크래퍼

**후보 자료**:
Collector가 발견했지만 사용자가 아직 지식으로 채택하지 않은 외부 자료 한 건. Vault 밖에 쌓이며, 노트가 아니다. `Add to Wiki`로 확정될 때만 노트가 된다.
_Avoid_: Candidate, 수집 자료, 외부 노트

**Research Inbox**:
후보 자료를 사용자에게 제시하고 `Add to Wiki` / `Important` / `Read Later` / `Ignore`를 고르게 하는 화면. Vault와 외부 정보 사이의 유일한 관문이다.
_Avoid_: 수집함, 받은함

**Topic Profile**:
카테고리 하나가 무엇을 찾는 중인지 서술하는 탐색 조건 묶음. 사용자가 관리하는 키워드를 Core Keywords로 삼고, AI가 넓힌 키워드·저자·기관·Venue·Seed Paper를 그 위에 쌓는다. AI가 추가한 항목은 사용자가 확인하거나 지울 수 있다.
_Avoid_: 관심사 설정, 프로필

**Seed Paper**:
사용자가 `Important`로 표시했거나 이미 Vault에 있는 중요 논문. 이후 인용·관련 논문 탐색의 출발점으로 쓰인다.
_Avoid_: 시드, 기준 논문
