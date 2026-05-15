import { ArchiveView } from "@/components/page/ArchiveView";
import { getAllPosts, getCategoryGroups } from "@/lib/queries";

export const revalidate = 60;

export default async function ArchivePage() {
  const [posts, groups] = await Promise.all([getAllPosts(), getCategoryGroups()]);
  return <ArchiveView locale="ko" posts={posts} groups={groups} />;
}
