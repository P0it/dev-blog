// HTML 페이지 글에 아이콘 스프라이트를 넣는다. 원고가 쓰는 <use href="#i-<id>"> 만 골라
// <symbol> 로 굽고, 원고의 <!--ICONS--> 자리(또는 이미 넣어 둔 <svg class="pg-icons">)를 바꾼다.
//   npm run icons -- auto-drafts/posts/<slug>.html
//
// 출처(전부 devDependency, 라이선스는 각 패키지):
//   Lucide(ISC)            — 일반 아이콘. 아래 BRANDS 에 없는 id 는 lucide-static 에서 찾는다
//   Lobe Icons(MIT)        — AI 제품 로고(Claude·GPT·Gemini·LangGraph…)
//   Devicon(MIT)           — 개발 도구 로고(색 있는 원본)
//   Simple Icons(CC0)      — 그 밖의 로고(단색)
// 다크 모드에서 안 보이는 검은 로고는 단색판을 쓴다 — 단색판은 fill=currentColor 라 CSS color 로 칠한다.
// 새 로고가 필요하면 BRANDS 에 한 줄 더한다. 규약: POSTING.md 5-10.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const NM = join(process.cwd(), "node_modules");
const lobe = (f) => join(NM, "@lobehub/icons-static-svg/icons", f + ".svg");
const dev = (f) => join(NM, "devicon/icons", f.split("-")[0], f + ".svg");
const si = (f) => join(NM, "simple-icons/icons", f + ".svg");
const lucide = (f) => join(NM, "lucide-static/icons", f + ".svg");

const BRANDS = {
  claude: lobe("claude-color"), openai: lobe("openai"), gemini: lobe("gemini-color"), vllm: lobe("vllm-color"),
  ollama: lobe("ollama"), langgraph: lobe("langgraph"), langchain: lobe("langchain"), langsmith: lobe("langsmith"),
  langfuse: lobe("langfuse-color"), mcp: lobe("mcp"), openrouter: lobe("openrouter"), huggingface: lobe("huggingface-color"),
  deepseek: lobe("deepseek-color"), qwen: lobe("qwen-color"), mistral: lobe("mistral-color"), meta: lobe("meta-color"),
  slack: dev("slack-original"), postgresql: dev("postgresql-original"), redis: dev("redis-original"),
  jira: dev("jira-original"), fastapi: dev("fastapi-original"), grafana: dev("grafana-original"),
  elasticsearch: dev("elasticsearch-original"), chrome: dev("chrome-original"), docker: dev("docker-original"),
  kubernetes: dev("kubernetes-original"), python: dev("python-original"), kafka: dev("apachekafka-original"),
  prometheus: dev("prometheus-original"),
  github: si("github"), nextjs: si("nextdotjs"), opentelemetry: si("opentelemetry"), qdrant: si("qdrant"),
  kakaotalk: si("kakaotalk"), anthropic: si("anthropic"), googlecalendar: si("googlecalendar"),
};

function symbol(id) {
  const brand = BRANDS[id];
  const file = brand ?? lucide(id);
  if (!existsSync(file)) throw new Error(`아이콘을 찾을 수 없음: ${id} (${file}) — BRANDS 에 더하거나 Lucide 이름을 확인`);
  let s = readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/<\?xml[^>]*>/g, "").replace(/<title>[\s\S]*?<\/title>/g, "");
  const vb = s.match(/viewBox="([^"]+)"/)[1];
  let inner = s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/\s+/g, " ").trim();
  // 그라디언트·클립 id 가 아이콘끼리 겹치지 않게 접두어
  inner = inner.replace(/id="([^"]+)"/g, `id="${id}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`).replace(/href="#([^"]+)"/g, `href="#${id}-$1"`);
  if (!brand) inner = `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
  else if (file.includes("simple-icons") || (file.includes("lobehub") && !file.includes("-color"))) inner = `<g fill="currentColor">${inner}</g>`;
  return `<symbol id="i-${id}" viewBox="${vb}">${inner}</symbol>`;
}

const page = process.argv[2];
if (!page) { console.error("사용법: npm run icons -- <page.html>"); process.exit(1); }
let html = readFileSync(page, "utf8");
// 자리표시는 한 줄에 혼자 있어야 한다 — 설명 주석 속 글자를 잘못 바꾸지 않게
const block = /^[ \t]*(?:<!--ICONS-->|<svg class="pg-icons"[\s\S]*?<\/defs><\/svg>)[ \t]*$/m;
if (!block.test(html)) { console.error("원고에 자리표시 줄(<!--ICONS-->)이 없다 — 본문 맨 앞에 한 줄로 넣는다"); process.exit(1); }
const body = html.replace(block, "");
const used = [...new Set([...body.matchAll(/href="#i-([a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
const sprite = `<svg class="pg-icons" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>\n${used.map(symbol).join("\n")}\n</defs></svg>`;
writeFileSync(page, html.replace(block, sprite));
console.log(`✓ 아이콘 ${used.length}개 (${Math.round(sprite.length / 1024)}KB): ${used.join(", ")}`);
