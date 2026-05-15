import { HomeView } from "@/components/page/HomeView";
import { getFeaturedPosts, getRecentPosts, localize } from "@/lib/queries";

export const revalidate = 60;

export default async function EnHomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPosts(), getRecentPosts(6)]);
  return (
    <HomeView
      locale="en"
      featured={featured.map((p) => localize(p, "en"))}
      recent={recent.map((p) => localize(p, "en"))}
    />
  );
}
