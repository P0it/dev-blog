---
title: AI-DLC는 애자일과 뭐가 다를까요?
slug: ai-dlc-aws-methodology
tags: [AI-DLC, AWS, 개발 방법론, 애자일, Kiro, AI 네이티브 개발 입문]
category: ai
published_at: 2026-08-23
series: ai-native-dev
series_order: 3
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/5b0e9d09.webp
---
> 2주 스프린트가 시간·일 단위 "볼트"로 바뀌고 사용자 스토리를 AI 가 먼저 씁니다. AWS 가 2025년 7월에 제안하고 2026년 9월 현재 Claude Code·Kiro·Cursor·Copilot 에서 같은 규칙으로 돌아가는 AI-DLC 의 세 단계와 애자일과의 차이, 검증된 주장의 범위를 정리했습니다.

## 스프린트 계획 회의가 어색해지는 순간

에이전트로 일하다 보면 기존 프로세스가 삐걱대는 대목이 생깁니다. 2주짜리 스프린트를 잡았는데 사흘 만에 백로그가 비어 버립니다. 사용자 스토리를 사람이 쓰고 태스크로 쪼개는 데 드는 시간이 구현 시간보다 깁니다. 왜 이럴까요? 애자일과 스크럼은 **사람이 만드는 속도**에 맞춰 설계된 방법론이기 때문입니다. 실행 주체가 바뀌었는데 리듬은 그대로라 어긋납니다.

AWS 의 Principal Solutions Architect Raja SP 가 2025년 7월 31일 AWS DevOps 블로그에 낸 AI-DLC 는 이 어긋남을 고치려는 시도입니다. 이름부터 SDLC(소프트웨어 개발 수명 주기)에 AI 를 붙였습니다. AI 를 **중심 협업자**로 놓고 사람은 감독·결정을 맡는다는 게 출발점입니다.

## AI 가 묻고 사람이 답하는 사이클

AI-DLC 의 작동 원리는 그림 하나로 요약됩니다.

![AWS AI-DLC 의 기본 사이클 — AI 가 계획을 만들고 질문하면 사람이 답하고 AI 가 구현한다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/718e63bd.webp)

보라색이 AI 의 일, 주황색이 사람의 일입니다. AI 가 계획을 세우고 부족한 맥락을 **질문**합니다. 사람이 답하면 그제야 구현합니다. Claude Code 문서가 권하는 "탐색 → 계획 → 구현" 과 같은 결이지만 AI-DLC 는 **질문 단계를 명시적으로 박아 둔** 점이 다릅니다. 사람이 처음부터 완벽한 스펙을 쓰는 대신 AI 가 빈칸을 찾아 묻게 합니다. Anthropic 의 Claude Code 문서가 권하는 "에이전트가 사람을 인터뷰하게 하라"는 조언과 정확히 같은 방향입니다.

## Inception·Construction·Operations 세 단계

이 사이클을 수명 주기 전체에 펼치면 세 단계가 됩니다.

![AWS AI-DLC 의 세 단계 — Inception(Mob Elaboration)·Construction(Mob Construction)·Operation](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/5b0e9d09.webp)

- **Inception** — AI 가 비즈니스 의도를 요구사항·사용자 스토리·작업 단위로 바꿉니다. 기존 코드에서 맥락을 먼저 뽑습니다. 이 과정을 팀 전체가 한자리에서 검증하는 걸 **Mob Elaboration** 이라고 부릅니다.
- **Construction** — AI 가 도메인 모델과 아키텍처 컴포넌트를 제안하고 코드와 테스트를 만듭니다. 팀이 실시간으로 기술적 판단을 보태는 **Mob Construction** 입니다.
- **Operation** — AI 가 앞 단계에서 쌓인 맥락으로 배포 파이프라인과 IaC 를 만들고 사람이 승인해 배포합니다.

애자일 용어도 바뀝니다. 에픽은 **작업 단위(Unit of Work)** 가 되고 스프린트는 **볼트(Bolt)** 가 됩니다. 볼트는 **시간·일 단위**의 짧고 강한 작업 사이클입니다. 저는 처음에 이름만 바꾼 것 아닌가 싶었는데 실제 차이는 리듬에 있었습니다. 2주 단위로 계획하면 AI 가 만든 산출물을 검토하는 사람 쪽 시간이 병목이 됩니다. 볼트는 그 검토를 매일 작게 나누는 장치입니다.

애자일과 나란히 놓으면 이렇습니다.

| | 애자일·스크럼 | AI-DLC |
|---|---|---|
| 중심 | 사람 팀 | AI + 사람 감독 |
| 작업 주기 | 스프린트(1~4주) | 볼트(시간~일) |
| 요구사항 | 사람이 스토리 작성 | AI 가 의도에서 생성, 팀이 검증 |
| 산출물 | 사람이 구현 | AI 가 계획·코드·테스트·IaC 생성 |
| 회의 | 스탠드업·회고 | Mob Elaboration·Mob Construction |
| 사람 역할 | 구현자 | 검증자·결정자 |

## 방법론에서 실행 가능한 규칙으로

백서만 있으면 방법론에 그칩니다. AWS 는 2025년 11월에 이를 에이전트가 읽는 마크다운 규칙 파일로 오픈소스화했습니다. `awslabs/aidlc-workflows` 저장소입니다. 2026년 9월 현재 GitHub Star 4,600개, 기여자 61명, 최신 릴리스 **2.9.0** 입니다.

2.x 버전의 구조가 흥미롭습니다. "하네스 중립 코어 하나"를 두고 Claude Code·Kiro CLI·Kiro IDE·Codex CLI·Cursor·opencode·GitHub Copilot 에 어댑터로 붙입니다. 전체 워크플로는 **5개 단계·33개 스테이지**로 나뉘고 스테이지 사이에 **사람 승인 게이트**가 있습니다. 모든 결정은 99종의 이벤트로 감사 추적에 남습니다. 도메인 전문가 11개, 리뷰어 2개, 조합기 1개로 구성된 에이전트 14개가 역할을 나눠 맡습니다. 역할별 서브에이전트 패턴을 방법론 수준에서 미리 짜 둔 구조입니다.

설치는 셸 한 줄입니다. 저장소 README 는 "AI-DLC 는 도구가 아니라 방법론"이라 IDE·에이전트·모델을 가리지 않는다고 강조합니다. 스펙 주도 IDE 인 Kiro 가 AWS 제품이라 AI-DLC 와 궁합이 맞게 설계됐지만 Claude Code 에서도 같은 규칙이 돕니다.

## "10배"는 어디까지 믿을까

AI-DLC 를 소개하는 자료에는 10배, 10~15배 생산성 같은 숫자가 따라다닙니다. 이 수치는 AWS 쪽 발표와 고객 사례에서 나온 **주장**이고 METR 의 무작위 대조 실험이나 Microsoft 의 배포 연구 같은 통제된 측정은 아닙니다. DORA 가 2026년 ROI 보고서에서 전제로 깐 J 커브를 떠올리면 방법론을 바꾼 직후에는 오히려 느려지는 구간이 정상입니다. 그래서 AI-DLC 를 볼 때는 배수보다 **구조**를 봐야 합니다. 질문을 앞당기는 것, 승인 게이트를 명시하는 것, 작업 주기를 줄이는 것 세 가지는 어느 팀이 써도 손해가 없는 장치입니다.

## AI-DLC 의 위치

에이전트 한 번의 작업 루프가 "한 작업" 단위였다면 AI-DLC 는 그 루프를 **팀의 수명 주기** 전체로 확장한 틀입니다. AI-DLC 를 그대로 도입하지 않더라도 이 틀을 머리에 두면 스펙·컨텍스트·MCP 같은 도구들이 수명 주기의 어느 칸을 채우는지 알게 됩니다. 다음 글에서는 Inception 단계의 핵심인 스펙 주도 개발에 대해서 알아보겠습니다.

## 참고 자료

- [AI-Driven Development Life Cycle: Reimagining Software Engineering — AWS DevOps Blog (2025-07-31)](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/) — 사이클·세 단계 도식 출처
- [awslabs/aidlc-workflows — GitHub](https://github.com/awslabs/aidlc-workflows)
- [AI-DLC: The AI-Driven Development Lifecycle — IBM Think](https://www.ibm.com/think/topics/ai-dlc)
