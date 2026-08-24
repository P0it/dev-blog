import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/queries";
import { ProjectDetailView } from "@/components/page/ProjectDetailView";

// 발행 전 프로젝트를 실제 섹션 렌더러로 확인하는 자리.
//
// 에디터 오른쪽 창은 일반 마크다운 프리뷰라, `**이미지** <url>` 같은 규약 줄이
// 굵은 라벨과 링크로만 보인다. 화면 갤러리·기획 표·시행착오가 실제로 어떻게
// 그려지는지는 여기서 봐야 한다.
//
// /lab/<slug> 는 published 만 열기 때문에 draft 는 404 다. 여기는 includeDrafts 로 연다.
// 라우트가 /admin 아래라 proxy 가 이미 막고 있어서 별도 인증이 필요 없다.
export const dynamic = "force-dynamic";

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug, true);
  if (!project) notFound();

  return (
    <>
      <div className="admin-preview-bar">
        <strong>미리보기</strong>
        <span>
          {project.visibility === "published"
            ? "발행된 프로젝트다. 공개 화면과 같다."
            : "아직 draft 라 /lab 에는 안 뜬다. 어드민에서 발행해야 공개된다."}
        </span>
      </div>
      <ProjectDetailView project={project} />
    </>
  );
}
