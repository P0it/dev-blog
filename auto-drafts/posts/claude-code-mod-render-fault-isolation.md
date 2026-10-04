---
title: 모드가 그린 Box 하나에 Claude Code 가 꺼지던 이유
slug: claude-code-mod-render-fault-isolation
tags: [Claude Code, 플러그인, 터미널 UI]
category: insights
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-04/f751cf45.svg
---

> 10월 1일 2.1.287 이 플러그인에 터미널 화면을 열어 준 뒤 이틀 만에 2.1.289 가 나왔고 그 수정 목록에는 모드가 화면을 그리다 세션을 끝내던 사례가 줄줄이 적혀 있습니다. 화면을 외부 코드에 열 때 검증과 격리 중 어디에 비용을 쓰게 되는지를 공식 changelog 와 모드 문서로 확인해 정리했습니다.

Claude Code 에 플러그인을 하나 설치하고 나서 화면이 평소와 달라진 적이 있을 것입니다. 프롬프트 위에 못 보던 줄이 생기거나 도구 호출 줄의 모양이 바뀌는 식입니다. 2.1.287 부터 플러그인이 터미널 화면을 직접 그릴 수 있게 됐기 때문입니다. 이렇게 화면까지 그리는 플러그인을 모드라고 부릅니다.

그러면 모드가 그린 화면이 잘못되면 어떻게 될까요? 처음에는 세션이 함께 끝났습니다. 10월 3일 [2.1.289 changelog](https://code.claude.com/docs/en/changelog)에는 터미널이 모르는 `borderStyle` 로 `Box` 를 그린 플러그인 때문에 실행 직후 멈춤이나 강제 종료가 났다는 수정이 적혀 있습니다. 높이가 없는 영역이 계속 커지는 경우도, 화면 핸들러가 비동기로 예외를 던지는 경우도 각각 세션을 끝냈습니다. 같은 릴리스가 그 실패를 영역 하나에 묶는 쪽으로 설계를 바꿨습니다. 확장을 열어 주는 쪽에서 비용을 어디에 쓰게 되는지를 이 목록으로 알 수 있습니다.

## 10월 3일 2.1.289 의 수정 목록을 채운 화면 실패

2.1.289 의 항목을 종류별로 묶으면 모드의 화면 쪽이 가장 두껍습니다. 한 릴리스 안에서 이런 것들이 함께 고쳐졌습니다.

- 화면 핸들러가 비동기로 예외를 던지면 관리 세션과 백그라운드 세션이 끝났습니다
- 높이가 없는 플러그인 영역이 계속 커지면 세션이 인터페이스 오류로 끝났습니다
- 터미널이 모르는 테두리 스타일로 `Box` 를 그리면 실행 직후 멈춤이나 강제 종료가 났습니다
- 모드의 `ui.render` 훅이 쓴 값 때문에 줄이 예외를 던지면 세션이 `unrecoverable interface error` 로 끝났습니다
- 모드의 `Client` 영역이 그려지는 중에 실패하면 그 모드가 그린 주변까지 함께 내려갔습니다

마지막 항목의 수정 문구가 바뀐 설계를 그대로 말해 줍니다. 이제 그 `Client` 는 **혼자 실패하고 `ui.fault` 를 올립니다**. 주변을 데려가지 않습니다.

## 모드가 화면에 끼어들 수 있는 다섯 곳

그럼 모드는 화면의 어디를 그릴 수 있을까요? [공식 문서](https://code.claude.com/docs/en/plugins/mods/interface)는 모드가 그릴 수 있는 모든 곳을 render site 라고 부릅니다. 터미널 세션에서 새로 생기는 곳이 다섯 군데입니다. 전사 옆의 pane, 전사 오른쪽 위의 toast, 전사 안의 로그 줄, 프롬프트 바로 위의 band, 프롬프트 아래의 상태 줄입니다.

![모드가 그릴 수 있는 곳을 표시한 Claude Code 터미널 화면 지도](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-04/f751cf45.svg)

새로 생기는 곳만 그릴 수 있는 게 아닙니다. Claude Code 가 이미 그리고 있는 곳도 render site 입니다. 메시지, 도구 호출 줄과 그 결과, 스피너, Claude 가 질문을 띄우는 대화 상자까지 모드가 다시 그릴 수 있습니다. 권한 프롬프트는 render site 가 아니어서 모드가 바꿀 수 없습니다.

바꾸는 방법은 세 가지가 있습니다. 이벤트를 그대로 넘겨 Claude Code 의 그림을 두거나, `props` 를 고쳐 세부만 바꾸거나, `next` 를 부르지 않고 자기 트리를 돌려줘 그곳의 그림을 대신합니다. 스피너 하나만 놓고 보면 애니메이션과 단어를 그대로 두고 뒤에 글자를 붙이는 것도, 스피너 대신 자기 한 줄을 그리는 것도 가능합니다.

## 한 모드의 그림이 세션 전체를 끝내던 구조

세션이 함께 끝난 이유는 모드 코드가 실행되는 위치에 있습니다. 설정 훅은 Claude Code 밖에서 셸 명령으로 실행되지만 모드의 훅은 **Claude Code 프로세스 안에서 함수로** 실행됩니다. 작은 모드는 파일 세 가지로 이루어집니다. 매니페스트, 코드 파일을 가리키는 `hooks.json`, 그리고 훅을 등록하는 코드 파일입니다.

![플러그인 디렉터리의 각 파일이 세션에 더하는 것을 이은 다이어그램](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-04/741384a7.svg)

그리는 과정도 Claude Code 와 공유합니다. 모드는 키보드를 직접 읽지 않습니다. 사용자가 버튼을 누르면 콜백이 변수를 바꾸고 `$.ui.invalidate('ui.render')` 로 다시 그려 달라고 요청하면, Claude Code 가 그 훅을 한 번 더 실행해 돌려받은 트리를 자기 화면과 함께 그립니다. 그래서 트리 하나가 그려지다 예외를 던지면 그 줄만 깨지고 끝나지 않았습니다. 그리던 화면 전체가 영향을 받았습니다.

여기까지 오면 수정 목록의 항목들이 왜 전부 세션 종료로 끝났는지 알게 됩니다. 모드의 그림은 별도 창이 아니라 같은 터미널 화면의 일부이고 그 화면을 그리는 주체가 하나거든요.

## 검증에 걸린 그림을 엔진이 대신 그리는 처리

고친 방향은 영역마다 대체로 그려 줄 주인을 두는 것입니다. 모드가 돌려준 트리가 유효하지 않으면 Claude Code 가 그곳의 그림을 자기 버전으로 바꿔 그립니다. 앱에 없는 요소를 쓰거나, 요소가 받지 않는 prop 을 넘기거나, 자식이 들어가지 않는 곳에 자식을 두면 그렇습니다.

`--plugin-dir` 로 실행한 세션에서는 전사에 이유가 한 줄 남습니다.

```text
ui.render (Pane) refused: Text prop "bogusProp" is not allowed; the engine drew its own
```

세션에 이 줄 말고 아무것도 나오지 않으므로, 모드의 그림이 안 보이면 이 줄이나 디버그 로그를 먼저 확인해야 합니다.

그리는 중에 생긴 실패는 `ui.fault` 이벤트로 올라옵니다. `e.phase` 가 `load`, `render`, `run` 중 하나이고 `e.reason` 에 오류 메시지가 들어옵니다. 모드가 이 이벤트를 처리하면 Claude Code 는 `ui.fault` 훅이 끝난 뒤 `ui.render` 훅을 한 번 더 실행합니다. 실패한 `Client` 를 빼고 다시 그릴 기회를 주는 것입니다. 아래는 모드가 pane 안에 직접 그린 격자인데 이런 영역이 바로 혼자 실패하도록 분리된 대상입니다.

![모드가 pane 안에 그린 색 블록 격자, 두 줄 세 칸](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-04/eac232de.svg)

## 모드를 설치하는 쪽과 만드는 쪽에 남는 차이

설치하는 쪽이 먼저 알아야 할 것은 모드가 내 권한으로 실행된다는 사실입니다. [모드 문서](https://code.claude.com/docs/en/plugins/mods/overview)가 설치 전에 확인하라고 적어 둔 범위는 넓습니다. 파일을 읽고 쓰고 프로그램을 시작하고 네트워크 요청을 보내고 환경 변수와 설정 파일에 든 API 키를 읽을 수 있습니다. 샌드박싱을 켜도 모드가 시작한 프로세스는 그 밖에서 실행됩니다.

![마켓플레이스에서 플러그인을 설치해 Claude Code 가 구성요소를 불러오는 경로](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-04/ec99a53e.svg)

무엇을 하는 모드인지 실행 없이 보려면 디렉터리를 받아 `claude plugin validate` 를 돌립니다. 출력의 `hooks:` 와 `calls:` 줄이 그 모드가 처리하는 이벤트와 Claude Code 에 요청하는 동작을 나열합니다.

그리고 훅이 실행되는 곳과 그림이 보이는 곳이 다릅니다. 비교해 보면 아래와 같습니다.

| | 훅 실행 | 모드가 그린 화면 |
|---|---|---|
| 터미널 `claude` | 된다 | 보인다 |
| Desktop 앱 Code 탭 | 된다 | 보인다(터미널 전용 요소 제외) |
| VS Code 확장 채팅 패널 | 된다 | 안 보인다 |
| `claude -p` 와 Agent SDK | 된다 | 안 보인다 |
| 클라우드 세션 | 된다 | 안 보인다 |

무인으로 돌리는 세션에서 이 구분이 특히 중요합니다. 훅은 그대로 실행되니 도구 호출을 막거나 고치는 모드는 효과가 있고 화면을 그리는 모드는 아무것도 보여 주지 않습니다.

만드는 쪽에 남는 것은 설계 하나입니다. 확장을 열어 주면 그곳은 한 번 실패했을 때 여러 곳이 함께 멈추는 곳이 되고 설치 시점 검증만으로는 끝까지 막히지 않습니다. 대신 영역마다 실패를 받아 줄 주인과 대체 그림을 둡니다. 플러그인과 훅으로 자기 작업 흐름을 손보는 1인 개발자라면 자기 코드에도 같은 질문을 해 볼 만합니다. 이 훅이 실패하면 무엇까지 함께 멈추는지 말입니다.

## 참고 자료

- [Claude Code changelog — Anthropic](https://code.claude.com/docs/en/changelog)
- [Draw in the interface with a mod — Anthropic](https://code.claude.com/docs/en/plugins/mods/interface)
- [Mods overview — Anthropic](https://code.claude.com/docs/en/plugins/mods/overview)
- [Plugins overview — Anthropic](https://code.claude.com/docs/en/plugins/overview)
