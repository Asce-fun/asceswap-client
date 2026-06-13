// Pure math for the landing page's draggable cap-line interaction.
// The chart plots a rate in percent on a fixed 0–10 domain.

export const RATE_MIN = 0;
export const RATE_MAX = 10;

// Keep the draggable line away from the chart edges so it always
// reads as a boundary with rate movement on both sides.
export const CAP_MIN = 1;
export const CAP_MAX = 9;
export const DEFAULT_CAP = 4.2;

export const PAD_TOP = 24;
export const PAD_BOTTOM = 36;

export function clampCap(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CAP;
  return Math.min(Math.max(value, CAP_MIN), CAP_MAX);
}

export function capToY(
  cap: number,
  height: number,
  padTop: number = PAD_TOP,
  padBottom: number = PAD_BOTTOM,
): number {
  const usable = height - padTop - padBottom;
  const fraction = (cap - RATE_MIN) / (RATE_MAX - RATE_MIN);
  return padTop + (1 - fraction) * usable;
}

export function yToCap(
  y: number,
  height: number,
  padTop: number = PAD_TOP,
  padBottom: number = PAD_BOTTOM,
): number {
  const usable = height - padTop - padBottom;
  const fraction = 1 - (y - padTop) / usable;
  return clampCap(RATE_MIN + fraction * (RATE_MAX - RATE_MIN));
}

export function coverageLabel(cap: number): string {
  return `If the rate finishes above ${cap.toFixed(1)}%, your hedge pays.`;
}
