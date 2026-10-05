"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  DECORATIONS,
  TIMESTAMP_COLOR_PRESETS,
  type Decoration,
  type ImageOffset,
  type ItemType,
  type ScrapbookItem,
} from "@/lib/db";
import { freshBlob } from "@/lib/blob";

export function randomDecoration(): Decoration {
  return DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
}

export function randomTimestampColor(): string {
  const presets = Object.values(TIMESTAMP_COLOR_PRESETS);
  return presets[Math.floor(Math.random() * presets.length)];
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
  timestampColor?: string;
  imageOffset?: ImageOffset;
  position: { x: number; y: number };
  existingItems: ScrapbookItem[];
}): Promise<ScrapbookItem> {
  const imageBlob = input.imageBlob ? await freshBlob(input.imageBlob) : undefined;

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
    timestampColor: input.timestampColor ?? randomTimestampColor(),
    imageOffset: input.imageOffset,
    zIndex: maxZIndex + 1,
    createdAt: Date.now(),
  };
  await db.items.add(item);
  return item;
}

async function safeUpdateItem(id: string, changes: Partial<ScrapbookItem>) {
  const current = await db.items.get(id);
  if (!current) return;
  const next: ScrapbookItem = { ...current, ...changes };
  if (next.imageBlob) {
    next.imageBlob = await freshBlob(next.imageBlob);
  }
  await db.items.put(next);
}

export async function updateScrapbookItem(id: string, changes: Partial<ScrapbookItem>) {
  await safeUpdateItem(id, changes);
}

export async function updateScrapbookItemPosition(
  id: string,
  position: { x: number; y: number; rotation: number; scale: number },
) {
  await safeUpdateItem(id, { position });
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
  await safeUpdateItem(current.id, { zIndex: next.zIndex });
  await safeUpdateItem(next.id, { zIndex: current.zIndex });
}

export async function sendScrapbookItemBackward(id: string, items: ScrapbookItem[]) {
  const sorted = sortedByZIndex(items);
  const index = sorted.findIndex((item) => item.id === id);
  const current = sorted[index];
  const prev = sorted[index - 1];
  if (index <= 0 || !current || !prev) return;
  await safeUpdateItem(current.id, { zIndex: prev.zIndex });
  await safeUpdateItem(prev.id, { zIndex: current.zIndex });
}

export async function deleteScrapbookItem(id: string) {
  await db.items.delete(id);
}