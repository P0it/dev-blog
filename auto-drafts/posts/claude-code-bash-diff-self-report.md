---
title: Claude Code 2.1.269 의 Bash diff — 에이전트 상한 256보다 이쪽이 큽니다
slug: claude-code-bash-diff-self-report
tags: [AI 코딩, AI 에이전트, Claude Code]
category: insights
---

> Claude Code 2.1.269 릴리스 노트에 두 줄이 나란히 들어왔습니다. 동시 에이전트 상한을 1~256 범위에서 올리는 설정과, Bash 명령이 바꾼 파일의 diff 를 도구 결과에 붙이는 변경입니다. 그동안 명령이 파일에 무엇을 했는지는 아무도 되읽지 않았고, 남은 건 모델이 "고쳤습니다"라고 적은 문장뿐이었습니다. diff 는 거기에 파일에 남은 자국이라는 경로를 끼워 넣습니다. 상한을 올리는 일은 이 뒤에 와야 합니다.

## 2.1.269 에 나란히 들어온 두 줄

9월 11일 [Claude Code 2.1.269](https://code.claude.com/docs/en/changelog) 에 항목이 여럿 올라왔습니다. 그중 두 개가 눈에 걸립니다.

- `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` — Workflow 도구의 동시 에이전트 한도를 **1~256** 범위에서 올린다
- Bash 도구 결과에, **그 명령이 바꾼 파일의 diff** 를 붙인다

같은 릴리스에 `claude plugin eval` 과 `/output-style [name]` 도 함께 들어왔죠. 그런데 이 둘은 정반대입니다. 하나는 더 많이 돌리는 쪽이고, 하나는 돌린 결과를 되읽는 쪽입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>한 릴리스에서 갈라진 두 방향 — 처리량을 올리는 설정과 결과를 되읽는 변경</title>
  <rect x="55" y="188" width="180" height="74" rx="16"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="145" y="232" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 20px">2.1.269</text>

  <path d="M247 205 C 330 160, 380 128, 452 118"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M436 108 L 456 117 L 438 129"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <path d="M247 245 C 330 290, 380 322, 452 332"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M436 322 L 456 331 L 438 343"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <rect x="466" y="78" width="282" height="80" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="607" y="112" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">동시 에이전트 1 → 256</text>
  <text x="607" y="138" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">처리량</text>

  <rect x="466" y="292" width="282" height="80" rx="16"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="607" y="326" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">Bash 결과에 diff</text>
  <text x="607" y="352" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">관측</text>
</svg>
```

## 에이전트의 "고쳤습니다"는 자기 보고입니다

도구 루프의 한 턴을 뜯어 보면 구조가 단순합니다. 모델이 Bash 명령을 부르고, 하네스가 stdout·stderr·종료 코드를 돌려주고, 모델이 그걸 읽은 다음 "수정했습니다"라고 적습니다.

이 문장은 파일 시스템을 본 적이 없습니다. 명령이 실제로 무엇을 바꿨는지 아무도 다시 확인하지 않았거든요. 하네스가 쥔 것은 명령의 출력이고, 사람이 읽는 것은 모델이 그 출력을 요약한 말입니다.

실사용 세션을 대규모로 뜯어본 [연구](https://arxiv.org/abs/2605.29442)도 같은 자리를 짚습니다. 코딩 에이전트의 실패 유형을 분류하면서 **부정확한 자기 보고**를 따로 한 칸으로 뒀습니다. 실행하지 않은 동작을 했다고 적거나, 부분적으로 끝난 상태를 완료로 보고하거나, 다룬 범위를 실제보다 넓게 말하는 경우입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>모델과 하네스 사이에서만 닫히는 루프, 그 밖에 놓인 파일 시스템</title>
  <rect x="120" y="70" width="200" height="86" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="220" y="120" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 19px">모델</text>

  <rect x="480" y="70" width="200" height="86" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="580" y="120" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 19px">하네스</text>

  <path d="M332 96 H 466"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M450 86 L 470 95 L 452 107"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="399" y="72" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">명령</text>

  <path d="M468 132 H 334"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M350 122 L 330 131 L 348 143"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="399" y="160" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">stdout · 종료 코드</text>

  <rect x="300" y="300" width="200" height="86" rx="16"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="400" y="350" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 19px">파일</text>

  <path d="M580 170 C 580 240, 520 300, 512 330"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none; stroke-dasharray: 9 11"
    stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## stdout 은 말이고 diff 는 자국입니다

둘은 같은 사건을 가리키지만 나오는 곳이 다릅니다.

stdout 은 실행된 프로그램이 스스로 적은 문장입니다. 아무 파일도 건드리지 않는 스크립트가 `Done.` 을 출력하게 만드는 건 어렵지 않고, 종료 코드 0 도 마찬가지입니다. 무언가 일어났다는 증거가 아니라, 무언가 일어났다는 프로그램의 진술입니다.

더 흔한 경우는 아예 표시가 나지 않습니다. `sed -i` 가 찾으려던 패턴과 한 글자라도 어긋나면 바뀌는 줄은 하나도 없는데, 출력은 비어 있고 종료 코드는 0 입니다. 실패가 아니라 성공의 모습을 하고 돌아오는 겁니다. 이 결과만 받아 든 모델이 다음 턴에 "치환했습니다"라고 적는 건 거짓말이 아니라 관측 부족입니다.

diff 는 명령이 끝난 뒤 파일에 남은 자국입니다. 프로그램이 하는 말을 거치지 않고, 상태를 전후로 견줘서 나옵니다. 이걸 도구 결과에 붙이면 모델은 자기가 시킨 일의 결과를 자기 말이 아닌 경로로 한 번 더 받습니다.

에이전트 하네스에서 검증은 대개 맨 뒤에 몰려 있습니다. 테스트를 돌리고, 린트를 돌리고, 사람이 PR 을 엽니다. 전부 여러 턴이 지난 뒤입니다. diff 는 그 검증의 일부를 **명령 하나 단위로** 당겨 놓습니다. 틀어진 자리를 스무 턴 뒤가 아니라 그 턴에서 보게 되는 겁니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>같은 명령에서 갈라지는 두 경로 — 프로그램의 진술과 파일에 남은 자국</title>
  <rect x="50" y="88" width="150" height="66" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="125" y="128" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">명령</text>
  <path d="M212 121 H 300"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M286 111 L 306 120 L 288 132"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="316" y="88" width="180" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="406" y="128" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">프로그램</text>
  <path d="M508 121 H 596"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M582 111 L 602 120 L 584 132"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="612" y="88" width="140" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="682" y="128" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">stdout</text>
  <text x="406" y="184" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">프로그램이 적은 말</text>

  <rect x="50" y="296" width="150" height="66" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="125" y="336" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">명령</text>
  <path d="M212 329 H 300"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M286 319 L 306 328 L 288 340"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="316" y="296" width="180" height="66" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="406" y="336" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">파일 상태</text>
  <path d="M508 329 H 596"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M582 319 L 602 328 L 584 340"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="612" y="296" width="140" height="66" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="682" y="336" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">diff</text>
  <text x="406" y="392" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">전후를 견준 자국</text>
</svg>
```

## 256 까지 열어 둔 상한과 검토 부채

동시 에이전트 한도를 1에서 256까지 열어 둔 건 팬아웃을 설정 항목으로 인정했다는 뜻입니다. 그런데 팬아웃을 늘리면 늘어나는 쪽은 결과물이지 검토 용량이 아닙니다.

병렬 에이전트를 여러 대 굴려 본 쪽의 집계는 대체로 비슷합니다. 에이전트 수를 올릴수록 조정 비용이 먼저 붙어 수확이 체감되고, [코드 리뷰가 병목으로 옮겨 갔다](https://moderne.ai/blog/ai-didnt-break-coding-it-broke-code-review)는 관찰도 여러 곳에서 나옵니다. AI 가 붙은 PR 이 더 크고 더 오래 대기한다는 [집계](https://www.flowverify.co/blog/ai-code-review-bottleneck-2026-data)도 있죠. 수치는 출처마다 갈리니 폭으로만 읽는 게 맞습니다.

그래서 256 은 처리량 눈금이 아니라 검토 부채의 눈금입니다. 에이전트 한 대가 자기 보고를 적으면 사람이 읽고 넘어갑니다. 256대가 자기 보고를 적으면 아무도 읽지 않습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>넓게 벌어진 에이전트들과 그 아래 하나뿐인 검토 관문</title>
  <circle cx="70" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="172" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="274" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="376" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="478" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="580" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="682" cy="80" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="740" cy="80" r="5"
    style="fill: var(--fg-neutral)" />
  <circle cx="758" cy="80" r="5"
    style="fill: var(--fg-neutral)" />

  <path d="M70 112 L 360 248 M172 112 L 372 248 M274 112 L 386 248 M376 112 L 398 248
           M478 112 L 412 248 M580 112 L 426 248 M682 112 L 440 248"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <rect x="330" y="262" width="140" height="66" rx="14"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <text x="400" y="302" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">검토</text>

  <path d="M400 340 V 392"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M390 378 L 399 398 L 411 380"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## diff 에 붙는 값과 2.1.270 의 회귀

diff 를 붙이는 일이 공짜는 아닙니다. 값은 컨텍스트로 치릅니다.

포맷터를 한 번 돌리거나 의존성을 설치하면 바뀐 파일이 수백 개가 되고, 그 diff 는 그대로 토큰이 됩니다. 정작 모델이 봐야 할 자리가 무관한 변경에 밀려나면, 관측을 붙이려고 치른 값이 도리어 관측을 지웁니다. 어떤 명령의 diff 를 붙이고 어디서 자를지가 곧 설계 문제가 됩니다.

마찰도 바로 나타났습니다. 하루 뒤인 9월 12일 [2.1.270](https://code.claude.com/docs/en/changelog) 이 고친 항목은 이겁니다 — 세션이 한동안 돌아간 뒤 읽기 전용 git 명령이 갑자기 권한을 묻던 문제, 2.1.269 의 회귀. 릴리스 노트가 원인을 어느 변경으로 적지는 않았습니다. 다만 Bash 도구 주변을 손본 릴리스의 값이 다음 날 청구됐다는 사실은 남습니다.

더 센 반론은 따로 있습니다. diff 를 모델에게 보여 주는 방식 자체가 약하다는 지적이죠. 자기 보고가 어긋나는 건 정보가 없어서만이 아니라 있는 정보를 건너뛰기 때문이기도 하고, 그렇다면 같은 모델에게 근거를 한 장 더 쥐여 주는 것으로는 판정자가 바뀌지 않습니다. 판정을 모델 밖으로 빼서 테스트·타입체크·CI 처럼 사람도 에이전트도 손댈 수 없는 자리에 두는 편이 낫다는 주장입니다.

맞는 말입니다. 다만 그 판정은 대개 작업이 한 덩어리로 끝난 뒤에야 돌아갑니다. 그사이 에이전트는 틀어진 전제 위에서 열 턴을 더 쌓고, CI 가 빨간불을 켰을 때는 어디서부터 어긋났는지 되짚어야 하죠. diff 는 그 판정을 대신하는 물건이 아니라, 판정이 돌아오기 전까지의 구간을 덜 캄캄하게 만드는 물건입니다. 둘은 같은 자리를 놓고 다투지 않습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>컨텍스트 창을 채운 대량 diff 가 정작 봐야 할 자리를 밀어내는 모습</title>
  <rect x="60" y="120" width="680" height="120" rx="18"
    style="fill: none; stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="60" y="100"
    style="fill: var(--fg-neutral); font-size: 15px">컨텍스트</text>

  <rect x="78" y="138" width="404" height="84" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="280" y="187" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">포맷터가 만든 diff</text>

  <rect x="496" y="138" width="120" height="84" rx="12"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="556" y="187" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 16px">본 변경</text>

  <rect x="630" y="138" width="92" height="84" rx="12"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-neutral); stroke-width: 2.5" />

  <path d="M496 300 H 726"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M712 288 L 732 299 L 712 311"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="496" y="340"
    style="fill: var(--fg-neutral); font-size: 15px">밀려나는 쪽</text>
</svg>
```

## diff 가 먼저이고 256 이 나중입니다

이 관점에서 보면 하네스를 직접 굴리는 쪽이 먼저 손볼 자리는 분명합니다. 에이전트를 몇 대까지 띄울지는 그다음입니다.

한 대가 무엇을 했는지 사람 말이 아닌 경로로 되읽을 수 있어야, 열 대를 띄운 결과도 읽힙니다. 그 경로가 없으면 팬아웃은 검토할 수 없는 산출물을 빠르게 쌓는 장치가 됩니다. 상한을 256까지 열어 둔 릴리스에 diff 가 같이 실린 순서를, 저는 그렇게 읽었습니다.

## 참고 자료

- [Claude Code changelog — Anthropic](https://code.claude.com/docs/en/changelog)
- [anthropics/claude-code releases — GitHub](https://github.com/anthropics/claude-code/releases)
- [How Coding Agents Fail Their Users: A Large-Scale Analysis of Developer-Agent Misalignment in 20,574 Real-World Sessions — arXiv](https://arxiv.org/abs/2605.29442)
- [AI Didn't Break Coding, It Broke Code Review — Moderne](https://moderne.ai/blog/ai-didnt-break-coding-it-broke-code-review)
- [The AI Code Review Bottleneck, By the 2026 Numbers — FlowVerify](https://www.flowverify.co/blog/ai-code-review-bottleneck-2026-data)
