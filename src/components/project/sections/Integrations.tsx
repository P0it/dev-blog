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

/**
 * 카드는 로고·이름·용도 한 줄·링크까지만 세우고, 세부는 **올리면 아래로 덮으며** 나온다.
 *
 * 접은 안이 둘 있다.
 *  - 제자리 펼침: 그리드 한 줄의 높이는 가장 큰 칸이 정한다. 하나를 펼치면 옆 카드가
 *    같이 늘어나 빈 상자가 됐다.
 *  - 확대 창(모달): 훑어 내리며 가볍게 보는 자리인데 화면이 전환되는 느낌이라 흐름이 끊겼다.
 *
 * 그래서 세부 판은 흐름 밖(absolute)에 두고 이웃 카드 위를 덮는다. 레이아웃은 그대로다.
 */
function Card({ item }: { item: Integration }) {
  const [open, setOpen] = useState(false);
  const brand = resolveBrand(item.name, item.icon);
  const rows = item.details;
  const hasDetails = rows.length > 0;

  return (
    <div
      className={`lab-panel lab-integ-card${open && hasDetails ? " open" : ""}`}
      style={{ ["--tc-light" as string]: brand.light, ["--tc-dark" as string]: brand.dark }}
      // 포인터가 있는 기기에서는 올리는 것만으로 열린다. 세부 판은 이 카드의 자손이라
      // 판 위로 마우스가 옮겨 가도 leave 가 나지 않는다.
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
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
          // 손가락·키보드에는 hover 가 없다. 같은 판을 눌러서도 여닫는다.
          <button
            type="button"
            className="lab-integ-more"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            onFocus={() => setOpen(true)}
          >
            자세히
            <ChevronDown size={14} className="chev" />
          </button>
        )}
      </div>

      {hasDetails && (
        <div className="lab-integ-pop" aria-hidden={!open}>
          <dl className="lab-integ-rows">
            {rows.map((f, i) => (
              <div key={i} className="lab-integ-row">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
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
