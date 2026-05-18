# AI 워커 셋업 (Mac mini)

서버(Vercel)의 어드민은 AI 작업을 Supabase `ai_jobs` 큐에 적재만 한다.
실제 생성/개선은 `claude` CLI가 설치된 머신에서 이 워커가 처리한다.
상시 켜진 Mac mini를 워커 머신으로 쓴다.

## 구조 (pull 모델)

```
태블릿/폰/PC → Vercel 어드민(비번) → Supabase(ai_jobs INSERT)
                                          ▲ outbound 폴링(~10s)
                      Mac mini 워커(launchd, --watch) → claude -p → 결과 UPDATE
```

Supabase가 Mac에 접속하지 않는다. Mac이 바깥으로 폴링한다 →
포트포워딩·인바운드·공유기 설정 전부 불필요. 집 NAT 뒤에서 그대로 동작.

## 1. 사전 준비 (Mac mini)

```bash
git clone <이 저장소> ~/dev-blog
cd ~/dev-blog
npm install
```

`.env.local` 생성 (서버 키와 동일):

```
NEXT_PUBLIC_SUPABASE_URL=https://wzaqtubtqwpddouevwbk.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
```

`claude` CLI(Claude Code) 설치 + 구독 로그인:

```bash
# 설치 방법은 Claude Code 공식 안내를 따른다
claude --version
claude            # 한 번 실행해 구독 계정으로 로그인해 둔다
```

YouTube 자막 추출용 `yt-dlp`:

```bash
brew install yt-dlp
```

## 2. 헤드리스 권한 스모크 테스트 (가장 중요)

`claude -p`가 비대화 모드에서 WebFetch/Bash를 실제로 쓸 수 있어야 한다.
워커는 `--permission-mode bypassPermissions`(모든 권한 우회)를 쓴다.
`acceptEdits`는 파일 편집만 자동 승인이라 WebFetch/Bash에서 멈춘다.

```bash
echo "https://www.anthropic.com/news 를 WebFetch로 열어 한 줄로 요약해줘" \
  | claude -p --permission-mode bypassPermissions
```

- 정상 요약이 나오면 OK.
- 정책상 bypass가 곤란하면 `claude --help`로 대안을 확인해
  `CLAUDE_ARGS` 환경변수로 워커 동작을 덮어쓴다(워커가 이 값을 우선 사용).

```bash
# 예: 대안 플래그
export CLAUDE_ARGS="-p --dangerously-skip-permissions"
```

YouTube 경로도 한 번:

```bash
echo "이 영상 핵심을 정리해줘: https://youtu.be/<id> (Bash로 yt-dlp 자막 추출)" \
  | claude -p --permission-mode bypassPermissions
```

## 3. 워커 수동 실행 확인

```bash
npm run ai:worker          # 대기 job 전부 처리 후 종료
npm run ai:worker -- --watch   # 상시 폴링
```

어드민에서 "URL로 초안"을 하나 넣고 위를 돌려, draft 본문이
POSTING.md 형식(인용구·문어체 헤드라인·참고자료/저작권)으로 채워지는지 본다.

## 4. 상시 서비스 등록 (launchd)

`~/Library/LaunchAgents/blog.ai-worker.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>blog.ai-worker</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>cd ~/dev-blog && npm run ai:worker -- --watch</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/blog-ai-worker.log</string>
  <key>StandardErrorPath</key><string>/tmp/blog-ai-worker.err</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/blog.ai-worker.plist
# 로그 확인
tail -f /tmp/blog-ai-worker.log
# 해제
launchctl unload ~/Library/LaunchAgents/blog.ai-worker.plist
```

`bash -lc`로 로그인 셸을 거쳐 node/npm PATH를 잡는다. `~/dev-blog`는 실제 클론 경로로.

## 5. 일일 백업 (선택, 권장)

콘텐츠 전체를 매일 JSON으로 덤프해 **별도 비공개 git 레포**에 push한다.
(메인 저장소 기본 위치 `backups/`는 `.gitignore`됨 — 공개 레포 유출 방지.)

별도 비공개 레포를 클론해 두고:

```bash
git clone <비공개-백업-레포> ~/blog-backups
```

`~/Library/LaunchAgents/blog.backup.plist` (매일 04:00):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>blog.backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>cd ~/dev-blog && BACKUP_DIR=~/blog-backups npm run backup && cd ~/blog-backups && git add -A && git commit -m "backup $(date +%F)" && git push</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/tmp/blog-backup.log</string>
  <key>StandardErrorPath</key><string>/tmp/blog-backup.err</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/blog.backup.plist
```

복원: 백업 JSON의 `tables.*`를 기존 seed 패턴(`scripts/seed.mjs`)처럼
`upsert`로 되돌리면 된다.

## 트러블슈팅

- **job이 계속 pending**: 워커 미실행 또는 폴링 실패. `/tmp/blog-ai-worker.log` 확인.
- **job이 error**: 어드민 설정 페이지(또는 ai_jobs.result)에서 메시지 확인.
  대개 헤드리스 권한 또는 yt-dlp 미설치/자막 없음.
- **긴 본문 개선이 실패**: 프롬프트는 stdin으로 전달하므로 argv 한계는 아님.
  `JOB_TIMEOUT_MS`를 늘려본다(기본 600000).
