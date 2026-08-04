"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { useTrip } from "@/hooks/useTrips";
import { useScrapbookItems } from "@/hooks/useScrapbookItems";
import { formatTripSubtitle } from "@/lib/format-date-range";
import { Button } from "@/components/ui/button";
import { ScrapbookCanvas, type ScrapbookCanvasHandle } from "@/components/scrapbook-canvas";
import { AddScrapbookItemDialog } from "@/components/add-scrapbook-item-dialog";

export default function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { trip, loading } = useTrip(id);
  const { items } = useScrapbookItems(id);
  const [addOpen, setAddOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<ScrapbookCanvasHandle>(null);

  async function handleExport() {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await canvasRef.current.exportToPng();
      const link = document.createElement("a");
      link.download = `${trip?.title || "scrapbook"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Couldn't export this page — try again.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className="flex-1 bg-paper" />;
  }

  if (!trip) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-paper">
        <p className="font-hand text-3xl">Trip not found</p>
        <Link href="/" className="text-base text-film underline">
          Back to your trips
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-dot-grid flex-1 bg-paper">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-6 pt-8">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-4xl leading-tight">{trip.title}</h1>
          <p className="text-sm text-ink-soft">{formatTripSubtitle(trip)}</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export"}
          </Button>
        )}
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add to scrapbook
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {items.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-paper-line">
            <p className="font-hand text-2xl text-ink-soft">
              This page is empty — add your first receipt or photo
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add to scrapbook
            </Button>
          </div>
        ) : (
          <ScrapbookCanvas items={items} ref={canvasRef} />
        )}
      </main>

      <AddScrapbookItemDialog
        tripId={id}
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultDate={trip.startDate}
      />
    </div>
  );
}
