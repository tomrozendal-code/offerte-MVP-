// Compares the AI's answer with the expected answer for one eval case. Strict on what matters most:
// a number that was not said must stay null (never invented), and every said number must be right.
import type { Extraction } from "../src/lib/ai/extraction";

type Item = Extraction["rooms"][number]["items"][number];

const NUM_FIELDS = ["lengthM", "widthM", "heightM", "areaM2", "coats", "count", "sides", "crackLengthM"] as const;
const BOOL_FIELDS = ["cracks", "peeling"] as const;

const sameNumber = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(a - b) < 0.001);

function sameOpenings(a: Item["openings"], b: Item["openings"]): boolean {
  const key = (o: Item["openings"][number]) => `${o.widthM}x${o.heightM}`;
  const expand = (list: Item["openings"]) => list.flatMap((o) => Array.from({ length: o.count }, () => key(o))).sort();
  return JSON.stringify(expand(a)) === JSON.stringify(expand(b));
}

/** Rooms named "Ruimte N" in the expected answer may have any name (the painter named none). */
function sameRoomName(expected: string, actual: string) {
  return /^Ruimte \d+$/.test(expected) || expected.trim().toLowerCase() === actual.trim().toLowerCase();
}

export function compareExtraction(expected: Extraction, actual: Extraction): string[] {
  const diffs: string[] = [];
  if (expected.rooms.length !== actual.rooms.length) {
    diffs.push(`aantal ruimtes: verwacht ${expected.rooms.length}, kreeg ${actual.rooms.length}`);
  }
  expected.rooms.forEach((er, ri) => {
    const ar = actual.rooms[ri];
    if (!ar) return;
    if (!sameRoomName(er.name, ar.name)) diffs.push(`ruimte ${ri + 1}: naam "${er.name}" ≠ "${ar.name}"`);
    const byKind = (items: Item[]) => [...items].sort((a, b) => a.kind.localeCompare(b.kind));
    const ei = byKind(er.items);
    const ai = byKind(ar.items);
    if (ei.length !== ai.length || ei.some((x, i) => x.kind !== ai[i].kind)) {
      diffs.push(`${er.name}: onderdelen ${ei.map((x) => x.kind).join(",")} ≠ ${ai.map((x) => x.kind).join(",")}`);
      return;
    }
    ei.forEach((e, i) => {
      const a = ai[i];
      for (const f of NUM_FIELDS) {
        if (!sameNumber(e[f], a[f])) {
          diffs.push(`${er.name}/${e.kind}.${f}: verwacht ${e[f]}, kreeg ${a[f]}${e[f] === null ? " (verzonnen!)" : ""}`);
        }
      }
      for (const f of BOOL_FIELDS) if (e[f] !== a[f]) diffs.push(`${er.name}/${e.kind}.${f}: verwacht ${e[f]}, kreeg ${a[f]}`);
      if (!sameOpenings(e.openings, a.openings)) {
        diffs.push(`${er.name}/${e.kind}.openings: verwacht ${JSON.stringify(e.openings)}, kreeg ${JSON.stringify(a.openings)}`);
      }
    });
  });

  for (const f of ["usageType", "dwellingOlderThanTwoYears", "residentialSharePct"] as const) {
    if (expected.vat[f] !== actual.vat[f]) diffs.push(`btw.${f}: verwacht ${expected.vat[f]}, kreeg ${actual.vat[f]}`);
  }
  for (const f of ["name", "address"] as const) {
    const e = expected.client[f];
    const a = actual.client[f];
    if (e === null && a !== null) diffs.push(`klant.${f}: verwacht leeg, kreeg "${a}" (verzonnen!)`);
    if (e !== null && (a === null || !a.toLowerCase().includes(e.toLowerCase()))) diffs.push(`klant.${f}: verwacht "${e}", kreeg ${a === null ? "leeg" : `"${a}"`}`);
  }
  if (expected.notUnderstood.length > 0 && actual.notUnderstood.length === 0) {
    diffs.push(`niet verwerkt: verwacht een melding (${expected.notUnderstood.join("; ")}), kreeg niets`);
  }
  if (expected.notUnderstood.length === 0 && actual.notUnderstood.length > 0) {
    diffs.push(`niet verwerkt: verwacht niets, kreeg "${actual.notUnderstood.join("; ")}"`);
  }
  return diffs;
}
