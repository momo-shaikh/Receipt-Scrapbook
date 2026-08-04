"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTrip } from "@/hooks/useTrips";
import { DEFAULT_THEME_COLOR } from "@/lib/db";
import { cn } from "@/lib/utils";

export function NewTripDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);

  const canSubmit = title.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const trip = await createTrip({
        title: title.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
        themeColor,
      });
      setOpen(false);
      router.push(`/trip/${trip.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "group flex flex-col items-center justify-center gap-3",
          "aspect-[3/4] rounded-2xl border-2 border-dashed border-paper-line",
          "text-ink-soft hover:border-film hover:text-film transition-colors",
          "bg-paper-grain",
        )}
      >
        <span className="flex h-30 w-30 items-center justify-center rounded-full bg-paper border-2 border-dashed border-current">
          <Plus className="h-6 w-6" />
        </span>
        <span className="font-hand text-2xl">New trip</span>
      </DialogTrigger>
      <DialogContent className="bg-paper lg:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl">Start a new scrapbook</DialogTitle>
            <DialogDescription className="text-base">
              Give your trip a name — you can add receipts and photos next.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Trip title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Enter your destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="themeColor">Accent color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="themeColor"
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className={cn(
                    "h-10 w-10 cursor-pointer rounded-full border-2 border-paper-line bg-transparent p-0",
                    "[&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none",
                    "[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none",
                  )}
                />
                <span className="font-mono text-sm text-ink-soft uppercase">
                  {themeColor}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              Create scrapbook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
