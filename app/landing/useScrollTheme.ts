"use client";

import type { RefObject } from "react";
import { useScroll, useTransform, type MotionValue } from "motion/react";

// Scroll progress stops aligned with the five acts. The explanatory middle
// stays in daylight; only the closing act goes dark, so the CTA carries weight
// without the settlement and trust copy being read against near-black.
// hero → exposure → cap → settlement → guarantee → early access (dusk) → close (dark).
const STOPS = [0, 0.15, 0.3, 0.45, 0.6, 0.72, 0.86, 1];
const COLORS = [
  "#fbfdfc",
  "#f7fcfa",
  "#f4faf7",
  "#eef7f2",
  "#e6f2ec",
  "#1c2a25",
  "#0b1512",
  "#030506",
];

export function useScrollTheme(
  target: RefObject<HTMLDivElement | null>,
): MotionValue<string> {
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start start", "end end"],
  });
  return useTransform(scrollYProgress, STOPS, COLORS);
}

// The prefers-reduced-motion fallback lives in globals.css as a static
// gradient on .landing-theme — it must override the inline background
// in CSS because the motion value is applied before hydration settles.
