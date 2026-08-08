"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  TIMESTAMP_COLORS,
  type Decoration,
  type ItemType,
  type ScrapbookItem,
  type TimestampColor,
} from "@/lib/db";
import { releaseCachedObjectUrl } from "@/lib/object-url-cache";

const DECORATIONS: Decoration[] = ["tape", "pin", "sticker", "polaroid"];

function randomDecoration(): Decoration {
  return DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
}

function randomTimestampColor(): TimestampColor {
  return TIMESTAMP_COLORS[Math.floor(Math.random() * TIMESTAMP_COLORS.length)];
}

function randomRotation() {
  return Math.random() * 8 - 4; // -4deg .. 4deg, kept subtle
}

export function useScrapbookItems(tripId: string | undefined) {
  const items = useLiveQuery<ScrapbookItem[], ScrapbookItem[]>(
    () =>
      tripId
        ? db.items.where("tripId").equals(tripId).sortBy("date")
        : Promise.resolve([]),
    [tripId],
    [],
  );

  return { items };
}

export async function createScrapbookItem(input: {
  tripId: string;
  type: ItemType;
  imageBlob?: Blob;
  caption: string;
  date: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  position: { x: number; y: number };
}): Promise<ScrapbookItem> {
  const imageBlob = input.imageBlob
    ? new Blob([input.imageBlob], { type: input.imageBlob.type })
    : undefined;

  const item: ScrapbookItem = {
    id: crypto.randomUUID(),
    tripId: input.tripId,
    type: input.type,
    imageBlob,
    caption: input.caption,
    date: input.date,
    vendor: input.vendor,
    amount: input.amount,
    currency: input.currency,
    position: { ...input.position, rotation: randomRotation(), scale: 1 },
    decoration: input.type === "photo" ? "polaroid" : randomDecoration(),
    timestampColor: randomTimestampColor(),
    createdAt: Date.now(),
  };
  await db.items.add(item);
  return item;
}

export async function updateScrapbookItem(id: string, changes: Partial<ScrapbookItem>) {
  await db.items.update(id, changes);
}

export async function updateScrapbookItemPosition(
  id: string,
  position: { x: number; y: number; rotation: number; scale: number },
) {
  await db.items.update(id, { position });
}

export async function deleteScrapbookItem(id: string) {
  await db.items.delete(id);
  releaseCachedObjectUrl(id);
}