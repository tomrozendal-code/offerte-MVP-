// Work types, their Dutch labels and the units a painter may choose per work type.
import type { NormKey, NormUnit } from "./types";

export const NORM_KEYS: NormKey[] = [
  "wall_paint",
  "ceiling_paint",
  "preparation",
  "peeling_prep",
  "crack_repair",
  "door_paint",
  "door_peeling_prep",
  "frame_paint",
  "skirting_paint",
];

export const NORM_LABELS: Record<NormKey, string> = {
  wall_paint: "Muur sauzen",
  ceiling_paint: "Plafond sauzen",
  preparation: "Voorbereiding",
  peeling_prep: "Extra voorbereiding bij bladderende verf",
  crack_repair: "Scheuren repareren",
  door_paint: "Deur lakken",
  door_peeling_prep: "Extra voorbereiding deuren bij bladderende verf",
  frame_paint: "Kozijn lakken",
  skirting_paint: "Plinten",
};

export const NORM_UNITS: Record<NormKey, NormUnit[]> = {
  wall_paint: ["m2_per_hour_per_coat"],
  ceiling_paint: ["m2_per_hour_per_coat"],
  preparation: ["minutes_per_m2"],
  peeling_prep: ["minutes_per_m2"],
  crack_repair: ["minutes_per_m2", "hours_per_meter"],
  door_paint: ["hours_per_piece_per_side", "hours_per_piece"],
  door_peeling_prep: ["hours_per_piece_per_side", "hours_per_piece"],
  frame_paint: ["hours_per_meter", "hours_per_piece"],
  skirting_paint: ["hours_per_meter"],
};

export const UNIT_LABELS: Record<NormUnit, string> = {
  m2_per_hour_per_coat: "m²/uur",
  minutes_per_m2: "min/m²",
  hours_per_meter: "uur/m",
  hours_per_piece: "uur/stuk",
  hours_per_piece_per_side: "uur per stuk per kant",
};

/** Longer explanation shown on the settings screen. */
export const UNIT_HINTS: Record<NormUnit, string> = {
  m2_per_hour_per_coat: "m² per uur, per laag",
  minutes_per_m2: "minuten per m²",
  hours_per_meter: "uur per strekkende meter",
  hours_per_piece: "uur per stuk",
  hours_per_piece_per_side: "uur per stuk, per kant",
};
