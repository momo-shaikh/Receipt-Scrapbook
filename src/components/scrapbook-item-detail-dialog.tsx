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
import { PhotoFields, ReceiptFields } from "@/components/scrapbook-item-fields";
import { deleteScrapbookItem, updateScrapbookItem } from "@/hooks/useScrapbookItems";
import type { ScrapbookItem } from "@/lib/db";
import { useObjectUrl } from "@/hooks/useObjectUrl";

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