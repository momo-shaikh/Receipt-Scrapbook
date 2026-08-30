"use client";

import { Playfair_Display } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { NewTripDialog } from "@/components/new-trip-dialog";
import { Button } from "@/components/ui/button";
import { LetterMosaic } from "@/components/letter-mosaic";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["700"],
});

// Timed to start once the mosaic's reveal wipe has finished.
const LINE_DELAY = 1.3;
const BUTTON_DELAY = LINE_DELAY + 1;

export function LandingHero() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <LetterMosaic text="Your" fontFamily={playfairDisplay.style.fontFamily} weight={600} className="w-full" />
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 1, delay: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
        className="w-full"
      >
        <LetterMosaic
          text={"Receipt\nScrapbook"}
          fontFamily={playfairDisplay.style.fontFamily}
          className="w-full"
        />
      </motion.div>

      <svg viewBox="0 0 320 24" className="h-6 w-64 text-film sm:w-80" fill="none" aria-hidden="true">
        <motion.path
          d="M4 14 Q 80 2, 160 13 T 316 11"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="7 7"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1, delay: reduceMotion ? 0 : LINE_DELAY, ease: "easeInOut" },
            opacity: { duration: 0.01, delay: reduceMotion ? 0 : LINE_DELAY },
          }}
        />
      </svg>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: reduceMotion ? 0 : BUTTON_DELAY }}
      >
        <NewTripDialog
          trigger={<Button size="lg" className="rounded-full px-8 text-base" />}
          triggerContent="Create a Scrapbook"
        />
      </motion.div>
    </div>
  );
}
