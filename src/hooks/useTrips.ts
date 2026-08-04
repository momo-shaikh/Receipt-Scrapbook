"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Trip } from "@/lib/db";
import { releaseCachedObjectUrl } from "@/lib/object-url-cache";

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
  themeColor: string;
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
  await db.trips.update(id, changes);
}

export async function deleteTrip(id: string) {
  const itemIds = await db.items.where("tripId").equals(id).primaryKeys();
  await db.transaction("rw", db.trips, db.items, async () => {
    await db.items.where("tripId").equals(id).delete();
    await db.trips.delete(id);
  });
  itemIds.forEach((itemId) => releaseCachedObjectUrl(String(itemId)));
  releaseCachedObjectUrl(id);
}
