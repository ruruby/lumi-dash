# Knowledge Source Precedence

## Decisions

- Lumi의 중심 지식 소스는 사용자의 Obsidian vault(LLM Wiki)다. 연구 동향 그래프와 기술 동향은 vault의 노트에서 도출한다.
- 뉴스는 지식 소스가 아니라 **바깥 흐름을 파악하는 별도 패널**로 남는다. 뉴스가 연구 동향 그래프나 기술 동향을 만들어내지 않는다.
- LUMI 채팅은 위키와 뉴스 중 **어느 쪽을 근거로 답할지 사용자가 고른다.** 기본값은 위키다.

## Boundaries

- 이 결정은 화면에 표시되는 지식이 어디서 왔는지에 적용된다. 그 지식을 어떤 런타임으로 가공하는지는 [local-claude-cli-runtime](local-claude-cli-runtime.md)이 따로 정한다.
- vault 쓰기는 더 이상 금지가 아니다. 사용자가 Research Inbox에서 `Add to Wiki`로 확정한 자료에 한해 신규 노트를 생성하며, 기존 노트는 여전히 수정·삭제하지 않는다. 조건과 근거는 [external-source-vs-vault](external-source-vs-vault.md)가 정한다.

## Why

Obsidian 노트는 사용자가 직접 읽고 판단해서 정리한 결론이고, 뉴스는 아직 소화되지 않은 외부 정보다. 둘을 섞으면 "내가 내린 결론"과 "남이 쓴 기사"가 구분되지 않는다. 사용자는 이 서비스를 Obsidian 기반 세컨드 브레인을 더 쉽게 쓰는 도구로 규정했으므로, vault가 중심이고 뉴스가 주변이다.

LUMI 채팅만 예외로 두 소스를 모두 허용하는 이유는, 두 소스가 서로 다른 질문에 답하기 때문이다. 위키는 "내가 정리해 둔 결론이 무엇인가", 뉴스는 "지금 밖에서 무슨 일이 벌어지는가"에 답한다. 어느 하나로 대체할 수 없어 사용자가 고르게 한다.

## Reconsider when

- vault 없이도 쓸 수 있어야 한다는 요구가 생겼을 때. 지금은 vault가 없으면 중심 기능이 비어 있는 상태로 안내만 표시된다.
- ~~외부 자료를 vault 노트로 저장하는 흐름을 만들 때~~ — Research Collector에서 발동됨. 결과는 [external-source-vs-vault](external-source-vs-vault.md)에 있다.
- 뉴스 패널이 후보 자료 파이프라인에 흡수될 때. 지금은 뉴스와 Collector 후보가 별도 경로로 남아 있다.

## Still-rejected alternatives

- 뉴스를 연구 동향·기술 동향의 근거로 계속 사용 — 사용자가 정리한 결론과 외부 기사가 구분되지 않아 세컨드 브레인이라는 목적에 어긋남; vault가 비어 있는 사용자를 주 대상으로 삼게 되면 재검토.
- LUMI 채팅을 위키 전용으로 교체 — 이미 동작이 검증된 뉴스 그라운딩을 버리게 되고, 외부 동향 질문에 답할 수단이 사라짐.
