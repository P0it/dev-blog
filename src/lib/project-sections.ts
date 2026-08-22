// projects.body_md → 타입이 붙은 섹션 배열.
//
// 이 파서는 절대 예외를 던지지 않는다. 다른 레포의 Claude 세션이 규약을 어긴
// 마크다운을 넘겨도 페이지는 살아 있어야 하므로, 형식이 어긋난 섹션은 raw 로
// 떨어뜨려 일반 마크다운으로 렌더한다.

export type Section =
  | { kind: "intro"; title: string; md: string }
  | { kind: "requirements"; title: string; items: { done: boolean; text: string }[] }
  | { kind: "tech"; title: string; head: string[]; rows: string[][] }
  | { kind: "architecture"; title: string; diagram: string | null; steps: { label: string; md: string }[] }
  | { kind: "trials"; title: string; cases: { title: string; symptom: string; attempt: string; result: string }[] }
  | { kind: "remaining"; title: string; md: string }
  | { kind: "raw"; title: string; md: string };

// 규약이 정한 제목 → 렌더러 종류. 여기 없는 제목은 raw 로 간다.
const KNOWN: Record<string, Section["kind"]> = {
  "제품 소개": "intro",
  "요구사항": "requirements",
  "기술 선정": "tech",
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

function extractMermaid(body: string): { diagram: string | null; rest: string } {
  const m = /```mermaid\s*\n([\s\S]*?)```/.exec(body);
  if (!m) return { diagram: null, rest: body };
  return { diagram: m[1].trim(), rest: body.replace(m[0], "").trim() };
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
      const rest: string[] = [m[1].trim()];
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

    if (kind === "intro" || kind === "remaining") {
      out.push({ kind, title, md: body });
    } else if (kind === "requirements") {
      const items = parseChecklist(body);
      out.push(items.length ? { kind, title, items } : raw);
    } else if (kind === "tech") {
      const t = parseTable(body);
      out.push(t ? { kind, title, head: t.head, rows: t.rows } : raw);
    } else if (kind === "architecture") {
      const { diagram, rest } = extractMermaid(body);
      const steps = splitSubs(rest);
      out.push(diagram || steps.length ? { kind, title, diagram, steps } : raw);
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
