// Runs every eval case against the real AI and reports how many are correct (goal: at least 9 of 10).
// Also checks the work description for test case 1 (CLAUDE.md 11.7, case 10).
// Costs a few cents per run. Usage: npm run evals
import { anthropicDescriber, anthropicStructurer } from "../src/lib/ai/anthropic";
import { checkDescription, factsText, roomFacts } from "../src/lib/ai/description";
import { toJob, toVatContext } from "../src/lib/ai/extraction";
import { calculateQuote } from "../src/lib/calc";
import { QUOTE_DATE, exampleSettings, vatConfig } from "../src/lib/calc/fixtures";
import { CASES } from "./cases";
import { compareExtraction } from "./compare";

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("ANTHROPIC_API_KEY ontbreekt in .env.local. Zonder sleutel kunnen de evals niet draaien.");
  process.exit(2);
}

let passed = 0;
let costMicrocents = 0;

for (const c of CASES) {
  try {
    const { extraction, usage } = await anthropicStructurer.structure(c.input);
    costMicrocents += usage.costMicrocents;
    const diffs = compareExtraction(c.expected, extraction);
    if (diffs.length === 0) passed++;
    console.log(`${diffs.length === 0 ? "✓" : "✗"} ${c.id}`);
    for (const d of diffs) console.log(`    ${d}`);
  } catch (error) {
    console.log(`✗ ${c.id}: ${(error as Error).message}`);
  }
}

// Work description for case 1: no euro amounts, no other numbers than 43,2 m², 20 m² and the coats.
const job = toJob(CASES[0].expected);
const calc = calculateQuote({ job, settings: exampleSettings, vat: toVatContext(CASES[0].expected), vatConfig, quoteDate: QUOTE_DATE });
const rooms = roomFacts(job, calc, ["Muurverf"]);
const { text, usage } = await anthropicDescriber.describe(factsText(rooms));
costMicrocents += usage.costMicrocents;
const check = checkDescription(text, rooms.flatMap((r) => r.numbers), ["Muurverf"]);
console.log(`\n${check.ok ? "✓" : "✗"} werkomschrijving testcase 1${check.ok ? "" : ": " + check.problems.join("; ")}`);
console.log(text.replace(/^/gm, "    "));

console.log(`\nResultaat: ${passed} van ${CASES.length} goed (doel: minstens 9 van 10). Werkomschrijving: ${check.ok ? "goed" : "fout"}.`);
console.log(`Kosten van deze run: $${(costMicrocents / 1e8).toFixed(4)}`);
process.exit(passed >= Math.ceil(CASES.length * 0.9) && check.ok ? 0 : 1);
