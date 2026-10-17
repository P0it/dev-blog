import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { AlgoSidebar } from "@/components/algo/AlgoSidebar";

/**
 * /algo 아래 모든 쪽이 같은 사이드바를 쓴다. 쪽을 옮겨도 사이드바는 다시 그려지지 않아
 * 접힘·검색어·스크롤 위치가 그대로 남는다.
 */
export default function AlgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav active="algo" />
      <div className="algo-shell">
        <AlgoSidebar />
        <div className="algo-main">{children}</div>
      </div>
      <Footer />
    </>
  );
}
