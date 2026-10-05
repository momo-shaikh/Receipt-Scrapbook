"use client";

import { TIMESTAMP_COLOR_PRESETS } from "@/lib/db";
import { cn } from "@/lib/utils";

const PRESET_VALUES: string[] = Object.values(TIMESTAMP_COLOR_PRESETS);

export function TimestampColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isCustom = !PRESET_VALUES.includes(value);

  return (
    <div className="flex items-center gap-2">
      {PRESET_VALUES.map((hex) => (
        <button
          key={hex}
          type="button"
          aria-label={hex}
          onClick={() => onChange(hex)}
          style={{ backgroundColor: hex }}
          className={cn(
            "h-6 w-6 rounded-full border border-paper-line transition-shadow hover:ring-2 hover:ring-film",
            value === hex && "ring-2 ring-film ring-offset-2 ring-offset-paper",
          )}
        />
      ))}
      <label
        aria-label="Custom color"
        style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
        className={cn(
          "relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-paper-line transition-shadow hover:ring-2 hover:ring-film",
          isCustom && "ring-2 ring-film ring-offset-2 ring-offset-paper",
        )}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}