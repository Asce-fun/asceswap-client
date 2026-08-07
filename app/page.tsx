"use client";

import { useRef } from "react";
import { motion } from "motion/react";

import { AmbientBackdrop } from "./landing/AmbientBackdrop";
import { CapAct } from "./landing/CapAct";
import { CloseAct } from "./landing/CloseAct";
import { ExposureAct } from "./landing/ExposureAct";
import { FeatureTicker } from "./landing/FeatureTicker";
import { GuaranteeAct } from "./landing/GuaranteeAct";
import { HeroAct } from "./landing/HeroAct";
import { LandingHeader } from "./landing/LandingHeader";
import { SettlementAct } from "./landing/SettlementAct";
import { EarlyAccessAct } from "./landing/EarlyAccessAct";
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
      <AmbientBackdrop containerRef={containerRef} />
      <LandingHeader />
      <main className="relative z-10">
        <HeroAct />
        <FeatureTicker />
        <ExposureAct />
        <CapAct />
        <SettlementAct />
        <GuaranteeAct />
        <EarlyAccessAct />
        <CloseAct />
      </main>
    </motion.div>
  );
}
