import React from "react";
import { LinkItem } from "../types";
import { SmartIcon } from "./SmartIcon";
import { getFaviconUrl } from "../utils/favicon";

interface CardCompactProps {
  items: LinkItem[];
  faviconApi: string;
  viewportScale: number;
}

export const CardCompact: React.FC<CardCompactProps> = ({ items, faviconApi, viewportScale }) => {
  const iconSize = Math.round(28 * viewportScale);
  const cellSize = Math.round(56 * viewportScale);

  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
        gap: `calc(8px * var(--density-scale, 1))`,
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
            className="flex items-center justify-center border border-white/10 dark:border-white/[0.06] transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--surface-hover)] group relative no-underline"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              borderRadius: `calc(12px * var(--radius-scale, 1))`,
              animationDelay: `calc(${index} * var(--anim-card-stagger, 30ms))`,
              animation:
                "card-enter-dynamic var(--anim-card-duration, 200ms) var(--anim-card-curve, ease-out) backwards",
            }}
            title={link.title}
            onClick={() => {
              navigator.sendBeacon("/api/visit", JSON.stringify({ linkId: link.id }));
            }}
          >
            <SmartIcon
              icon={iconSource}
              size={iconSize}
              imgClassName="object-contain rounded-md"
              style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
              faviconApi={faviconApi}
              sourceUrl={link.icon ? undefined : link.url}
            />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {link.title}
            </span>
          </a>
        );
      })}
    </div>
  );
};
