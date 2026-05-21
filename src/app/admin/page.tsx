import { redirect } from "next/navigation";

// 어드민 첫 화면은 글 목록 — 주 작업이 글쓰기이므로.
// 개요가 필요하면 사이드바 "대시보드"(/admin/dashboard).
export default function AdminIndexPage() {
  redirect("/admin/posts");
}
