import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { getAllPostsForAdmin } from "@/lib/queries";
import { PostsList } from "@/components/admin/PostsList";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <>
      <AdminTopbar>
        <Link href="/admin/editor">
          <Button variant="primary" size="sm">
            <Plus size={14} />새 글
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
        <AdminSidebar active="posts" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">글 관리</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            글 <span className="meta" style={{ fontWeight: 500 }}>({posts.length})</span>
          </h1>
          <PostsList posts={posts} />
        </div>
      </div>
    </>
  );
}
