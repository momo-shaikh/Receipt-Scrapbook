"use client";

import { Pin } from "lucide-react";
import type { ScrapbookItem } from "@/lib/db";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { safeFormatDate } from "@/lib/format-date-range";

function digicamTimestamp(date: string) {
  return safeFormatDate(date, "''yy.M.d") ?? date;
}

function DecorationAccent({ decoration }: { decoration: ScrapbookItem["decoration"] }) {
  if (decoration === "tape") {
    return (
      <div className="washi-tape absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 -rotate-3 rounded-sm" />
    );
  }
  if (decoration === "pin") {
    return (
      <Pin
        className="absolute -top-3 left-1/2 z-10 h-6 w-6 -translate-x-1/2 fill-film text-film drop-shadow"
        strokeWidth={1.5}
      />
    );
  }
  if (decoration === "sticker") {
    return (
      <div className="absolute -top-3 -right-3 z-10 h-7 w-7 rounded-full bg-butter shadow-polaroid" />
    );
  }
  return null;
}

export function ScrapbookItemCard({ item }: { item: ScrapbookItem }) {
  const imageUrl = useObjectUrl(item.id, item.imageBlob);

  if (item.type === "photo") {
    return (
      <div className="w-44 shrink-0 select-none bg-card p-2.5 pb-8 shadow-polaroid sm:w-52">
        <DecorationAccent decoration={item.decoration} />
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
          <span className="timestamp-digicam absolute right-1.5 bottom-1.5 text-[10px]">
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
      <DecorationAccent decoration={item.decoration} />
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
