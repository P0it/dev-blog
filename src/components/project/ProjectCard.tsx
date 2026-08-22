import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link href={`/lab/${p.slug}`} className="lab-panel lab-card lab-reveal">
      <div className="lab-card-tile" style={{ background: p.logoBg }}>
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logoUrl} alt="" />
        ) : (
          <span aria-hidden>{p.logoEmoji}</span>
        )}
      </div>
      <div className="lab-card-body">
        <h3 className="lab-card-name">{p.name}</h3>
        {p.tagline && <p className="lab-card-tagline">{p.tagline}</p>}
      </div>
    </Link>
  );
}
