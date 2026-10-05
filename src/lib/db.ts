import Dexie, { type EntityTable } from "dexie";

export type ItemType = "receipt" | "photo";
export const DECORATIONS = ["tape", "pin", "sticker", "heart", "star", "polaroid"] as const;
export type Decoration = (typeof DECORATIONS)[number];
export const TIMESTAMP_COLOR_PRESETS = {
  yellow: "#f4d35e",
  orange: "#ee964b",
  red: "#d64550",
  blue: "#8ecae6",
} as const;
export const DEFAULT_TIMESTAMP_COLOR = TIMESTAMP_COLOR_PRESETS.yellow;

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  coverImage?: Blob;
  createdAt: number;
}

export interface ScrapbookItem {
  id: string;
  tripId: string;
  type: ItemType;
  imageBlob?: Blob;
  caption: string;
  date: string; // ISO date
  vendor?: string;
  amount?: number;
  currency?: string;
  position: { x: number; y: number; rotation: number; scale: number };
  decoration: Decoration;
  timestampColor?: string;
  zIndex: number;
  createdAt: number;
}

const db = new Dexie("receipt-scrapbook") as Dexie & {
  trips: EntityTable<Trip, "id">;
  items: EntityTable<ScrapbookItem, "id">;
};

db.version(1).stores({
  trips: "id, createdAt",
  items: "id, tripId, date, createdAt",
});

export { db };
