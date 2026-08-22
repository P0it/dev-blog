import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { ProjectHero } from "@/components/project/ProjectHero";
import { SectionRail } from "@/components/project/SectionRail";
import { MarkdownView } from "@/components/post/MarkdownView";
import { Intro } from "@/components/project/sections/Intro";
import { Requirements } from "@/components/project/sections/Requirements";
import { TechChoices } from "@/components/project/sections/TechChoices";
import { Integrations } from "@/components/project/sections/Integrations";
import { Architecture } from "@/components/project/sections/Architecture";
import { Trials } from "@/components/project/sections/Trials";
import { Remaining } from "@/components/project/sections/Remaining";
import { parseProjectBody, sectionAnchor, type Section } from "@/lib/project-sections";
import type { Project } from "@/lib/types";

function renderSection(s: Section) {
  switch (s.kind) {
    case "intro":
      return <Intro md={s.md} />;
    case "requirements":
      return <Requirements items={s.items} />;
    case "tech":
      return <TechChoices head={s.head} rows={s.rows} />;
    case "integrations":
      return <Integrations items={s.items} />;
    case "architecture":
      return <Architecture diagram={s.diagram} steps={s.steps} />;
    case "trials":
      return <Trials cases={s.cases} />;
    case "remaining":
      return <Remaining md={s.md} />;
    default:
      return (
        <div className="lab-prose">
          <MarkdownView md={s.md} />
        </div>
      );
  }
}

export function ProjectDetailView({ project }: { project: Project }) {
  const sections = parseProjectBody(project.body);
  const rail = sections.map((s, i) => ({ id: sectionAnchor(i, s.title), label: s.title }));

  return (
    <>
      <PublicNav active="lab" />
      <ProjectHero project={project} />

      <div className="lab-page" style={{ paddingBottom: 96 }}>
        <div className="container-wide">
          <div className="lab-detail">
            <SectionRail items={rail} />
            <div style={{ minWidth: 0 }}>
              {sections.map((s, i) => (
                <section key={sectionAnchor(i, s.title)} id={sectionAnchor(i, s.title)}>
                  <div className="lab-section-head">
                    <span className="lab-label">
                      {String(i + 1).padStart(2, "0")} · {s.title}
                    </span>
                    <hr />
                  </div>
                  {renderSection(s)}
                </section>
              ))}
              {sections.length === 0 && (
                <p className="lab-prose" style={{ paddingTop: 56 }}>개발기 준비 중입니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
