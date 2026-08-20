# dev-environment-lacks-claude-cli-subscription

## Symptom

Research Collector 구현 중 실제 OpenAlex/기관 피드 수집은 성공했지만(38건 발견, 0건 오류), AI 관련성 분석은 매 배치가 실패해 후보 전부가 `analysis: null`로 남았다. `runCollection`의 `analysisSkipped`는 `false`였는데도 실제 점수는 하나도 없었다 — `isLocalClaudeCliAvailable()`이 `claude --version`만 확인하고 실제 `claude -p` 호출 성공 여부는 확인하지 않아서다.

## Observed evidence

이 개발 환경에서 직접 확인:
```
$ claude --version
2.1.226 (Claude Code)

$ claude -p "..." --system-prompt "..." --disallowedTools "..."
Your organization has disabled Claude subscription access for Claude Code · Use an Anthropic API key instead, or ask your admin to enable access
```
바이너리는 있고 버전 확인은 되지만, 이 세션을 구동하는 조직 계정에는 Claude 구독을 통한 CLI 접근이 비활성화돼 있다.

## Suspected cause

이 환경은 API 기반 에이전트 세션이라 `claude` CLI가 기대하는 소비자 구독 인증이 연결돼 있지 않다. 이는 `docs/decisions/local-claude-cli-runtime.md`가 이미 명시한 제약("서버 환경에 claude CLI가 설치되어 있고 로그인(구독) 상태여야 동작한다")이 실제로 발동한 사례이며, 코드 결함이 아니라 이 실행 환경의 인증 상태 문제다.

## What was tried

- `research-relevance.ts`의 `analyzeCandidates`가 배치 실패를 조용히 삼키던 부분을 고쳐, "CLI는 있지만 호출이 전부 실패"를 "CLI 자체가 없음"과 구분되는 `callsFailed` 신호로 반환하도록 함.
- `runCollection`이 그 신호를 `analysisCallsFailed`로 노출하고, Research Inbox 화면에 별도 경고 문구("claude CLI는 찾았지만 응답을 받지 못해...")로 표시.
- 실패를 `console.error`로 로깅해 서버 로그에서 원인을 추적할 수 있게 함.
- 이 조치로 사용자에게 정직하게 상태를 알리는 것까지는 해결했지만, **AI가 실제로 관련성 점수·요약·Wiki 노트 초안을 만드는 경로는 이 세션에서 런타임으로 검증하지 못했다.** 수집·중복제거·Inbox 표시·4개 액션·Vault 쓰기는 실제로 검증됨.

## Proposed next step

구독 접근이 가능한 환경(사용자의 실제 로컬 머신, 로그인된 `claude` CLI)에서 한 번 더 수집을 실행해 AI 관련성 점수·요약·Wiki 노트 초안 생성이 실제로 동작하는지 확인이 필요하다. 이 follow-up은 그 확인이 이뤄지면 지울 수 있다.
