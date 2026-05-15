export function EditorMarkdownPane() {
  return (
    <div className="editor-pane" style={{ padding: "24px 28px", overflow: "auto" }}>
      <div className="editor-line">
        <span className="md"># </span>
        <span className="h">Claude Code subprocess 패턴</span>
      </div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">
        <span className="md">&gt; </span>로컬 어드민에서 직접 CLI를 띄우면 launchd, websocket, 큐 전부 사라진다.
      </div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">
        <span className="md">## </span>
        <span className="h">왜 워커를 만들고 싶어지는가</span>
      </div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">&quot;AI 호출은 30초 걸리니까 큐로 빼야지.&quot; 자연스러운 첫 직관이다. 하지만</div>
      <div className="editor-line">이 직관은 보통 두 가정에 의존한다 — (1) 호출이 자주 일어나거나,</div>
      <div className="editor-line">(2) 호출자가 죽으면 안 된다는 가정.</div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">
        <span className="md">## </span>
        <span className="h">코드</span>
      </div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">
        <span className="md">```typescript</span>
      </div>
      <div className="editor-line">
        <span className="md">import</span> {"{ spawn }"} <span className="md">from</span> &quot;node:child_process&quot;;
      </div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">const claude = spawn(&quot;claude&quot;, [&quot;-p&quot;, prompt]);</div>
      <div className="editor-line">const draft = await collectStdout(claude);</div>
      <div className="editor-line">
        <span className="md">```</span>
      </div>
      <div className="editor-line">&nbsp;</div>
      <div className="editor-line">
        <span className="md">## </span>
        <span className="h">주의할 점</span>
      </div>
      <div className="editor-line">
        <span className="md">- </span>Mac이 꺼지면 어드민도 죽는다.
      </div>
      <div className="editor-line">
        <span className="md">- </span>긴 호출은 Next.js 핸들러 타임아웃에 걸린다.
      </div>
      <div className="editor-line">
        <span className="md">- </span>stdout 버퍼가 차면 hang한다. <span className="md">`</span>on(&apos;data&apos;)
        <span className="md">`</span>로 스트리밍해야 한다.
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 18,
            background: "var(--blue-600)",
            verticalAlign: "middle",
            marginLeft: 2,
            animation: "blink 1s steps(1) infinite",
          }}
        />
      </div>
    </div>
  );
}
