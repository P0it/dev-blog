"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { resolveBrand } from "@/lib/tech-icons";
import type { IntegrationItem } from "@/lib/project-sections";

export type Integration = IntegrationItem;

// 접힌 상태로는 로고·이름·용도 한 줄·칩만 보인다.
// 무엇에 쓰는 물건인지가 먼저고, 적재·주의 같은 세부는 눌러야 나온다.
function Card({ item }: { item: Integration }) {
  const [open, setOpen] = useState(false);
  const brand = resolveBrand(item.name, item.icon);
  const hasDetails = item.details.length > 0;

  return (
    <div className={`lab-panel lab-integ-card${open ? " open" : ""}`}>
      <div className="lab-integ-head">
        <span
          className="lab-integ-logo"
          style={{ ["--tc-light" as string]: brand.light, ["--tc-dark" as string]: brand.dark }}
          aria-hidden="true"
        >
          {brand.icon ? (
            <svg viewBox="0 0 24 24">
              <path d={brand.icon.path} />
            </svg>
          ) : (
            <i>{brand.letter}</i>
          )}
        </span>
        <span className="lab-integ-name">{item.name}</span>
        {item.link && (
          <a
            className="lab-integ-link"
            href={item.link}
            target="_blank"
            rel="noreferrer"
            aria-label={`${item.name} 문서 열기`}
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {item.purpose && <p className="lab-integ-purpose">{item.purpose}</p>}

      {(item.chips.length > 0 || hasDetails) && (
        <div className="lab-integ-foot">
          <div className="lab-integ-chips">
            {item.chips.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
          {hasDetails && (
            <button
              type="button"
              className="lab-integ-more"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "접기" : "자세히"}
              <ChevronDown size={15} className="chev" />
            </button>
          )}
        </div>
      )}

      {open && hasDetails && (
        <dl className="lab-integ-rows">
          {item.details.map((f, i) => (
            <div key={i} className="lab-integ-row">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function Integrations({ items }: { items: Integration[] }) {
  return (
    <div className="lab-integ lab-stagger">
      {items.map((it, i) => (
        <Card key={i} item={it} />
      ))}
    </div>
  );
}
