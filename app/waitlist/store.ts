import { promises as fs } from "fs";
import path from "path";

interface Entry {
  email: string;
  /** The number the signup says they're exposed to. Optional, free text. */
  exposure?: string;
  ts: string;
}

export type SaveResult = "added" | "exists";

export const MAX_EXPOSURE_LENGTH = 120;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Trims and lowercases an address, returning null when it is not usable.
 *
 * Callers must normalize before validating: the pattern rejects surrounding
 * whitespace, so a pasted address with a trailing space would otherwise be
 * turned away as invalid.
 */
export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return isValidEmail(normalized) ? normalized : null;
}

/** Trims and length-caps the free-text exposure. Empty input becomes undefined. */
export function normalizeExposure(exposure: unknown): string | undefined {
  if (typeof exposure !== "string") return undefined;
  const trimmed = exposure.trim().slice(0, MAX_EXPOSURE_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * The only place that touches storage. Posts to a Google Sheet web app when
 * WAITLIST_SHEET_URL is set; otherwise falls back to a local JSON file so dev
 * and tests work with no configuration.
 */
export async function saveEmail(email: string, exposure?: string): Promise<SaveResult> {
  const normalized = email.trim().toLowerCase();
  const normalizedExposure = normalizeExposure(exposure);
  if (process.env.WAITLIST_SHEET_URL) return saveToSheet(normalized, normalizedExposure);
  return saveToFile(normalized, normalizedExposure);
}

async function saveToSheet(email: string, exposure?: string): Promise<SaveResult> {
  const response = await fetch(process.env.WAITLIST_SHEET_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, exposure, secret: process.env.WAITLIST_SHEET_SECRET ?? "" }),
    // Apps Script web apps 302-redirect to their content host; fetch follows it.
    redirect: "follow",
  });

  if (!response.ok) throw new Error(`Waitlist sheet responded ${response.status}.`);

  const data = (await response.json()) as { status?: SaveResult; error?: string };
  if (data.error) throw new Error(data.error);

  return data.status === "exists" ? "exists" : "added";
}

async function saveToFile(email: string, exposure?: string): Promise<SaveResult> {
  const file = process.env.WAITLIST_FILE ?? path.join(process.cwd(), "data", "waitlist.json");
  await fs.mkdir(path.dirname(file), { recursive: true });

  let entries: Entry[] = [];
  try {
    entries = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    // First signup — the file does not exist yet.
  }

  if (entries.some((entry) => entry.email === email)) return "exists";

  entries.push({ email, exposure, ts: new Date().toISOString() });
  await fs.writeFile(file, JSON.stringify(entries, null, 2));

  return "added";
}
