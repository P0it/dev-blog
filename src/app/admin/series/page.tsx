import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getAllSeries } from "@/lib/queries";
import { SeriesManager } from "@/components/admin/SeriesManager";

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  const series = await getAllSeries();

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
        <AdminSidebar active="series" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">묶음 관리</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            시리즈{" "}
            <span className="meta" style={{ fontWeight: 500 }}>
              ({series.length})
            </span>
          </h1>
          <SeriesManager series={series} />
        </div>
      </div>
    </>
  );
}
