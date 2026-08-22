import Link from "next/link";
import { SquarePen } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { getAllProjectsForAdmin } from "@/lib/queries";
import { ProjectsList } from "@/components/admin/ProjectsList";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <>
      <AdminTopbar>
        <Link href="/admin/projects/editor">
          <Button variant="primary" size="sm">
            <SquarePen size={14} />새 프로젝트
          </Button>
        </Link>
      </AdminTopbar>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        <AdminSidebar active="projects" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">실험실 관리</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            실험실 <span className="meta" style={{ fontWeight: 500 }}>({projects.length})</span>
          </h1>
          <ProjectsList projects={projects} />
        </div>
      </div>
    </>
  );
}
