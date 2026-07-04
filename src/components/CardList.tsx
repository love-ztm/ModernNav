import React from "react";
import { ChevronRight } from "lucide-react";
import { LinkItem } from "../types";
import { SmartIcon } from "./SmartIcon";
import { getFaviconUrl } from "../utils/favicon";

interface CardListProps {
  items: LinkItem[];
  faviconApi: string;
  viewportScale: number;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const CardList: React.FC<CardListProps> = ({ items, faviconApi, viewportScale }) => {
  const iconSize = Math.round(20 * viewportScale);
  const rowHeight = Math.round(48 * viewportScale);

  return (
    <div
      className="w-full overflow-hidden border border-[var(--border)] backdrop-blur-[var(--glass-blur)]"
      style={{
        borderRadius: `calc(16px * var(--radius-scale, 1))`,
        backgroundColor: "color-mix(in srgb, var(--surface-elevated), transparent 40%)",
      }}
    >
      {items.map((link, index) => {
        const iconSource = link.icon || getFaviconUrl(link.url, faviconApi);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 no-underline transition-colors hover:bg-[var(--surface-hover)] group"
            style={{
              height: `${rowHeight}px`,
              borderBottom: index < items.length - 1 ? "0.5px solid var(--border-muted)" : "none",
              animationDelay: `calc(${index} * var(--anim-card-stagger, 30ms))`,
              animation:
                "card-enter-dynamic var(--anim-card-duration, 200ms) var(--anim-card-curve, ease-out) backwards",
            }}
            onClick={() => {
              navigator.sendBeacon("/api/visit", JSON.stringify({ linkId: link.id }));
            }}
          >
            <SmartIcon
              icon={iconSource}
              size={iconSize}
              imgClassName="object-contain rounded"
              style={{ width: `${iconSize}px`, height: `${iconSize}px`, flexShrink: 0 }}
              faviconApi={faviconApi}
              sourceUrl={link.icon ? undefined : link.url}
            />
            <span className="ml-3 text-sm font-normal truncate text-[var(--text)]">
              {link.title}
            </span>
            <span className="ml-auto mr-2 text-xs text-[var(--text-muted)] truncate max-w-[140px] hidden sm:block">
              {extractDomain(link.url)}
            </span>
            <ChevronRight
              size={14}
              className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          </a>
        );
      })}
    </div>
  );
};
