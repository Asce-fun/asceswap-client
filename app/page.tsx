"use client";

import { useRef } from "react";
import { motion } from "motion/react";

import { DrawTheLineAct } from "./landing/DrawTheLineAct";
import { HeroAct } from "./landing/HeroAct";
import { HowItWorksAct } from "./landing/HowItWorksAct";
import { LandingHeader } from "./landing/LandingHeader";
import { LaunchAct } from "./landing/LaunchAct";
import { MarketsPreviewAct } from "./landing/MarketsPreviewAct";
import { ProblemAct } from "./landing/ProblemAct";
import { TrustAct } from "./landing/TrustAct";
import { useScrollTheme } from "./landing/useScrollTheme";

export default function Landing() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backgroundColor = useScrollTheme(containerRef);

  return (
    <motion.div
      ref={containerRef}
      style={{ backgroundColor }}
      className="landing-theme relative min-h-screen font-sans"
    >
      <LandingHeader />
      <main>
        <HeroAct />
        <ProblemAct />
        <DrawTheLineAct />
        <HowItWorksAct />
        <TrustAct />
        <MarketsPreviewAct />
        <LaunchAct />
      </main>
    </motion.div>
  );
}
