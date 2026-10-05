"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Trip } from "@/lib/db";
import { freshBlob } from "@/lib/blob";

export function useTrips() {
  const trips = useLiveQuery(
    () => db.trips.orderBy("createdAt").reverse().toArray(),
    [],
    [] as Trip[],
  );

  return { trips };
}

export function useTrip(tripId: string | undefined) {
  const trip = useLiveQuery(
    () => (tripId ? db.trips.get(tripId) : undefined),
    [tripId],
  );

  return { trip, loading: trip === undefined };
}

export async function createTrip(input: {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}): Promise<Trip> {
  const trip: Trip = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: Date.now(),
  };
  await db.trips.add(trip);
  return trip;
}

export async function updateTrip(id: string, changes: Partial<Trip>) {
  const current = await db.trips.get(id);
  if (!current) return;
  const next: Trip = { ...current, ...changes };
  if (next.coverImage) {
    next.coverImage = await freshBlob(next.coverImage);
  }
  await db.trips.put(next);
}

export async function deleteTrip(id: string) {
  await db.transaction("rw", db.trips, db.items, async () => {
    await db.items.where("tripId").equals(id).delete();
    await db.trips.delete(id);
  });
}
