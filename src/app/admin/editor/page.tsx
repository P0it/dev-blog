import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { AIDraftBanner } from "@/components/admin/AIDraftBanner";
import { EditorMetaPanel } from "@/components/admin/EditorMetaPanel";
import { EditorMarkdownPane } from "@/components/admin/EditorMarkdownPane";
import { EditorPreviewPane } from "@/components/admin/EditorPreviewPane";
import { AIDraftModal } from "@/components/admin/AIDraftModal";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ ai?: string }>;
}) {
  const sp = await searchParams;
  const aiOpen = sp.ai === "1";

  return (
    <>
      <AdminTopbar>
        <span className="meta">저장됨 · 3분 전</span>
        <Button variant="ghost" size="sm">미리보기</Button>
        <Button variant="outline" size="sm">임시 저장</Button>
        <Button variant="primary" size="sm">발행</Button>
      </AdminTopbar>
      <AIDraftBanner />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr 1fr",
          height: "calc(100vh - 56px - 38px)",
        }}
      >
        <EditorMetaPanel />
        <EditorMarkdownPane />
        <EditorPreviewPane />
      </div>
      {aiOpen && <AIDraftModal />}
    </>
  );
}
