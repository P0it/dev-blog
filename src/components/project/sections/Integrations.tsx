"use client";

import { useState } from "react";
import { ExternalLink, Maximize2 } from "lucide-react";
import { resolveBrand } from "@/lib/tech-icons";
import { LabModal } from "../LabModal";
import type { IntegrationItem } from "@/lib/project-sections";

export type Integration = IntegrationItem;

// 링크는 카드에 보여야 값을 한다. 스킴과 www 만 떼고 주소를 그대로 세운다 —
// 어느 개발자센터·문서 페이지를 보고 붙였는지가 이 섹션의 신뢰다.
function linkLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function Brand({ item, size }: { item: Integration; size: "sm" | "lg" }) {
  const brand = resolveBrand(item.name, item.icon);
  return (
    <span className={`lab-integ-logo${size === "lg" ? " lg" : ""}`} aria-hidden="true">
      {brand.icon ? (
        <svg viewBox="0 0 24 24">
          <path d={brand.icon.path} />
        </svg>
      ) : (
        <i>{brand.letter}</i>
      )}
    </span>
  );
}

function Card({ item }: { item: Integration }) {
  const [open, setOpen] = useState(false);
  const brand = resolveBrand(item.name, item.icon);
  const rows = item.details;
  const hasDetails = rows.length > 0;

  const brandVars = {
    ["--tc-light" as string]: brand.light,
    ["--tc-dark" as string]: brand.dark,
  };

  return (
    <>
      <div className="lab-panel lab-integ-card" style={brandVars}>
        {/* 카드 전체가 누를 자리다. 판을 덮는 버튼을 깔아 두면 카드 안의 링크가
            버튼 안에 중첩되지 않는다 — 버튼 속 링크는 마크업상 허용되지 않는다. */}
        {hasDetails && (
          <button
            type="button"
            className="lab-integ-hit"
            onClick={() => setOpen(true)}
            aria-label={`${item.name} 자세히 보기`}
          />
        )}

        <div className="lab-integ-head">
          <Brand item={item} size="sm" />
          <span className="lab-integ-name">{item.name}</span>
        </div>

        {item.purpose && <p className="lab-integ-purpose">{item.purpose}</p>}

        <div className="lab-integ-foot">
          {item.link ? (
            <a
              className="lab-integ-link"
              href={item.link}
              target="_blank"
              rel="noreferrer"
              title={item.link}
            >
              <span>{linkLabel(item.link)}</span>
              <ExternalLink size={13} />
            </a>
          ) : (
            <span />
          )}
          {hasDetails && (
            <span className="lab-integ-more">
              자세히
              <Maximize2 size={12} />
            </span>
          )}
        </div>
      </div>

      <LabModal open={open} onClose={() => setOpen(false)} label={item.name} className="lab-integ-modal">
        <div style={brandVars}>
          <div className="lab-integ-modal-head">
            <Brand item={item} size="lg" />
            <div>
              <h3>{item.name}</h3>
              {item.purpose && <p>{item.purpose}</p>}
            </div>
          </div>

          {item.link && (
            <a
              className="lab-integ-modal-link"
              href={item.link}
              target="_blank"
              rel="noreferrer"
            >
              <span>{linkLabel(item.link)}</span>
              <ExternalLink size={14} />
            </a>
          )}

          <dl className="lab-integ-rows">
            {rows.map((f, i) => (
              <div key={i} className="lab-integ-row">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </LabModal>
    </>
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
