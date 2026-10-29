import { formatNumber } from "@/lib/format";
import { ceilingArea, wallArea } from "./area";
import { checkCount, checkMeasure, missing } from "./checks";
import { euro, fmt, plural } from "./explain";
import { type Fraction, add, ceil, div, frac, fromDecimal, mul, roundHalfUp } from "./fraction";
import { laborVatParts, materialVatParts, missingVatRates, vatBreakdown, type VatPart } from "./vat";
import type {
  CalcLine,
  CalcSettings,
  CeilingItem,
  DoorsItem,
  FramesItem,
  Job,
  Material,
  MissingInfo,
  MissingSetting,
  Norm,
  NormKey,
  NormUnit,
  QuoteCalculation,
  SkirtingItem,
  VatConfig,
  VatContext,
  WallsItem,
} from "./types";

export type CalculateQuoteInput = {
  job: Job;
  settings: CalcSettings;
  vat: VatContext;
  vatConfig: VatConfig;
  /** ISO date (yyyy-mm-dd) of the quote; determines which VAT rates apply. */
  quoteDate: string;
};

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

const UNIT_LABELS: Record<NormUnit, string> = {
  m2_per_hour_per_coat: "m²/uur",
  minutes_per_m2: "min/m²",
  hours_per_meter: "uur/m",
  hours_per_piece: "uur/stuk",
  hours_per_piece_per_side: "uur per stuk per kant",
};

type MaterialUse = { label: string; area: Fraction; coats: number };

/**
 * Calculates a complete quote from the structured job description and the painter's own settings.
 * Pure function: no database, no AI, no UI. Missing data is reported, never guessed.
 */
export function calculateQuote({ job, settings, vat, vatConfig, quoteDate }: CalculateQuoteInput): QuoteCalculation {
  const lines: CalcLine[] = [];
  const missingInfo: MissingInfo[] = [];
  const missingSettings = new Map<string, MissingSetting>();
  const warnings = new Set<string>();
  const materialUse = new Map<string, { material: Material; uses: MaterialUse[] }>();

  const rate = settings.hourlyRateCents;
  if (!(rate > 0)) missingSettings.set("hourlyRate", { key: "hourlyRate", message: "Vul bij Instellingen je uurtarief in." });

  function norm(key: NormKey, allowed: NormUnit[]): Norm | null {
    const n = settings.norms[key];
    if (!n || !(n.value > 0)) {
      missingSettings.set(`norm:${key}`, { key: `norm:${key}`, message: `Vul bij Normen in: ${NORM_LABELS[key]}.` });
      return null;
    }
    if (!allowed.includes(n.unit)) {
      missingSettings.set(`norm:${key}`, {
        key: `norm:${key}`,
        message: `De norm "${NORM_LABELS[key]}" staat in ${UNIT_LABELS[n.unit]}, maar hier is nodig: ${allowed.map((u) => UNIT_LABELS[u]).join(" of ")}. Pas de norm aan.`,
      });
      return null;
    }
    return n;
  }

  /** Hours are rounded to 0.01 hour, then multiplied by the hourly rate and rounded to whole cents. */
  function addLabor(room: string, description: string, quantity: number, unit: string, hours: Fraction, steps: string[], hoursText: string) {
    if (!(rate > 0)) return;
    const centiHours = roundHalfUp(mul(hours, frac(100)));
    const amountCents = roundHalfUp(frac(centiHours * rate, 100));
    lines.push({
      room,
      kind: "labor",
      description,
      quantity,
      unit,
      amountCents,
      vatCategory: "labor",
      explanation: [...steps, `${hoursText} = ${fmt(hours)} uur × ${euro(rate)} = ${euro(amountCents)}`],
    });
  }

  function addMinutesPerM2(room: string, description: string, area: Fraction, areaText: string, n: Norm) {
    const minutes = mul(area, fromDecimal(n.value));
    addLabor(room, description, roundedNumber(area), "m²", div(minutes, frac(60)), [areaText], `${fmt(area)} m² × ${formatNumber(n.value)} min/m² = ${fmt(minutes)} min`);
  }

  function surface(room: string, item: WallsItem | CeilingItem) {
    const isWall = item.kind === "walls";
    const result = isWall ? wallArea(item, room) : ceilingArea(item, room);
    if ("missing" in result) {
      missingInfo.push(...result.missing);
      return;
    }
    const { area, explanation: areaText } = result;
    const what = isWall ? "muren" : "plafond";
    const paintKey: NormKey = isWall ? "wall_paint" : "ceiling_paint";
    const coats = item.coats ?? settings.defaultCoats;
    if (item.coats != null) {
      const problem = checkCount(item.coats, room, "coats", "aantal lagen", 10);
      if (problem) {
        missingInfo.push(problem);
        return;
      }
    } else if (!(Number.isInteger(coats) && coats >= 1)) {
      missingSettings.set("defaultCoats", { key: "defaultCoats", message: "Vul bij Instellingen het standaard aantal lagen in." });
      return;
    }
    const coatsText = `${coats} ${plural(coats, "laag", "lagen")}${item.coats == null ? " (standaard)" : ""}`;

    const paint = norm(paintKey, ["m2_per_hour_per_coat"]);
    if (paint) {
      const hours = div(mul(area, frac(coats)), fromDecimal(paint.value));
      addLabor(room, `${isWall ? "Muren" : "Plafond"} sauzen, ${coatsText}`, roundedNumber(area), "m²", hours, [areaText],
        `${fmt(area)} m² × ${coatsText} ÷ ${formatNumber(paint.value)} ${UNIT_LABELS[paint.unit]}`);
    }

    const prep = norm("preparation", ["minutes_per_m2"]);
    if (prep) addMinutesPerM2(room, `Voorbereiding ${what}`, area, areaText, prep);

    if (item.condition?.peeling) {
      const peel = norm("peeling_prep", ["minutes_per_m2"]);
      if (peel) addMinutesPerM2(room, `Extra voorbereiding ${what} (bladderende verf)`, area, areaText, peel);
    }

    if (item.condition?.cracks) {
      const repair = norm("crack_repair", ["minutes_per_m2", "hours_per_meter"]);
      if (repair?.unit === "minutes_per_m2") {
        addMinutesPerM2(room, `Scheuren repareren ${what}`, area, areaText, repair);
      } else if (repair) {
        const length = item.condition.crackLengthM;
        const problem = length == null ? null : checkMeasure(length, room, "crackLengthM", "een scheurlengte", "m");
        if (length == null) {
          missingInfo.push(missing(room, "crackLengthM", `${room}: hoeveel meter scheur zit er in ${what === "plafond" ? "het plafond" : "de muren"}?`));
        } else if (problem) {
          missingInfo.push(problem);
        } else {
          const hours = mul(fromDecimal(length), fromDecimal(repair.value));
          addLabor(room, `Scheuren repareren ${what}`, length, "m", hours, [], `${formatNumber(length)} m × ${formatNumber(repair.value)} uur/m`);
        }
      }
    }

    trackMaterial(room, item, paintKey, what, area, coats);
  }

  function trackMaterial(room: string, item: WallsItem | CeilingItem, workType: NormKey, what: string, area: Fraction, coats: number) {
    const material = item.materialId
      ? settings.materials.find((x) => x.id === item.materialId)
      : settings.materials.find((x) => x.workTypes.includes(workType));
    if (!material) {
      const key = item.materialId ? `material:${item.materialId}` : `material:${workType}`;
      missingSettings.set(key, { key, message: `Voeg bij Materialen een materiaal toe voor: ${NORM_LABELS[workType]}.` });
      return;
    }
    if (material.coverageM2PerUnitPerCoat == null || !(material.coverageM2PerUnitPerCoat > 0)) {
      const key = `coverage:${material.id}`;
      missingSettings.set(key, { key, message: `Vul bij Materialen het verbruik (m² per ${material.unit}) in van ${material.name}.` });
      return;
    }
    const entry = materialUse.get(material.id) ?? { material, uses: [] };
    entry.uses.push({ label: `${room} ${what}`, area, coats });
    materialUse.set(material.id, entry);
  }

  function doors(room: string, item: DoorsItem) {
    const n = norm("door_paint", ["hours_per_piece_per_side", "hours_per_piece"]);
    if (item.count == null) {
      missingInfo.push(missing(room, "count", `${room}: hoeveel deuren zijn het?`));
      return;
    }
    const countProblem = checkCount(item.count, room, "count", "aantal deuren");
    if (countProblem) {
      missingInfo.push(countProblem);
      return;
    }
    const perSide = n?.unit === "hours_per_piece_per_side";
    if (perSide && item.sides == null) {
      missingInfo.push(missing(room, "sides", `${room}: moeten de deuren aan één of aan twee kanten gelakt worden?`));
      return;
    }
    const sidesProblem = perSide ? checkCount(item.sides!, room, "sides", "aantal kanten", 2) : null;
    if (sidesProblem) {
      missingInfo.push(sidesProblem);
      return;
    }
    warnings.add("Materiaal voor deuren, kozijnen en plinten wordt nog niet automatisch berekend. Voeg het zelf toe.");

    const pieces = item.count;
    const sides = perSide ? item.sides! : 1;
    const piecesText = `${pieces} ${plural(pieces, "deur", "deuren")}${perSide ? ` × ${sides} ${plural(sides, "kant", "kanten")}` : ""}`;

    const addDoorLabor = (description: string, x: Norm) => {
      const hours = mul(frac(pieces * sides), fromDecimal(x.value));
      addLabor(room, description, pieces, plural(pieces, "stuk", "stuks"), hours, [], `${piecesText} × ${formatNumber(x.value)} uur`);
    };

    if (n) addDoorLabor(`Deuren lakken${perSide ? `, ${sides} ${plural(sides, "kant", "kanten")}` : ""}`, n);
    if (item.condition?.peeling) {
      const prep = norm("door_peeling_prep", [perSide ? "hours_per_piece_per_side" : "hours_per_piece"]);
      if (prep) addDoorLabor("Extra voorbereiding deuren (bladderende verf)", prep);
    }
  }

  function frames(room: string, item: FramesItem) {
    const n = norm("frame_paint", ["hours_per_meter", "hours_per_piece"]);
    if (!n) return;
    warnings.add("Materiaal voor deuren, kozijnen en plinten wordt nog niet automatisch berekend. Voeg het zelf toe.");
    if (n.unit === "hours_per_meter") {
      if (item.lengthM == null) {
        missingInfo.push(missing(room, "lengthM", `${room}: hoeveel strekkende meter kozijn is het?`));
        return;
      }
      const problem = checkMeasure(item.lengthM, room, "lengthM", "een kozijnlengte", "m");
      if (problem) {
        missingInfo.push(problem);
        return;
      }
      const hours = mul(fromDecimal(item.lengthM), fromDecimal(n.value));
      addLabor(room, "Kozijnen lakken", item.lengthM, "m", hours, [], `${formatNumber(item.lengthM)} m × ${formatNumber(n.value)} uur/m`);
    } else {
      if (item.count == null) {
        missingInfo.push(missing(room, "count", `${room}: hoeveel kozijnen zijn het?`));
        return;
      }
      const problem = checkCount(item.count, room, "count", "aantal kozijnen");
      if (problem) {
        missingInfo.push(problem);
        return;
      }
      const hours = mul(frac(item.count), fromDecimal(n.value));
      addLabor(room, "Kozijnen lakken", item.count, plural(item.count, "stuk", "stuks"), hours, [], `${item.count} × ${formatNumber(n.value)} uur/stuk`);
    }
  }

  function skirting(room: string, item: SkirtingItem) {
    const n = norm("skirting_paint", ["hours_per_meter"]);
    if (!n) return;
    warnings.add("Materiaal voor deuren, kozijnen en plinten wordt nog niet automatisch berekend. Voeg het zelf toe.");
    if (item.lengthM == null) {
      missingInfo.push(missing(room, "lengthM", `${room}: hoeveel strekkende meter plint is het?`));
      return;
    }
    const problem = checkMeasure(item.lengthM, room, "lengthM", "een plintlengte", "m");
    if (problem) {
      missingInfo.push(problem);
      return;
    }
    const hours = mul(fromDecimal(item.lengthM), fromDecimal(n.value));
    addLabor(room, "Plinten lakken", item.lengthM, "m", hours, [], `${formatNumber(item.lengthM)} m × ${formatNumber(n.value)} uur/m`);
  }

  for (const room of job.rooms) {
    for (const item of room.items) {
      switch (item.kind) {
        case "walls":
        case "ceiling":
          surface(room.name, item);
          break;
        case "doors":
          doors(room.name, item);
          break;
        case "frames":
          frames(room.name, item);
          break;
        case "skirting":
          skirting(room.name, item);
          break;
      }
    }
  }

  // Materials are combined per product over the whole quote, so you never pay for a half-used extra package.
  for (const { material, uses } of materialUse.values()) {
    const total = uses.reduce((sum, u) => add(sum, mul(u.area, frac(u.coats))), frac(0));
    const units = div(total, fromDecimal(material.coverageM2PerUnitPerCoat!));
    const packages = ceil(div(units, fromDecimal(material.packageSize)));
    const markup = frac(10000 + settings.materialMarkupBp, 10000);
    const amountCents = roundHalfUp(mul(frac(packages * material.purchasePriceCents), markup));
    const parts = uses.map((u) => `${u.label} ${fmt(u.area)} m² × ${u.coats} ${plural(u.coats, "laag", "lagen")}`);
    const packageText = `${packages} ${plural(packages, "verpakking", "verpakkingen")} van ${formatNumber(material.packageSize)} ${material.unit}`;
    lines.push({
      room: null,
      kind: "material",
      description: material.name,
      quantity: packages,
      unit: plural(packages, "verpakking", "verpakkingen"),
      amountCents,
      vatCategory: "material",
      explanation: [
        `${parts.join(" + ")}${uses.length > 1 || uses[0].coats > 1 ? ` = ${fmt(total)} m²` : ""}`,
        `${fmt(total)} m² ÷ ${formatNumber(material.coverageM2PerUnitPerCoat!)} m² per ${material.unit} = ${fmt(units)} ${material.unit} → ${packageText} (naar boven afgerond)`,
        `${packages} × ${euro(material.purchasePriceCents)} + ${formatNumber(settings.materialMarkupBp / 100)}% opslag = ${euro(amountCents)}`,
      ],
    });
  }

  if (settings.travelCostCents > 0) {
    lines.push({
      room: null,
      kind: "travel",
      description: "Voorrijkosten",
      quantity: 1,
      unit: "keer",
      amountCents: settings.travelCostCents,
      vatCategory: "labor",
      explanation: [`Vast bedrag uit je instellingen: ${euro(settings.travelCostCents)}`],
    });
  }

  const beforeMinimum = sumAmounts(lines);
  if (lines.length > 0 && beforeMinimum < settings.minimumAmountCents) {
    const diff = settings.minimumAmountCents - beforeMinimum;
    lines.push({
      room: null,
      kind: "minimum_charge",
      description: "Aanvulling tot minimumbedrag",
      quantity: 1,
      unit: "keer",
      amountCents: diff,
      vatCategory: "labor",
      explanation: [`Minimumbedrag ${euro(settings.minimumAmountCents)} − subtotaal ${euro(beforeMinimum)} = ${euro(diff)}`],
    });
  }

  const subtotalCents = sumAmounts(lines);

  // VAT
  let vatLines: QuoteCalculation["vat"] = null;
  const labor = laborVatParts(vat, vatConfig, quoteDate);
  if ("missing" in labor) {
    missingInfo.push(...labor.missing);
  } else {
    let materialParts: VatPart[] | null = labor.parts;
    if (lines.some((l) => l.vatCategory === "material")) {
      const m = materialVatParts(settings.materialVatMode, labor.parts);
      if ("missing" in m) {
        missingSettings.set(m.missing.key, m.missing);
        materialParts = null;
      } else {
        materialParts = m.parts;
      }
    }
    const rateProblems = materialParts ? missingVatRates([...labor.parts, ...materialParts], vatConfig, quoteDate) : [];
    rateProblems.forEach((p) => missingSettings.set(p.key, p));
    if (materialParts && rateProblems.length === 0) {
      vatLines = vatBreakdown(lines, { labor: labor.parts, material: materialParts }, vatConfig, quoteDate);
    }
  }

  const vatCents = vatLines ? vatLines.reduce((sum, v) => sum + v.vatCents, 0) : null;
  const missingSettingsList = [...missingSettings.values()];

  return {
    lines,
    missingInfo,
    missingSettings: missingSettingsList,
    warnings: [...warnings],
    subtotalCents,
    vat: vatLines,
    vatCents,
    totalCents: vatCents === null ? null : subtotalCents + vatCents,
    complete: missingInfo.length === 0 && missingSettingsList.length === 0,
  };
}

function sumAmounts(lines: CalcLine[]): number {
  return lines.reduce((sum, l) => sum + l.amountCents, 0);
}

/** Areas are already rounded to 0.01 m², so this conversion is exact enough for the quantity column. */
function roundedNumber(f: Fraction): number {
  return roundHalfUp(mul(f, frac(100))) / 100;
}
