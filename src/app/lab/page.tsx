import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/project/ProjectCard";
import type { Metadata } from "next";
import { getProjects } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "실험실",
  description: "직접 만들어 굴리고 있는 사이드 프로젝트 모음.",
  alternates: { canonical: `${SITE.url}/lab` },
  openGraph: {
    type: "website",
    url: `${SITE.url}/lab`,
    title: "실험실",
    description: "직접 만들어 굴리고 있는 사이드 프로젝트 모음.",
  },
};

export default async function LabPage() {
  const projects = await getProjects();

  return (
    <>
      <PublicNav active="lab" />
      <div className="lab-page" style={{ minHeight: "70vh", paddingTop: 28, paddingBottom: 72 }}>
        <div className="container-wide">
          <div className="lab-grid">
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} p={p} index={i} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
