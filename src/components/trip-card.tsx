"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Camera } from "lucide-react";
import { DEFAULT_THEME_COLOR, type Trip } from "@/lib/db";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { formatTripSubtitle } from "@/lib/format-date-range";
import { cn } from "@/lib/utils";

export function TripCard({ trip }: { trip: Trip }) {
  const coverUrl = useObjectUrl(trip.id, trip.coverImage);
  const themeColor = trip.themeColor || DEFAULT_THEME_COLOR;

  return (
    <Link href={`/trip/${trip.id}`} className="block">
      <motion.div
        whileHover={{ y: -4, rotate: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-2xl",
          "bg-card shadow-polaroid",
        )}
      >
        {/* washi tape accent */}
        <div className="washi-tape absolute -top-2 left-6 z-10 h-6 w-16 -rotate-6 rounded-sm" />

        <div
          className="flex h-2/3 items-center justify-center"
          style={coverUrl ? undefined : { backgroundColor: themeColor }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-10 w-10 text-ink/40" strokeWidth={1.5} />
          )}
        </div>

        <div className="flex h-1/3 flex-col justify-center gap-1 bg-paper px-4">
          <h3 className="truncate font-heading text-2xl leading-tight">{trip.title}</h3>
          <p className="truncate text-sm text-ink-soft">{formatTripSubtitle(trip)}</p>
        </div>
      </motion.div>
    </Link>
  );
}
