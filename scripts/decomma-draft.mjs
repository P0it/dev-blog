// 연결어미 뒤 쉼표(POSTING.md 2-4 점검표 2번)를 기계적으로 뗀다.
//   npm run fix:commas -- drafts/<slug>.md
// title 줄·표·HTML/SVG 줄은 건드리지 않는다. 뗀 뒤에는 lint:draft 로 다시 센다.
import { readFileSync, writeFileSync } from "node:fs";
const p = process.argv[2];
const re = /(고|며|지만|면서|아서|어서|해서|라서|이라서|니까|는데|인데|은데), /g;
const out = readFileSync(p, "utf8").split("\n").map((l) =>
  l.startsWith("title:") || l.includes("<") || l.startsWith("|") ? l : l.replace(re, "$1 "),
);
writeFileSync(p, out.join("\n"));
console.log("✓", p);
