import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { ProjectHero } from "@/components/project/ProjectHero";
import { SectionRail } from "@/components/project/SectionRail";
import { MarkdownView } from "@/components/post/MarkdownView";
import { Intro } from "@/components/project/sections/Intro";
import { Requirements } from "@/components/project/sections/Requirements";
import { TechChoices } from "@/components/project/sections/TechChoices";
import { Plan } from "@/components/project/sections/Plan";
import { UserFlow } from "@/components/project/sections/UserFlow";
import { Journey } from "@/components/project/sections/Journey";
import { Integrations } from "@/components/project/sections/Integrations";
import { Demos } from "@/components/project/sections/Demos";
import { Architecture } from "@/components/project/sections/Architecture";
import { Trials } from "@/components/project/sections/Trials";
import { Remaining } from "@/components/project/sections/Remaining";
import { buildProjectSections, sectionAnchor, type Section } from "@/lib/project-sections";
import type { Project } from "@/lib/types";
import {
  BookOpen,
  ListChecks,
  Layers,
  Plug,
  PlayCircle,
  Network,
  Wrench,
  Flag,
  FileText,
  Route,
  Compass,
  Target,
} from "lucide-react";

// 섹션 종류마다 고정 아이콘. 이모지를 쓰지 않고 아이콘으로만 구분한다.
const SECTION_ICON: Record<Section["kind"], typeof BookOpen> = {
  intro: BookOpen,
  plan: Target,
  userflow: Compass,
  requirements: ListChecks,
  tech: Layers,
  journey: Route,
  integrations: Plug,
  demo: PlayCircle,
  architecture: Network,
  trials: Wrench,
  remaining: Flag,
  raw: FileText,
};

function renderSection(s: Section) {
  switch (s.kind) {
    case "intro":
      return <Intro md={s.md} />;
    case "requirements":
      return <Requirements items={s.items} />;
    case "tech":
      return <TechChoices items={s.items} />;
    case "plan":
      return <Plan fields={s.fields} />;
    case "userflow":
      return <UserFlow diagram={s.diagram} steps={s.steps} />;
    case "journey":
      return <Journey steps={s.steps} />;
    case "integrations":
      return <Integrations items={s.items} />;
    case "demo":
      return <Demos clips={s.clips} />;
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

function sectionIcon(kind: Section["kind"]) {
  const Icon = SECTION_ICON[kind];
  return <Icon size={17} />;
}

export function ProjectDetailView({ project }: { project: Project }) {
  const sections = buildProjectSections(project.body, project.stack);
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
                    <span className="icon">{sectionIcon(s.kind)}</span>
                    <h2>{s.title}</h2>
                    <hr />
                    <span className="lab-label">{String(i + 1).padStart(2, "0")}</span>
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
