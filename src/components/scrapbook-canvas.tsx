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
import html2canvas from "html2canvas-pro";
import { ChevronDown, ChevronUp, Pencil, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ScrapbookItem } from "@/lib/db";
import {
  bringScrapbookItemForward,
  deleteScrapbookItem,
  sendScrapbookItemBackward,
  updateScrapbookItemPosition,
} from "@/hooks/useScrapbookItems";
import { CANVAS_DRAG_BOUNDS } from "@/lib/canvas-bounds";
import { ScrapbookItemCard } from "@/components/scrapbook-item-card";
import { ScrapbookItemDetailDialog } from "@/components/scrapbook-item-detail-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function persistPosition(
  id: string,
  position: { x: number; y: number; rotation: number; scale: number },
) {
  updateScrapbookItemPosition(id, position).catch(() => {
    toast.error("Couldn't save that change — try again.");
  });
}

function reorderLayer(promise: Promise<void>) {
  promise.catch(() => {
    toast.error("Couldn't reorder that item — try again.");
  });
}

function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

function useResizeGesture(
  cardRef: React.RefObject<HTMLDivElement | null>,
  startScale: number,
  onResize: (scale: number) => void,
  onResizeEnd: (scale: number) => void,
) {
  const [isResizing, setIsResizing] = useState(false);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    if (startDist === 0) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setIsResizing(true);

    function scaleFromPointer(clientX: number, clientY: number) {
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      return startScale * (dist / startDist);
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      onResize(scaleFromPointer(moveEvent.clientX, moveEvent.clientY));
    }

    function handlePointerUp(upEvent: PointerEvent) {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerup", handlePointerUp);
      onResizeEnd(scaleFromPointer(upEvent.clientX, upEvent.clientY));
      setIsResizing(false);
    }

    target.addEventListener("pointermove", handlePointerMove);
    target.addEventListener("pointerup", handlePointerUp);
  }

  return { isResizing, handlePointerDown };
}

function useRotateGesture(
  cardRef: React.RefObject<HTMLDivElement | null>,
  onRotate: (rotation: number) => void,
  onRotateEnd: (rotation: number) => void,
) {
  const [isRotating, setIsRotating] = useState(false);

  function angleFromPointer(centerX: number, centerY: number, clientX: number, clientY: number) {
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setIsRotating(true);

    function handlePointerMove(moveEvent: PointerEvent) {
      onRotate(angleFromPointer(centerX, centerY, moveEvent.clientX, moveEvent.clientY));
    }

    function handlePointerUp(upEvent: PointerEvent) {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerup", handlePointerUp);
      onRotateEnd(angleFromPointer(centerX, centerY, upEvent.clientX, upEvent.clientY));
      setIsRotating(false);
    }

    target.addEventListener("pointermove", handlePointerMove);
    target.addEventListener("pointerup", handlePointerUp);
  }

  return { isRotating, handlePointerDown };
}

function DraggableScrapbookItem({
  item,
  items,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  item: ScrapbookItem;
  items: ScrapbookItem[];
  isSelected: boolean;
  onSelect: (item: ScrapbookItem) => void;
  onEdit: (item: ScrapbookItem) => void;
  onDelete: (item: ScrapbookItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });
  const { x, y } = transform ?? { x: 0, y: 0 };

  const itemScale = item.position.scale ?? 1;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [liveRotation, setLiveRotation] = useState<number | null>(null);
  const { isRotating, handlePointerDown } = useRotateGesture(
    cardRef,
    setLiveRotation,
    (rotation) => {
      persistPosition(item.id, { ...item.position, scale: itemScale, rotation });
      setLiveRotation(null);
    },
  );
  const rotation = liveRotation ?? item.position.rotation;

  const [liveScale, setLiveScale] = useState<number | null>(null);
  const { isResizing, handlePointerDown: handleResizePointerDown } = useResizeGesture(
    cardRef,
    itemScale,
    setLiveScale,
    (scale) => {
      persistPosition(item.id, { ...item.position, scale });
      setLiveScale(null);
    },
  );
  const scale = liveScale ?? itemScale;

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${item.position.x}%`,
    top: `${item.position.y}%`,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`,
    touchAction: "none",
    zIndex:
      isDragging || isRotating || isResizing ? Number.MAX_SAFE_INTEGER : (item.zIndex ?? 0),
  };

  const cornerHandles = [
    { position: "-top-1.5 -left-1.5", cursor: "cursor-nwse-resize" },
    { position: "-top-1.5 -right-1.5", cursor: "cursor-nesw-resize" },
    { position: "-bottom-1.5 -left-1.5", cursor: "cursor-nesw-resize" },
    { position: "-bottom-1.5 -right-1.5", cursor: "cursor-nwse-resize" },
  ];

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        cardRef.current = el;
      }}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging && !isRotating) onSelect(item);
      }}
      className={`cursor-grab active:cursor-grabbing ${isSelected ? "pencil-outline" : ""}`}
    >
      {isSelected && (
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="Send backward"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderLayer(sendScrapbookItemBackward(item.id, items));
                  }}
                  className="absolute -top-7 left-[calc(50%-4rem)] z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-paper-line bg-card text-ink-soft shadow-polaroid transition-shadow hover:ring-2 hover:ring-film"
                />
              }
            >
              <ChevronDown className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent data-html2canvas-ignore="true">Bring back one layer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="Bring forward"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderLayer(bringScrapbookItemForward(item.id, items));
                  }}
                  className="absolute -top-7 left-[calc(50%-2rem)] z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-paper-line bg-card text-ink-soft shadow-polaroid transition-shadow hover:ring-2 hover:ring-film"
                />
              }
            >
              <ChevronUp className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent data-html2canvas-ignore="true">Bring forward one layer</TooltipContent>
          </Tooltip>
          {cornerHandles.map(({ position, cursor }) => (
            <Tooltip key={position}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Resize"
                    data-html2canvas-ignore="true"
                    onPointerDown={handleResizePointerDown}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute ${position} ${cursor} z-20 h-3 w-3 touch-none rounded-full border border-paper-line bg-card shadow-polaroid transition-shadow hover:ring-2 hover:ring-film`}
                  />
                }
              />
              <TooltipContent data-html2canvas-ignore="true">
                Drag to resize (keeps proportions)
              </TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="Rotate"
                  data-html2canvas-ignore="true"
                  onPointerDown={handlePointerDown}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -top-7 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 touch-none cursor-grab items-center justify-center rounded-full border border-paper-line bg-card text-ink-soft shadow-polaroid transition-shadow hover:ring-2 hover:ring-film active:cursor-grabbing"
                />
              }
            >
              <RotateCw className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent data-html2canvas-ignore="true">Rotate</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="Edit"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="absolute -top-7 left-[calc(50%+2rem)] z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-paper-line bg-card text-ink-soft shadow-polaroid transition-shadow hover:ring-2 hover:ring-film"
                />
              }
            >
              <Pencil className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent data-html2canvas-ignore="true">Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="Delete"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="absolute -top-7 left-[calc(50%+4rem)] z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-paper-line bg-card text-destructive shadow-polaroid transition-shadow hover:ring-2 hover:ring-destructive"
                />
              }
            >
              <Trash2 className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent data-html2canvas-ignore="true">Delete</TooltipContent>
          </Tooltip>
        </>
      )}
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useImperativeHandle(
    ref,
    () => ({
      async exportToPng() {
        const node = containerRef.current;
        if (!node) throw new Error("Canvas not mounted");

        const canvas = await html2canvas(node, {
          scale: 2,
          backgroundColor: getComputedStyle(document.body).backgroundColor,
        });
        return canvas.toDataURL("image/png");
      },
    }),
    [],
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

    persistPosition(item.id, { ...item.position, scale: item.position.scale ?? 1, x: nextX, y: nextY });
  }

  function handleDeleteItem(item: ScrapbookItem) {
    deleteScrapbookItem(item.id).catch(() => {
      toast.error("Couldn't delete that item — try again.");
    });
    setSelectedItemId(null);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={containerRef}
          onClick={() => setSelectedItemId(null)}
          className="bg-dot-grid bg-paper-grain relative isolate min-h-[70vh] w-full overflow-hidden rounded-2xl border border-paper-line"
        >
          {items.map((item) => (
            <DraggableScrapbookItem
              key={item.id}
              item={item}
              items={items}
              isSelected={selectedItemId === item.id}
              onSelect={(selectedItem) => setSelectedItemId(selectedItem.id)}
              onEdit={setSelected}
              onDelete={handleDeleteItem}
            />
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
