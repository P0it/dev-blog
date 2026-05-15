import { ArchiveView } from "@/components/page/ArchiveView";
import { getAllPosts, getCategoryGroups, localize } from "@/lib/queries";

export const revalidate = 60;

export default async function EnArchivePage() {
  const [posts, groups] = await Promise.all([getAllPosts(), getCategoryGroups()]);
  return (
    <ArchiveView
      locale="en"
      posts={posts.map((p) => localize(p, "en"))}
      groups={groups}
    />
  );
}
