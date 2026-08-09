"use client";

import type { ScrapbookItem } from "@/lib/db";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { safeFormatDate } from "@/lib/format-date-range";
import { DecorationGraphic } from "@/components/scrapbook-decorations";

function digicamTimestamp(date: string) {
  return safeFormatDate(date, "''yy.M.d") ?? date;
}

// Deterministic hash so each item's decoration placement is stable across
// renders/refreshes instead of jumping around randomly every time.
function hashSeed(seed: string): number {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
}

function decorationPlacement(id: string): React.CSSProperties {
  const rotation = (hashSeed(id) % 30) - 15; // -15deg .. 14deg
  const leftPercent = 18 + (hashSeed(`${id}-offset`) % 65); // 18% .. 82%
  return {
    position: "absolute",
    top: "-0.75rem",
    left: `${leftPercent}%`,
    transform: `translateX(-50%) rotate(${rotation}deg)`,
    zIndex: 10,
  };
}

function DecorationAccent({ item }: { item: ScrapbookItem }) {
  const { decoration, id } = item;
  const placement = decorationPlacement(id);

  if (decoration === "tape") {
    return <div style={placement} className="washi-tape h-6 w-16 rounded-sm" />;
  }
  if (decoration === "pin") {
    return <DecorationGraphic decoration="pin" style={placement} className="h-6 w-6 drop-shadow" />;
  }
  if (decoration === "sticker") {
    return <DecorationGraphic decoration="sticker" style={placement} className="h-7 w-7" />;
  }
  if (decoration === "heart") {
    return (
      <DecorationGraphic decoration="heart" style={placement} className="h-7 w-7 drop-shadow" />
    );
  }
  if (decoration === "star") {
    return <DecorationGraphic decoration="star" style={placement} className="h-7 w-7 drop-shadow" />;
  }
  return null;
}

export function ScrapbookItemCard({ item }: { item: ScrapbookItem }) {
  const imageUrl = useObjectUrl(item.id, item.imageBlob);

  if (item.type === "photo") {
    return (
      <div className="w-44 shrink-0 select-none bg-card p-2.5 pb-8 shadow-polaroid sm:w-52">
        <DecorationAccent item={item} />
        <div className="relative aspect-square w-full overflow-hidden bg-paper-line">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}
          <span
            className={`timestamp-digicam timestamp-${item.timestampColor ?? "yellow"} absolute right-1.5 bottom-1.5 text-[10px]`}
          >
            {digicamTimestamp(item.date)}
          </span>
        </div>
        <p className="mt-2 truncate px-0.5 font-hand text-lg leading-tight text-ink">
          {item.caption}
        </p>
      </div>
    );
  }

  // receipt
  return (
    <div className="w-36 shrink-0 select-none bg-card px-3 py-4 shadow-polaroid sm:w-40">
      <DecorationAccent item={item} />
      {imageUrl && (
        <div className="mb-2 aspect-[3/4] w-full overflow-hidden rounded-sm bg-paper-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      )}
      <div className="font-mono text-[11px] leading-snug text-ink">
        <p className="truncate font-semibold">{item.vendor || item.caption}</p>
        {item.vendor && <p className="truncate text-ink-soft">{item.caption}</p>}
        <p className="mt-1 text-ink-soft">{digicamTimestamp(item.date)}</p>
        {typeof item.amount === "number" && (
          <p className="mt-1 font-semibold">
            {item.currency ?? ""} {item.amount}
          </p>
        )}
      </div>
    </div>
  );
}
