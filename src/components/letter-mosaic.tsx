"use client";

import { useEffect, useRef } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import { cn } from "@/lib/utils";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ";

const REPEL_RADIUS = 35;
const REPEL_STRENGTH = 45;
const SPRING = 0.06;
const DAMPING = 0.82;
const REST_EPSILON = 0.02;

type Particle = {
  char: string;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

/**
 * Renders `text` as large letterforms filled with small tiled lorem-ipsum
 * text (a "letters made of letters" mosaic). Pretext lays out the fill text
 * without any DOM reflow cost; each resulting character becomes an
 * independent particle that's kept only where it lands on the big
 * letterform's ink. Hovering the pointer over the text repels nearby
 * particles apart; a spring pulls each one back to its home position once
 * the pointer moves on, so the mosaic reassembles itself.
 */
export function LetterMosaic({
  text,
  fontFamily,
  italic = true,
  weight = 700,
  fontSize,
  className,
}: {
  text: string;
  fontFamily: string;
  italic?: boolean;
  weight?: number;
  fontSize?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let particles: Particle[] = [];
    let smallFont = "";
    let ink = "#3a2a1a";
    let rafId = 0;
    let running = false;
    const pointer = { x: -9999, y: -9999, active: false };

    function step() {
      const ctx = canvas!.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas!.width / dpr, canvas!.height / dpr);
      ctx.font = smallFont;
      ctx.fillStyle = ink;
      ctx.textBaseline = "alphabetic";

      let settled = true;
      for (const p of particles) {
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.001) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }
        p.vx += (p.homeX - p.x) * SPRING;
        p.vy += (p.homeY - p.y) * SPRING;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        if (
          Math.abs(p.vx) > REST_EPSILON ||
          Math.abs(p.vy) > REST_EPSILON ||
          Math.abs(p.x - p.homeX) > REST_EPSILON ||
          Math.abs(p.y - p.homeY) > REST_EPSILON
        ) {
          settled = false;
        }

        ctx.fillText(p.char, p.x, p.y);
      }

      if (!settled || pointer.active) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
      }
    }

    function wake() {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(step);
      }
    }

    function toCanvasCoords(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onPointerEnter(e: PointerEvent) {
      pointer.active = true;
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      pointer.x = x;
      pointer.y = y;
      wake();
    }
    function onPointerMove(e: PointerEvent) {
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      pointer.x = x;
      pointer.y = y;
      wake();
    }
    function onPointerLeave() {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      wake();
    }

    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    async function setup() {
      const container = canvas!.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const bigFontSize = fontSize ?? Math.max(48, Math.min(140, width / 4));
      const smallFontSize = Math.max(7, bigFontSize / 21);
      const style = italic ? "italic " : "";
      const bigFont = `${style}${weight} ${bigFontSize}px ${fontFamily}`;
      smallFont = `${style}700 ${smallFontSize}px ${fontFamily}`;

      await Promise.all([document.fonts.load(bigFont), document.fonts.load(smallFont)]);
      if (cancelled) return;

      const bigLines = text.split("\n");
      const bigLineHeight = bigFontSize * 1.05;
      const height = bigLineHeight * bigLines.length;
      const dpr = window.devicePixelRatio || 1;
      const pxWidth = Math.round(width * dpr);
      const pxHeight = Math.round(height * dpr);

      // Paint the big letterforms as a mask shape on an offscreen canvas —
      // only used to test which small-text particles land on visible ink.
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = pxWidth;
      maskCanvas.height = pxHeight;
      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.scale(dpr, dpr);
      maskCtx.font = bigFont;
      maskCtx.textBaseline = "alphabetic";
      maskCtx.fillStyle = "#000";
      bigLines.forEach((line, i) => {
        const lineWidth = maskCtx.measureText(line).width;
        maskCtx.fillText(line, (width - lineWidth) / 2, bigFontSize * 0.85 + i * bigLineHeight);
      });
      const maskData = maskCtx.getImageData(0, 0, pxWidth, pxHeight).data;
      const isInk = (x: number, y: number) => {
        const px = Math.round(x * dpr);
        const py = Math.round(y * dpr);
        if (px < 0 || py < 0 || px >= pxWidth || py >= pxHeight) return false;
        return maskData[(py * pxWidth + px) * 4 + 3] > 24;
      };
      // A single sample point (e.g. the glyph's visual center) misses most of
      // a character whenever the letterform's stroke only grazes its bounding
      // box — exactly what happens along edges and thin serifs — so coverage
      // came out sparse and edges looked ragged. Sampling a small grid across
      // the character's box and keeping it if *any* point hits ink fixes that.
      const overlapsInk = (left: number, w: number, baseline: number) => {
        const xs = [left + w * 0.2, left + w * 0.5, left + w * 0.8];
        const ys = [baseline - smallFontSize * 0.72, baseline - smallFontSize * 0.36, baseline];
        for (const y of ys) {
          for (const x of xs) {
            if (isInk(x, y)) return true;
          }
        }
        return false;
      };

      // Lay out tiled small text with Pretext, then turn each character that
      // lands on the mask's ink into a particle at its natural position.
      ink = getComputedStyle(document.documentElement).getPropertyValue("--ink-strong").trim() || "#3a2a1a";
      maskCtx.font = smallFont;

      const smallLineHeight = smallFontSize * 1.1;
      const rowsNeeded = Math.ceil(height / smallLineHeight) + 1;

      // Lay the fill text out across the *full* width rather than splitting
      // it into narrow columns: Pretext word-wraps each column on its own,
      // so every line leaves a ragged blank gap at its right edge, and in a
      // narrow column that gap can eat a large share of the line — that's
      // what was making the mosaic look sparse. One wide column keeps that
      // per-line gap a small fraction of the row instead.
      let repeated = LOREM;
      let lines = layoutWithLines(prepareWithSegments(repeated, smallFont), width, smallLineHeight).lines;
      while (lines.length < rowsNeeded) {
        repeated += LOREM;
        lines = layoutWithLines(prepareWithSegments(repeated, smallFont), width, smallLineHeight).lines;
      }

      const nextParticles: Particle[] = [];
      for (let i = 0; i < rowsNeeded; i++) {
        const lineText = lines[i].text;
        const baseY = smallFontSize + i * smallLineHeight;
        let cursor = 0;
        for (const ch of lineText) {
          const w = maskCtx.measureText(ch).width;
          if (ch.trim() !== "" && overlapsInk(cursor, w, baseY)) {
            nextParticles.push({ char: ch, homeX: cursor, homeY: baseY, x: cursor, y: baseY, vx: 0, vy: 0 });
          }
          cursor += w;
        }
      }

      canvas!.width = pxWidth;
      canvas!.height = pxHeight;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      particles = nextParticles;
      wake();
    }

    setup().catch((err) => console.error("LetterMosaic setup failed:", err));
    const onResize = () => setup().catch((err) => console.error("LetterMosaic setup failed:", err));
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [text, fontFamily, italic, weight, fontSize]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("touch-none", className)}
      aria-label={text}
      role="img"
    />
  );
}