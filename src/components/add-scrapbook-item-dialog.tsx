"use client";

import { useMemo, useState } from "react";
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
import { ScrapbookItemCard, type ScrapbookItemCardData } from "@/components/scrapbook-item-card";
import {
  createScrapbookItem,
  randomDecoration,
  randomTimestampColor,
} from "@/hooks/useScrapbookItems";
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
  const [files, setFiles] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const file = files[currentIndex] ?? null;
  const isLastImage = currentIndex === files.length - 1;
  const draftKey = file ? draftKeyFor(file) : undefined;

  // Randomized once per image (not per keystroke) so the sneak-peek preview
  // mirrors what createScrapbookItem will actually pick, without reshuffling
  // every time a field changes.
  const previewDecoration = useMemo(
    () => (type === "photo" ? "polaroid" : randomDecoration()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftKey, type],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewTimestampColor = useMemo(() => randomTimestampColor(), [draftKey]);

  const previewItem: ScrapbookItemCardData | null =
    file && draftKey
      ? {
          id: draftKey,
          type,
          imageBlob: file,
          caption,
          date,
          timestampColor: previewTimestampColor,
          decoration: previewDecoration,
          vendor: type === "receipt" ? vendor : undefined,
          amount: type === "receipt" && amount ? parseFloat(amount) : undefined,
          currency: type === "receipt" ? currency : undefined,
        }
      : null;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: (accepted) => {
      if (accepted.length === 0) return;
      setFiles((current) => [...current, ...accepted]);
    },
  });

  function resetItemFields() {
    setCaption("");
    setVendor("");
    setAmount("");
    setCurrency("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (draftKey) releaseCachedObjectUrl(draftKey);
      setType("receipt");
      setFiles([]);
      setCurrentIndex(0);
      resetItemFields();
      setDate(defaultDate ?? "");
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
      if (draftKey) releaseCachedObjectUrl(draftKey);
      if (isLastImage) {
        handleOpenChange(false);
      } else {
        resetItemFields();
        setCurrentIndex((i) => i + 1);
      }
    } catch {
      toast.error("Couldn't add that to your scrapbook — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-paper sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {file ? "Caption it" : "Add to your scrapbook"}
            </DialogTitle>
            {files.length > 1 && (
              <DialogDescription>
                Image {currentIndex + 1} of {files.length}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-3 sm:flex-row sm:items-center">
            {previewItem && (
              <div className="shrink-0 -rotate-2 sm:order-last">
                <ScrapbookItemCard item={previewItem} />
              </div>
            )}

            <div className="grid w-full min-w-0 gap-3">
              {files.length > 1 && (
                <div className="flex justify-center gap-1.5">
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}-${f.lastModified}-${i}`}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        i === currentIndex ? "bg-film" : i < currentIndex ? "bg-film/40" : "bg-paper-line",
                      )}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {(["receipt", "photo"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-1.5 text-sm font-medium transition-colors",
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

              {file ? (
                <div
                  {...getRootProps()}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-paper-line py-1.5 text-xs text-ink-soft transition-colors hover:border-film/50"
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="h-3.5 w-3.5" />
                  Add more images
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors",
                    isDragActive
                      ? "border-film bg-blush/40"
                      : "border-paper-line hover:border-film/50",
                  )}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="h-6 w-6 text-ink-soft" />
                  <p className="text-sm text-ink-soft">
                    Drag images here, or click to choose
                  </p>
                </div>
              )}

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
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {isLastImage ? "Add to page" : "Save & next"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
