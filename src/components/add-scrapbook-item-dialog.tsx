"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Receipt as ReceiptIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoFields, ReceiptFields } from "@/components/scrapbook-item-fields";
import { createScrapbookItem } from "@/hooks/useScrapbookItems";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { releaseCachedObjectUrl } from "@/lib/object-url-cache";
import { CANVAS_SPAWN_BOUNDS } from "@/lib/canvas-bounds";
import type { ItemType, ScrapbookItem } from "@/lib/db";
import { cn } from "@/lib/utils";

function randomPosition() {
  return {
    x: CANVAS_SPAWN_BOUNDS.minX + Math.random() * (CANVAS_SPAWN_BOUNDS.maxX - CANVAS_SPAWN_BOUNDS.minX),
    y: CANVAS_SPAWN_BOUNDS.minY + Math.random() * (CANVAS_SPAWN_BOUNDS.maxY - CANVAS_SPAWN_BOUNDS.minY),
  };
}

function draftKeyFor(file: File) {
  return `draft:${file.name}:${file.size}:${file.lastModified}`;
}

export function AddScrapbookItemDialog({
  tripId,
  items,
  open,
  onOpenChange,
  defaultDate,
}: {
  tripId: string;
  items: ScrapbookItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}) {
  const [type, setType] = useState<ItemType>("receipt");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const draftKey = file ? draftKeyFor(file) : undefined;
  const previewUrl = useObjectUrl(draftKey, file ?? undefined);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (accepted) => {
      if (!accepted[0]) return;
      if (draftKey) releaseCachedObjectUrl(draftKey);
      setFile(accepted[0]);
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (draftKey) releaseCachedObjectUrl(draftKey);
      setType("receipt");
      setFile(null);
      setCaption("");
      setDate(defaultDate ?? "");
      setVendor("");
      setAmount("");
      setCurrency("");
    }
    onOpenChange(next);
  }

  const canSubmit = !!file && caption.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !canSubmit) return;
    setSubmitting(true);
    try {
      await createScrapbookItem({
        tripId,
        type,
        imageBlob: file,
        caption: caption.trim(),
        date,
        vendor: type === "receipt" && vendor.trim() ? vendor.trim() : undefined,
        amount: type === "receipt" && amount ? parseFloat(amount) : undefined,
        currency: type === "receipt" && currency.trim() ? currency.trim() : undefined,
        position: randomPosition(),
        existingItems: items,
      });
      onOpenChange(false);
    } catch {
      toast.error("Couldn't add that to your scrapbook — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-paper sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl">
              Add to your scrapbook
            </DialogTitle>
            <DialogDescription className="text-base">
              Upload a receipt or photo, then caption it your way.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              {(["receipt", "photo"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-2 text-sm font-medium transition-colors",
                    type === t
                      ? "border-film bg-blush text-ink"
                      : "border-paper-line text-ink-soft hover:border-film/50",
                  )}
                >
                  {t === "receipt" ? (
                    <ReceiptIcon className="h-4 w-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {t === "receipt" ? "Receipt" : "Photo"}
                </button>
              ))}
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors",
                isDragActive
                  ? "border-film bg-blush/40"
                  : "border-paper-line hover:border-film/50",
              )}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="max-h-48 rounded-md object-contain shadow-polaroid"
                />
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-ink-soft" />
                  <p className="text-sm text-ink-soft">
                    Drag an image here, or click to choose one
                  </p>
                </>
              )}
            </div>

            <PhotoFields
              idPrefix="new"
              caption={caption}
              onCaptionChange={setCaption}
              captionPlaceholder={
                type === "receipt"
                  ? "Example - Ichiran Ramen, Shibuya"
                  : "Example - View from the top of Kiyomizu-dera"
              }
              date={date}
              onDateChange={setDate}
            />

            {type === "receipt" && (
              <ReceiptFields
                idPrefix="new"
                vendor={vendor}
                onVendorChange={setVendor}
                amount={amount}
                onAmountChange={setAmount}
                currency={currency}
                onCurrencyChange={setCurrency}
                optional
              />
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              Add to page
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
