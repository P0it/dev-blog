---
title: 플러그인에 고정한 커밋 SHA를 믿어도 될까요?
slug: plugin-pinned-commit-sha-verify
tags: [Claude Code, 플러그인, 공급망 보안]
category: insights
---

> AI 코딩 도구가 플러그인을 고정할 때 쓰는 40자 커밋 SHA 가 실제로는 대조되지 않는다는 공개가 9월 17일에 나왔습니다. 그 구조를 샌드박스의 git 으로 직접 재현하고 보도된 패치 버전이 언제 배포됐는지 레지스트리에서 확인해 정리했습니다.

플러그인 마켓플레이스 파일을 열어 보면 항목마다 40자짜리 문자열이 하나씩 적혀 있습니다. `sha` 필드입니다. 태그나 브랜치 이름과 달리 이 값은 나중에 다른 커밋을 가리키도록 바뀌지 않으니 여기까지는 안심할 만해 보입니다. 그런데 그 해시에 해당하는 코드가 정말 내 디스크에 들어왔는지는 누가 확인할까요? 확인하지 않고 넘어가는 구간이 있었습니다. 고정값을 적어 두는 것과 적힌 값이 실제로 쓰였는지 대조하는 것은 서로 다른 동작인데 주요 코딩 에이전트 네 개가 앞쪽만 하고 뒤쪽을 빼 두었다는 내용이 이번에 공개됐습니다. 원격 저장소에 `FETCH_HEAD` 라는 이름의 브랜치를 하나 만들어 두면 같은 고정값으로 시작한 설치가 다른 커밋에서 끝나는데 에러도 경고도 나지 않습니다. 구조를 알면 지금 쓰는 도구의 설치본이 어느 쪽인지 확인할 수 있습니다.

## marketplace.json 의 sha 필드가 약속하는 것

Claude Code 는 플러그인을 git 저장소에서 가져오고 마켓플레이스 항목의 `source` 안에 `ref` 와 `sha` 를 적을 수 있습니다.

```json
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

공식 문서는 `sha` 를 "정확한 버전으로 고정하는 40자 전체 git 커밋 SHA" 로 정의합니다. 둘이 같이 있을 때는 `sha` 가 실제 고정값이 되고 Claude Code 가 그 커밋을 직접 fetch 해서 checkout 한다고 적혀 있습니다.

읽어 보면 약속은 분명합니다. 다만 문서가 적어 둔 동작은 **fetch 와 checkout 까지**입니다. 체크아웃이 끝난 뒤 작업 트리가 그 해시의 내용인지 되묻는 단계는 규약에 없습니다.

## 같은 서버에서 다른 커밋으로 끝난 재현

그 한 단계가 왜 필요한지는 git 만으로 확인할 수 있습니다. 서버 쪽 저장소를 하나 만들어 안전한 커밋과 공격자 커밋을 하나씩 두었습니다. 그리고 공격자 커밋을 가리키는 `FETCH_HEAD` 라는 이름의 브랜치를 만들었습니다. 고정값은 안전한 커밋 쪽입니다.

```bash
PIN=7e189c8d7ec44f1748e2377ece1d8a7caa799987   # plugin.js 가 'safe'
EVIL=0f59cb57f1c8a462e44e89c85da13bcc47d5464a  # plugin.js 가 'evil'
git branch FETCH_HEAD "$EVIL"
```

설치하는 쪽은 두 가지로 나뉩니다. 고정값을 직접 지정해 fetch 하느냐, 저장소를 통째로 fetch 한 뒤 `FETCH_HEAD` 를 체크아웃하느냐입니다.

```bash
### A — 고정값을 직접 fetch
git fetch origin "$PIN" && git checkout FETCH_HEAD
HEAD  7e189c8d7ec44f1748e2377ece1d8a7caa799987
file  console.log('safe')

### B — 전체 fetch 후 FETCH_HEAD 체크아웃
git fetch origin && git checkout FETCH_HEAD
HEAD  0f59cb57f1c8a462e44e89c85da13bcc47d5464a
file  console.log('evil')
```

B 에서 체크아웃된 커밋은 고정값과 다릅니다. 두 명령 모두 정상 종료했고 경고 한 줄 없었습니다. 이유는 `.git/FETCH_HEAD` 파일에 있습니다. git 은 fetch 한 ref 를 이 파일에 한 줄씩 적어 두고 `FETCH_HEAD` 라는 이름을 해석할 때 첫 줄을 읽습니다. 재현에서는 이렇게 적혔습니다.

```
0f59cb57f1c8a462e44e89c85da13bcc47d5464a	not-for-merge	branch 'FETCH_HEAD' of ../server
7e189c8d7ec44f1748e2377ece1d8a7caa799987	not-for-merge	branch 'master' of ../server
```

`FETCH_HEAD` 라는 이름의 브랜치가 첫 줄을 차지했습니다. 브랜치 이름은 저장소를 가진 쪽이 정합니다. 그러니 첫 줄에 무엇이 올지도 그쪽이 정할 수 있습니다. 여기 쓴 git 은 2.43.0 입니다.

## 고정값과 HEAD 를 맞춰 보는 한 줄

막는 방법은 짧습니다. 체크아웃이 끝난 뒤 실제 HEAD 를 읽어 고정값과 문자열로 비교하면 됩니다.

```bash
actual=$(git -C "$dir" rev-parse HEAD)
[ "$actual" = "$PIN" ] || { echo "핀 불일치: $actual"; exit 1; }
```

두 줄이면 위 B 는 설치 단계에서 멈춥니다. 40자 해시를 적는 행위는 의도를 기록하는 일이고 이 비교가 그 의도를 집행하는 일입니다. 둘 중 뒤쪽이 빠져 있으면 앞쪽은 주석과 다를 바가 없습니다.

## 패치는 공개보다 석 달 먼저 배포돼 있었다

보도에 따르면 이번 건은 AIR Security 가 Plugin4Shell 이라는 이름으로 9월 17일에 공개했고 Claude Code·OpenAI Codex·GitHub Copilot·Gemini CLI 네 도구가 대상입니다. 패치된 버전은 Claude Code 2.1.179 와 Codex 0.146.0 으로 전해집니다. 관련 매체가 샌드박스에서 열리지 않아 이 문장들은 원문으로 확인하지 못했습니다.

확인할 수 있는 쪽은 배포 시각입니다. npm 레지스트리 메타데이터를 보면 두 버전이 올라간 날짜가 이렇습니다.

| | 배포 시각 | 공개일까지 |
|---|---|---|
| `@anthropic-ai/claude-code` 2.1.179 | 2026-06-16 | 약 3개월 |
| `@openai/codex` 0.146.0 | 2026-07-29 | 약 7주 |

고쳐진 코드가 이미 몇 달째 배포돼 있었다는 뜻입니다. 연구자가 먼저 알리고 벤더가 고친 뒤에 공개하는 순서라 그렇거든요. 그래서 이번 소식을 읽는 사람이 할 일도 달라집니다. 기다릴 패치가 있는 게 아니라 이미 나온 버전을 쓰고 있는지 확인하면 됩니다.

덧붙이면 Claude Code 변경 로그의 2.1.179 항목에는 이 내용이 없습니다. 플러그인 무결성과 관련된 문구가 로그에 다시 보이는 것은 한참 뒤입니다. 2.1.275 는 npm 소스 플러그인을 `npm pack --ignore-scripts` 로 받아 무결성을 검증하도록 바꿨습니다. 2.1.277 은 `installed_plugins.json` 이 공식 마켓플레이스 플러그인의 커밋을 기록하지 않던 문제와 커밋을 고정한 플러그인을 갱신한 뒤에도 옛 커밋이 남던 문제를 고쳤습니다. 설치된 것이 무엇인지 기록하는 쪽도 함께 고치고 있다는 신호로 읽힙니다.

## 아직 패치가 없다고 알려진 도구들

GitHub Copilot 은 아직 수정본이 나오지 않았고 Google 은 Gemini CLI 를 고치는 대신 폐기하고 Antigravity 로 옮기라고 안내했다고 전해집니다. 이 두 문장도 원문을 열지 못했습니다.

다만 레지스트리에서 보이는 모습은 조금 다릅니다. `@google/gemini-cli` 는 9월 20일까지도 `0.62.0-nightly.20260920` 같은 nightly 빌드를 매일 올리고 있습니다. 폐기 안내가 나왔다고 배포가 멈춘 것은 아닙니다. 계속 쓸지 정할 때는 안내문보다 실제로 설치된 버전을 확인하는 편이 낫겠습니다.

## 플러그인을 하나 더 넣기 전에

이 관점에서 보면 이번 공개의 실질은 취약점 자체보다 **고정값을 적는 습관과 대조하는 습관 사이의 간격**입니다. 그리고 그 간격은 플러그인에만 있지 않습니다. GitHub Actions 의 액션을 커밋 SHA 로 고정해 두었어도 실행된 것이 그 커밋인지 확인하는 단계는 워크플로 어디에도 없습니다. `package-lock.json` 과 컨테이너 이미지 태그도 같은 모양입니다. 값을 적어 둔 파일은 늘어나는데 적힌 값과 실제로 실행된 것을 맞춰 보는 줄은 잘 늘어나지 않습니다.

당장 할 수 있는 것은 세 가지가 있습니다. 쓰고 있는 코딩 에이전트의 버전을 확인합니다. 마켓플레이스를 직접 운영한다면 설치가 끝난 뒤 `rev-parse` 비교를 한 줄 넣습니다. 그리고 이미 설치된 플러그인이 어느 커밋에서 왔는지 기록이 남아 있는지 확인합니다. 세 번째가 의외로 비어 있습니다.

## 참고 자료

- [Create and distribute a plugin marketplace — Claude Code Docs](https://code.claude.com/docs/en/plugin-marketplaces)
- [anthropics/claude-code CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- [registry.npmjs.org/@anthropic-ai/claude-code](https://registry.npmjs.org/@anthropic-ai/claude-code)
- [registry.npmjs.org/@openai/codex](https://registry.npmjs.org/@openai/codex)
- [registry.npmjs.org/@google/gemini-cli](https://registry.npmjs.org/@google/gemini-cli)
- [Plugin4Shell — AIR Security](https://www.air.security/blog-posts/plugin4shell)
- [Zero-click RCE vulnerability hit four major AI coding agents — Help Net Security](https://www.helpnetsecurity.com/2026/09/18/plugin4shell-ai-coding-agents-vulnerability/)
