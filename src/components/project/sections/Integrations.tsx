"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { resolveBrand } from "@/lib/tech-icons";
import type { IntegrationItem } from "@/lib/project-sections";

export type Integration = IntegrationItem;

// 링크는 카드에 보여야 값을 한다. 스킴과 www 만 떼고 주소를 그대로 세운다 —
// 어느 개발자센터·문서 페이지를 보고 붙였는지가 이 섹션의 신뢰다.
function linkLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

// 접힌 상태로는 로고·이름·용도 한 줄·링크·칩만 보인다.
// 무엇에 쓰는 물건인지가 먼저고, 적재·주의 같은 세부는 눌러야 나온다.
function Card({ item }: { item: Integration }) {
  const [open, setOpen] = useState(false);
  const brand = resolveBrand(item.name, item.icon);
  const hasDetails = item.details.length > 0;

  return (
    <div
      className={`lab-panel lab-integ-card${open ? " open" : ""}`}
      style={{ ["--tc-light" as string]: brand.light, ["--tc-dark" as string]: brand.dark }}
    >
      <div className="lab-integ-head">
        <span className="lab-integ-logo" aria-hidden="true">
          {brand.icon ? (
            <svg viewBox="0 0 24 24">
              <path d={brand.icon.path} />
            </svg>
          ) : (
            <i>{brand.letter}</i>
          )}
        </span>
        <span className="lab-integ-name">{item.name}</span>
      </div>

      {item.purpose && <p className="lab-integ-purpose">{item.purpose}</p>}

      {item.link && (
        <a className="lab-integ-link" href={item.link} target="_blank" rel="noreferrer" title={item.link}>
          <span>{linkLabel(item.link)}</span>
          <ExternalLink size={13} />
        </a>
      )}

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
