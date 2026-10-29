// Input checks. Instead of guessing or crashing, impossible values become a question for the painter.
import { formatNumber } from "@/lib/format";
import type { MissingInfo } from "./types";

export const missing = (room: string | null, field: string, question: string): MissingInfo => ({ room, field, question, reason: "missing" });

export const invalid = (room: string | null, field: string, question: string): MissingInfo => ({ room, field, question, reason: "invalid" });

export const unsupported = (room: string | null, field: string, question: string): MissingInfo => ({ room, field, question, reason: "unsupported" });

/** A measurement in metres or m² must be a number above zero. */
export function checkMeasure(value: number, room: string, field: string, label: string, unit: string): MissingInfo | null {
  if (Number.isFinite(value) && value > 0) return null;
  return invalid(room, field, `${room}: ${label} van ${formatNumber(value)} ${unit} kan niet kloppen. Wat is de juiste maat?`);
}

/** A count (doors, coats, sides) must be a whole number of at least 1, and at most `max` if given. */
export function checkCount(value: number, room: string, field: string, label: string, max?: number): MissingInfo | null {
  if (Number.isInteger(value) && value >= 1 && (max === undefined || value <= max)) return null;
  return invalid(room, field, `${room}: ${label} "${formatNumber(value)}" kan niet kloppen. Wat is het juiste aantal?`);
}
