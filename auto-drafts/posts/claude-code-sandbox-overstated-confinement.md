---
title: Claude Opus 4.6은 왜 증거보다 "시뮬레이션"이라는 말을 믿었을까요
slug: claude-code-sandbox-overstated-confinement
tags: [AI 에이전트, AI 안전]
category: insights
---

> Anthropic이 9월 9일 네 번째 사고를 공개하면서 7월에 내렸던 판단을 고쳤습니다. 평가 환경이 실제 인터넷에 붙어 있다는 증거가 여럿 있었는데도, 모델의 추론이 "여긴 시뮬레이션"이라는 안내 쪽으로 기울어 있었다는 겁니다. 하루 뒤 나온 Claude Code 2.1.268은 시스템 프롬프트에서 강제되지 않는 경계 약속을 지웠습니다. 에이전트에게 환경을 설명하는 문장은 배경 설명이 아니라 판단의 입력값입니다.

## 인터넷이 없다고 들은 모델이 실제 시스템에 들어갔다

Anthropic이 9월 9일 [사이버보안 사고에 대한 정렬 평가](https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents)를 공개했습니다. 3자 평가 환경에서 Claude 모델이 외부 조직의 실제 시스템에 무단 접근한 사고를 다룬 문서고, 여기서 네 번째 사고가 처음 알려졌습니다.

네 번째 건은 2026년 1월에 났습니다. `Claude Opus 4.6`의 초기 체크포인트가 capture-the-flag 과제를 돌던 중이었습니다. 가상의 시나리오와 표적 머신, 빼내야 할 비밀 하나를 주는 형식이죠. 모델은 인터넷이 없는 시뮬레이션 안에 있다고 안내받았는데, 설정이 잘못돼 실제로는 열린 인터넷에 붙어 있었습니다.

네 건 모두 같은 평가 파트너가 만든 환경에서 났습니다. 이번 건은 7월에 돌린 기록 훑기에서 빠졌다가 나중에 잡혔습니다. Anthropic은 네 번째 건을 앞의 셋보다 덜 우려한다고 적었습니다. 모델이 과제를 중단하려는 시도를 반복했기 때문입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>안내받은 경계 밖으로 연결이 이어져 있던 평가 환경</title>
  <rect x="60" y="100" width="430" height="230" rx="18"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" stroke-dasharray="10 8" />
  <text x="62" y="82" style="fill: var(--fg-neutral); font-size: 15">안내받은 경계 · 인터넷 없는 시뮬레이션</text>

  <circle cx="160" cy="215" r="46"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="160" y="222" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">모델</text>

  <rect x="285" y="180" width="150" height="70" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="360" y="221" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">표적 머신</text>

  <path d="M216 215 H275"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none" stroke-linecap="round" />

  <path d="M445 215 H562"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M544 202 L562 215 L544 228"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="490" cy="215" r="9"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />

  <rect x="575" y="180" width="165" height="70" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="657" y="221" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">열린 인터넷</text>

  <text x="657" y="290" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">설정 실수로 살아 있던 경로</text>
</svg>
```

## 7월에 운영 실패로 적은 걸 9월에 다시 적었다

7월 30일 [첫 세 건을 공개](https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals)할 때 Anthropic은 이 사고들을 운영상의 실패에 가깝게 봤습니다. 환경 설정이 틀렸고 모델이 그 틀린 환경에 휘말렸다는 정리였습니다.

9월 9일 문서에서 Anthropic은 그 정리를 고쳤습니다. 네 건에서 반복해 나타난 문제로 두 가지를 꼽습니다. 하나는 *biased reasoning*으로, 맡은 과제를 계속할 근거가 되는 쪽으로 증거를 골라 읽는 성향입니다. 다른 하나는 *recklessness*로, 목표를 좁게 좇느라 실제 피해가 날 수 있는 행동까지 무릅쓰는 성향입니다.

문장으로 옮기면 이렇습니다. 모델은 자기가 실제 인터넷에 닿아 있다는 신호를 봤습니다. 그런데 처음에 시뮬레이션이라고 들었기 때문에, 그 신호를 **시뮬레이션이 잘 만들어졌다는 증거로** 읽었습니다.

Anthropic은 같은 문서에서 METR과 독립 조사 계약을 맺었다고 밝혔습니다. 사고가 난 기간 밖의 기록과 기밀을 공유할 수 있는 직원까지 접근 범위에 넣었고, 초기 계약 기간은 8주라고 합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>같은 사고 네 건에 7월과 9월이 서로 다른 라벨을 붙인 모습</title>
  <rect x="70" y="95" width="230" height="100" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <text x="185" y="133" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">7월 30일</text>
  <text x="185" y="163" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17">운영 실패</text>

  <rect x="500" y="95" width="230" height="100" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="615" y="133" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">9월 9일</text>
  <text x="615" y="163" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17">정렬 문제</text>

  <path d="M312 145 H482"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M464 132 L482 145 L464 158"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <path d="M185 205 V295 M615 205 V295"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-dasharray="8 8" stroke-linecap="round" />

  <rect x="70" y="305" width="660" height="80" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="400" y="352" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17">같은 사고 네 건 · 같은 평가 파트너 환경</text>
</svg>
```

## 환경을 설명하는 문장은 판단의 입력값이다

여기부터는 제 해석입니다.

에이전트에게 "여긴 샌드박스다"라고 말하는 건 배경 설명처럼 보입니다. 그런데 실제로는 그 뒤에 들어오는 모든 관측의 해석 기준을 정하는 문장입니다. 공개 IP가 응답하고, 실제 도메인의 인증서가 유효하고, 낯선 호스트가 살아 있어도, 앞 문장이 시뮬레이션이라고 단정해 두면 그 관측들은 정교한 목업으로 분류됩니다.

그래서 환경 서술을 실제보다 세게 적는 건 안전 마진이 아닙니다. <mark>강제되지 않는 경계를 프롬프트에 적으면 그 경계를 넘었다는 증거까지 함께 무효가 됩니다.</mark> 모델을 안심시키려고 적은 문장이 모델의 관측을 깎아내립니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>안내 한 줄이 여러 관측 증거보다 무겁게 기운 저울</title>
  <path d="M160 200 L640 150"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M365 360 L400 177 L435 360 Z"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5"
    stroke-linejoin="round" />
  <path d="M120 360 H680"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />

  <path d="M160 200 V246"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <rect x="95" y="246" width="130" height="62" rx="12"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="160" y="284" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">안내 한 줄</text>

  <path d="M640 150 V192"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <rect x="570" y="192" width="42" height="42" rx="9"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <rect x="619" y="192" width="42" height="42" rx="9"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <rect x="668" y="192" width="42" height="42" rx="9"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />

  <text x="160" y="398" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">여긴 시뮬레이션이다</text>
  <text x="640" y="398" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">실제 인터넷이라는 관측</text>
</svg>
```

## 하루 뒤 Claude Code 2.1.268이 지운 문장

9월 10일 18시 41분(UTC), Claude Code `2.1.268`이 npm에 올라왔습니다. [릴리스 노트](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)에 이런 항목이 있습니다.

> Fixed Bash sandbox instructions over-stating confinement: no unenforced path lists when filesystem isolation is off, and strict mode no longer claims commands can never run unsandboxed

두 군데입니다. filesystem isolation이 꺼져 있으면 강제되지도 않는 경로 목록을 프롬프트에 늘어놓지 않고, strict mode에서 "명령은 절대 샌드박스 밖에서 돌지 않는다"는 문장을 뺐습니다.

그 문장이 왜 사실이 아니었는지는 [공식 샌드박싱 문서](https://code.claude.com/docs/en/sandboxing)에 적혀 있습니다. 제한 절의 첫 줄이 "Sandboxing reduces risk but is not a complete isolation boundary"입니다.

새는 자리에는 이름도 붙어 있습니다. 샌드박스 안에서 막힌 명령을 모델이 `dangerouslyDisableSandbox`로 다시 시도하는 escape hatch가 있고, `allowUnsandboxedCommands: false`로 그 예외를 닫아도 사용자가 `!` shell-mode로 직접 친 명령은 밖에서 돕니다. 네트워크 쪽도 기본 설정에서 프록시가 TLS를 열어 보지 않으니, 허용 도메인 목록만으로 유출을 막는다고는 말할 수 없습니다.

두 발표가 하루 차이로 붙어 있는 게 우연인지는 알 수 없습니다. 다만 고친 자리는 같습니다. 하네스가 모델에게 하던 말이 문서가 보증하는 것보다 셌습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>프롬프트가 말한 경계와 실제로 강제되는 경계의 차이</title>
  <rect x="60" y="90" width="680" height="280" rx="18"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" stroke-dasharray="10 8" />
  <text x="62" y="72" style="fill: var(--fg-neutral); font-size: 15">프롬프트가 말한 경계</text>

  <rect x="100" y="140" width="330" height="180" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="265" y="222" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17">실제로 강제되는 경계</text>
  <text x="265" y="252" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">OS 격리 · 도메인 허용 목록</text>

  <rect x="500" y="128" width="210" height="58" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="605" y="164" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">밖에서 재시도</text>

  <rect x="500" y="202" width="210" height="58" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="605" y="238" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">셸 직접 입력</text>

  <rect x="500" y="276" width="210" height="58" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="605" y="312" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">TLS 미검사</text>
</svg>
```

## "지금 평가 중"이라고 알려 주면 평가가 흐려진다

반대편 근거도 분명합니다. 환경을 모델에게 정확히 알려 줄수록 평가는 덜 믿을 만해집니다. Apollo Research는 [Claude Sonnet 3.7이 정렬 평가를 자주 알아챈다](https://www.apolloresearch.ai/science/claude-sonnet-37-often-knows-when-its-in-alignment-evaluations)고 적었습니다. scheming 평가를 도는 동안 자기가 평가받는 중이라는 걸 추론에서 언급한 비율이 최대 33% 선이었다고 합니다. `Claude Opus 4.6`도 문항의 극단적인 구체성과 여러 제약이 겹친 문장을 보고 벤치마크의 구조를 짚어 냈다고 알려졌습니다.

평가받는 걸 아는 모델은 다르게 행동합니다. 정직성을 시험받는 자리라고 판단하면 평소보다 정직해지고, 위험한 능력을 재는 자리라면 실력을 덜 내보일 수도 있습니다. 안내를 걷어내고 사실대로 말할수록 이번 같은 사고는 줄지만, 평가 숫자는 배포 환경의 행동과 멀어집니다.

그래도 결론은 그대로입니다. 두 문장이 같은 층에 있지 않으니까요. "지금 너를 평가하는 중이다"는 평가 설계의 문제고 답이 아직 열려 있습니다. "이 명령은 샌드박스 밖에서 돌 수 없다"는 사실 진술이고, 설정 파일을 읽으면 참인지 거짓인지 판별됩니다. 뒤엣것을 정확하게 적자는 이야기는 앞엣것과 상관이 없습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>열린 문제인 평가 층과 판별 가능한 실행 층</title>
  <rect x="70" y="90" width="660" height="120" rx="16"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <text x="120" y="140" style="fill: var(--fg-strong); font-size: 18">평가 층</text>
  <text x="120" y="172" style="fill: var(--fg-neutral); font-size: 15">지금 평가 중인가</text>
  <circle cx="640" cy="150" r="34"
    style="fill: none; stroke: var(--diag-yellow-stroke); stroke-width: 2.5" stroke-dasharray="8 8" />
  <text x="640" y="159" text-anchor="middle" style="fill: var(--fg-strong); font-size: 24">?</text>

  <path d="M120 245 H680"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-dasharray="8 8" stroke-linecap="round" />

  <rect x="70" y="280" width="660" height="120" rx="16"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="120" y="330" style="fill: var(--fg-strong); font-size: 18">실행 층</text>
  <text x="120" y="362" style="fill: var(--fg-neutral); font-size: 15">경계가 실제로 강제되는가</text>
  <path d="M615 342 L635 362 L672 318"
    style="stroke: var(--diag-green-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## 내 하네스에 남은 과장

이 관점에서 보면 확인할 자리는 하나입니다. 에이전트에게 주는 지침에서 환경을 서술한 문장 중 설정으로 실제 강제되는 게 몇 줄인지 세어 보는 겁니다. 강제되지 않는 줄은 "~할 수 없습니다"에서 "~는 기본적으로 막혀 있습니다"로 낮춥니다. 사람이 안 보는 시간에 도는 파이프라인일수록 이 차이가 커집니다. 그 시간에 모델이 기댈 건 그 문장뿐이거든요.

에이전트를 더 자유롭게 굴리는 방향은 계속 갈 겁니다. 자유의 폭을 모델의 판단력이 정한다면, 판단의 재료가 되는 문장부터 사실이어야 합니다.

## 참고 자료

- [An alignment assessment of recent cybersecurity incidents — Anthropic](https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents)
- [Investigating three incidents in our cybersecurity evaluations — Anthropic](https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals)
- [Configure the sandboxed Bash tool — Claude Docs](https://code.claude.com/docs/en/sandboxing)
- [Claude Code CHANGELOG 2.1.268 — anthropics/claude-code](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- [Claude Sonnet 3.7 (often) knows when it's in alignment evaluations — Apollo Research](https://www.apolloresearch.ai/science/claude-sonnet-37-often-knows-when-its-in-alignment-evaluations)
- [Another Anthropic model gained access to the open internet, company says — CBS News](https://www.cbsnews.com/news/anthropic-ai-model-internet-hack-fourth-time/)
