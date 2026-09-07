---
title: 에이전트 도입을 막는 건 모델이 아니라 형상관리입니다
slug: agent-as-code-ant-apply
tags: [AI 에이전트, 엔터프라이즈]
category: insights
---

> Anthropic이 에이전트와 스킬, 실행 환경을 저장소 파일로 선언하는 ant apply를 냈습니다. 에이전트가 회사 안으로 들어가지 못한 이유는 모델 성능이 아니라, 누가 언제 무엇을 바꿨는지 댈 수 없다는 데 있었습니다.

## 에이전트를 파일로 선언한다

`ant` CLI 1.30.0이 9월 3일 나오면서 `ant apply`가 들어왔습니다. 에이전트·환경·스킬·메모리 스토어·배포를 저장소 안의 파일로 적어 두고, 그 파일과 Claude API 쪽 리소스를 맞추는 명령입니다.

에이전트 하나는 `agents/` 아래 마크다운 한 장입니다. 프런트매터가 모델·도구 같은 설정이고 본문이 시스템 프롬프트죠. 환경과 메모리 스토어는 YAML로 적고, 배포는 마크다운인데 여기서는 프런트매터가 요청 본문이 되고 산문이 세션을 여는 첫 메시지가 됩니다. 스킬만 예외로, `SKILL.md`를 루트에 둔 디렉터리 하나를 통째로 올립니다.

파일끼리는 ID가 아니라 **상대 경로**로 서로를 가리킵니다. 리뷰어 에이전트가 `skills`에 `../skills/pr-summary`라고 적어 두면 `ant apply`가 의존 순서대로 만들면서 실제 ID를 채워 넣습니다. 명령을 실행하면 바뀔 내용을 계획으로 먼저 출력하고 승인을 기다립니다. `--dry-run`은 그 계획만 보여 주고 끝냅니다.

![ant CLI 실행 화면 데모](REHOST:https://raw.githubusercontent.com/anthropics/anthropic-cli/main/.github/demo.gif)

## 락파일에 적히는 두 개의 해시

첫 실행이 `claude-lock.json`을 씁니다. 파일 경로마다 어떤 리소스가 됐는지, 그 ID와 버전이 무엇인지, 그리고 해시 두 개를 적어 둡니다. `hash`는 마지막으로 보낸 내용의 지문이고, `remote_hash`는 API가 돌려준 내용의 지문입니다.

이 두 값이 있어서 다음 실행에서 양쪽 변경이 모두 걸립니다. 파일이 고쳐졌는지, 그리고 리소스가 이 파일들 밖에서 바뀌었는지. 누가 Console에서 같은 에이전트를 손댔다면 계획이 `This plan cannot be applied:`와 그 이유를 찍고 `refusing to apply`로 멈춥니다. 덮어쓰려면 `--force`를 직접 붙여야 합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>파일과 API 리소스 사이에서 두 해시가 외부 변경을 잡아내는 구조</title>

  <rect x="50" y="175" width="175" height="100" rx="14"
    style="fill: var(--diag-teal-fill); stroke: var(--diag-teal-stroke); stroke-width: 2.5" />
  <text x="137" y="232" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">reviewer.md</text>

  <rect x="308" y="150" width="185" height="150" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="400" y="186" text-anchor="middle" font-size="16"
    style="fill: var(--fg-strong)">claude-lock.json</text>
  <rect x="330" y="203" width="141" height="36" rx="10"
    style="fill: none; stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="400" y="228" text-anchor="middle" font-size="15"
    style="fill: var(--fg-neutral)">hash</text>
  <rect x="330" y="249" width="141" height="36" rx="10"
    style="fill: none; stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="400" y="274" text-anchor="middle" font-size="15"
    style="fill: var(--fg-neutral)">remote_hash</text>

  <rect x="575" y="175" width="175" height="100" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="662" y="232" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">API 리소스</text>

  <path d="M235 225 H298 M288 217 L298 225 L288 233"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M503 225 H565 M555 217 L565 225 L555 233"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <rect x="575" y="345" width="175" height="62" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="662" y="383" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">Console 편집</text>
  <path d="M662 337 V285 M654 295 L662 285 L670 295"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <circle cx="534" cy="225" r="20"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <path d="M525 216 L543 234 M543 216 L525 234"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
</svg>
```

## 막힌 곳은 성능이 아니라 감사 추적이었다

에이전트가 회사 안에서 멈춰 서는 지점은 벤치마크가 아닙니다. 승인과 감사, 그리고 롤백입니다. 프롬프트를 누가 언제 고쳤는지, 그 변경이 리뷰를 거쳤는지, 사고가 나면 어디로 되돌리는지. 이 셋에 답이 없으면 파일럿에서 더 나아가지 못합니다.

문서가 적어 둔 CI 절차를 보면 그 셋이 그대로 들어 있습니다. PR에서는 `ant apply --dry-run .`으로 계획을 리뷰어에게 보여 주고, 병합 뒤 기본 브랜치에서 `ant apply --yes .`로 적용하고, 중간에 실패했더라도 갱신된 락파일을 커밋합니다. 인증은 저장해 둔 API 키 대신 Workload Identity Federation을 권하고, <mark>락파일에 적힌 조직·워크스페이스와 다른 곳으로 풀리는 자격 증명은 아예 거부합니다</mark>.

규제 쪽에서 요구하는 것도 다르지 않습니다. EU AI Act의 고위험 시스템 의무는 올해 8월 2일부터 적용에 들어갔고, 12조는 시스템이 스스로 로그를 남기도록 요구합니다. 사람이 사후에 정리한 문서로는 대신할 수 없는 항목입니다.

## 콘솔에서 만든 에이전트는 데려올 수 없다

`ant apply`는 Console이나 `ant beta:agents create`로 만든 리소스를 흡수하지 못합니다. 락파일에 든 것만 관리 대상이고, 이미 있는 에이전트를 그대로 파일에 옮겨 적어 적용하면 같은 에이전트가 하나 더 생깁니다.

빠져나갈 길이 하나 있기는 합니다. Console의 **Export as code**로 내려받으면 그 안에 자체 `claude-lock.json`이 들어 있어서, 그걸 적용하면 원래 리소스를 그대로 갱신합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>콘솔에서 만든 에이전트와 파일에서 만든 에이전트가 각각 따로 존재하는 모습</title>

  <rect x="515" y="72" width="225" height="82" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <text x="627" y="120" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">Console 에이전트</text>

  <rect x="55" y="252" width="185" height="82" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="147" y="300" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">agents/…md</text>

  <rect x="308" y="252" width="170" height="82" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="393" y="300" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">ant apply</text>

  <rect x="546" y="252" width="194" height="82" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="643" y="300" text-anchor="middle" font-size="17"
    style="fill: var(--fg-strong)">새 에이전트</text>

  <path d="M250 293 H298 M288 285 L298 293 L288 301"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M488 293 H536 M526 285 L536 293 L526 301"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <path d="M627 158 V242"
    style="stroke: var(--diag-mute-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-dasharray="8 10" />
  <circle cx="627" cy="200" r="21"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <path d="M618 191 L636 209 M636 191 L618 209"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
</svg>
```

그래도 방향은 분명합니다. 화면에서 클릭으로 만든 에이전트에는 운영으로 가는 승격 경로가 자동으로 붙지 않습니다. 진열장에서 실험하던 것을 그대로 밀어 올리는 흐름은 막혀 있고, 어느 시점에는 사람이 저장소로 옮겨 적어야 합니다. 이 관점에서 보면 팀에 권할 순서는 하나로 좁혀집니다. 데모는 콘솔에서 하되, 두 번째 버전부터는 파일에서 시작하는 겁니다.

## 그래도 IaC라는 반론

반론은 분명합니다. 형상관리가 도입을 막은 진짜 이유였다면 Terraform을 쓰는 회사들은 진작 에이전트를 굴리고 있어야 합니다. Gartner는 2027년 말까지 agentic AI 프로젝트의 40% 선이 취소될 것으로 전망했는데, 이유로 든 것은 비용과 불분명한 가치, 그리고 부실한 리스크 통제였습니다. 셋 중 앞의 둘은 락파일로는 풀리지 않습니다.

더 무거운 제약도 하나 있습니다. Claude Managed Agents는 세션이 길게 살아 있고 대화 이력과 샌드박스 상태, 산출물을 서버에 저장하는 구조라, Zero Data Retention과 HIPAA BAA 적용 대상이 아니라고 공식 문서가 직접 밝혀 뒀습니다. 형상은 코드로 내려왔지만 데이터 보존 요건은 그대로 남아 있습니다. 의료나 금융처럼 데이터 처분권부터 따지는 곳에서는 이 한 줄에서 검토가 끝납니다.

그래도 제 결론은 바뀌지 않습니다. 형상관리는 도입의 충분조건이 아니라 필요조건이거든요. 비용과 가치는 프로젝트마다 다르게 판정되지만, 변경 이력이 없는 시스템은 그 판정 자리에 아예 오르지 못합니다.

## 저장소에 무엇이 들어 있는가

지난 10년 동안 인프라가 화면에서 파일로 내려온 경로를 에이전트가 그대로 밟고 있습니다. 서버가 그랬고 네트워크 설정이 그랬습니다. 이제 프롬프트와 스킬, 크론 일정이 같은 자리로 옵니다.

그래서 이제 물어야 할 것은 어느 모델이 더 나은가가 아닙니다. 우리 저장소에 에이전트 정의가 들어 있는지입니다. 그 폴더에 에이전트 정의가 없다면 아무도 안 쓰고 있다는 뜻이 아니라, 누군가 화면에서 만들어 쓰는데 기록이 남지 않았다는 뜻일 가능성이 큽니다.

## 참고 자료

- [Manage resources as code with ant apply — Claude Platform Docs](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/apply)
- [Claude Managed Agents overview — Claude Platform Docs](https://platform.claude.com/docs/en/managed-agents/overview)
- [Claude Platform release notes — Anthropic](https://platform.claude.com/docs/en/release-notes/overview) (2026-09-03 항목)
- [anthropics/anthropic-cli — GitHub](https://github.com/anthropics/anthropic-cli) (본문 데모 이미지 출처, MIT)
- [Gartner Predicts Over 40% of Agentic AI Projects Will Be Canceled by End of 2027 — Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
- [Article 12: Record-Keeping — EU Artificial Intelligence Act](https://artificialintelligenceact.eu/article/12/)
