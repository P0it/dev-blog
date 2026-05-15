import { HomeView } from "@/components/page/HomeView";
import { getFeaturedPosts, getRecentPosts } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPosts(), getRecentPosts(6)]);
  return <HomeView locale="ko" featured={featured} recent={recent} />;
}
