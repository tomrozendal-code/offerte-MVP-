// Input and output types of the calculation module.
// Lengths are in metres, as spoken by the painter; null means "not given" and is never guessed.

export type NormKey =
  | "wall_paint" // walls, per coat
  | "ceiling_paint" // ceilings, per coat
  | "preparation" // standard preparation of walls and ceilings
  | "peeling_prep" // extra preparation for peeling paint on walls and ceilings
  | "crack_repair" // repairing cracks
  | "door_paint" // painting doors
  | "door_peeling_prep" // extra preparation for peeling paint on doors
  | "frame_paint" // window and door frames
  | "skirting_paint"; // skirting boards

export type NormUnit =
  | "m2_per_hour_per_coat"
  | "minutes_per_m2"
  | "hours_per_meter"
  | "hours_per_piece"
  | "hours_per_piece_per_side";

export type Norm = { unit: NormUnit; value: number };

export type Material = {
  id: string;
  name: string;
  unit: "liter" | "kg" | "stuk" | "rol";
  /** Content of one package, in `unit` (e.g. 10 liter per bucket). */
  packageSize: number;
  /** Purchase price per package, excl. VAT. */
  purchasePriceCents: number;
  /** m² per unit per coat; null if the material is not used per m². */
  coverageM2PerUnitPerCoat: number | null;
  workTypes: NormKey[];
};

export type MaterialVatMode = "follow_labor" | "always_standard";

export type CalcSettings = {
  hourlyRateCents: number;
  /** Markup on materials in basis points (1500 = 15%). */
  materialMarkupBp: number;
  travelCostCents: number;
  minimumAmountCents: number;
  /** Number of coats used when the painter does not mention it. Set by the painter. */
  defaultCoats: number;
  norms: Partial<Record<NormKey, Norm>>;
  materials: Material[];
  /** How VAT applies to materials. null = not chosen yet (no assumption, CLAUDE.md 4.2). */
  materialVatMode: MaterialVatMode | null;
};

export type Condition = {
  cracks?: boolean;
  /** Length of the cracks, only needed if the crack norm is per metre. */
  crackLengthM?: number | null;
  peeling?: boolean;
};

export type Opening = { widthM: number | null; heightM: number | null; count?: number };

type Surface = {
  coats?: number | null;
  condition?: Condition;
  /** Material to use; otherwise the first material linked to the work type. */
  materialId?: string;
  /** Total area if the painter gives it directly instead of dimensions. */
  areaM2?: number | null;
};

export type WallsItem = Surface & {
  kind: "walls";
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
  openings?: Opening[];
};

export type CeilingItem = Surface & { kind: "ceiling"; lengthM?: number | null; widthM?: number | null };

export type DoorsItem = { kind: "doors"; count?: number | null; sides?: number | null; condition?: Condition };

export type FramesItem = { kind: "frames"; count?: number | null; lengthM?: number | null };

export type SkirtingItem = { kind: "skirting"; lengthM?: number | null };

export type JobItem = WallsItem | CeilingItem | DoorsItem | FramesItem | SkirtingItem;

export type Room = { name: string; items: JobItem[] };

export type Job = { rooms: Room[] };

export type UsageType = "residential" | "mixed" | "non_residential";

/** Answers to the VAT questions on a new quote (CLAUDE.md 4.3). */
export type VatContext = {
  usageType: UsageType | null;
  dwellingOlderThanTwoYears: boolean | null;
  /** Share of the building used as a home, 0–100. Only for mixed use. */
  residentialSharePct: number | null;
};

export type VatRate = { code: "reduced" | "standard"; rateBp: number; validFrom: string; validTo: string | null };

/** Comes from the database tables vat_rates and vat_rules, so law changes need no code change. */
export type VatConfig = { rates: VatRate[]; mixedUseSplitFrom: string };

export type LineKind = "labor" | "material" | "travel" | "minimum_charge";

export type CalcLine = {
  room: string | null;
  kind: LineKind;
  description: string;
  quantity: number;
  unit: string;
  amountCents: number;
  /** Labor-like lines (incl. travel and minimum charge) follow the labor VAT; materials follow the material setting. */
  vatCategory: "labor" | "material";
  /** Human-readable calculation steps (CLAUDE.md rule 3). */
  explanation: string[];
};

/**
 * Something about the job the app cannot calculate. Nothing is ever guessed instead:
 * - missing: information was not given ("hoe hoog zijn de muren?");
 * - invalid: a given value is impossible (a height of 0, half a door);
 * - unsupported: the situation is outside what the app can calculate.
 */
export type MissingInfo = { room: string | null; field: string; question: string; reason: "missing" | "invalid" | "unsupported" };

/** A setting that is missing or unusable: the painter has to fix it under Instellingen. */
export type MissingSetting = { key: string; message: string };

export type VatLine = { rateBp: number; baseCents: number; vatCents: number };

export type QuoteCalculation = {
  lines: CalcLine[];
  missingInfo: MissingInfo[];
  missingSettings: MissingSetting[];
  warnings: string[];
  subtotalCents: number;
  /** null as long as the VAT questions or settings are incomplete. */
  vat: VatLine[] | null;
  vatCents: number | null;
  totalCents: number | null;
  /** True when nothing is missing and the quote can be sent. */
  complete: boolean;
};
