"use client";

import type { RefObject } from "react";
import { useScroll, useTransform, type MotionValue } from "motion/react";

// Scroll progress stops aligned with the seven acts:
// hero → problem → draw-the-line → how-it-works → trust → markets (dusk) → launch (dark).
const STOPS = [0, 0.14, 0.3, 0.46, 0.6, 0.72, 0.84, 1];
const COLORS = [
  "#fbfdfc",
  "#f4faf7",
  "#eef7f2",
  "#e6f2ec",
  "#d8e9e0",
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
