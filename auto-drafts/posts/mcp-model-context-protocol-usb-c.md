---
title: MCP는 왜 AI의 USB-C라고 불릴까?
slug: mcp-model-context-protocol-usb-c
tags: [MCP, Model Context Protocol, 에이전트, Agentic AI Foundation, 도구 연결, AI 네이티브 개발 입문]
category: ai
published_at: 2026-09-01
series: ai-native-dev
series_order: 6
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/3c16b30f.webp
---
> 2025년 12월 Linux Foundation 으로 넘어갈 당시 공개 MCP 서버는 1만 개, SDK 월간 다운로드는 9,700만 건이었습니다. 에이전트가 GitHub·DB·Figma 같은 바깥 세계와 대화하는 이 표준의 구조와 2026년 레지스트리, 서버를 붙일 때 볼 것을 정리했습니다.

## 에이전트가 우리 회사 DB 를 어떻게 읽나

에이전트는 "도구"가 있어야 행동합니다. 파일 읽기·셸 실행은 하네스에 기본으로 들어 있습니다. 그런데 Jira 이슈를 읽거나 Postgres 를 조회하거나 Figma 디자인을 가져오는 도구는 어디서 올까요? 예전에는 도구마다 에이전트마다 따로 붙였습니다. Claude 용 Jira 연동, Cursor 용 Jira 연동을 각각 만드는 식입니다.

MCP 는 이 M×N 문제를 M+N 으로 줄입니다. 외부 시스템 쪽은 **MCP 서버**를 한 번 만들고 에이전트 쪽은 **MCP 클라이언트**를 한 번 구현하면 서로 조합이 됩니다. 공식 문서가 USB-C 라고 부르는 이유입니다. 기기마다 다른 케이블을 만들지 않고 규격 하나로 통일하는 겁니다.

![MCP 공식 문서 — AI 애플리케이션이 MCP 를 통해 데이터 소스·도구·워크플로에 연결되는 구조](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/3c16b30f.webp)

## 호스트·클라이언트·서버 구조

용어가 세 개라 처음엔 헷갈립니다. 저도 클라이언트와 호스트를 한동안 같은 말로 썼습니다. 정리하면 이렇습니다.

- **호스트**는 사용자가 쓰는 AI 애플리케이션입니다. Claude Code, ChatGPT, VS Code 가 호스트입니다.
- **클라이언트**는 호스트 안에서 서버 하나와 1:1 로 연결을 유지하는 부품입니다. 서버 세 개를 붙이면 클라이언트도 세 개입니다.
- **서버**는 외부 시스템을 대신해 기능을 노출하는 프로그램입니다. 로컬 프로세스일 수도 있고 원격 HTTP 엔드포인트일 수도 있습니다.

서버가 노출하는 것은 크게 세 종류입니다. 모델이 호출하는 **도구**(예: 이슈 생성), 모델이 읽는 **리소스**(예: 파일·DB 레코드), 재사용 가능한 **프롬프트** 템플릿입니다. 에이전트는 서버에 접속하면 "너 뭐 할 수 있어?"를 먼저 묻고 그 목록을 컨텍스트에 넣어 둡니다. 그래서 Claude Code 는 컨텍스트를 아끼려고 도구 정의를 지연 로딩합니다. 서버 열 개를 붙여도 이름만 들고 있다가 쓸 때 정의를 가져옵니다.

## 2025년 12월, Anthropic 이 손을 뗐다

표준이 되려면 한 회사 것이면 안 됩니다. Anthropic 은 2025년 12월 9일 MCP 를 Linux Foundation 산하에 새로 만든 **Agentic AI Foundation** 에 기부했습니다. 창립 멤버는 Anthropic·Block·OpenAI 이고 Google·Microsoft·AWS·Cloudflare·Bloomberg 가 지원사로 들어왔습니다. 같은 날 Block 의 에이전트 goose 와 OpenAI 가 주도한 AGENTS.md 도 같은 재단으로 옮겼습니다. 저장소 컨텍스트 파일의 표준과 도구 연결 표준이 한 지붕 아래 있게 된 겁니다.

기부 시점 수치가 규모를 말해 줍니다.

- 활성 공개 MCP 서버 **1만 개 이상**
- Python·TypeScript SDK 월간 다운로드 **9,700만 건 이상**
- ChatGPT·Cursor·Gemini·Microsoft Copilot·VS Code 가 클라이언트로 채택

2026년에는 공식 레지스트리가 서버 목록을 관리합니다. 화면을 보면 어떤 것들이 올라오는지 감이 옵니다.

![공식 MCP 레지스트리 — SEC 공시 조회, 소송 검색, 브라우저 조작, 에이전트 간 통신 등 2026년 9월 16일에 갱신된 서버들](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/e60e7a47.webp)

SEC 공시를 읽는 서버, 미국 연방 소송을 검색하는 서버, 에이전트가 결제하기 전에 수취인 주소를 제재 목록과 대조하는 서버, 에이전트끼리 대화하는 메시 서버까지 있습니다. 개발 도구를 넘어 에이전트가 손댈 수 있는 세계 전체가 서버로 올라오는 중입니다.

## 실제로 붙이는 법

Claude Code 에서는 명령 한 줄입니다. `claude mcp add --transport http notion https://mcp.notion.com/mcp` 처럼 이름과 주소를 주면 됩니다. 그 뒤로 "이슈 #1234 를 읽고 구현해", "모니터링에서 어제 에러 급증 원인 찾아" 같은 요청이 도구 호출로 이어집니다.

다만 Claude Code 문서는 한 가지를 먼저 권합니다. **CLI 가 있으면 CLI 를 쓰라**는 겁니다. GitHub 라면 `gh`, AWS 라면 `aws`. CLI 는 컨텍스트를 가장 적게 쓰는 연결 방식이고 모델이 이미 쓰는 법을 압니다. 모르는 CLI 도 `--help` 를 읽고 익힙니다. MCP 는 CLI 가 없거나 원격 서비스와 구조화된 대화가 필요할 때 힘을 발휘합니다. OpenAI 가 하네스 엔지니어링 사례에서 Chrome DevTools 를 MCP 로 붙여 에이전트가 화면을 직접 검증하게 한 게 딱 그 경우입니다.

## 서버를 붙이기 전에 볼 것

서버가 1만 개라는 건 누구나 서버를 올릴 수 있다는 뜻입니다. OWASP 의 에이전트 애플리케이션 Top 10(2026)은 **ASI04 에이전트 공급망 취약점** 항목에서 MCP 서버를 직접 지목합니다. 손상된 서버가 그걸 붙인 모든 에이전트로 위험을 퍼뜨립니다. **ASI02 도구 오용** 항목은 도구의 설명 메타데이터에 심은 지시로 에이전트를 조종하는 공격을 다룹니다. 에이전트는 서버가 준 도구 설명을 그대로 읽기 때문입니다.

그래서 실무에서는 세 가지를 봅니다. 서버 코드가 공개돼 있고 누가 유지하는지, 도구가 요구하는 권한이 필요 이상으로 넓지 않은지, 서버가 반환하는 내용에 지시문이 섞여 들어올 여지가 있는지. Karpathy 는 2026년 4월 대담에서 앞으로의 제품은 사람용 문서 대신 **기계가 읽는 스키마와 CLI** 를 제공해야 한다고 했습니다. MCP 가 그 통로인데 통로가 넓어진 만큼 문단속도 같이 가야 합니다.

## 연결 다음은 지식

MCP 로 에이전트가 바깥 도구를 쓰는 방법은 표준이 됐습니다. 그런데 도구를 쓸 줄 안다고 우리 팀 방식대로 일하는 건 아닙니다. "배포 전에는 이 체크리스트를 돌려라", "이 API 는 이런 규약으로 설계해라" 같은 절차 지식은 MCP 가 아니라 다른 계층이 맡습니다. 다음 글에서는 그 계층인 스킬·서브에이전트·훅에 대해서 알아보겠습니다.

## 참고 자료

- [What is the Model Context Protocol (MCP)? — MCP Docs](https://modelcontextprotocol.io/docs/getting-started/intro) — 구조 도식 출처
- [Official MCP Registry](https://registry.modelcontextprotocol.io/) — 레지스트리 화면 캡처 출처
- [Donating the Model Context Protocol and establishing the Agentic AI Foundation — Anthropic (2025-12-09)](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [Linux Foundation Announces the Formation of the Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [Best practices for Claude Code — Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
