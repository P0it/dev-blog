import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getCategoriesForAdmin } from "@/lib/queries";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesForAdmin();

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
        <AdminSidebar active="categories" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">분류 관리</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            카테고리{" "}
            <span className="meta" style={{ fontWeight: 500 }}>
              ({categories.length})
            </span>
          </h1>
          <CategoriesManager categories={categories} />
        </div>
      </div>
    </>
  );
}
