// Work description per room (CLAUDE.md 11.4). The AI writes the text, but this module decides what
// it may say: we hand it plain facts, and check its text afterwards. A text with amounts or invented
// quantities is never shown; a plain template is used instead.
import { formatNumber } from "@/lib/format";
import type { Job, QuoteCalculation } from "@/lib/calc/types";

type RoomFacts = { name: string; facts: string[]; numbers: number[] };

/** Facts per room, without any prices or hours: only what the painter said plus calculated areas. */
export function roomFacts(job: Job, calc: QuoteCalculation, materialNames: string[]): RoomFacts[] {
  return job.rooms.map((room) => {
    const facts: string[] = [];
    const numbers: number[] = [];
    const areaOf = (prefix: string) => calc.lines.find((l) => l.room === room.name && l.description.startsWith(prefix))?.quantity;

    for (const item of room.items) {
      if (item.kind === "walls" || item.kind === "ceiling") {
        const isWall = item.kind === "walls";
        const area = areaOf(isWall ? "Muren sauzen" : "Plafond sauzen");
        const coats = item.coats ?? null;
        let fact = isWall ? "muren sauzen" : "plafond sauzen";
        if (area !== undefined) {
          fact += ` (${formatNumber(area)} m²)`;
          numbers.push(area);
        }
        if (coats !== null) {
          fact += `, ${coats} lagen`;
          numbers.push(coats);
        } else {
          const line = calc.lines.find((l) => l.room === room.name && l.description.startsWith(isWall ? "Muren sauzen" : "Plafond sauzen"));
          const m = line?.description.match(/(\d+) lag/);
          if (m) {
            fact += `, ${m[1]} lagen`;
            numbers.push(Number(m[1]));
          }
        }
        facts.push(fact);
        if (calc.lines.some((l) => l.room === room.name && l.description === `Voorbereiding ${isWall ? "muren" : "plafond"}`)) {
          facts.push(`${isWall ? "muren" : "plafond"} voorbereiden (schoonmaken, schuren, vullen)`);
        }
        if (item.condition?.cracks) facts.push(`scheuren in ${isWall ? "de muren" : "het plafond"} repareren`);
        if (item.condition?.peeling) facts.push(`loszittende verf op ${isWall ? "de muren" : "het plafond"} verwijderen`);
      } else if (item.kind === "doors") {
        let fact = "deuren lakken";
        if (item.count != null) {
          fact = `${item.count} deuren lakken`;
          numbers.push(item.count);
        }
        if (item.sides != null) {
          fact += `, ${item.sides === 2 ? "aan beide kanten" : "aan één kant"}`;
        }
        facts.push(fact);
        if (item.condition?.peeling) facts.push("loszittende verf op de deuren verwijderen");
      } else if (item.kind === "frames") {
        facts.push("kozijnen lakken");
      } else {
        facts.push("plinten lakken");
      }
    }
    if (materialNames.length > 0) facts.push(`verf: ${materialNames.join(", ")}`);
    return { name: room.name, facts, numbers };
  });
}

/** The facts as the AI gets them. */
export function factsText(rooms: RoomFacts[]): string {
  return rooms.map((r) => `${r.name}:\n${r.facts.map((f) => `- ${f}`).join("\n")}`).join("\n\n");
}

export type DescriptionCheck = { ok: true } | { ok: false; problems: string[] };

/**
 * Rejects a text with euro amounts, prices or hours, or with numbers that are not in the facts.
 * Material names (e.g. "10 liter") may contain numbers too, so those are allowed as well.
 */
export function checkDescription(text: string, allowedNumbers: number[], materialNames: string[] = []): DescriptionCheck {
  const problems: string[] = [];
  if (/€|\beuro\b|\bEUR\b/i.test(text)) problems.push("bevat een bedrag");
  if (/\b(uur|uren|tarief|prijs|kosten|btw)\b/i.test(text)) problems.push("noemt uren, prijzen of btw");
  if (/\b(garantie|gegarandeerd|planning|klaar binnen|binnen \w+ dagen|doorlooptijd)\b/i.test(text)) problems.push("doet een belofte over garantie of planning");

  const fromMaterials = new Set(materialNames.flatMap((n) => [...n.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(",", ".")))));
  const allowed = new Set([...allowedNumbers, ...fromMaterials].map((n) => Math.round(n * 1000)));
  // Numbers like "43,2" or "20"; m² after a number is part of the same mention.
  for (const m of text.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const value = Number(m[0].replace(".", "").replace(",", "."));
    const plain = Number(m[0].replace(",", "."));
    if (!allowed.has(Math.round(value * 1000)) && !allowed.has(Math.round(plain * 1000))) {
      problems.push(`noemt het getal ${m[0]}, dat niet in de gegevens staat`);
    }
  }
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

/** Plain fallback text, used when the AI text does not pass the check or the AI is unavailable. */
export function templateDescription(rooms: RoomFacts[]): string {
  return rooms
    .map((r) => {
      const list = r.facts.filter((f) => !f.startsWith("verf:"));
      const paint = r.facts.find((f) => f.startsWith("verf:"));
      const sentence = list.length > 1 ? `${list.slice(0, -1).join(", ")} en ${list[list.length - 1]}` : (list[0] ?? "");
      return `${r.name}: wij gaan ${sentence}.${paint ? ` We gebruiken ${paint.slice(6)}.` : ""}`;
    })
    .join("\n\n");
}
