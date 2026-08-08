"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PhotoFields({
  idPrefix,
  caption,
  onCaptionChange,
  captionPlaceholder,
  date,
  onDateChange,
}: {
  idPrefix: string;
  caption: string;
  onCaptionChange: (value: string) => void;
  captionPlaceholder?: string;
  date: string;
  onDateChange: (value: string) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-caption`}>Caption</Label>
        <Textarea
          id={`${idPrefix}-caption`}
          placeholder={captionPlaceholder}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-date`}>Date</Label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
    </>
  );
}

export function ReceiptFields({
  idPrefix,
  vendor,
  onVendorChange,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  optional,
}: {
  idPrefix: string;
  vendor: string;
  onVendorChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-2 grid gap-2">
        <Label htmlFor={`${idPrefix}-vendor`}>Vendor</Label>
        <Input
          id={`${idPrefix}-vendor`}
          placeholder={optional ? "Example - Ichiran" : undefined}
          value={vendor}
          onChange={(e) => onVendorChange(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-amount`}>Amount</Label>
        <Input
          id={`${idPrefix}-amount`}
          type="number"
          inputMode="decimal"
          placeholder={optional ? "Ex - 200" : undefined}
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-currency`}>Currency</Label>
        <Input
          id={`${idPrefix}-currency`}
          placeholder={optional ? "Ex - ¥" : undefined}
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        />
      </div>
    </div>
  );
}