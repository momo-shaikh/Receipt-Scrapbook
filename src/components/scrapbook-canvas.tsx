"use client";

import { useImperativeHandle, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toPng } from "html-to-image";
import type { ScrapbookItem } from "@/lib/db";
import { updateScrapbookItemPosition } from "@/hooks/useScrapbookItems";
import { blobToDataUrl } from "@/lib/blob-to-data-url";
import { CANVAS_DRAG_BOUNDS } from "@/lib/canvas-bounds";
import { ScrapbookItemCard } from "@/components/scrapbook-item-card";
import { ScrapbookItemDetailDialog } from "@/components/scrapbook-item-detail-dialog";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function DraggableScrapbookItem({
  item,
  onOpen,
}: {
  item: ScrapbookItem;
  onOpen: (item: ScrapbookItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });
  const { x, y } = transform ?? { x: 0, y: 0 };

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${item.position.x}%`,
    top: `${item.position.y}%`,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${item.position.rotation}deg)`,
    touchAction: "none",
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(item)}
      className="cursor-grab active:cursor-grabbing"
    >
      <ScrapbookItemCard item={item} />
    </div>
  );
}

export interface ScrapbookCanvasHandle {
  exportToPng: () => Promise<string>;
}

export function ScrapbookCanvas({
  items,
  ref,
}: {
  items: ScrapbookItem[];
  ref?: React.Ref<ScrapbookCanvasHandle>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<ScrapbookItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useImperativeHandle(
    ref,
    () => ({
      async exportToPng() {
        const node = containerRef.current;
        if (!node) throw new Error("Canvas not mounted");

        // Safari can't resolve blob: URLs when html-to-image rasterizes the
        // DOM via an SVG foreignObject, so swap each image to a base64 data
        // URL for the capture, then restore the blob URL afterward.
        const imgEls = Array.from(
          node.querySelectorAll<HTMLImageElement>("img[data-item-id]"),
        );
        const byId = new Map(items.map((item) => [item.id, item]));
        const originalSrcs = imgEls.map((img) => img.src);

        try {
          await Promise.all(
            imgEls.map(async (img) => {
              const item = byId.get(img.dataset.itemId ?? "");
              if (item?.imageBlob) img.src = await blobToDataUrl(item.imageBlob);
            }),
          );
          return await toPng(node, {
            pixelRatio: 2,
            backgroundColor: getComputedStyle(node).backgroundColor,
          });
        } finally {
          imgEls.forEach((img, i) => {
            img.src = originalSrcs[i];
          });
        }
      },
    }),
    [items],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    const deltaXPct = (delta.x / rect.width) * 100;
    const deltaYPct = (delta.y / rect.height) * 100;
    const nextX = clamp(item.position.x + deltaXPct, CANVAS_DRAG_BOUNDS.minX, CANVAS_DRAG_BOUNDS.maxX);
    const nextY = clamp(item.position.y + deltaYPct, CANVAS_DRAG_BOUNDS.minY, CANVAS_DRAG_BOUNDS.maxY);

    updateScrapbookItemPosition(item.id, {
      x: nextX,
      y: nextY,
      rotation: item.position.rotation,
    });
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={containerRef}
          className="bg-dot-grid bg-paper-grain relative min-h-[70vh] w-full overflow-hidden rounded-2xl border border-paper-line"
        >
          {items.map((item) => (
            <DraggableScrapbookItem key={item.id} item={item} onOpen={setSelected} />
          ))}
        </div>
      </DndContext>

      {selected && (
        <ScrapbookItemDetailDialog
          key={selected.id}
          item={selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </>
  );
}
