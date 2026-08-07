"use client";

import type { RefObject } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

// One 600-unit segment, repeated at x=600 so the 200%-wide svg loops
// seamlessly with the .rate-drift (-50%) animation.
const SEGMENT =
  "M0 96 C 40 78, 80 118, 130 92 S 230 110, 290 84 S 390 116, 450 92 S 550 74, 600 96";
const SEGMENT_ALT =
  "M0 96 C 50 112, 90 72, 150 100 S 250 78, 300 104 S 400 76, 460 98 S 545 118, 600 96";

// Two drifting lines, hero only. The page has exactly one honest plot on it —
// the hedge curve — and decorative squiggles that read as charts anywhere near
// it would teach the eye to treat real data as ambience.
const rateLines = [
  { top: "6%", opacity: 0.26, duration: "28s", alt: false },
  { top: "13%", opacity: 0.18, duration: "37s", alt: true },
];

const MARK_PATH = "M 105 130 L 105 45 A 42 42 0 1 0 105 112";

const DUST_COUNT = 64;
const DUST_SIZE = 26;
const DUST_OPACITY = 0.22;
/** Slow enough that the drift reads as ambient rather than animated. */
const SECONDS_PER_PASS = 52;
/** The golden angle, as a fraction of a turn. */
const GOLDEN_FRACTION = 0.6180339887498949;
const DUST_VARIANTS = ["dust-a", "dust-b", "dust-c"] as const;

/**
 * A dust field of brand marks, placed by the golden angle.
 *
 * Each mark advances 0.618 of a turn horizontally (137.5°, the phyllotaxis
 * angle) while marching evenly down the page. Because the golden ratio is the
 * most irrational number, successive marks never align into rows, columns or
 * clusters — the distribution reads as organic while being fully deterministic,
 * with no hand-placed coordinates anywhere.
 */
const dust = Array.from({ length: DUST_COUNT }, (_, index) => {
  const x = (index * GOLDEN_FRACTION) % 1;
  const y = (index + 0.5) / DUST_COUNT;
  // Mutually incommensurate durations: no two marks share a cycle.
  const duration = SECONDS_PER_PASS * (0.75 + ((index * 7) % 13) / 24);

  return {
    key: index,
    left: `${(x * 100).toFixed(3)}%`,
    top: `${(y * 100).toFixed(3)}%`,
    size: Math.round(DUST_SIZE * (0.65 + (index % 5) * 0.175)),
    // Ease up as the page darkens toward the close.
    opacity: Number((DUST_OPACITY * (0.7 + y * 0.6)).toFixed(3)),
    variant: DUST_VARIANTS[index % DUST_VARIANTS.length],
    duration: `${duration.toFixed(1)}s`,
    delay: `-${((index * 4.7) % duration).toFixed(1)}s`,
  };
});

function BrandMark({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 140 150" fill="none" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id={id} x1="105" y1="130" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#047857" />
          <stop offset="0.35" stopColor="#059669" />
          <stop offset="0.65" stopColor="#34d399" />
          <stop offset="1" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>
      <path
        d={MARK_PATH}
        stroke={`url(#${id})`}
        strokeWidth="16"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="6" fill="#059669" />
    </svg>
  );
}

/**
 * Flat-filled and gradient-free — dozens of gradients would be pure cost — but
 * otherwise the complete mark, foot circle included.
 */
function DustMark() {
  return (
    <svg viewBox="0 0 140 150" fill="none" aria-hidden="true" className="h-full w-full">
      <path
        d={MARK_PATH}
        stroke="#059669"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="7" fill="#059669" />
    </svg>
  );
}

export function AmbientBackdrop({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // The mark descends as you scroll and comes to rest over the footer.
  const fallY = useTransform(scrollYProgress, [0, 1], ["-4vh", "54vh"]);
  const fallOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.16, 0.2, 0.34]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {rateLines.map((line) => (
        <div
          key={line.top}
          className="absolute inset-x-0"
          style={{ top: line.top, opacity: line.opacity }}
        >
          <svg
            className="rate-drift h-36 w-[200%]"
            style={{ animationDuration: line.duration }}
            viewBox="0 0 1200 192"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d={line.alt ? SEGMENT_ALT : SEGMENT}
              stroke="#059669"
              strokeOpacity="0.7"
              strokeWidth="2"
            />
            <path
              d={line.alt ? SEGMENT_ALT : SEGMENT}
              transform="translate(600 0)"
              stroke="#059669"
              strokeOpacity="0.7"
              strokeWidth="2"
            />
          </svg>
        </div>
      ))}

      {dust.map((mark) => (
        <div
          key={mark.key}
          className="absolute"
          style={{
            left: mark.left,
            top: mark.top,
            width: mark.size,
            height: mark.size,
            opacity: mark.opacity,
            marginLeft: -mark.size / 2,
            marginTop: -mark.size / 2,
          }}
        >
          <div
            className={`${mark.variant} h-full w-full`}
            style={{ animationDuration: mark.duration, animationDelay: mark.delay }}
          >
            <DustMark />
          </div>
        </div>
      ))}

      {/* The mark that follows you down the page and settles into the footer. */}
      <motion.div
        className="fixed right-[6vw] top-[16vh] hidden h-[30vh] w-[30vh] lg:block"
        style={reducedMotion ? { opacity: 0.18 } : { y: fallY, opacity: fallOpacity }}
      >
        <BrandMark id="ambientFallingMark" />
      </motion.div>
    </div>
  );
}
