"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { useTrip, deleteTrip, updateTrip } from "@/hooks/useTrips";
import { useScrapbookItems } from "@/hooks/useScrapbookItems";
import { formatTripSubtitle } from "@/lib/format-date-range";
import { freshBlob } from "@/lib/blob";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrapbookCanvas, type ScrapbookCanvasHandle } from "@/components/scrapbook-canvas";
import { AddScrapbookItemDialog } from "@/components/add-scrapbook-item-dialog";

export default function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { trip, loading } = useTrip(id);
  const { items } = useScrapbookItems(id);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<ScrapbookCanvasHandle>(null);

  async function saveCoverSnapshot() {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasRef.current.captureCover();
      if (!blob) return;
      await updateTrip(id, { coverImage: await freshBlob(blob) });
    } catch (err) {
      console.error("Failed to save trip cover snapshot:", err);
    }
  }

  async function handleClose() {
    await saveCoverSnapshot();
    router.push("/");
  }

  async function handleDeleteTrip() {
    setDeleting(true);
    try {
      await deleteTrip(id);
      router.push("/");
    } catch {
      toast.error("Couldn't delete this trip — try again.");
      setDeleting(false);
    }
  }

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
          onClick={(e) => {
            e.preventDefault();
            void handleClose();
          }}
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
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete trip
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add to scrapbook
        </Button>
      </header>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-paper sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Delete this trip?</DialogTitle>
            <DialogDescription>
              This will permanently delete “{trip.title}”. This action can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrip}
              disabled={deleting}
            >
              {deleting ? "Deleting …" : "Delete trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="relative mx-auto max-w-6xl px-6 py-8">
        <ScrapbookCanvas items={items} ref={canvasRef} />
        {items.length === 0 && (
          <div className="pointer-events-none absolute inset-6 top-8 flex flex-col items-center justify-center gap-4">
            <p className="font-hand text-2xl text-ink-soft">
              This page is empty — add your first receipt or photo
            </p>
            <Button className="pointer-events-auto" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add to scrapbook
            </Button>
          </div>
        )}
      </main>

      <AddScrapbookItemDialog
        tripId={id}
        items={items}
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultDate={trip.startDate}
      />
    </div>
  );
}
