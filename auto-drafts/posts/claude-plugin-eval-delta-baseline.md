---
title: claude plugin eval 의 Δ, 스킬이 켜졌다고 일한 건 아닙니다
slug: claude-plugin-eval-delta-baseline
tags: [AI 코딩, AI 에이전트]
category: insights
---

> Claude Code 2.1.269 에 들어간 `claude plugin eval` 은 플러그인을 켜고 돌린 점수에서 끄고 돌린 점수를 뺀 `Δ` 를 적습니다. 두 값이 같으면 그 스킬은 결과를 바꾸지 않았다는 뜻입니다. 스킬을 쌓아 온 쪽에 지울 근거가 생겼습니다.

## /skill-doctor 가 비워 둔 칸

9월 4일 2.1.261 에 [`/skill-doctor`](https://www.implicator.ai/anthropic-claude-code-skill-doctor-context-audit/) 가 들어왔습니다. 세션에 올라온 스킬 중 실제로 호출된 것이 무엇인지, 각 스킬이 턴마다 컨텍스트를 얼마나 차지하는지 보여 주는 진단 명령입니다. 스킬은 켜 두는 것만으로 시스템 프롬프트에 한 줄씩 자리를 차지하니, 안 쓰는 스킬을 골라내는 데는 쓸모가 분명했죠.

다만 이 명령이 답하는 질문은 둘까지입니다. 떴는가, 얼마나 비싼가. 세 번째 칸은 비어 있습니다 — 그래서 결과가 나아졌는가.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>스킬 진단이 채운 두 칸과 비어 있는 세 번째 칸</title>
  <rect x="55" y="120" width="170" height="56" rx="12"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <rect x="55" y="196" width="170" height="56" rx="12"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <rect x="55" y="272" width="170" height="56" rx="12"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="140" y="155" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">스킬 A</text>
  <text x="140" y="231" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">스킬 B</text>
  <text x="140" y="307" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">스킬 C</text>
  <path d="M235 224 H335" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M318 213 L335 224 L318 235" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="360" y="86" width="350" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="535" y="126" text-anchor="middle" font-size="19" style="fill: var(--fg-strong)">호출됐는가</text>
  <rect x="360" y="182" width="350" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="535" y="222" text-anchor="middle" font-size="19" style="fill: var(--fg-strong)">컨텍스트 비용</text>
  <rect x="360" y="278" width="350" height="66" rx="14" stroke-dasharray="9 8"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="535" y="318" text-anchor="middle" font-size="19" style="fill: var(--fg-neutral)">결과가 달라졌는가</text>
</svg>
```

## 켜고 3번, 끄고 3번, 그 차이가 Δ

`claude plugin eval` 은 9월 11일 npm 에 올라온 2.1.269 부터 쓸 수 있습니다. 케이스 하나가 디렉터리 하나입니다. 그 안에는 사용자가 칠 법한 문장을 담은 `prompt.md`, 그리고 결과를 채점할 그레이더 파일을 모아 둔 `graders/` 가 놓입니다.

비결정적인 에이전트를 한 번 돌려서는 알 수 없으니 케이스마다 기본 3번을 돌립니다. 여기에 플러그인을 아예 빼고 같은 횟수를 다시 돌립니다. 케이스 하나에 **6런**입니다. [공식 문서](https://code.claude.com/docs/en/plugin-evals)가 보여 주는 예시 요약표는 이렇게 떨어집니다 — 켠 쪽 `1.00`, 끈 쪽 `0.33`, `Δ +0.67`, 6런, 74초, `$0.41`.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>같은 프롬프트를 플러그인을 켜고 세 번, 끄고 세 번 돌려 두 점수의 차를 내는 구조</title>
  <rect x="45" y="198" width="140" height="58" rx="12"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="115" y="234" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">프롬프트</text>
  <path d="M195 227 H228 M228 227 L246 132 M228 227 L246 322"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="256" y="106" width="62" height="50" rx="10"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="328" y="106" width="62" height="50" rx="10"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="400" y="106" width="62" height="50" rx="10"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="359" y="88" text-anchor="middle" font-size="17" style="fill: var(--fg-neutral)">켜고 3번</text>
  <path d="M472 131 H502" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="510" y="101" width="112" height="60" rx="12"
    style="fill: none; stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="566" y="138" text-anchor="middle" font-size="19" style="fill: var(--fg-strong)">WITH</text>
  <rect x="256" y="296" width="62" height="50" rx="10"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-neutral); stroke-width: 2.5" />
  <rect x="328" y="296" width="62" height="50" rx="10"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-neutral); stroke-width: 2.5" />
  <rect x="400" y="296" width="62" height="50" rx="10"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="359" y="378" text-anchor="middle" font-size="17" style="fill: var(--fg-neutral)">끄고 3번</text>
  <path d="M472 321 H502" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="510" y="291" width="112" height="60" rx="12"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="566" y="328" text-anchor="middle" font-size="19" style="fill: var(--fg-strong)">W/OUT</text>
  <path d="M632 131 L660 196 M632 321 L660 256"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="648" y="196" width="104" height="60" rx="12"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="700" y="233" text-anchor="middle" font-size="21" style="fill: var(--fg-strong)">Δ</text>
</svg>
```

그레이더는 여섯 종류입니다. `regex`·`tool_used`·`tool_order`·`file_exists` 는 실행 기록과 생성된 파일에서 바로 계산하니 비용이 들지 않고, `llm`·`baseline` 은 판정용 모델을 부르니 비용이 붙습니다.

이 설계의 취지를 문서가 한 문장으로 적어 뒀습니다. 켜고 껐을 때가 모두 1.0 이면, 그 케이스를 통과시킨 건 플러그인이 아닙니다.

## Δ 를 0 으로 만드는 건 대개 description 한 줄

문서는 사람들이 처음 마주칠 결과까지 미리 적어 뒀습니다. Δ 가 0 근처인데 `tool_used: Skill` 그레이더가 실패하는 경우고, 원인은 스킬의 `description` 이 그 프롬프트의 표현에 걸리지 않는 것입니다. 고칠 곳은 스킬 본문이 아니라 **프런트매터 한 줄**입니다.

이 관점에서 보면 스킬을 만드는 작업은 두 층으로 갈립니다. 무엇을 시킬지 적는 층, 그리고 그게 언제 불릴지 정하는 층이죠. 공들이는 쪽은 대개 앞이지만 점수를 가르는 쪽은 뒤입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>사용자 문장이 description 이라는 좁은 관문을 통과해야 스킬 본문에 닿는 모습</title>
  <rect x="50" y="188" width="182" height="74" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="141" y="232" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">사용자 문장</text>
  <path d="M242 225 H316" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M299 214 L316 225 L299 236" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="330" y="106" width="34" height="96" rx="8"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <rect x="330" y="248" width="34" height="96" rx="8"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <text x="347" y="382" text-anchor="middle" font-size="17" style="fill: var(--fg-neutral)">description</text>
  <path d="M374 225 H452" stroke-dasharray="10 9"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M435 214 L452 225 L435 236" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="466" y="142" width="264" height="166" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="598" y="232" text-anchor="middle" font-size="19" style="fill: var(--fg-strong)">SKILL.md 본문</text>
</svg>
```

하나 더 있습니다. `tool_used` 그레이더가 `Skill` 을 대상으로 삼으면 그 그레이더는 양쪽 점수에서 빠집니다. 플러그인 없이는 통과할 수 없는 항목이라 점수에 넣으면 끈 쪽이 0 으로 밀리고 Δ 가 부풀기 때문입니다. 리포트에는 `plugin-fired indicator` 배지로만 남죠. 스킬이 떴다는 사실 자체를 성과로 치지 않겠다는 설계입니다.

## judge 모델이 흔들린다는 반론

Δ 가 숫자로 떨어진다고 그 숫자가 단단한 건 아닙니다. `llm`·`baseline` 그레이더의 판정은 모델이 내리고, 기본값은 작고 빠른 모델입니다. 문서도 이걸 전제로 안내합니다. `tool_used: Skill` 은 통과했는데 Δ 가 음수면 플러그인보다 판정 모델을 먼저 의심하고, `--judge-model sonnet` 으로 다시 돌려 보라고 적혀 있습니다.

연구 쪽 보고도 같은 방향입니다. 판정 모델의 신뢰도를 대규모로 잰 [최근 연구](https://arxiv.org/pdf/2606.19544)는 사람과의 단순 일치율이 우연을 보정한 지표보다 30%대까지 부풀어 보인다고 지적합니다. 같은 입력에 같은 판정이 다시 나오는 비율도 temperature 를 0 에서 1 로 올리면 90%대에서 70%선까지 내려간다고 합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>같은 응답을 판정 모델에 세 번 넣었을 때 판정이 갈리는 모습</title>
  <rect x="48" y="192" width="168" height="70" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="132" y="234" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">같은 응답</text>
  <path d="M226 227 H286" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="348" cy="227" r="56"
    style="fill: none; stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="348" y="234" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">judge</text>
  <path d="M406 210 L468 138 M406 227 H468 M406 244 L468 316"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="478" y="108" width="146" height="58" rx="12"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="551" y="144" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">pass</text>
  <rect x="478" y="198" width="146" height="58" rx="12"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="551" y="234" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">pass</text>
  <rect x="478" y="288" width="146" height="58" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="551" y="324" text-anchor="middle" font-size="18" style="fill: var(--fg-strong)">fail</text>
  <path d="M672 122 V332 M660 134 L672 122 L684 134 M660 320 L672 332 L684 320"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="712" y="234" text-anchor="middle" font-size="18" style="fill: var(--fg-neutral)">Δ 폭</text>
</svg>
```

그래서 Δ 는 절대 점수로 읽을 값이 아닙니다. 케이스도 모델도 judge 도 고정해 두고 규약을 고치기 전과 후를 견주는 상대 비교일 때 값이 삽니다. 문서가 CI 예시에서 `--model` 과 `--judge-model` 을 둘 다 못 박아 두라고 적은 이유도 같습니다. 모델이 교체된 날 그 변화가 내 플러그인의 회귀로 둔갑하지 않게 막는 장치입니다.

비용도 걸립니다. 케이스 10개면 60런이고, 판정 그레이더를 붙인 만큼 판정 호출이 더해집니다. `--ablation none` 으로 한쪽 팔만 돌리면 절반으로 줄지만 그러면 Δ 가 없습니다. 애초에 `plugin eval` 은 아직 early access 라 계정에 따라 명령이 그대로 종료되기도 합니다.

## 스킬을 늘리는 일과 스킬이 일하게 하는 일

CI 에 걸 수단은 이미 갖춰져 있습니다. `--threshold` 아래로 떨어진 케이스가 하나라도 있으면 exit 1, `--max-cost-usd` 상한에 걸려 못 돌린 런이 남으면 exit 2 입니다. 리포트는 외부 요청을 하지 않는 단일 HTML 파일이라 CI 산출물로 그대로 붙일 수 있습니다.

정작 달라지는 건 명령이 아니라 습관 쪽입니다. 스킬과 커맨드를 저장소에 쌓아 굴리는 사람이라면, 규약 문서를 고치는 일은 이미 일상이죠. 고친 뒤 결과가 나아졌는지 재는 자리는 여태 비어 있었습니다. Δ 는 그 자리에 숫자 한 칸을 만들어 줍니다. 0 이 나오면 그 스킬은 지우면 됩니다.

## 참고 자료

- [Test plugins with evals — Claude Code Docs](https://code.claude.com/docs/en/plugin-evals)
- [Claude Code CHANGELOG — anthropics/claude-code](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- [@anthropic-ai/claude-code — npm registry (배포 시각)](https://registry.npmjs.org/@anthropic-ai/claude-code)
- [Reliability without Validity: LLM-as-a-Judge 대규모 평가](https://arxiv.org/pdf/2606.19544)
- [Anthropic Ships /skill-doctor to Audit Claude Code Skills](https://www.implicator.ai/anthropic-claude-code-skill-doctor-context-audit/)
