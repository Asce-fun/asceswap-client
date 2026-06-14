export type MarketRuntimeStatus = "Live" | "Opening" | "Closing soon" | "Settles soon";

export type MarketTimelinePhase = "upcoming" | "live" | "ended";

export type MarketTimelineInput = Readonly<{
  startTimestamp: number;
  endTimestamp: number;
}>;

export type MarketTimeline = Readonly<{
  phase: MarketTimelinePhase;
  status: MarketRuntimeStatus;
  targetTimestamp: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  totalSeconds: number;
}>;

const secondMs = 1000;
const closingSoonSeconds = 24 * 60 * 60;

export function getMarketTimeline(market: MarketTimelineInput, nowMs = Date.now()): MarketTimeline {
  const startMs = market.startTimestamp * secondMs;
  const endMs = market.endTimestamp * secondMs;
  const totalSeconds = Math.max(market.endTimestamp - market.startTimestamp, 0);

  if (nowMs < startMs) {
    return {
      phase: "upcoming",
      status: "Opening",
      targetTimestamp: market.startTimestamp,
      remainingSeconds: Math.max(Math.ceil((startMs - nowMs) / secondMs), 0),
      elapsedSeconds: 0,
      totalSeconds,
    };
  }

  if (nowMs >= endMs || totalSeconds === 0) {
    return {
      phase: "ended",
      status: "Settles soon",
      targetTimestamp: market.endTimestamp,
      remainingSeconds: 0,
      elapsedSeconds: totalSeconds,
      totalSeconds,
    };
  }

  const remainingSeconds = Math.max(Math.ceil((endMs - nowMs) / secondMs), 0);

  return {
    phase: "live",
    status: remainingSeconds <= closingSoonSeconds ? "Closing soon" : "Live",
    targetTimestamp: market.endTimestamp,
    remainingSeconds,
    elapsedSeconds: Math.min(Math.max(Math.floor((nowMs - startMs) / secondMs), 0), totalSeconds),
    totalSeconds,
  };
}

export function formatCountdown(totalSeconds: number) {
  const clampedSeconds = Math.max(Math.floor(totalSeconds), 0);
  const days = Math.floor(clampedSeconds / 86_400);
  const hours = Math.floor((clampedSeconds % 86_400) / 3_600);
  const minutes = Math.floor((clampedSeconds % 3_600) / 60);
  const seconds = clampedSeconds % 60;
  const clock = [hours, minutes, seconds].map((value) => value.toString().padStart(2, "0")).join(":");

  return days > 0 ? `${days}d ${clock}` : clock;
}

export function formatMarketDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp * secondMs));
}
