// Eval cases (CLAUDE.md phase 3): what a painter says, and what the AI must make of it.
// Cases 1–5 are the test cases from CLAUDE.md chapter 8. Expected values contain only what was said.
import type { Extraction } from "../src/lib/ai/extraction";

type Item = Extraction["rooms"][number]["items"][number];

const item = (over: Partial<Item> & Pick<Item, "kind">): Item => ({
  lengthM: null,
  widthM: null,
  heightM: null,
  areaM2: null,
  openings: [],
  coats: null,
  count: null,
  sides: null,
  cracks: false,
  crackLengthM: null,
  peeling: false,
  ...over,
});

const noVat = { usageType: null, dwellingOlderThanTwoYears: null, residentialSharePct: null };
const noClient = { name: null, address: null };

export type EvalCase = { id: string; input: string; expected: Extraction };

const livingRoom = (): Extraction["rooms"] => [
  {
    name: "Woonkamer",
    items: [
      item({ kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, openings: [{ widthM: 1.5, heightM: 1.2, count: 2 }] }),
      item({ kind: "ceiling", lengthM: 4, widthM: 5, cracks: true }),
    ],
  },
];

export const CASES: EvalCase[] = [
  {
    id: "01-woonkamer-1985",
    input:
      "Woonhuis uit 1985. Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van anderhalf bij één twintig, plafond heeft scheuren, eerst repareren.",
    expected: { rooms: livingRoom(), vat: { usageType: "residential", dwellingOlderThanTwoYears: true, residentialSharePct: null }, client: noClient, notUnderstood: [] },
  },
  {
    id: "02-gemengd-gebruik",
    input:
      "Woning uit 1990 met een praktijkruimte aan huis, zeventig procent is woongedeelte. Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van anderhalf bij één twintig, plafond heeft scheuren, eerst repareren.",
    expected: { rooms: livingRoom(), vat: { usageType: "mixed", dwellingOlderThanTwoYears: true, residentialSharePct: 70 }, client: noClient, notUnderstood: [] },
  },
  {
    id: "03-nieuwbouw",
    input:
      "Nieuwbouwwoning, ze wonen er sinds acht maanden. Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van anderhalf bij één twintig, plafond heeft scheuren, eerst repareren.",
    expected: { rooms: livingRoom(), vat: { usageType: "residential", dwellingOlderThanTwoYears: false, residentialSharePct: null }, client: noClient, notUnderstood: [] },
  },
  {
    id: "04-ontbrekende-hoogte",
    input: "Slaapkamer muren sauzen, drie bij vier.",
    expected: { rooms: [{ name: "Slaapkamer", items: [item({ kind: "walls", lengthM: 3, widthM: 4 })] }], vat: noVat, client: noClient, notUnderstood: [] },
  },
  {
    id: "05-deuren",
    input: "Vier binnendeuren aan twee kanten aflakken, verf bladdert.",
    expected: { rooms: [{ name: "Ruimte 1", items: [item({ kind: "doors", count: 4, sides: 2, peeling: true })] }], vat: noVat, client: noClient, notUnderstood: [] },
  },
  {
    id: "06-twee-ruimtes-kantoor",
    input:
      "Kantoorpand. Keuken plafond sauzen, drie bij drie. En de hal, muren sauzen, die is twee bij vijf en tweeënhalve meter hoog, met één deur van tachtig centimeter bij twee meter tien.",
    expected: {
      rooms: [
        { name: "Keuken", items: [item({ kind: "ceiling", lengthM: 3, widthM: 3 })] },
        { name: "Hal", items: [item({ kind: "walls", lengthM: 2, widthM: 5, heightM: 2.5, openings: [{ widthM: 0.8, heightM: 2.1, count: 1 }] })] },
      ],
      vat: { usageType: "non_residential", dwellingOlderThanTwoYears: null, residentialSharePct: null },
      client: noClient,
      notUnderstood: [],
    },
  },
  {
    id: "07-oppervlakte-lagen-klant",
    input: "Slaapkamer, vijfendertig vierkante meter muur, drie lagen, de verf bladdert op een paar plekken. Klant is mevrouw Jansen, Dorpsstraat 12 in Zeist.",
    expected: {
      rooms: [{ name: "Slaapkamer", items: [item({ kind: "walls", areaM2: 35, coats: 3, peeling: true })] }],
      vat: noVat,
      client: { name: "Jansen", address: "Dorpsstraat 12" },
      notUnderstood: [],
    },
  },
  {
    id: "08-kozijnen-plinten",
    input: "Woonkamer, zes kozijnen lakken en de plinten, twintig strekkende meter plint.",
    expected: {
      rooms: [{ name: "Woonkamer", items: [item({ kind: "frames", count: 6 }), item({ kind: "skirting", lengthM: 20 })] }],
      vat: noVat,
      client: noClient,
      notUnderstood: [],
    },
  },
  {
    id: "09-niet-te-verwerken",
    input: "Badkamer plafond sauzen, twee bij twee. En het oude behang in de gang moet eraf.",
    expected: {
      rooms: [{ name: "Badkamer", items: [item({ kind: "ceiling", lengthM: 2, widthM: 2 })] }],
      vat: noVat,
      client: noClient,
      notUnderstood: ["oud behang in de gang verwijderen"],
    },
  },
  {
    id: "10-centimeters",
    input: "Zolder, muren sauzen, vier meter twintig bij drie meter, hoogte twee meter veertig, er zit een dakraam in van zestig bij negentig centimeter.",
    expected: {
      rooms: [{ name: "Zolder", items: [item({ kind: "walls", lengthM: 4.2, widthM: 3, heightM: 2.4, openings: [{ widthM: 0.6, heightM: 0.9, count: 1 }] })] }],
      vat: noVat,
      client: noClient,
      notUnderstood: [],
    },
  },
  {
    id: "11-geen-maten",
    input: "Plafond in de keuken sauzen.",
    expected: { rooms: [{ name: "Keuken", items: [item({ kind: "ceiling" })] }], vat: noVat, client: noClient, notUnderstood: [] },
  },
];
