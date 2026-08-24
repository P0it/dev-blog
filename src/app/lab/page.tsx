import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getProjects } from "@/lib/queries";

export const revalidate = 60;

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
