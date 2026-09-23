---
title: Claude Code 설정을 구버전이 통째로 건너뛰는 한 줄
slug: claude-code-attribution-false-old-cli
tags: [Claude Code, settings.json, Git]
category: insights
---

> Claude Code v2.1.281 이 커밋과 PR 서명을 한 번에 끄는 `"attribution": false` 를 더하면서 구버전 CLI 는 이 값이 든 설정 파일을 건너뛴다는 단서를 같은 줄에 붙였습니다. 공식 changelog 와 설정 문서로 어떤 경우에 파일 전체가 버려지고 그것을 어디서 확인할 수 있는지 정리했습니다.

Claude Code 에 커밋을 맡기면 메시지 끝에 `Co-Authored-By: Claude ...` 한 줄이 따라붙습니다. 저장소 히스토리를 깔끔하게 두고 싶어서 이 줄을 없애려고 `settings.json` 을 열어 본 분들이 있을 겁니다. 9월 23일 릴리스에 그 줄을 한 번에 끄는 값이 생겼습니다. `"attribution": false` 입니다. 그러면 이 값을 팀이 같이 쓰는 `.claude/settings.json` 에 적어도 될까요? 적으면 곤란합니다. 이 값을 모르는 구버전 CLI 는 그 파일을 통째로 건너뜁니다. 서명 한 줄을 끄려고 적은 값 때문에 같은 파일에 들어 있던 권한 규칙과 환경 변수, 훅 설정까지 함께 적용되지 않습니다. 어떤 경우에 파일 전체가 버려지고 어떤 경우에 그 항목만 버려지는지 알면 이런 설정을 어느 파일에 적을지 정할 수 있습니다.

## 9월 23일에 더해진 값 하나

[Claude Code changelog](https://code.claude.com/docs/en/changelog) 의 v2.1.281 항목에 이렇게 적혀 있습니다.

> Added `"attribution": false` in `settings.json` to hide all commit and PR attribution; older CLI versions skip a settings file that holds it, so keep the object form in files shared across versions

한 문장에 기능과 주의사항이 같이 들어 있습니다. 앞쪽은 커밋과 PR 에 붙는 서명을 전부 감춘다는 뜻이고 뒤쪽은 버전이 섞인 곳에서 공유하는 파일에는 객체 형태를 그대로 두라는 뜻입니다.

## attribution 아래의 키 세 개

그럼 여기서 말하는 객체 형태는 어떻게 생겼을까요? [설정 레퍼런스](https://code.claude.com/docs/en/settings-reference)를 보면 `attribution` 아래에 키가 세 개 있습니다.

- `attribution.commit` — 커밋에 붙는 `Co-Authored-By` 트레일러를 바꾸거나 감춥니다.
- `attribution.pr` — PR 본문에 붙는 줄을 바꾸거나 감춥니다. 설정하지 않으면 `🤖 Generated with [Claude Code](https://claude.com/claude-code)` 가 붙습니다.
- `attribution.sessionUrl` — 클라우드 세션과 Remote Control 세션이 만든 커밋에 붙는 `Claude-Session` 링크를 뺍니다.

문서는 서명을 전부 감추는 방법을 이렇게 안내합니다. `attribution.commit` 과 `attribution.pr` 을 빈 문자열로 두고 `attribution.sessionUrl` 을 `false` 로 놓는 것입니다. 9월 24일 기준으로 설정 레퍼런스에는 아직 이 방법만 적혀 있습니다.

changelog 가 더한 `"attribution": false` 는 그 세 줄을 한 줄로 줄인 것입니다. 겉보기에는 편의 기능입니다. 다만 이 편의는 키를 새로 더하는 방식이 아니라 기존 키가 받는 값의 타입을 넓히는 방식으로 들어왔습니다. 원래 객체만 받던 `attribution` 키가 이제 불리언도 받습니다. 구버전 CLI 의 스키마는 이 키에서 여전히 객체만 받습니다.

## 항목만 버려질 때와 파일째 버려질 때

이 차이가 왜 중요한지는 Claude Code 가 잘못된 설정을 처리하는 방식을 보면 알게 됩니다. [설정 문서](https://code.claude.com/docs/en/settings)는 무엇이 잘못됐는지에 따라 버리는 범위를 나눠 적어 뒀습니다.

**Settings Error** 는 파일에 잘못된 JSON 이 있거나 스키마가 거부하는 값이 들어 있을 때입니다. 대화형 세션을 시작하면 대화 상자가 떠서 파일을 고칠지, 종료할지, 그 설정 없이 계속할지 묻습니다. 이때 버려지는 단위는 그 파일 전체입니다.

**Settings Warning** 은 개별 항목만 실패한 경우입니다. 잘못 쓴 권한 규칙이나 존재하지 않는 훅 이벤트 이름이 여기에 들어갑니다. Claude Code 는 그 값만 건너뛰고 파일의 나머지는 그대로 적용합니다.

`"attribution": false` 는 앞쪽에 해당합니다. 모르는 키를 새로 적은 것이라면 개별 항목 실패로 끝났겠지만 구버전 입장에서는 이미 아는 키에 스키마가 받지 않는 타입의 값이 들어온 것이기 때문입니다. 문서도 같은 말을 한 줄로 적어 뒀습니다. 잘못된 JSON 이나 거부된 값은 파일이나 항목을 건너뛰게 만든다는 것입니다.

## 공유 .claude/settings.json 에 적었을 때

버려지는 단위가 파일이라면, 그 값을 어느 파일에 적었는지가 손해의 범위를 정합니다. Claude Code 는 같은 키가 여러 곳에 있으면 위쪽 파일의 값을 씁니다. 순서는 아래와 같습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>설정 파일 다섯 곳의 우선순위와 값을 적을 수 있는 두 파일</title>
  <path d="M95 60 V392" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M86 70 L95 55 L104 70" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M86 382 L95 397 L104 382" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="150" y="45" width="560" height="58" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <rect x="150" y="118" width="560" height="58" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <rect x="150" y="191" width="560" height="58" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <rect x="150" y="264" width="560" height="58" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <rect x="150" y="337" width="560" height="58" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="176" y="80" style="fill: var(--fg-strong); font-size: 17px">managed-settings.json</text>
  <text x="176" y="153" style="fill: var(--fg-strong); font-size: 17px">claude --settings</text>
  <text x="176" y="226" style="fill: var(--fg-strong); font-size: 17px">.claude/settings.local.json</text>
  <text x="176" y="299" style="fill: var(--fg-strong); font-size: 17px">.claude/settings.json</text>
  <text x="176" y="372" style="fill: var(--fg-strong); font-size: 17px">~/.claude/settings.json</text>
  <text x="44" y="66" style="fill: var(--fg-neutral); font-size: 14px">높음</text>
  <text x="44" y="400" style="fill: var(--fg-neutral); font-size: 14px">낮음</text>
</svg>
```

개인 `~/.claude/settings.json` 에 적었다면 손해는 내 사용자 설정 한 파일에서 끝납니다. 팀이 같이 쓰는 `.claude/settings.json` 에 적었다면 그 저장소를 여는 사람 모두의 프로젝트 설정이 한꺼번에 적용되지 않습니다. 거기 들어 있던 권한 규칙과 환경 변수, 훅 설정이 전부 포함됩니다. changelog 가 버전이 섞인 파일에는 객체 형태를 유지하라고 적은 이유가 이것입니다.

## 화면이 뜨지 않는 -p 실행

여기까지는 사람이 터미널을 보고 있는 경우입니다. 그런데 이런 설정이 가장 어긋나기 쉬운 곳은 CI 와 클라우드 루틴처럼 아무도 화면을 보지 않는 실행입니다. 문서는 `-p` 실행에 대화 상자가 없다고 적어 뒀습니다. 파일이 통째로 버려져도 화면에는 아무 표시가 없고 작업은 그대로 진행됩니다.

확인하는 방법도 같은 문서에 있습니다. 설정을 무시한 `-p` 실행 뒤에 `claude doctor` 를 돌리면 무엇이 버려졌는지 볼 수 있습니다. 대화형 세션에서는 `/status` 가 어떤 파일이 실제로 로드됐는지 알려 줍니다.

에디터의 경고도 판단 근거로는 부족합니다. 문서는 JSON 스키마가 최신 CLI 릴리스보다 늦을 수 있어서 최근에 문서화된 키에 경고가 떠도 설정이 잘못된 것은 아니라고 적어 뒀습니다. 반대쪽도 마찬가지입니다. 에디터가 아무 경고도 내지 않는다고 해서 모든 CLI 버전이 그 값을 받아 준다는 뜻은 아닙니다.

## 문서에 적힌 규칙과 설정에 적힌 규칙

커밋에 AI 서명을 남기지 않는다는 규칙을 `CLAUDE.md` 같은 지침 파일에 문장으로 적어 두는 저장소가 많습니다. 모델이 읽는 규칙이라 대체로 지켜지지만 한 번씩 빠져나갑니다. `attribution.commit` 을 설정했는데 시스템 프롬프트의 트레일러가 이겼다는 [이슈](https://github.com/anthropics/claude-code/issues/65657)가 6월 5일에 올라왔고 closed as not planned 로 닫혔습니다. 8월 31일에는 이 설정을 데스크톱 Settings 화면에 꺼내고 기본값을 꺼 두자는 [요청](https://github.com/anthropics/claude-code/issues/90942)이 올라왔습니다. 이미 붙은 서명을 나중에 지우려면 히스토리를 다시 쓰고 force push 를 해야 한다는 것이 이유입니다.

그래서 한 줄짜리 값이 생긴 것 자체는 반가운 변경입니다. 다만 이번에는 조건이 하나 붙었습니다. 그 값을 읽을 수 있는 CLI 를 관련된 사람이 모두 쓰고 있어야 합니다. 팀의 버전이 섞여 있다면 객체 형태 세 줄이 지금도 짧은 한 줄보다 안전합니다.

## 참고 자료

- [Claude Code changelog — Claude Docs](https://code.claude.com/docs/en/changelog)
- [Settings files and precedence — Claude Docs](https://code.claude.com/docs/en/settings)
- [Settings reference — Claude Docs](https://code.claude.com/docs/en/settings-reference)
- [attribution.commit setting in settings.json is ignored — anthropics/claude-code #65657](https://github.com/anthropics/claude-code/issues/65657)
- [Desktop: Expose commit/PR attribution in Settings and default it off — anthropics/claude-code #90942](https://github.com/anthropics/claude-code/issues/90942)
