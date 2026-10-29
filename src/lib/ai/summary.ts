// Plain Dutch summary of what the AI understood, so the painter can check it at a glance.
import { formatNumber } from "@/lib/format";
import type { Extraction } from "./extraction";

type Item = Extraction["rooms"][number]["items"][number];

const m = (v: number | null) => (v === null ? null : `${formatNumber(v, 3)} m`);
const missing = "ontbreekt";

export function summarizeItem(i: Item): string {
  const parts: string[] = [];
  switch (i.kind) {
    case "walls":
    case "ceiling": {
      parts.push(i.kind === "walls" ? "Muren sauzen" : "Plafond sauzen");
      if (i.areaM2 !== null) parts.push(`${formatNumber(i.areaM2)} m²`);
      else parts.push(`${m(i.lengthM) ?? `lengte ${missing}`} × ${m(i.widthM) ?? `breedte ${missing}`}`);
      if (i.kind === "walls" && i.areaM2 === null) parts.push(i.heightM !== null ? `${m(i.heightM)} hoog` : `hoogte ${missing}`);
      const openings = i.openings.reduce((n, o) => n + o.count, 0);
      if (openings > 0) parts.push(`${openings} ${openings === 1 ? "raam/deur" : "ramen/deuren"} eraf`);
      parts.push(i.coats !== null ? `${i.coats} ${i.coats === 1 ? "laag" : "lagen"}` : "lagen: standaard");
      break;
    }
    case "doors":
      parts.push("Deuren lakken", i.count !== null ? `${i.count} stuks` : `aantal ${missing}`);
      if (i.sides !== null) parts.push(i.sides === 2 ? "twee kanten" : "één kant");
      break;
    case "frames":
      parts.push("Kozijnen lakken");
      if (i.count !== null) parts.push(`${i.count} stuks`);
      if (i.lengthM !== null) parts.push(`${m(i.lengthM)}`);
      break;
    case "skirting":
      parts.push("Plinten lakken", i.lengthM !== null ? `${m(i.lengthM)}` : `lengte ${missing}`);
      break;
  }
  if (i.cracks) parts.push("scheuren repareren");
  if (i.peeling) parts.push("verf bladdert");
  return parts.join(" · ");
}

export function summarizeVat(v: Extraction["vat"]): string {
  if (v.usageType === null) return "Niet genoemd";
  const type = v.usageType === "residential" ? "Woning" : v.usageType === "mixed" ? `Gemengd gebruik${v.residentialSharePct !== null ? `, ${v.residentialSharePct}% wonen` : ""}` : "Geen woning";
  if (v.usageType === "non_residential") return type;
  const age = v.dwellingOlderThanTwoYears === null ? "leeftijd niet genoemd" : v.dwellingOlderThanTwoYears ? "2 jaar of ouder" : "jonger dan 2 jaar";
  return `${type}, ${age}`;
}
