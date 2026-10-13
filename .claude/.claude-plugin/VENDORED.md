# humanize-korean — 레포에 넣은 사본

- 출처: https://github.com/epoko77-ai/im-not-ai (MIT, `LICENSE` 참고)
- 버전: 2.3.2 (`plugin.json`), 2026-10-13 에 플러그인 캐시에서 복사
- 넣은 것: 런타임 에이전트 3종(`.claude/agents/humanize-{monolith,diagnostician,finalizer}.md`),
  스킬 4종(`.claude/skills/humanize{,-korean,-scan,-redo}`), 스크립트(`.claude/scripts/*.py`)

## 왜 플러그인이 아니라 사본인가

클라우드 루틴(매일 자동 글, `docs/auto-daily-draft.md`)은 레포 `.claude/settings.json` 의
`enabledPlugins` 를 설치하지 않는다. 레포 안의 `.claude/agents`·`.claude/skills` 는 clone 과 함께
들어오므로 사본을 두면 로컬과 클라우드가 같은 윤문기를 쓴다.

## 이 폴더가 있는 이유

스킬은 `${CLAUDE_SKILL_DIR}` 에서 `.claude-plugin/` 이 나올 때까지 거슬러 올라가 그곳을 `SKILL_ROOT` 로
삼고 `${SKILL_ROOT}/scripts/` 를 부른다. 그래서 `.claude/` 가 플러그인 루트 노릇을 하도록 이 폴더를 둔다.
지우면 전처리 스크립트를 못 찾는다.

## 갱신

1. 새 버전 플러그인을 받아(또는 저장소를 clone) 위 파일들을 같은 자리에 덮어쓴다. 우리가 고친 파일은 없다.
2. `python .claude/scripts/prepare_monolith_input.py --run-dir _workspace/t --genre blog` 로 돌아가는지 본다.
3. 이 파일의 버전을 고친다.

로컬에 플러그인도 깔려 있으면 `humanize-korean:` 접두어가 붙은 같은 에이전트가 하나 더 보인다. 써도 결과는 같지만
문서는 접두어 없는 레포 사본을 기준으로 한다. 필요 없으면 `/plugin uninstall humanize-korean@im-not-ai`.
