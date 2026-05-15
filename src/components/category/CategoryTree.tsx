import { categoryGroups } from "@/data/categories";

export function CategoryTree({ activeChildSlug }: { activeChildSlug?: string }) {
  return (
    <div className="tree">
      {categoryGroups.map((g, i) => (
        <div key={g.slug} className="group" style={i > 0 ? { marginTop: 12 } : undefined}>
          <div className="node">
            <span>
              {g.label} {g.expanded ? "▾" : "▸"}
            </span>
            <span className="count">{g.count}</span>
          </div>
          {g.expanded && g.children.length > 0 && (
            <div className="child">
              {g.children.map((c) => (
                <div key={c.slug} className={`node ${activeChildSlug === c.slug ? "active" : ""}`}>
                  <span>{c.label}</span>
                  <span className="count">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
