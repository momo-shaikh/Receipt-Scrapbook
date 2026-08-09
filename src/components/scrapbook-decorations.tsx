import { Pin } from "lucide-react";
import type { Decoration } from "@/lib/db";

export const DECORATION_LABELS: Record<Decoration, string> = {
  tape: "Tape",
  pin: "Pin",
  sticker: "Sticker",
  heart: "Heart",
  star: "Star",
  polaroid: "None",
};

export function DecorationGraphic({
  decoration,
  className,
  style,
}: {
  decoration: Decoration;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (decoration === "pin") {
    return <Pin className={`fill-film text-film ${className}`} style={style} strokeWidth={1.5} />;
  }
  if (decoration === "sticker") {
    return <div className={`rounded-full bg-butter shadow-polaroid ${className}`} style={style} />;
  }
  if (decoration === "heart") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-blush ${className}`}
        style={style}
      >
        <circle cx="8.5" cy="9" r="5.5" />
        <circle cx="15.5" cy="9" r="5.5" />
        <path d="M3.5 11.5 L12 21 L20.5 11.5 Z" />
      </svg>
    );
  }
  if (decoration === "star") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-butter ${className}`}
        style={style}
      >
        <path d="M12 2.5l2.6 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.9l-5.6 2.8 1.4-6.3-4.8-4.3 6.4-.7L12 2.5z" />
      </svg>
    );
  }
  return null;
}