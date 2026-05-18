import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getAllTagsForAdmin } from "@/lib/queries";
import { TagsManager } from "@/components/admin/TagsManager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAllTagsForAdmin();

  return (
    <>
      <AdminTopbar />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        <AdminSidebar active="tags" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">태그 관리</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            태그{" "}
            <span className="meta" style={{ fontWeight: 500 }}>
              ({tags.length})
            </span>
          </h1>
          <TagsManager tags={tags} />
        </div>
      </div>
    </>
  );
}
