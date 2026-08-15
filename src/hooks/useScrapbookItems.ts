"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  DECORATIONS,
  TIMESTAMP_COLORS,
  type Decoration,
  type ItemType,
  type ScrapbookItem,
  type TimestampColor,
} from "@/lib/db";
import { releaseCachedObjectUrl } from "@/lib/object-url-cache";

export function randomDecoration(): Decoration {
  return DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
}

export function randomTimestampColor(): TimestampColor {
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
  existingItems: ScrapbookItem[];
}): Promise<ScrapbookItem> {
  const imageBlob = input.imageBlob
    ? new Blob([input.imageBlob], { type: input.imageBlob.type })
    : undefined;

  const maxZIndex = input.existingItems.reduce((max, item) => Math.max(max, item.zIndex ?? 0), 0);

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
    zIndex: maxZIndex + 1,
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

function sortedByZIndex(items: ScrapbookItem[]): ScrapbookItem[] {
  return [...items].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

export async function bringScrapbookItemForward(id: string, items: ScrapbookItem[]) {
  const sorted = sortedByZIndex(items);
  const index = sorted.findIndex((item) => item.id === id);
  const current = sorted[index];
  const next = sorted[index + 1];
  if (!current || !next) return;
  await db.items.update(current.id, { zIndex: next.zIndex });
  await db.items.update(next.id, { zIndex: current.zIndex });
}

export async function sendScrapbookItemBackward(id: string, items: ScrapbookItem[]) {
  const sorted = sortedByZIndex(items);
  const index = sorted.findIndex((item) => item.id === id);
  const current = sorted[index];
  const prev = sorted[index - 1];
  if (index <= 0 || !current || !prev) return;
  await db.items.update(current.id, { zIndex: prev.zIndex });
  await db.items.update(prev.id, { zIndex: current.zIndex });
}

export async function deleteScrapbookItem(id: string) {
  await db.items.delete(id);
  releaseCachedObjectUrl(id);
}