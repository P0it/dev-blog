import Link from "next/link";
import type { CategoryGroup } from "@/lib/types";

export function CategoryTree({
  groups,
  activeChildSlug,
}: {
  groups: CategoryGroup[];
  activeChildSlug?: string;
}) {
  return (
    <div className="tree">
      {groups.map((g, i) => (
        <div key={g.slug} className="group" style={i > 0 ? { marginTop: 12 } : undefined}>
          <Link href={`/posts/c/${g.slug}`} className="node" style={{ color: "inherit", textDecoration: "none" }}>
            <span>
              {g.label} {g.expanded ? "▾" : "▸"}
            </span>
            <span className="count">{g.count}</span>
          </Link>
          {g.expanded && g.children.length > 0 && (
            <div className="child">
              {g.children.map((c) => (
                <Link
                  key={c.slug}
                  href={`/posts/c/${g.slug}/${c.slug}`}
                  className={`node ${activeChildSlug === c.slug ? "active" : ""}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <span>{c.label}</span>
                  <span className="count">{c.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
