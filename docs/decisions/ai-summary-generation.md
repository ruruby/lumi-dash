# News Summary Generation

## Decisions

- 뉴스 "정리본"은 OpenAI API 키가 설정되어 있으면 AI가 생성한 요약을 사용한다. 키가 없으면 RSS 원문의 설명(description) 스니펫을 그대로 정리본 자리에 표시하는 것으로 대체한다.

## Boundaries

- 이 결정은 뉴스 목록 화면의 정리본 필드에만 적용된다. 다른 화면(예: 전체 동향 요약)의 AI 요약 방식에는 적용되지 않는다.

## Why

이번 작업 시점에는 API 키가 준비되어 있지 않아, 키 없이도 뉴스 목록 기능 자체는 끝까지 동작하고 검증할 수 있어야 한다. 키가 준비되면 별도 코드 변경 없이 AI 요약으로 자연히 전환되도록 설계한다. LLM 제공자는 처음에는 Anthropic으로 시작했으나, 사용자가 LUMI 채팅 기능에 OpenAI API 키를 쓰기로 하면서 두 기능이 서로 다른 제공자를 쓰지 않도록 OpenAI로 통일했다.

## Reconsider when

- OpenAI API 키가 발급되어 `.env`에 설정된 이후, 실제 AI 요약 동작을 검증할 때.
- 제공자를 다시 바꾸거나 여러 제공자를 동시에 지원해야 할 필요가 생겼을 때.

## Still-rejected alternatives

- Anthropic API — 처음 채택했던 제공자였으나, 사용자가 LUMI 채팅에 OpenAI 키를 쓰기로 하면서 두 기능의 일관성을 위해 OpenAI로 교체함.
