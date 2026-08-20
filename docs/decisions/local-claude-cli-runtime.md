# Local LLM Runtime (Claude CLI)

## Decisions

- 앱 안에서 새로 텍스트를 생성해야 하는 AI 기능(LUMI 채팅 답변, 기술 동향 분석 등)은 OpenAI/Anthropic API를 직접 호출하지 않고, 서버 프로세스에서 로컬에 설치·로그인된 `claude` CLI를 `claude -p`(non-interactive print 모드)로 실행해 생성한다. 맥락(뉴스 컨텍스트, 대화 기록 등)은 `--system-prompt`와 프롬프트 문자열로 전달하고, 도구 사용은 `--disallowedTools`로 모두 막는다. 공용 실행 로직은 `lib/local-claude-cli.ts`에 둔다.

## Boundaries

- 이 결정은 이 앱이 직접 호출하는 생성형 AI 기능 전반에 적용된다(LUMI 채팅, 기술 동향 분석 등). 뉴스 정리본(`lib/summarize.ts`)만 예외로 여전히 OpenAI API를 사용한다.
- 이 방식은 앱을 실행하는 서버 환경에 `claude` CLI가 설치되어 있고 로그인(구독) 상태여야 동작한다. 일반적인 호스팅 배포 환경(Vercel 등)에는 `claude` CLI가 없으므로 그대로는 동작하지 않는다 — 로컬 개발 환경 또는 CLI가 설치된 서버에서만 유효하다.

## Why

OpenAI API는 별도 결제(크레딧)가 필요하고, 사용자의 OpenAI 계정은 `insufficient_quota`로 막혀 있었다. ChatGPT Plus/Claude Pro 같은 소비자 구독은 API 플랫폼 결제와 별개라 문제를 해결해주지 못한다. 사용자는 이미 이 환경에서 `claude` CLI에 로그인되어 있으므로, 별도 API 키·결제 없이 그 인증을 그대로 재사용해 채팅 기능을 동작시키기로 했다.

## Reconsider when

- 이 앱을 `claude` CLI가 없는 환경(예: 일반 클라우드 호스팅)에 배포해야 할 때 — 그때는 정식 API 키 기반 방식으로 되돌리거나 별도 백엔드가 필요하다.
- OpenAI 또는 Anthropic API에 정식으로 결제·크레딧이 연결되어 API 키 기반 방식을 다시 쓸 수 있게 됐을 때.

## Still-rejected alternatives

- OpenAI API 키 — 계정에 결제 수단이 연결되지 않아 `insufficient_quota` 오류로 막힘; 결제가 연결되면 재검토.
- ChatGPT Plus/Claude Pro 구독으로 API 호출 대체 — 소비자 구독은 API 플랫폼과 별도 결제 체계라 지원되지 않으며, 세션 쿠키 등으로 우회하는 것은 이용약관 위반이라 배제.
