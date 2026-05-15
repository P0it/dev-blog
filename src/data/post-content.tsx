import { AgentLoopDiagram } from "@/components/diagram/AgentLoopDiagram";
import { CodeBlock, type CodeLine } from "@/components/post/CodeBlock";

const lines: CodeLine[] = [
  { n: 1, tokens: (<><span className="tok-key">import</span>{" "}{"{ spawn }"}{" "}<span className="tok-key">from</span>{" "}<span className="tok-str">&quot;node:child_process&quot;</span><span className="tok-pun">;</span></>) },
  { n: 2, tokens: <>&nbsp;</> },
  { n: 3, tokens: (<><span className="tok-key">export async function</span>{" "}<span className="tok-fn">POST</span>(req<span className="tok-pun">:</span> Request) {"{"}</>) },
  { n: 4, tokens: (<>{"  "}<span className="tok-key">const</span>{" "}{"{ urls, tone }"}{" "}<span className="tok-pun">=</span>{" "}<span className="tok-key">await</span> req.<span className="tok-fn">json</span>()<span className="tok-pun">;</span></>) },
  { n: 5, tokens: (<>{"  "}<span className="tok-key">const</span> content{" "}<span className="tok-pun">=</span>{" "}<span className="tok-key">await</span>{" "}<span className="tok-fn">extractContent</span>(urls)<span className="tok-pun">;</span></>) },
  { n: 6, tokens: <>&nbsp;</> },
  { n: 7, tokens: (<>{"  "}<span className="tok-com">{"// Claude Code as a subprocess — no API key needed"}</span></>) },
  { n: 8, tokens: (<>{"  "}<span className="tok-key">const</span> claude{" "}<span className="tok-pun">=</span>{" "}<span className="tok-fn">spawn</span>(<span className="tok-str">&quot;claude&quot;</span><span className="tok-pun">,</span> [<span className="tok-str">&quot;-p&quot;</span><span className="tok-pun">,</span> SYSTEM_PROMPT{" "}<span className="tok-pun">+</span> content])<span className="tok-pun">;</span></>) },
  { n: 9, tokens: (<>{"  "}<span className="tok-key">const</span> draft{" "}<span className="tok-pun">=</span>{" "}<span className="tok-key">await</span>{" "}<span className="tok-fn">collectStdout</span>(claude)<span className="tok-pun">;</span></>) },
  { n: 10, tokens: <>&nbsp;</> },
  { n: 11, tokens: (<>{"  "}<span className="tok-key">return</span> Response.<span className="tok-fn">json</span>({"{ draft }"})<span className="tok-pun">;</span></>) },
  { n: 12, tokens: <>{"}"}</> },
];

export const claudeSubprocessTOC = [
  { id: "intro", label: "한 줄 결론" },
  { id: "why", label: "왜 워커를 만들고 싶어지는가", active: true },
  { id: "structure", label: "구조" },
  { id: "code", label: "코드" },
  { id: "code-subprocess", label: "subprocess 호출", sub: true },
  { id: "code-streaming", label: "스트리밍 처리", sub: true },
  { id: "caveats", label: "주의할 점" },
];

export function ClaudeSubprocessBody() {
  return (
    <div className="prose" style={{ marginTop: 32 }}>
      <p id="intro">
        한 줄 결론: <strong>AI 호출은 가능하면 같은 프로세스 안에서 끝내라.</strong> 워커도, 큐도, 별도 서비스도 거의 항상 과한 답이다.
      </p>
      <h2 id="why">왜 워커를 만들고 싶어지는가</h2>
      <p>
        &quot;AI 호출은 30초 걸리니까 큐로 빼야지.&quot; 자연스러운 첫 직관이다. 하지만 이 직관은 보통 두 가정에 의존한다 — (1) 호출이 자주 일어나거나, (2) 호출자가 죽으면 안 된다는 가정. 1인 블로그 어드민에는 둘 다 해당하지 않는다.
      </p>
      <h2 id="structure">구조</h2>
      <p>다음 다이어그램이 전체 흐름이다. 사용자 입력에서 LLM, 도구, 관찰, 응답으로 이어지는 한 사이클.</p>

      <AgentLoopDiagram />

      <h2 id="code">코드</h2>
      <p>
        핵심은 한 줄. 로컬 Next.js 서버에서 child_process로 <code>claude</code> CLI를 띄운다.
      </p>

      <CodeBlock filename="app/admin/draft/route.ts" language="typescript" lines={lines} />

      <blockquote>
        &quot;최고의 인프라는 없는 인프라다.&quot;
        <br />
        운영해야 할 컴포넌트가 줄어들수록 사고할 거리가 줄어든다.
      </blockquote>

      <h2 id="caveats">주의할 점</h2>
      <ul>
        <li>Mac이 꺼지면 어드민도 죽는다 — 폰에서 글을 쓰지 않는다는 전제가 있어야 한다.</li>
        <li>긴 호출은 Next.js 핸들러 타임아웃에 걸린다. <code>maxDuration</code>을 늘려두자.</li>
        <li>stdout 버퍼가 차면 hang한다. <code>on(&apos;data&apos;)</code>로 스트리밍해야 한다.</li>
      </ul>
    </div>
  );
}
