"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhotoFields, ReceiptFields } from "@/components/scrapbook-item-fields";
import { DECORATION_LABELS, DecorationGraphic } from "@/components/scrapbook-decorations";
import { deleteScrapbookItem, updateScrapbookItem } from "@/hooks/useScrapbookItems";
import { DECORATIONS, TIMESTAMP_COLORS, type Decoration, type ScrapbookItem } from "@/lib/db";
import { useObjectUrl } from "@/hooks/useObjectUrl";

function DecorationPreview({ decoration }: { decoration: Decoration }) {
  if (decoration === "tape") {
    return <div className="washi-tape h-4 w-8 -rotate-3 rounded-sm" />;
  }
  if (decoration === "polaroid") {
    return <span className="text-[10px] text-ink-soft">None</span>;
  }
  return <DecorationGraphic decoration={decoration} className="h-4 w-4" />;
}

export function ScrapbookItemDetailDialog({
  item,
  onOpenChange,
}: {
  item: ScrapbookItem;
  onOpenChange: (open: boolean) => void;
}) {
  const imageUrl = useObjectUrl(item.id, item.imageBlob);
  const [caption, setCaption] = useState(item.caption);
  const [date, setDate] = useState(item.date);
  const [vendor, setVendor] = useState(item.vendor ?? "");
  const [amount, setAmount] = useState(item.amount != null ? String(item.amount) : "");
  const [currency, setCurrency] = useState(item.currency ?? "");
  const [timestampColor, setTimestampColor] = useState(item.timestampColor ?? "yellow");
  const [decoration, setDecoration] = useState(item.decoration);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateScrapbookItem(item.id, {
        caption: caption.trim(),
        date,
        vendor: item.type === "receipt" && vendor.trim() ? vendor.trim() : undefined,
        amount: item.type === "receipt" && amount ? parseFloat(amount) : undefined,
        currency: item.type === "receipt" && currency.trim() ? currency.trim() : undefined,
        timestampColor: item.type === "photo" ? timestampColor : undefined,
        decoration,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteScrapbookItem(item.id);
    onOpenChange(false);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-paper sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-3xl">
            {item.type === "receipt" ? "Edit receipt" : "Edit photo"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="mx-auto max-h-64 rounded-md object-contain shadow-polaroid"
            />
          )}

          <PhotoFields
            idPrefix="edit"
            caption={caption}
            onCaptionChange={setCaption}
            date={date}
            onDateChange={setDate}
          />

          <div className="grid gap-2">
            <Label>Decoration</Label>
            <div className="flex gap-2">
              {DECORATIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={DECORATION_LABELS[value]}
                  onClick={() => setDecoration(value)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border border-paper-line bg-card transition-shadow hover:ring-2 hover:ring-film ${
                    decoration === value ? "ring-2 ring-film ring-offset-2 ring-offset-paper" : ""
                  }`}
                >
                  <DecorationPreview decoration={value} />
                </button>
              ))}
            </div>
          </div>

          {item.type === "photo" && (
            <div className="grid gap-2">
              <Label>Timestamp color</Label>
              <div className="flex gap-2">
                {TIMESTAMP_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => setTimestampColor(color)}
                    className={`h-7 w-7 rounded-full border border-paper-line bg-current transition-shadow hover:ring-2 hover:ring-film timestamp-${color} ${
                      timestampColor === color ? "ring-2 ring-film ring-offset-2 ring-offset-paper" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {item.type === "receipt" && (
            <ReceiptFields
              idPrefix="edit"
              vendor={vendor}
              onVendorChange={setVendor}
              amount={amount}
              onAmountChange={setAmount}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}