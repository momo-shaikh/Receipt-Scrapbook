"use client";

import { useTrips } from "@/hooks/useTrips";
import { TripCard } from "@/components/trip-card";
import { NewTripDialog } from "@/components/new-trip-dialog";
import { LandingHero } from "@/components/landing-hero";

export default function Home() {
  const { trips } = useTrips();

  if (trips.length === 0) {
    return (
      <div className="bg-dot-grid flex flex-1 items-center bg-paper">
        <main className="mx-auto w-full max-w-5xl px-6">
          <LandingHero />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-dot-grid flex-1 bg-paper">
      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-mono text-4xl tracking-widest uppercase">
              Receipt Scrapbook
            </p>
            <h1 className="font-heading text-4xl leading-tight sm:text-6xl">
              Your trips
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
          <NewTripDialog />
        </div>
      </main>
    </div>
  );
}
