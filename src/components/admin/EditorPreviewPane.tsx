export function EditorPreviewPane() {
  return (
    <div style={{ padding: "32px 36px", overflow: "auto", background: "var(--bg-base)" }}>
      <div className="prose">
        <h1 style={{ fontSize: 28, margin: "0 0 12px", lineHeight: 1.2 }}>
          Claude Code subprocess 패턴
        </h1>
        <blockquote style={{ margin: "0 0 24px" }}>
          로컬 어드민에서 직접 CLI를 띄우면 launchd, websocket, 큐 전부 사라진다.
        </blockquote>
        <h2 style={{ fontSize: 20, margin: "24px 0 12px" }}>왜 워커를 만들고 싶어지는가</h2>
        <p style={{ fontSize: 15 }}>
          &quot;AI 호출은 30초 걸리니까 큐로 빼야지.&quot; 자연스러운 첫 직관이다. 하지만 이 직관은 보통 두 가정에 의존한다.
        </p>
        <h2 style={{ fontSize: 20, margin: "24px 0 12px" }}>코드</h2>
        <div className="codeblock" style={{ margin: "12px 0" }}>
          <div className="codeblock-head">
            <span>typescript</span>
          </div>
          <div className="codeblock-body" style={{ padding: "12px 14px" }}>
            <div>
              <span className="tok-key">import</span> {"{ spawn }"}{" "}
              <span className="tok-key">from</span>{" "}
              <span className="tok-str">&quot;node:child_process&quot;</span>;
            </div>
            <div>&nbsp;</div>
            <div>
              <span className="tok-key">const</span> claude ={" "}
              <span className="tok-fn">spawn</span>(
              <span className="tok-str">&quot;claude&quot;</span>, [
              <span className="tok-str">&quot;-p&quot;</span>, prompt]);
            </div>
            <div>
              <span className="tok-key">const</span> draft ={" "}
              <span className="tok-key">await</span>{" "}
              <span className="tok-fn">collectStdout</span>(claude);
            </div>
          </div>
        </div>
        <h2 style={{ fontSize: 20, margin: "24px 0 12px" }}>주의할 점</h2>
        <ul>
          <li style={{ fontSize: 15 }}>Mac이 꺼지면 어드민도 죽는다.</li>
          <li style={{ fontSize: 15 }}>긴 호출은 Next.js 핸들러 타임아웃에 걸린다.</li>
          <li style={{ fontSize: 15 }}>stdout 버퍼가 차면 hang한다.</li>
        </ul>
      </div>
    </div>
  );
}
