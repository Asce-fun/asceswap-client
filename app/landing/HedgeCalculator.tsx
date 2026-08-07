"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  type Scenario,
  SCENARIOS,
  baselineAt,
  boundFor,
  clampLevel,
  costToY,
  formatMoney,
  formatScenarioValue,
  hedgedAt,
  premiumFor,
  valueToX,
  xToValue,
} from "./hedgeMath";

const WIDTH = 640;
const HEIGHT = 190;
const PAD_LEFT = 12;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

const SAMPLES = 121;

function buildPath(
  valueAt: (value: number) => number,
  scenario: Scenario,
  minY: number,
  maxY: number,
): string {
  const span = scenario.domainMax - scenario.domainMin;

  return Array.from({ length: SAMPLES }, (_, index) => {
    const value = scenario.domainMin + (span * index) / (SAMPLES - 1);
    const x = valueToX(value, scenario, WIDTH, PAD_LEFT, PAD_RIGHT);
    const y = costToY(valueAt(value), HEIGHT, minY, maxY, PAD_TOP, PAD_BOTTOM);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function Readout({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="px-5 py-3">
      <div className="font-mono text-[10px] tracking-[0.22em] text-[#8aa096]">{label}</div>
      <div
        className={`mt-1.5 font-mono text-2xl font-semibold leading-none tabular-nums ${
          accent ? "text-[#047857]" : "text-[#0c1a15]"
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-[#a8b8b0]">{note}</div>
    </div>
  );
}

export function HedgeCalculator() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = useMemo(
    () => SCENARIOS.find((entry) => entry.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );

  // Each scenario keeps its own level, so switching tabs never loses a drag.
  const [levels, setLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(SCENARIOS.map((entry) => [entry.id, entry.defaultLevel])),
  );
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const level = levels[scenario.id] ?? scenario.defaultLevel;
  const bound = boundFor(level, scenario);
  const premium = premiumFor(level, scenario);

  const setLevel = useCallback(
    (next: (current: number) => number) => {
      setLevels((current) => ({
        ...current,
        [scenario.id]: clampLevel(next(current[scenario.id] ?? scenario.defaultLevel), scenario),
      }));
    },
    [scenario],
  );

  // Fix the vertical scale across the whole drag range so the plot does not
  // rescale under the pointer while the level moves.
  const { minY, maxY } = useMemo(() => {
    const probes = [
      baselineAt(scenario.domainMin, scenario),
      baselineAt(scenario.domainMax, scenario),
      hedgedAt(scenario.domainMin, scenario.levelMin, scenario),
      hedgedAt(scenario.domainMax, scenario.levelMin, scenario),
      hedgedAt(scenario.domainMin, scenario.levelMax, scenario),
      hedgedAt(scenario.domainMax, scenario.levelMax, scenario),
    ];
    const low = Math.min(...probes);
    const high = Math.max(...probes);
    const padding = (high - low) * 0.12;
    return { minY: low - padding, maxY: high + padding };
  }, [scenario]);

  const baselinePath = useMemo(
    () => buildPath((value) => baselineAt(value, scenario), scenario, minY, maxY),
    [scenario, minY, maxY],
  );
  const hedgedPath = useMemo(
    () => buildPath((value) => hedgedAt(value, level, scenario), scenario, minY, maxY),
    [scenario, level, minY, maxY],
  );

  const levelX = valueToX(level, scenario, WIDTH, PAD_LEFT, PAD_RIGHT);
  const boundX = valueToX(bound, scenario, WIDTH, PAD_LEFT, PAD_RIGHT);
  const bandLeft = Math.min(levelX, boundX);
  const bandWidth = Math.abs(boundX - levelX);
  const dragStep = (scenario.levelMax - scenario.levelMin) / 60;

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return;
      const x = ((clientX - rect.left) / rect.width) * WIDTH;
      setLevel(() => xToValue(x, scenario, WIDTH, PAD_LEFT, PAD_RIGHT));
    },
    [scenario, setLevel],
  );

  return (
    <div className="rounded border border-[#bcd5c9] bg-white/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cfe0d8] px-5 py-2.5">
        <div className="flex gap-1 rounded bg-[#eef7f2] p-0.5">
          {SCENARIOS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setScenarioId(entry.id)}
              aria-pressed={entry.id === scenario.id}
              className={`rounded px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition ${
                entry.id === scenario.id
                  ? "bg-white text-[#047857] shadow-[0_1px_4px_rgba(64,86,74,0.12)]"
                  : "text-[#5c6b64] hover:text-[#0c1a15]"
              }`}
            >
              {entry.tab.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] tracking-[0.18em] text-[#a8b8b0]">
          {scenario.header}
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#cfe0d8] border-b border-[#cfe0d8] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Readout label="PREMIUM" value={formatMoney(premium)} note="MAXIMUM COST" accent />
        <Readout
          label={scenario.levelLabel}
          value={formatScenarioValue(level, scenario)}
          note="DRAG TO MOVE"
        />
        <Readout
          label={scenario.boundLabel}
          value={formatScenarioValue(bound, scenario)}
          note="COVER ENDS"
        />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full cursor-ew-resize touch-none select-none"
        role="slider"
        aria-label={`${scenario.levelLabel.toLowerCase()} level`}
        aria-valuemin={scenario.levelMin}
        aria-valuemax={scenario.levelMax}
        aria-valuenow={Number(level.toFixed(2))}
        aria-valuetext={`${scenario.levelLabel} ${formatScenarioValue(level, scenario)}, premium ${formatMoney(premium)}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const delta = event.key === "ArrowRight" ? dragStep : -dragStep;
          setLevel((current) => current + delta);
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setIsDragging(true);
          updateFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (isDragging) updateFromPointer(event.clientX);
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
      >
        {/* Covered band */}
        <rect
          x={bandLeft}
          y={PAD_TOP}
          width={bandWidth}
          height={HEIGHT - PAD_TOP - PAD_BOTTOM}
          fill="#059669"
          fillOpacity={0.1}
        />

        {/* What the number does to you with no cover. */}
        <path d={baselinePath} stroke="#b4715a" strokeWidth={1.75} fill="none" />
        {/* With cover: flat across the covered band. */}
        <path d={hedgedPath} stroke="#059669" strokeWidth={2.5} fill="none" />

        {/* Level handle */}
        <line
          x1={levelX}
          x2={levelX}
          y1={PAD_TOP}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="#047857"
          strokeWidth={1}
          strokeDasharray="4 4"
          strokeOpacity={0.75}
        />
        <rect x={levelX - 5} y={HEIGHT - PAD_BOTTOM - 6} width={10} height={12} fill="#047857" />

        {/* Axis */}
        <line
          x1={PAD_LEFT}
          x2={WIDTH - PAD_RIGHT}
          y1={HEIGHT - PAD_BOTTOM}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="#cfe0d8"
          strokeWidth={1}
        />
        {scenario.ticks.map((tick) => (
          <text
            key={tick}
            x={valueToX(tick, scenario, WIDTH, PAD_LEFT, PAD_RIGHT)}
            y={HEIGHT - 13}
            textAnchor="middle"
            className="fill-[#a8b8b0] font-mono text-[12px]"
          >
            {formatScenarioValue(tick, scenario)}
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#cfe0d8] px-5 py-3 font-mono text-[10px] tracking-[0.18em]">
        <span className="flex items-center gap-2 text-[#5c6b64]">
          <span className="h-0.5 w-5 shrink-0 bg-[#059669]" />
          {scenario.hedgedLabel}
        </span>
        <span className="flex items-center gap-2 text-[#5c6b64]">
          <span className="h-0.5 w-5 shrink-0 bg-[#b4715a]" />
          {scenario.baselineLabel}
        </span>
      </div>
    </div>
  );
}
