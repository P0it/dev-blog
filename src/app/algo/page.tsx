import type { Metadata } from "next";
import Link from "next/link";
import { byCategory, registry } from "@/content/algo/registry";
import { SITE } from "@/lib/site";

const ready = registry.filter((e) => e.status === "ready").length;

export const metadata: Metadata = {
  title: "알고리즘",
  description: "직접 해 보면서 배우는 알고리즘. 코딩테스트에서 무엇을 왜 고르는지까지.",
  alternates: { canonical: `${SITE.url}/algo` },
};

export default function AlgoIndexPage() {
  return (
    <main className="algo-page algo-index">
      <p className="algo-crumb">알고리즘</p>
      <h1 className="algo-title">직접 해 보면서 배웁니다</h1>
      <p className="algo-lede">
        설명을 읽기 전에 먼저 해 봅니다. 그다음에 왜 그렇게 되는지 풀어 씁니다.
      </p>

      <p className="algo-index-count">
        <strong>{ready}편</strong> 공개 · 전체 {registry.length}편 준비 중
      </p>

      {[...byCategory()].map(([cat, rows]) => (
        <section key={cat} className="algo-index-group">
          <h2>{cat}</h2>
          <ul>
            {rows.map((e) =>
              e.status === "ready" ? (
                <li key={e.slug}>
                  <Link href={`/algo/${e.slug}`} className="algo-index-card">
                    <b>{e.title}</b>
                    <span>{e.lede}</span>
                  </Link>
                </li>
              ) : (
                <li key={e.slug}>
                  <div className="algo-index-card" data-planned>
                    <b>{e.title}</b>
                    <span>{e.lede}</span>
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </main>
  );
}
