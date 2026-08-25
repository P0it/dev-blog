// projects.body_md → 타입이 붙은 섹션 배열.
//
// 이 파서는 절대 예외를 던지지 않는다. 다른 레포의 Claude 세션이 규약을 어긴
// 마크다운을 넘겨도 페이지는 살아 있어야 하므로, 형식이 어긋난 섹션은 raw 로
// 떨어뜨려 일반 마크다운으로 렌더한다.

// 데이터와 API 한 항목. 카드는 접힌 상태로 `용도` 한 줄과 칩만 보여주고,
// 나머지 라벨은 펼쳤을 때 나온다. 무엇에 쓰는지가 먼저고 세부는 뒤로 뺀 것이다.
export type IntegrationItem = {
  name: string;
  /** `**아이콘** Naver` 로 준 브랜드 힌트. 없으면 이름에서 찾는다 */
  icon: string | null;
  /** `**용도**` — 이 서비스를 무엇에 쓰는지 한 줄 */
  purpose: string;
  /** `**링크**` — 카드에 세우는 바깥 링크 */
  link: string;
  /** 용도·아이콘·링크를 뺀 나머지 라벨 전부. 원고 순서 그대로, 확대 창에서만 보인다 */
  details: { label: string; value: string }[];
};

export type Section =
  | { kind: "intro"; title: string; md: string }
  | { kind: "plan"; title: string; fields: { label: string; values: string[] }[] }
  | {
      kind: "userflow";
      title: string;
      diagram: string | null;
      steps: { label: string; md: string; branches: { when: string; then: string }[] }[];
    }
  | { kind: "requirements"; title: string; items: { done: boolean; text: string }[] }
  | { kind: "tech"; title: string; items: string[] }
  | { kind: "journey"; title: string; steps: { label: string; md: string; added: string[] }[] }
  | { kind: "architecture"; title: string; diagram: string | null; steps: { label: string; md: string }[] }
  | { kind: "integrations"; title: string; items: IntegrationItem[] }
  | { kind: "demo"; title: string; clips: { title: string; src: string; poster: string | null; caption: string }[] }
  | { kind: "screens"; title: string; shots: { title: string; src: string; caption: string }[] }
  | { kind: "trials"; title: string; cases: { title: string; symptom: string; attempt: string; result: string }[] }
  | { kind: "remaining"; title: string; items: string[]; md: string }
  | { kind: "raw"; title: string; md: string };

// 규약이 정한 제목 → 렌더러 종류. 여기 없는 제목은 raw 로 간다.
const KNOWN: Record<string, Section["kind"]> = {
  "제품 소개": "intro",
  "화면": "screens",
  "기획": "plan",
  "유저 플로우": "userflow",
  "유저 플로": "userflow",
  "구상": "requirements",
  "요구사항": "requirements",
  "기술 선정": "tech",
  "기술 스택": "tech",
  "개발 과정": "journey",
  "데이터와 API": "integrations",
  // 규약에서 뺀 섹션이다. 화면 갤러리가 영상도 같은 자리에 그린다.
  // 옛 원고가 들고 와도 깨지지 않게 파서·렌더러는 남겨 둔다.
  "시연": "demo",
  "구조": "architecture",
  "시행착오": "trials",
  "남은 것": "remaining",
};

// 레일 링크와 섹션 id 가 같은 값을 쓰도록 한 곳에서 만든다.
// 한글 제목을 그대로 앵커로 쓰면 URL 인코딩돼 지저분해지므로 인덱스를 쓴다.
export function sectionAnchor(index: number, _title: string): string {
  return `sec-${index + 1}`;
}

// 코드펜스 안의 줄을 헤딩으로 오인하지 않도록, 펜스 밖 여부를 함께 돌려준다.
function* walk(md: string): Generator<{ line: string; inFence: boolean }> {
  let fence: string | null = null;
  for (const line of md.split("\n")) {
    const m = /^(\s*)(`{3,}|~{3,})/.exec(line);
    if (m) {
      const mark = m[2][0];
      if (fence === null) fence = mark;
      else if (fence === mark) fence = null;
      yield { line, inFence: true };
      continue;
    }
    yield { line, inFence: fence !== null };
  }
}

type Block = { title: string; body: string };

// `## 제목` 기준으로 자른다. 첫 `##` 앞의 머리말은 title 없는 블록이 된다.
function splitBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  let title = "";
  let buf: string[] = [];
  const flush = () => {
    const body = buf.join("\n").trim();
    if (title || body) blocks.push({ title, body });
    buf = [];
  };
  for (const { line, inFence } of walk(md)) {
    const h = !inFence ? /^##\s+(.+?)\s*$/.exec(line) : null;
    if (h) {
      flush();
      title = h[1].trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

// `### 제목` 기준으로 다시 자른다 (구조의 단계, 시행착오의 케이스).
function splitSubs(body: string): { label: string; md: string }[] {
  const out: { label: string; md: string }[] = [];
  let label: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (label !== null) out.push({ label, md: buf.join("\n").trim() });
    buf = [];
  };
  for (const { line, inFence } of walk(body)) {
    const h = !inFence ? /^###\s+(.+?)\s*$/.exec(line) : null;
    if (h) {
      flush();
      label = h[1].trim();
    } else if (label !== null) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

// `- 항목` / `* 항목` 을 뽑는다. 체크박스가 붙은 줄은 구상의 몫이라 건너뛴다.
function parseBullets(body: string): string[] {
  const out: string[] = [];
  for (const { line, inFence } of walk(body)) {
    if (inFence) continue;
    const m = /^\s*[-*+]\s+(.+?)\s*$/.exec(line);
    if (!m || /^\[[ xX]\]/.test(m[1])) continue;
    const t = stripMd(m[1]);
    if (t) out.push(t);
  }
  return out;
}

function parseChecklist(body: string): { done: boolean; text: string }[] {
  const items: { done: boolean; text: string }[] = [];
  for (const { line, inFence } of walk(body)) {
    if (inFence) continue;
    const m = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/.exec(line);
    if (m) items.push({ done: m[1].toLowerCase() === "x", text: m[2].trim() });
  }
  return items;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

const DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function parseTable(body: string): { head: string[]; rows: string[][] } | null {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 3) return null;
  if (!DIVIDER.test(lines[1])) return null;
  const head = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow).filter((r) => r.some((c) => c !== ""));
  if (!rows.length) return null;
  return { head, rows };
}

// 기술 이름만 뽑는다. 표(옛 규약, 첫 열이 기술 이름)·불릿·쉼표 나열을 모두 받는다.
// 고른 이유는 더 이상 화면에 쓰지 않지만, 옛 원고가 표로 남아 있어도 이름은 살린다.
function parseTechNames(body: string): string[] {
  const table = parseTable(body);
  if (table) {
    // 옛 규약은 `후보 | 고른 것 | 이유` 3열이었다. 그 경우 이름은 둘째 열에 있다.
    const picked = table.head.findIndex((h) => /고른\s*것|선택/.test(h));
    const col = picked >= 0 ? picked : 0;
    return dedupe(table.rows.map((r) => stripMd(r[col] ?? "")).filter(Boolean));
  }

  const out: string[] = [];
  for (const { line, inFence } of walk(body)) {
    if (inFence) continue;
    const text = line.trim();
    if (!text) continue;
    // `- Next.js` / `* Next.js` / `1. Next.js` / `Next.js, React`
    const item = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(text);
    const raw = item ? item[1] : text;
    for (const part of raw.split(/[,·・]/)) {
      const name = stripMd(part);
      // 이유를 덧붙인 줄이 섞여 있으면 앞쪽 이름만 취한다.
      const head = name.split(/\s+[—–-]\s+/)[0].trim();
      if (head) out.push(head);
    }
  }
  return dedupe(out);
}

// 굵게·코드·링크 표기를 벗겨 이름만 남긴다.
function stripMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function dedupe(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

// 유저 플로우의 한 단계. `**갈라짐** 괜찮다 → 발행 / 아쉽다 → 다시 요청` 을 떼어낸다.
// 화살표는 `→` 와 `->` 를, 갈래 구분은 `/` 를 받는다.
function parseFlowStep(label: string, md: string) {
  const branches: { when: string; then: string }[] = [];
  const kept: string[] = [];
  for (const { line, inFence } of walk(md)) {
    const m = !inFence ? /^\s*(?:\*\*갈라짐\*\*|갈라짐)\s*[:：]?\s*(.*)$/.exec(line) : null;
    if (!m) {
      kept.push(line);
      continue;
    }
    for (const part of m[1].split("/")) {
      const [when, ...rest] = part.split(/\s*(?:→|->)\s*/);
      const then = rest.join(" → ").trim();
      if (when.trim() && then) branches.push({ when: stripMd(when), then: stripMd(then) });
    }
  }
  return { label, md: kept.join("\n").trim(), branches };
}

// 개발 과정의 한 단계. 서술은 그대로 두고, `**붙인 것**` 줄만 떼어 칩으로 돌린다.
function parseJourneyStep(label: string, md: string) {
  // `### 1. 제목` 의 앞머리 번호는 뗀다. 화면이 이미 순번을 그린다.
  const title = label.replace(/^\s*\d+\s*[.)]\s*/, "").trim() || label;
  const added: string[] = [];
  const kept: string[] = [];
  for (const { line, inFence } of walk(md)) {
    const m = !inFence ? /^\s*(?:\*\*붙인\s*것\*\*|붙인\s*것)\s*[:：]?\s*(.*)$/.exec(line) : null;
    if (m) {
      for (const part of m[1].split(/[,·・]/)) {
        const name = stripMd(part);
        if (name) added.push(name);
      }
      continue;
    }
    kept.push(line);
  }
  return { label: title, md: kept.join("\n").trim(), added: dedupe(added) };
}

function extractMermaid(body: string): { diagram: string | null; rest: string } {
  const m = /```mermaid\s*\n([\s\S]*?)```/.exec(body);
  if (!m) return { diagram: null, rest: body };
  return { diagram: m[1].trim(), rest: body.replace(m[0], "").trim() };
}

// `**라벨** 값` 형태의 줄을 순서대로 모은다. 라벨 이름을 미리 정하지 않아
// 프로젝트마다 필요한 항목(제공처·링크·방식·적재·주의)을 자유롭게 쓸 수 있다.
function parseFields(md: string): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const { line, inFence } of walk(md)) {
    if (inFence) continue;
    const m = /^\s*(?:\*\*(.+?)\*\*|([^:：]{1,12})\s*[:：])\s*(.*)$/.exec(line);
    if (!m) continue;
    const label = (m[1] ?? m[2] ?? "").trim();
    const value = (m[3] ?? "").replace(/^\s*[-–—]\s*/, "").trim();
    if (!label || !value) continue;
    out.push({ label, value });
  }
  return out;
}

// 라벨을 자리별로 가른다. 카드에 나오는 건 용도 한 줄과 링크뿐이고, 방식·갱신·적재·주의
// 같은 나머지 라벨은 전부 확대 창으로 내려간다. 한때 방식·갱신을 칩으로 세웠지만,
// 값이 죄다 한 문장 이상이라 칩 안에서 잘려 아무 정보도 주지 못했다.
// 용도가 없으면 첫 라벨 값을 대신 세운다 — 카드 머리가 비면 무엇에 쓰는지 알 수 없다.

function parseIntegration(
  name: string,
  fields: { label: string; value: string }[],
): IntegrationItem | null {
  if (!fields.length) return null;
  const item: IntegrationItem = { name, icon: null, purpose: "", link: "", details: [] };
  const rest: { label: string; value: string }[] = [];
  for (const f of fields) {
    if (f.label === "용도" && !item.purpose) item.purpose = f.value;
    else if (f.label === "아이콘" && !item.icon) item.icon = f.value;
    else if (f.label === "링크" && !item.link && /^https?:\/\//.test(f.value)) item.link = f.value;
    else rest.push(f);
  }
  if (!item.purpose) {
    const first = rest.shift() ?? null;
    item.purpose = first?.value ?? "";
  }
  item.details = rest;
  return item.purpose || item.details.length ? item : null;
}

// `**증상** …` / `증상: …` 두 표기를 모두 받는다. 라벨이 하나도 없으면
// 본문 전체를 증상에 넣어, 최소한 내용이 화면에서 사라지지 않게 한다.
function parseCase(label: string, md: string) {
  const pick = (name: string): string => {
    const re = new RegExp(`^\\s*(?:\\*\\*${name}\\*\\*|${name})\\s*[:：]?\\s*(.*)$`);
    const lines = md.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = re.exec(lines[i]);
      if (!m) continue;
      // `**증상** — 내용` 처럼 라벨 뒤에 대시를 쓰는 표기가 흔하다. 대시는 뗀다.
      const rest: string[] = [m[1].replace(/^\s*[-–—]\s*/, "").trim()];
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].trim()) break;
        rest.push(lines[j].trim());
      }
      return rest.join(" ").trim();
    }
    return "";
  };
  const symptom = pick("증상");
  const attempt = pick("시도");
  const result = pick("결론");
  return {
    title: label,
    symptom: symptom || (!attempt && !result ? md.trim() : ""),
    attempt,
    result,
  };
}

export function parseProjectBody(md: string): Section[] {
  if (!md || !md.trim()) return [];
  const out: Section[] = [];

  for (const block of splitBlocks(md)) {
    const { title, body } = block;

    // 첫 `##` 앞 머리말 — 제품 소개로 흡수한다.
    if (!title) {
      if (body) out.push({ kind: "intro", title: "제품 소개", md: body });
      continue;
    }

    const kind = KNOWN[title];
    const raw: Section = { kind: "raw", title, md: body };

    if (kind === "intro") {
      out.push({ kind, title, md: body });
    } else if (kind === "remaining") {
      // 불릿을 뽑아 전용 목록으로 그린다. 전역 리셋이 list-style 을 죽여 놔서
      // 마크다운 그대로 두면 마커 없는 줄글로 보인다.
      out.push({ kind, title, items: parseBullets(body), md: body });
    } else if (kind === "requirements") {
      const items = parseChecklist(body);
      out.push(items.length ? { kind, title, items } : raw);
    } else if (kind === "tech") {
      const items = parseTechNames(body);
      out.push(items.length ? { kind, title, items } : raw);
    } else if (kind === "plan") {
      // 같은 라벨이 여러 번 나오는 게 정상이다 — 문제도 셋, 넣지 않은 것도 다섯.
      // 라벨을 줄마다 반복하면 표가 지저분해지므로 처음 나온 순서대로 묶는다.
      const grouped: { label: string; values: string[] }[] = [];
      for (const f of parseFields(body)) {
        const hit = grouped.find((g) => g.label === f.label);
        if (hit) hit.values.push(f.value);
        else grouped.push({ label: f.label, values: [f.value] });
      }
      out.push(grouped.length ? { kind, title, fields: grouped } : raw);
    } else if (kind === "userflow") {
      // 단계를 쓰면 전용 렌더러로 그린다. mermaid 만 있는 옛 원고는 그림으로 떨어진다.
      const { diagram, rest } = extractMermaid(body);
      const steps = splitSubs(rest).map((sub) => parseFlowStep(sub.label, sub.md));
      out.push(diagram || steps.length ? { kind, title, diagram, steps } : raw);
    } else if (kind === "journey") {
      const steps = splitSubs(body).map((sub) => parseJourneyStep(sub.label, sub.md));
      out.push(steps.length ? { kind, title, steps } : raw);
    } else if (kind === "architecture") {
      const { diagram, rest } = extractMermaid(body);
      const steps = splitSubs(rest);
      out.push(diagram || steps.length ? { kind, title, diagram, steps } : raw);
    } else if (kind === "integrations") {
      const items = splitSubs(body)
        .map((sub) => parseIntegration(sub.label, parseFields(sub.md)))
        .filter((it) => it !== null);
      out.push(items.length ? { kind, title, items } : raw);
    } else if (kind === "demo") {
      const clips = splitSubs(body)
        .map((sub) => {
          const f = parseFields(sub.md);
          const get = (name: string) => f.find((x) => x.label === name)?.value ?? "";
          return {
            title: sub.label,
            src: get("영상") || get("이미지") || get("파일"),
            poster: get("포스터") || null,
            caption: get("설명"),
          };
        })
        .filter((c) => c.src);
      out.push(clips.length ? { kind, title, clips } : raw);
    } else if (kind === "screens") {
      // 시연과 같은 모양으로 적는다 (`### 제목` + `**파일**`). 적재 스크립트가 로컬
      // 파일을 올리며 `**이미지**`/`**영상**` 으로 바꾸지만, 어드민에서 URL 을 직접
      // 적으면 `**파일**` 그대로다. 셋 다 받는다.
      const shots = splitSubs(body)
        .map((sub) => {
          const f = parseFields(sub.md);
          const get = (name: string) => f.find((x) => x.label === name)?.value ?? "";
          const src = get("이미지") || get("영상") || get("파일");
          return { title: sub.label, src, caption: get("설명") };
        })
        .filter((s) => s.src);
      out.push(shots.length ? { kind, title, shots } : raw);
    } else if (kind === "trials") {
      const subs = splitSubs(body);
      const cases = subs.map((s) => parseCase(s.label, s.md));
      out.push(cases.length ? { kind, title, cases } : raw);
    } else {
      out.push(raw);
    }
  }

  return out;
}

// 목록 카드에 쓸 대표 화면 — `## 화면` 의 첫 장이다.
//
// 카드가 폰 화면을 세로로 세워 보여주므로, 배포 사이트를 가로로 찍은 hero_poster
// 보다 이쪽이 맞다. 화면 섹션이 없으면 null 이고, 카드는 로고 타일로 떨어진다.
export function firstScreenSrc(body: string): string | null {
  for (const s of parseProjectBody(body)) {
    if (s.kind === "screens") return s.shots[0]?.src ?? null;
  }
  return null;
}

// 화면에 그릴 최종 섹션 목록.
//
// 기술 스택은 프런트매터 `stack` 이 소스다. 본문에 `## 기술 스택` 을 따로 쓰지 않아도
// 여기서 섹션 하나를 만들어 끼운다. 옛 원고처럼 본문에 표가 남아 있으면 그쪽을 쓴다.
export function buildProjectSections(body: string, stack: string[]): Section[] {
  const sections = parseProjectBody(body);
  const names = stack.map((s) => s.trim()).filter(Boolean);
  if (!names.length || sections.some((s) => s.kind === "tech")) return sections;

  const tech: Section = { kind: "tech", title: "기술 스택", items: names };
  // 화면 다음 자리다. 본문은 화면으로 열고, 무엇으로 만들었는지가 바로 받는다.
  // 화면이 없으면 소개 뒤(=본문 첫 섹션)로 간다. 소개는 히어로로 올라간다.
  const screens = sections.findIndex((s) => s.kind === "screens");
  const at = screens >= 0 ? screens + 1 : sections.findIndex((s) => s.kind === "intro") + 1;
  return [...sections.slice(0, at), tech, ...sections.slice(at)];
}

// 본문 옆 바로가기 버튼의 라벨. 링크가 데모 페이지를 가리키면 "체험"이라고 말해준다 —
// 같은 "사이트 바로가기"로 뭉뚱그리면 눌러보기 전까지 뭐가 열릴지 알 수 없다.
// 프런트매터에 라벨 필드를 따로 두지 않는 건, 지금까지 갈리는 경우가 이 하나뿐이라
// 컬럼을 늘릴 값어치가 없어서다. 경우가 늘면 그때 `url_label` 을 받는다.
export function projectCtaLabel(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (/(^|\/)demo(\/|$)/.test(path)) return "데모 체험하기";
  } catch {
    // 상대 경로·깨진 URL 은 기본 라벨로 둔다.
  }
  return "사이트 바로가기";
}
