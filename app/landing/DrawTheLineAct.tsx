"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FadeUp } from "./FadeUp";
import {
  CAP_MAX,
  CAP_MIN,
  DEFAULT_CAP,
  capToY,
  clampCap,
  coverageLabel,
  yToCap,
} from "./drawTheLineMath";

const WIDTH = 640;
const HEIGHT = 320;

// Deterministic rate path on the 0–10% domain.
const RATE_POINTS: Array<[number, number]> = [
  [0, 3.1],
  [55, 3.6],
  [110, 2.9],
  [165, 4.1],
  [220, 3.7],
  [275, 4.6],
  [330, 4.2],
  [385, 5.3],
  [440, 4.8],
  [495, 5.6],
  [550, 5.1],
  [605, 5.8],
  [640, 5.5],
];

const LINE_PATH = RATE_POINTS.map(
  ([x, rate], index) =>
    `${index === 0 ? "M" : "L"} ${x} ${capToY(rate, HEIGHT).toFixed(1)}`,
).join(" ");

const FINAL_RATE = RATE_POINTS[RATE_POINTS.length - 1][1];

export function DrawTheLineAct() {
  const [cap, setCap] = useState(DEFAULT_CAP);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Gentle auto-demo until the visitor touches it.
  useEffect(() => {
    if (hasInteracted) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      setCap(clampCap(DEFAULT_CAP + Math.sin(t * 0.45) * 0.9));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hasInteracted]);

  const updateFromPointer = useCallback((clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.height === 0) return;
    const y = ((clientY - rect.top) / rect.height) * HEIGHT;
    setCap(yToCap(y, HEIGHT));
  }, []);

  const capY = capToY(cap, HEIGHT);
  const hedgePays = FINAL_RATE > cap;

  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <h2 className="max-w-2xl font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
            So draw a line.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-[#5c6b64]">
            Pick the level you never want to pay beyond. If the rate finishes
            past your line, the market pays you back.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mt-10 rounded-2xl border border-[#cfe0d8] bg-white/70 p-4 sm:p-6">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full cursor-ns-resize touch-none select-none"
              role="slider"
              aria-label="Cap level in percent"
              aria-valuemin={CAP_MIN}
              aria-valuemax={CAP_MAX}
              aria-valuenow={Number(cap.toFixed(1))}
              aria-valuetext={`${cap.toFixed(1)} percent cap`}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                  event.preventDefault();
                  setHasInteracted(true);
                  const delta = event.key === "ArrowUp" ? 0.1 : -0.1;
                  setCap((current) => clampCap(current + delta));
                }
              }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setHasInteracted(true);
                setIsDragging(true);
                updateFromPointer(event.clientY);
              }}
              onPointerMove={(event) => {
                if (isDragging) updateFromPointer(event.clientY);
              }}
              onPointerUp={() => setIsDragging(false)}
              onPointerCancel={() => setIsDragging(false)}
            >
              {/* Covered region: everything above the cap line. */}
              <rect
                x={0}
                y={8}
                width={WIDTH}
                height={Math.max(capY - 8, 0)}
                fill="#059669"
                fillOpacity={0.08}
              />
              <text
                x={WIDTH - 12}
                y={26}
                textAnchor="end"
                className="fill-[#047857] text-[12px] font-semibold"
              >
                covered
              </text>

              {/* Rate line */}
              <path
                d={LINE_PATH}
                stroke="#0c1a15"
                strokeOpacity={0.65}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Final observation dot */}
              <circle
                cx={WIDTH}
                cy={capToY(FINAL_RATE, HEIGHT)}
                r={5}
                fill={hedgePays ? "#059669" : "#9aa8a1"}
              />

              {/* The cap line */}
              <line
                x1={0}
                x2={WIDTH}
                y1={capY}
                y2={capY}
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <g transform={`translate(${WIDTH - 84}, ${capY - 14})`}>
                <rect width={72} height={24} rx={6} fill="#059669" />
                <text
                  x={36}
                  y={16}
                  textAnchor="middle"
                  className="fill-white text-[12px] font-semibold"
                >
                  cap {cap.toFixed(1)}%
                </text>
              </g>
            </svg>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3ece7] pt-4">
              <p className="text-sm font-medium text-[#0c1a15]">
                {coverageLabel(cap)}
              </p>
              <p className="text-xs text-[#8aa096]">
                Drag the line — or use arrow keys. This is the whole product.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
