---
title: 안 쓰는 Claude 플러그인이 매 턴 쓰는 토큰
slug: claude-plugin-always-on-context-cost
tags: [Claude Code, 플러그인, 컨텍스트 엔지니어링]
category: insights
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-26/894c8a45.webp
---

> 9월 25일 열린 플러그인 제출 포털과 공식 문서를 함께 읽고 플러그인 하나가 매 턴 컨텍스트에 넣는 것을 정리했습니다. 확장을 만드는 쪽이 줄여야 하는 것은 기능이 아니라 설명문입니다.

`/plugin` 을 열어 Discover 탭을 훑다가 쓸 만해 보이는 것을 두세 개 설치해 둔 적이 있을 것입니다. 그중 실제로 쓰는 것은 하나고 나머지는 언젠가 쓰려고 켜 둔 상태입니다.

켜 두기만 한 플러그인은 비용을 안 낼까요? 냅니다. 활성화한 플러그인의 스킬·에이전트·커맨드는 **이름과 설명**이 매 턴 컨텍스트에 들어갑니다. 아무것도 실행되지 않은 세션에서도 들어갑니다.

공식 문서가 예로 든 `formatter` 플러그인을 보면 스킬 세 개와 에이전트 한 개가 매 세션에 약 146 토큰을 더합니다. 플러그인 하나치고는 작은 숫자입니다. 다만 이 숫자는 설치한 개수만큼 쌓이고 쓰지 않아도 그대로 쌓입니다.

이 계산을 알면 플러그인을 하나 더 설치할 때와 직접 만들어 배포할 때 각각 무엇을 확인해야 하는지 알 수 있습니다.

## 9월 25일에 열린 플러그인 제출 포털

Anthropic 이 9월 25일 플러그인 디렉터리 제출 포털을 공개했습니다. 유료 플랜(Pro·Max·Team·Enterprise)을 쓰면 파트너 프로그램에 따로 지원하지 않고 바로 제출할 수 있습니다. 발표문은 플러그인을 "Claude 의 서드파티 확장을 만드는 주된 방법"이라고 적었습니다.

포털이 더해 준 것은 세 가지입니다. 제출하면 자동 검증과 안전성 스캔이 돌아갑니다. 검토가 어디까지 진행됐는지와 권고 사항을 개발자가 직접 확인합니다. 통과한 버전을 언제 올릴지는 만든 사람이 정합니다.

발행한 뒤에는 제품 화면별·버전별 설치 수와 목록 노출 수, 검색어까지 볼 수 있습니다.

![발행한 플러그인의 사용 지표를 보여 주는 화면 예시로 값은 예시 데이터입니다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-26/8968293c.webp)

제출 종류는 두 가지로 나뉩니다. 플러그인 번들은 GitHub 저장소에서 읽어 갑니다. 원격 MCP 서버는 URL 로 커넥터 하나를 등록합니다. 자기 서버를 직접 운영하면 번들과 커넥터를 각각 내는 쪽을 문서가 권합니다. 커넥터 쪽에만 서버 상태와 도구별 사용량 대시보드가 붙기 때문입니다.

이미 디렉터리에 올라간 스킬·커넥터·플러그인은 고칠 것이 없다고 발표문이 밝혔습니다. Claude 는 MCP 2.0 의 무상태 코어와 확장 두 개를 지원합니다. 대화 안에 화면을 띄우는 MCP Apps, OAuth 를 관리자 설정으로 끝내는 Enterprise Managed Auth 입니다.

## 플러그인이 매 턴 컨텍스트에 넣는 것

그런데 유통 창구가 열린 주에 공식 문서 쪽에는 반대 방향의 숫자가 붙었습니다. 활성화한 플러그인은 그것을 쓰는 세션에만 관여하지 않습니다. 설치해 둔 모든 세션에 관여합니다.

![플러그인 폴더에 든 매니페스트·스킬·에이전트·훅·MCP 설정이 세션에서 각각 무엇이 되는지 짝지어 보여 주는 다이어그램](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-26/e0b39a5e.svg)

구성요소마다 계산이 다릅니다. 매 턴 들어가는 것과 호출할 때만 들어가는 것을 비교해 보면 아래와 같습니다.

| | 매 턴 컨텍스트 | 호출할 때 |
|---|---|---|
| 스킬·커맨드 | 이름과 설명이 들어간다 | 본문이 들어간다 |
| 에이전트 | 이름과 설명이 들어간다 | 정의가 들어간다 |
| 훅 | 없다. 하네스가 실행한다 | 없다 |
| MCP 서버 | 추정치에 잡히지 않는다 | 도구 스키마가 런타임에 붙는다 |

훅이 모델 컨텍스트 비용을 안 내는 이유는 모델이 훅을 읽지 않기 때문입니다. 훅은 Claude Code 가 특정 시점에 실행하는 명령이라 지시문이 컨텍스트로 갈 일이 없습니다. MCP 서버의 도구 스키마도 기본 설정에서는 미리 다 들어가지 않고 필요할 때 검색으로 받아 옵니다.

스킬 설명 목록에는 성질이 하나 더 있습니다. 문서의 컨텍스트 윈도우 시뮬레이션을 보면 시작 시점의 스킬 설명 묶음이 450 토큰으로 잡혀 있는데 이 목록은 `/compact` 뒤에 다시 들어가지 않습니다. 실제로 호출한 스킬만 남습니다.

## Always-on 숫자를 줄이는 방법과 그 대가

내 설정이 지고 있는 숫자는 셸에서 바로 확인할 수 있습니다. 세션 프롬프트가 아니라 셸에서 `claude plugin details <이름>` 을 실행하면 `Always-on` 줄이 나옵니다. 그 아래에는 구성요소별로 always-on 몫과 호출할 때 드는 몫이 따로 적힙니다. 어느 스킬이 가장 많이 차지하는지 그 표에서 골라낼 수 있습니다.

always-on 에 들어가는 것은 각 구성요소의 이름과 `description`, 그리고 `when_to_use` 프런트매터입니다. 문서가 제시하는 줄이는 방법은 두 가지입니다. 스킬과 에이전트의 설명을 짧게 쓰는 것, 큰 플러그인을 쪼개서 필요한 것만 설치하게 하는 것입니다.

그런데 같은 문서가 바로 다음 줄에서 대가를 적어 뒀습니다. 스킬의 `description` 은 Claude 가 사용자 요청과 맞춰 보는 문장이기도 합니다. 설명을 짧게 쓰면 매 턴 비용은 내려가지만 그 스킬이 필요한 순간에 호출되지 않을 수 있습니다.

그래서 설명을 줄인 뒤에는 eval 묶음의 `tool_used: Skill` 그레이더로 트리거가 살아 있는지 확인하라고 안내합니다. 만드는 쪽의 최적화 대상이 기능에서 설명문으로 옮겨 오면서 줄이는 작업에 품질 확인이 곧바로 따라붙었습니다.

## 설치 전과 설치 뒤에 사용자가 보는 숫자

쓰는 쪽에도 같은 숫자가 왔습니다. 공식 마켓플레이스에 있는 플러그인은 설치 전에 **Context cost** 를 보여 줍니다. `Every turn:` 은 메시지 하나를 보낼 때마다 더해지는 양입니다. `When invoked:` 는 스킬이나 에이전트가 실제로 불릴 때 더해지는 양입니다. always-on 이 2,000 토큰 이상이면 `Every turn:` 줄이 강조 표시로 나옵니다.

이 값이 늘 보이지는 않습니다. 마켓플레이스 이름을 지정해 열거나 Marketplaces 탭에서 들어갈 때만 나오고 Discover 목록에서 바로 들어간 상세 화면에는 나오지 않습니다. 내가 직접 만든 마켓플레이스의 플러그인에는 Context cost 항목이 아예 없습니다. 공식 마켓플레이스만 이 값을 계산해 붙입니다.

![마켓플레이스가 플러그인을 목록에 올리고 그 플러그인이 설치되어 세션에서 구성요소로 실리는 경로를 세 칸으로 그린 다이어그램](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-26/48121cf3.svg)

설치한 뒤에도 표시가 붙습니다. `/plugin` 의 Installed 탭에서 14일과 10세션 동안 쓰이지 않은 플러그인은 **Not used recently** 아래로 내려갑니다. 상세 화면에는 `Last used:` 줄이 생깁니다.

여기에는 예외가 있습니다. `--plugin-dir` 로 띄운 것과 관리 설정으로 켜진 것, 테마나 출력 스타일을 담은 것은 이 목록에 들어가지 않습니다. 호출 기록 없이도 계속 쓰이는 종류이기 때문입니다.

켜고 끄는 동작 자체에도 비용이 있습니다. 플러그인을 활성화하거나 비활성화하면 프롬프트 캐시가 무효가 될 수 있어서 Claude Code 는 경고를 내고 변경을 대기 상태로 둡니다. `/reload-plugins --force` 로 밀어붙이면 캐시 없는 요청 한 번을 치릅니다. 정리하겠다고 세션 중간에 여러 개를 껐다 켜면 그만큼을 치릅니다.

## 검증과 보안 스캔이 걸러내는 것들

제출하는 쪽에서 걸리는 항목은 대부분 코드 품질이 아닙니다. 실행 경로입니다. 검증은 포털의 **Validate** 버튼으로 돌고 스캔은 제출 뒤 추적 브랜치에 새 커밋이 올라올 때마다 돕니다. 결과는 네 단계로 나옵니다. 제출을 막는 **Blocks**, 사람 검토로 넘기는 **Policy hold**, 그대로 제출할 수 있는 **Warning**, 알림뿐인 **Note** 입니다.

![플러그인의 검토 상태와 권고 사항을 보여 주는 화면 예시로 값은 예시 데이터입니다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-26/894c8a45.webp)

막히는 것 중 실수하기 쉬운 것들을 모아 보면 아래와 같습니다.

- `npx`·`uvx` 같은 런처로 실행하는 패키지는 정확한 버전으로 고정해야 합니다. 범위나 `@latest` 는 차단입니다.
- 자격증명을 파일에 적어 두면 문서와 예시까지 포함해 차단입니다. `plugin.json` 의 `userConfig` 에 `sensitive: true` 로 받아 `${user_config.KEY}` 로 참조합니다.
- 사용자 환경에 이미 있는 토큰을 읽어 서버로 보내는 구성은 README 예시라도 사람 검토로 넘어갑니다.
- 플러그인 폴더에 README 를 40단어 이상 두고 LICENSE 를 넣어야 합니다. 코드 블록 안의 단어는 세지 않습니다.
- 이름을 `claude`·`anthropic`·`official`·`mcp` 같은 예약어로 짓거나 이미 있는 이름과 겹치면 차단입니다.

버전을 고정해도 사람 검토로 넘어가는 것이 있습니다. 레지스트리에서 패키지를 받아 실행하는 런처는 그 패키지의 의존성이 설치 시점에 정해지기 때문에 항상 검토 대상입니다. 락파일로 의존성을 설치하는 구성도 같습니다.

보안 스캔이 보는 것은 공개하지 않은 동작입니다. 데이터를 밝히지 않은 곳으로 보내는 것, 숨겨 둔 코드를 실행하는 것, Claude 의 권한 설정을 바꾸는 것입니다. 한 번도 발행되지 않은 플러그인이 스캔에서 걸리면 반려로 처리됩니다.

비공개 저장소로도 검증과 제출을 할 수 있습니다. 대신 저장소 소스가 자동 스캔과 검토를 위해 Anthropic 에 업로드된다는 데 동의해야 하고 발행하려면 공개로 바꿔야 합니다. 제출 한도는 조직당 24시간에 10건이고 초안과 철회한 건도 한도에 들어갑니다. 같은 저장소와 폴더는 먼저 제출한 조직이 가져갑니다.

## 확장을 하나 더 붙일 때 따져 볼 것

디렉터리가 열리면서 만드는 쪽과 쓰는 쪽이 같은 숫자를 보게 됐습니다. 만드는 쪽은 always-on 을 줄이면서 트리거가 살아 있는지 확인해야 합니다. 쓰는 쪽은 설치 전에 Every turn 값을 보고 안 쓰는 것을 내려야 합니다. 확인할 곳은 이미 여러 개 있습니다. 셸의 `claude plugin details`, 세션의 `/plugin` Installed 탭, `/skill-doctor`, `/doctor`, `/usage` 입니다.

이 계산은 디렉터리에서 받은 플러그인에만 적용되지 않습니다. `~/.claude/skills/` 에 직접 넣어 둔 스킬도 이름과 설명이 매 턴 함께 갑니다. 확장을 늘려 온 설정이라면 `claude plugin details` 를 한 번 돌려 보는 것으로 충분합니다. 숫자를 보고 나면 어느 설명문을 다시 쓸지 정할 수 있습니다. 🙂

## 참고 자료

- [Build plugins for Claude — Anthropic](https://claude.com/blog/build-plugins-for-claude)
- [Publish to the directory — Claude Docs](https://claude.com/docs/directory/publish)
- [Submit your plugin — Claude Docs](https://claude.com/docs/plugins/submit)
- [Plugin pre-submission checklist — Claude Docs](https://claude.com/docs/plugins/pre-submission-checklist)
- [Measure plugin cost and usage — Claude Code Docs](https://code.claude.com/docs/en/plugins/measure)
- [Install and manage plugins — Claude Code Docs](https://code.claude.com/docs/en/plugins/install)
- [Plugins overview — Claude Code Docs](https://code.claude.com/docs/en/plugins)
- [Explore the context window — Claude Code Docs](https://code.claude.com/docs/en/context-window)
