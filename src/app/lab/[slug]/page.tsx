import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjectSlugs, getProjectBySlug } from "@/lib/queries";
import { ProjectDetailView } from "@/components/page/ProjectDetailView";
import { SITE } from "@/lib/site";
import { projectJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  const url = `${SITE.url}/lab/${project.slug}`;
  return {
    title: project.name,
    description: project.tagline || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: project.name,
      description: project.tagline || undefined,
    },
    twitter: { card: "summary_large_image", title: project.name, description: project.tagline || undefined },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const crumbs = [
    { name: SITE.name, path: "/" },
    { name: "실험실", path: "/lab" },
    { name: project.name, path: `/lab/${project.slug}` },
  ];

  return (
    <>
      <JsonLd data={[projectJsonLd(project), breadcrumbJsonLd(crumbs)]} />
      <ProjectDetailView project={project} />
    </>
  );
}
