"use client";

import { Check, Crop } from "lucide-react";
import type { ImageOffset } from "@/lib/db";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const BUTTON_CLASSES =
  "absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full border border-paper-line bg-card text-ink-soft shadow-polaroid transition-shadow hover:ring-2 hover:ring-film";

export function ImageCropOverlay({
  active,
  value,
  onChange,
  onActivate,
  onDone,
}: {
  active: boolean;
  value: ImageOffset;
  onChange: (value: ImageOffset) => void;
  onActivate: () => void;
  onDone: () => void;
}) {
  if (!active) {
    return (
      <button
        type="button"
        aria-label="Crop image"
        data-html2canvas-ignore="true"
        onClick={onActivate}
        className={BUTTON_CLASSES}
      >
        <Crop className="h-3.5 w-3.5" />
      </button>
    );
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    container.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const start = value;

    function handlePointerMove(moveEvent: PointerEvent) {
      const dxPercent = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dyPercent = ((moveEvent.clientY - startY) / rect.height) * 100;
      onChange({
        x: clamp(start.x - dxPercent, 0, 100),
        y: clamp(start.y - dyPercent, 0, 100),
      });
    }
    function handlePointerUp() {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
    }
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div
      data-html2canvas-ignore="true"
      onPointerDown={handlePointerDown}
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
    >
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border border-white/60" />
        ))}
      </div>
      <button
        type="button"
        aria-label="Done cropping"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        className={BUTTON_CLASSES}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}