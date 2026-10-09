---
title: MCP 서버에서 세션이 사라지면 무엇이 깨질까요?
slug: mcp-stateless-default-claude-code
tags: [MCP, Claude Code, AI 에이전트]
category: insights
---

> MCP 규격 `2026-07-28` 은 7월에 공개됐지만 Claude Code 가 그 규격을 기본으로 묻기 시작한 것은 10월 6일과 8일입니다. 세션을 쓰던 서버가 새 규격으로 붙을 때 무엇을 잃고 어떤 설정으로 되돌릴 수 있는지, 공식 문서와 SDK 마이그레이션 문서에 적힌 범위로 정리했습니다.

MCP 서버를 하나 만들어 Claude Code 에 붙여 두고 몇 달째 그대로 쓰는 경우가 많습니다. 서버 코드는 손대지 않았는데 10월 들어 클라이언트 쪽 기본값이 먼저 바뀌었습니다. 그러면 연결에서 무엇이 달라질까요? 세션이 없어집니다. 연결을 열 때 한 번 주고받던 `initialize` 가 돌지 않고 `Mcp-Session-Id` 헤더도 사라집니다. 예를 들어 TypeScript SDK 로 만든 서버에서 `getClientCapabilities()` 를 부르면 새 규격으로 붙은 연결에서는 `undefined` 가 돌아옵니다. 그 값을 채워 주던 단계가 없어졌기 때문입니다. 협상이 어떤 규칙으로 일어나는지 알면 내 서버가 지금 어느 쪽으로 붙고 있는지, 무엇부터 고쳐야 하는지 알게 됩니다.

## 7월에 나온 규격과 10월에 바뀐 기본값

MCP 규격 `2026-07-28` 은 2026년 7월 28일에 공개됐습니다. 양방향 상태 유지 프로토콜을 요청·응답 방식으로 바꾼 개정입니다. 공식 블로그는 서버를 서버리스나 엣지 환경에 올릴 수 있게 하는 것이 목적이라고 적었습니다. 공개 시점의 안내는 Claude 제품군에 지원이 "곧" 들어간다는 정도였습니다.

기본값이 실제로 바뀐 것은 10월입니다. **10월 6일 Claude Code 2.1.292** 가 로컬 stdio MCP 서버 연결을 모든 설치에서 `2026-07-28` 로 협상하도록 바꿨습니다. 여기에는 Bedrock·Vertex·Foundry 설치도 들어갑니다. 이틀 뒤 **10월 8일 2.1.295** 는 플래그를 받아 오지 않는 설치의 claude.ai 커넥터까지 같은 기본값으로 옮겼습니다. 두 변경 모두 `MCP_PROTOCOL_NEGOTIATION` 을 `legacy` 로 두면 해제됩니다.

상태를 없앤 이유는 배포 쪽에 있습니다. 요청이 스스로를 설명하게 만들면 어느 요청이 어느 인스턴스로 가도 됩니다. 공식 블로그는 평범한 라운드로빈 로드밸런서 뒤에 서버를 여러 대 두고 공유 저장소 없이 운영할 수 있다고 설명합니다. 세션을 유지하려면 같은 클라이언트의 요청을 같은 인스턴스로 계속 보내야 했습니다. 그 제약이 서버리스나 엣지 환경에서 가장 먼저 걸립니다.

규격이 바뀐 날과 클라이언트가 그 규격을 먼저 묻기 시작한 날은 두 달 넘게 떨어져 있습니다. 서버를 운영하는 쪽에서 증상을 처음 보는 날은 뒤쪽입니다.

## 지원한다고 답한 서버에만 쓰는 v2 런타임

그럼 기본값이 바뀌었다고 모든 서버가 새 규격으로 넘어갈까요? 그렇지 않습니다. Claude Code 문서는 v2 런타임이 MCP TypeScript SDK 2.0 과 같은 코드이고 거기에 리비전 `2026-07-28` 이 들어 있다고 설명합니다. 이 런타임은 HTTP·stdio·claude.ai 커넥터 서버에 새 리비전을 지원하는지 묻고 **지원한다고 답한 서버와만** 그 리비전으로 통신합니다. 나머지 서버에는 v1 과 같은 방식으로 붙습니다.

서버 쪽 기본값도 아직 그대로입니다. TypeScript SDK v2 마이그레이션 문서는 opt-in 이라고 분명히 적어 뒀습니다. 직접 만든 `Server` 나 `McpServer` 는 v2 에서도 2025년 규격을 계속 씁니다. 아직 옮기지 않은 서버가 이번 주에 멈추지 않은 이유가 이것입니다.

그래서 분기점은 클라이언트가 바뀐 날이 아니라 내가 SDK 를 올리고 새 규격을 켜는 날입니다. 그날부터는 클라이언트가 이미 묻고 있으니 서버가 "지원한다"고 답하는 순간 바로 새 방식으로 연결됩니다.

## initialize 가 사라지면서 비는 값들

새 규격으로 붙은 연결에서는 `initialize` 가 아예 실행되지 않습니다. 그 단계에서 채우던 값이 전부 비게 되므로 `getClientCapabilities()` 와 `getClientVersion()` 은 `undefined` 를 돌려줍니다. 클라이언트 정보는 요청마다 따라오는 `_meta` 봉투로 옮겨갔습니다. SDK 에서는 `ctx.mcpReq.envelope` 에서 읽습니다. `io.modelcontextprotocol/protocolVersion`, `clientInfo`, `clientCapabilities` 같은 예약 키는 핸들러가 실행되기 전에 그 봉투 쪽으로 옮겨집니다.

연결 상태를 전제하던 기능도 같이 정리됐습니다. `ping` 은 2026년 연결에서 제거돼 들어온 요청에 `-32601` 이 돌아갑니다. 반대로 2026년 상대에게 `ping` 을 보내면 예외가 납니다. Streamable HTTP 요청에는 `MCP-Protocol-Version` 과 함께 `Mcp-Method`·`Mcp-Name` 헤더가 필수입니다. 헤더가 없으면 요청이 거부됩니다. 헤더와 본문이 어긋나면 `400` 응답과 JSON-RPC `-32020` 이 돌아옵니다. 게이트웨이가 본문을 열어 보지 않고도 요청을 라우팅하고 권한을 판단할 수 있게 하려는 설계입니다.

두 규격을 항목별로 비교해 보면 아래와 같습니다.

| | 2025년 규격 | 리비전 2026-07-28 |
|---|---|---|
| 연결 시작 | `initialize`·`initialized` 교환 | 교환 없음, 요청마다 `_meta` 봉투 |
| 세션 식별 | `Mcp-Session-Id` 헤더 | 없음, 서버가 `requestState` 를 돌려줌 |
| 클라이언트 정보 | `initialize` 결과를 보관 | `_meta` 의 `io.modelcontextprotocol/clientInfo` |
| `ping` | 사용 가능 | 제거, 들어온 요청은 `-32601` |
| HTTP 필수 헤더 | `MCP-Protocol-Version` | `Mcp-Method`·`Mcp-Name` 추가 |

능력 조회용 `server/discover` 가 새로 생기긴 했습니다. 다만 Ruby SDK 문서는 이 호출을 먼저 보내는 것이 필수는 아니라고 적습니다. 요청에 실린 봉투만으로도 새 수명주기가 선택되거든요.

## 상태를 클라이언트에 돌려보내는 requestState

상태를 전부 버리라는 개정은 아닙니다. 보관하는 쪽을 서버에서 클라이언트로 옮긴 것입니다. 서버는 더 받을 값이 있으면 `inputRequired(...)` 로 응답하면서 `requestState` 를 함께 돌려줍니다. 클라이언트는 다음 호출에 답과 그 값을 그대로 실어 보냅니다. 서버 쪽에서는 `ctx.mcpReq.requestState<T>()` 로 읽습니다.

여기서 한 가지는 확인해야 합니다. 돌아온 `requestState` 는 **신뢰하지 않는 입력으로 다뤄야 합니다.** 마이그레이션 문서가 `ServerOptions.requestState.verify` 설정을 권하고 `createRequestStateCodec` 을 예로 듭니다. 이 코덱은 값에 서명을 하지만 암호화는 하지 않습니다. 민감한 값을 그대로 담아 보내면 클라이언트가 읽을 수 있습니다. 단계가 여러 번이면 `inputResponses` 가 이번 왕복만 담으므로 단계 구분을 `requestState` 안에 직접 넣어 두라고 안내합니다.

공식 블로그는 상태가 꼭 필요한 서버라면 도구에서 명시적인 핸들을 만들어 돌려주고 모델이 그 값을 인자로 다시 넘기게 하라고도 권합니다. 어느 쪽이든 상태를 서버 메모리에 두지 않는다는 원칙은 같습니다.

예전에 서버가 스트림을 열어 두고 보내던 `elicitation/create`, `sampling/createMessage`, `roots/list` 도 이 방식으로 바뀌었습니다. 서버가 `resultType: "input_required"` 와 필요한 요청을 돌려주면 클라이언트가 `inputResponses` 를 채워 같은 호출을 다시 보냅니다. SDK 에서 이 왕복은 기본 8회이고 한 번의 왕복을 600,000밀리초(10분)까지 기다립니다.

## 채널 서버가 새 리비전으로 붙을 때 잃는 것

Claude Code 문서에 한 줄로 적힌 제약이 하나 있습니다. v2 런타임에서 리비전 `2026-07-28` 로 협상한 채널 서버는 채널 메시지를 전달할 수 없습니다. 그래서 Claude Code 가 그 서버를 채널로 등록하지 않습니다. 서버가 죽는 것도 에러가 뜨는 것도 아니고 채널 기능만 목록에서 빠집니다.

알림 쪽도 전제가 달라졌습니다. 같은 문서는 10초 넘게 열려 있다가 닫히는 알림 스트림을 Claude Code 가 다시 연다고 적어 뒀습니다. 서버리스 호스트에 붙은 스트림이 보통 그렇게 끊기기 때문입니다. 연결이 오래 유지된다고 가정하고 짠 알림 코드라면 이 동작을 한 번 확인해 보는 편이 좋겠습니다.

## 확장으로 빠져나간 tasks 와 바뀐 알림 호출

코어를 줄인 만큼 나머지 기능은 확장으로 옮겨졌습니다. 실험 단계에 있던 tasks 가 `io.modelcontextprotocol/tasks` 확장으로 나갔고 MCP Apps 와 Enterprise Managed Authorization 도 확장으로 정리됐습니다. 코어를 건드리지 않고 기능을 더할 수 있게 하려는 구조입니다.

쓰던 호출 몇 개는 이름이 바뀌었습니다. task 메서드에는 폐기 표시가 붙어 2026년 연결에서는 `tasks/get` 과 `tasks/cancel` 만 남습니다. 이 둘도 스키마를 직접 넘겨야 합니다. 변경 알림은 `subscriptions/listen` 으로 옮겨졌습니다. 캐시 힌트 필드 `ttlMs` 와 `cacheScope` 는 응답에 항상 실리는데 기본값이 `0` 과 `'private'` 입니다. 실제로 캐시해도 되는 응답이라면 `ServerOptions.cacheHints` 로 따로 알려 줘야 합니다. 인증 쪽에서는 Dynamic Client Registration 이 폐기되고 Client ID Metadata Documents 로 넘어갑니다.

## 지금 확인할 것과 남아 있는 되돌림 설정

내 서버가 어느 규격으로 붙고 있는지는 두 가지를 확인하면 알 수 있습니다. SDK 를 올리고 새 규격을 켰는지, 그리고 클라이언트가 묻고 있는지입니다. 두 조건이 모두 맞을 때만 세션이 없는 연결이 됩니다.

되돌릴 설정은 양쪽에 남아 있습니다. 클라이언트에서는 `MCP_PROTOCOL_NEGOTIATION` 을 `legacy` 로 두면 모든 서버를 옛 핸드셰이크로 붙입니다. `MCP_SDK_GENERATION` 을 `v1` 으로 두면 런타임 자체를 되돌립니다. 서버에서는 `createMcpHandler` 의 기본값 `legacy: 'stateless'` 가 두 규격을 모두 받습니다. `{ legacy: 'reject' }` 로 두면 2025년 연결을 거부합니다. 급하면 설정 한 줄로 되돌릴 수 있습니다. 장애가 났을 때 쓸 수단은 남아 있습니다.

유예 기간도 짧지 않습니다. `roots`·`sampling`·`logging` 은 폐기 표시가 붙었지만 최소 12개월은 계속 동작합니다. 옛 HTTP+SSE 전송도 1년짜리 오프램프를 받았습니다. 당장 전부 옮길 일은 아닙니다.

다만 순서가 바뀐 것은 기억해 둘 만합니다. 예전에는 클라이언트가 따라올 때까지 서버가 기다렸습니다. 지금은 클라이언트가 먼저 묻고 있습니다. 서버가 지원한다고 답하는 날 바로 새 규격으로 연결됩니다. 세션에 상태를 얹어 둔 MCP 서버를 운영하고 있다면 SDK 를 올리기 전에 그 상태를 어디로 옮길지부터 정해 두는 편이 안전합니다.

## 참고 자료

- [Claude Code changelog — Claude Docs](https://code.claude.com/docs/en/changelog)
- [Connect Claude Code to tools via MCP — Claude Docs](https://code.claude.com/docs/en/mcp)
- [The 2026-07-28 Specification — MCP Blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [Supporting protocol revision 2026-07-28 — MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)
- [Server discovery — MCP Ruby SDK](https://ruby.sdk.modelcontextprotocol.io/server/discovery/)
- [MCP 2026-07-28 spec: stateless core, coming to Claude — Anthropic](https://claude.com/blog/bringing-mcp-2026-07-28-to-claude)
