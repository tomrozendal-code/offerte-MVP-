import { formatNumber } from "@/lib/format";
import { checkCount, checkMeasure, invalid, missing } from "./checks";
import { fmt } from "./explain";
import { type Fraction, add, compare, frac, fromDecimal, mul, roundHalfUp, sub } from "./fraction";
import type { CeilingItem, MissingInfo, WallsItem } from "./types";

export type AreaResult = { area: Fraction; explanation: string } | { missing: MissingInfo[] };

/** Areas are rounded to 0.01 m² so every following step can be checked with the displayed number. */
function roundArea(f: Fraction): Fraction {
  return frac(roundHalfUp(mul(f, frac(100))), 100);
}

const m = (value: number) => formatNumber(value, 3);

const notNull = <T>(x: T | null): x is T => x !== null;

/** Wall area: perimeter × height, minus the openings (windows, doors) that were mentioned. */
export function wallArea(item: WallsItem, room: string): AreaResult {
  if (item.areaM2 != null) {
    const problem = checkMeasure(item.areaM2, room, "areaM2", "een muuroppervlak", "m²");
    if (problem) return { missing: [problem] };
    const area = roundArea(fromDecimal(item.areaM2));
    return { area, explanation: `Muren: ${fmt(area)} m² (opgegeven)` };
  }

  const problems: MissingInfo[] = [];
  if (item.lengthM == null || item.widthM == null) {
    problems.push(missing(room, "lengthM", `${room}: hoe lang en hoe breed is de ruimte?`));
  }
  if (item.heightM == null) {
    problems.push(missing(room, "heightM", `${room}: hoe hoog zijn de muren?`));
  }
  problems.push(
    ...[
      item.lengthM != null ? checkMeasure(item.lengthM, room, "lengthM", "een lengte", "m") : null,
      item.widthM != null ? checkMeasure(item.widthM, room, "widthM", "een breedte", "m") : null,
      item.heightM != null ? checkMeasure(item.heightM, room, "heightM", "een hoogte", "m") : null,
    ].filter(notNull),
  );

  const openings = item.openings ?? [];
  openings.forEach((o, i) => {
    const field = `openings.${i}`;
    if (o.widthM == null || o.heightM == null) {
      problems.push(missing(room, field, `${room}: hoe breed en hoe hoog is raam of deur ${i + 1}?`));
      return;
    }
    problems.push(
      ...[
        checkMeasure(o.widthM, room, field, `raam of deur ${i + 1} met een breedte`, "m"),
        checkMeasure(o.heightM, room, field, `raam of deur ${i + 1} met een hoogte`, "m"),
        o.count !== undefined ? checkCount(o.count, room, field, `het aantal ramen of deuren`) : null,
      ].filter(notNull),
    );
  });
  if (problems.length > 0) return { missing: problems };

  const length = fromDecimal(item.lengthM!);
  const width = fromDecimal(item.widthM!);
  const height = fromDecimal(item.heightM!);
  const perimeter = mul(frac(2), add(length, width));
  const gross = mul(perimeter, height);

  let openingsArea = frac(0);
  const openingTexts: string[] = [];
  for (const o of openings) {
    const count = o.count ?? 1;
    openingsArea = add(openingsArea, mul(frac(count), mul(fromDecimal(o.widthM!), fromDecimal(o.heightM!))));
    openingTexts.push(`${count} × ${m(o.widthM!)} × ${m(o.heightM!)} m`);
  }

  const net = roundArea(sub(gross, openingsArea));
  if (compare(net, frac(0)) <= 0) {
    return { missing: [invalid(room, "openings", `${room}: de ramen en deuren zijn samen groter dan de muren. Kloppen de maten?`)] };
  }

  let explanation = `Muren: omtrek 2 × (${m(item.lengthM!)} + ${m(item.widthM!)}) = ${fmt(perimeter)} m × ${m(item.heightM!)} m hoog = ${fmt(gross)} m²`;
  if (openings.length > 0) {
    explanation += ` − openingen (${openingTexts.join(" + ")}) ${fmt(openingsArea)} m² = ${fmt(net)} m²`;
  }
  return { area: net, explanation };
}

/** Ceiling area: length × width. */
export function ceilingArea(item: CeilingItem, room: string): AreaResult {
  if (item.areaM2 != null) {
    const problem = checkMeasure(item.areaM2, room, "areaM2", "een plafondoppervlak", "m²");
    if (problem) return { missing: [problem] };
    const area = roundArea(fromDecimal(item.areaM2));
    return { area, explanation: `Plafond: ${fmt(area)} m² (opgegeven)` };
  }
  if (item.lengthM == null || item.widthM == null) {
    return { missing: [missing(room, "lengthM", `${room}: hoe lang en hoe breed is het plafond?`)] };
  }
  const problems = [
    checkMeasure(item.lengthM, room, "lengthM", "een lengte", "m"),
    checkMeasure(item.widthM, room, "widthM", "een breedte", "m"),
  ].filter(notNull);
  if (problems.length > 0) return { missing: problems };

  const area = roundArea(mul(fromDecimal(item.lengthM), fromDecimal(item.widthM)));
  return { area, explanation: `Plafond: ${m(item.lengthM)} × ${m(item.widthM)} m = ${fmt(area)} m²` };
}
