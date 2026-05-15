import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CategoryTree } from "@/components/category/CategoryTree";
import { Thumb } from "@/components/diagram/Thumb";
import { Chip } from "@/components/ui/Chip";
import type { ThumbKind } from "@/lib/types";

const sampleBookNotes: { kind: ThumbKind; title: string; date: string; min: string }[] = [
  { kind: "a", title: "「일의 언어들」 — 일을 하는 사람에게 남고 싶은 문장들", date: "2026.05.02", min: "6분" },
  { kind: "b", title: "「함께 자라면」 — 관계의 단위는 둔이에서 팀으로", date: "2026.04.22", min: "9분" },
  { kind: "d", title: "「생각의 탄생」을 읽고 — 아이디어는 어떻게 생기는가", date: "2026.04.10", min: "7분" },
  { kind: "e", title: "「고든의 명상록」을 올해도 다시 읽었다", date: "2026.03.28", min: "5분" },
  { kind: "f", title: "「제자들이 적은 운어 읽기」 — 하루에 한 구절씩", date: "2026.03.14", min: "4분" },
];

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  await params;

  return (
    <>
      <PublicNav active="categories" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 8 }}>카테고리 / 독서</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>독서 노트</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 16, marginTop: 8, maxWidth: 640 }}>
          읽은 책과 그에 대한 메모. 흥미롭게 읽은 문장과, 읽고 난 뒤 남은 생각을 같이 적어둡니다.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 56,
            marginTop: 48,
          }}
        >
          <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
            <div className="t-overline" style={{ marginBottom: 12 }}>전체 카테고리</div>
            <CategoryTree activeChildSlug="notes" />
          </aside>

          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              <Chip variant="blue">일의-언어-한계</Chip>
              <Chip>생각의-탄생</Chip>
              <Chip>도교</Chip>
              <Chip>수필</Chip>
              <Chip>고전</Chip>
              <Chip>+6</Chip>
            </div>
            {sampleBookNotes.map((p, i) => (
              <div key={i} className="post-card">
                <div>
                  <div className="meta" style={{ marginBottom: 6 }}>
                    {p.date}
                    <span className="dot-sep" />
                    {p.min}
                  </div>
                  <h3>{p.title}</h3>
                  <p>
                    밑줄 그은 문장과 그 옆에 적은 짧은 메모를 같이 둡니다. 읽고 난 한참 뒤에 다시 돌아와보는 페이지.
                  </p>
                </div>
                <Thumb kind={p.kind} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
