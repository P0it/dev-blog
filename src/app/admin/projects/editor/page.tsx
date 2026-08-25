import { ProjectEditor, type ProjectEditorInitial } from "@/components/admin/ProjectEditor";
import { getProjectBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProjectEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  // draft 도 편집해야 하므로 includeDrafts.
  const project = slug ? await getProjectBySlug(slug, true) : null;

  const initial: ProjectEditorInitial = project
    ? {
        originalSlug: project.slug,
        slug: project.slug,
        name: project.name,
        year: project.year,
        tagline: project.tagline,
        logoUrl: project.logoUrl ?? "",
        logoBg: project.logoBg,
        status: project.status,
        url: project.url ?? "",
        host: project.host,
        platform: project.platform,
        stack: project.stack,
        bodyMd: project.body,
        visibility: project.visibility,
      }
    : {
        originalSlug: null,
        slug: "",
        name: "",
        year: String(new Date().getFullYear()),
        tagline: "",
        logoUrl: "",
        logoBg: "#1B1C1E",
        status: "실험중",
        url: "",
        host: "none",
        platform: "mobile",
        stack: [],
        bodyMd: "",
        visibility: "draft",
      };

  return <ProjectEditor initial={initial} />;
}
