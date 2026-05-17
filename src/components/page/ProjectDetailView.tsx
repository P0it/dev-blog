import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { PostBody } from "@/components/post/PostBody";
import { extractToc } from "@/lib/markdown";
import type { Project } from "@/lib/types";

export function ProjectDetailView({ project }: { project: Project }) {
  const toc = extractToc(project.body);

  return (
    <>
      <PublicNav active="lab" />
      <div className="container-wide" style={{ paddingTop: 56 }}>
        <div className="post-layout">
          <div style={{ maxWidth: 720, justifySelf: "end", width: "100%" }}>
            <Link
              href="/lab"
              className="meta"
              style={{ display: "inline-block", marginBottom: 16, color: "var(--fg-primary)" }}
            >
              ← 실험실
            </Link>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Chip variant="blue">{project.year}</Chip>
            </div>
            <h1 className="prose post-title">{project.name}</h1>
            {project.desc && (
              <p style={{ fontSize: 17, color: "var(--fg-neutral)", lineHeight: 1.6, margin: "0 0 24px" }}>
                {project.desc}
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: "12px 16px",
                padding: "20px 0",
                borderTop: "1px solid var(--line-subtle)",
                borderBottom: "1px solid var(--line-subtle)",
              }}
            >
              <div className="t-overline" style={{ paddingTop: 2 }}>기획</div>
              <div style={{ fontSize: 14, color: "var(--fg-normal)", lineHeight: 1.6 }}>{project.plan}</div>
              <div className="t-overline" style={{ paddingTop: 2 }}>구현</div>
              <div style={{ fontSize: 14, color: "var(--fg-normal)", lineHeight: 1.6 }}>{project.build}</div>
            </div>

            {project.stack.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "20px 0" }}>
                {project.stack.map((s) => (
                  <Chip key={s}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s}</span>
                  </Chip>
                ))}
              </div>
            )}

            {project.url && (
              <a
                href={`https://${project.url}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--line-subtle)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--fg-strong)",
                  textDecoration: "none",
                  fontFamily: "var(--font-mono)",
                  marginBottom: 8,
                }}
              >
                <span>{project.url}</span>
                <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
              </a>
            )}
            <div className="meta" style={{ fontSize: 12, marginBottom: 32 }}>
              via {project.host === "vercel" ? "Vercel" : "Cloudflare Pages"}
            </div>

            <PostBody md={project.body} fallback="개발기 준비 중입니다." />
          </div>

          <aside className="post-toc">
            {toc.length > 0 && (
              <>
                <div className="t-overline" style={{ marginBottom: 12 }}>목차</div>
                <nav className="toc">
                  {toc.map((tt) => (
                    <a key={tt.id} href={`#${tt.id}`} className={tt.sub ? "sub" : ""}>
                      {tt.label}
                    </a>
                  ))}
                </nav>
              </>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
