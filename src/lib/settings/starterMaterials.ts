// Hand-made starter list (CLAUDE.md rule 10): no scraped prices. Prices are EXAMPLES and are always
// shown as "voorbeeldprijs – pas aan naar jouw inkoopprijs". Coverage values are common figures from
// manufacturers' technical data sheets; the painter can change everything.
import type { Material } from "@/lib/calc/types";

export type StarterMaterial = Omit<Material, "id">;

const m = (
  name: string,
  unit: Material["unit"],
  packageSize: number,
  purchasePriceCents: number,
  coverageM2PerUnitPerCoat: number | null,
  workTypes: Material["workTypes"] = [],
): StarterMaterial => ({ name, unit, packageSize, purchasePriceCents, coverageM2PerUnitPerCoat, workTypes });

// The first material linked to a work type is used by default in calculations, so the order matters.
export const STARTER_MATERIALS: StarterMaterial[] = [
  // Wall and ceiling paint
  m("Muurverf binnen, mat wit, 10 liter", "liter", 10, 6000, 8, ["wall_paint", "ceiling_paint"]),
  m("Muurverf binnen, mat wit, 5 liter", "liter", 5, 3300, 8, ["wall_paint", "ceiling_paint"]),
  m("Muurverf zijdemat (keuken, badkamer), 10 liter", "liter", 10, 7500, 10, ["wall_paint"]),
  m("Plafondverf extra mat wit, 10 liter", "liter", 10, 5500, 8, ["ceiling_paint"]),
  m("Latex voor vochtige ruimtes, 5 liter", "liter", 5, 4500, 9, ["wall_paint", "ceiling_paint"]),
  m("Gevelverf buiten, 10 liter", "liter", 10, 8500, 7),
  // Primers
  m("Voorstrijkmiddel muren, 10 liter", "liter", 10, 4500, 10),
  m("Fixeer (diepgrond), 5 liter", "liter", 5, 3500, 10),
  m("Isoleerverf tegen vlekken, 2,5 liter", "liter", 2.5, 3800, 7),
  m("Grondverf hout binnen, 0,75 liter", "liter", 0.75, 1500, 10),
  m("Grondverf hout, 2,5 liter", "liter", 2.5, 4200, 10),
  // Lacquer
  m("Lakverf hoogglans binnen, 0,75 liter", "liter", 0.75, 2000, 12, ["door_paint", "frame_paint", "skirting_paint"]),
  m("Lakverf hoogglans binnen, 2,5 liter", "liter", 2.5, 5500, 12, ["door_paint", "frame_paint", "skirting_paint"]),
  m("Lakverf zijdeglans binnen, 0,75 liter", "liter", 0.75, 2000, 12, ["door_paint", "frame_paint", "skirting_paint"]),
  m("Lakverf zijdeglans binnen, 2,5 liter", "liter", 2.5, 5500, 12, ["door_paint", "frame_paint", "skirting_paint"]),
  m("Watergedragen lak (acryl), 0,75 liter", "liter", 0.75, 2200, 12, ["door_paint", "frame_paint", "skirting_paint"]),
  m("Lakverf buiten, dekkend, 2,5 liter", "liter", 2.5, 6500, 12, ["frame_paint"]),
  m("Dekkende beits, 2,5 liter", "liter", 2.5, 5000, 10, ["frame_paint"]),
  m("Radiatorlak, 0,75 liter", "liter", 0.75, 1800, 10),
  // Filling and repair
  m("Vulmiddel poeder, 5 kg", "kg", 5, 1500, null),
  m("Plamuur kant-en-klaar, 1,5 kg", "kg", 1.5, 1100, null),
  m("Reparatiegips, 5 kg", "kg", 5, 1200, null),
  m("Gaasband voor scheuren, rol", "rol", 1, 600, null),
  m("Acrylaatkit wit, koker", "stuk", 1, 300, null),
  m("Glasweefselbehang, rol", "rol", 1, 4500, null),
  m("Lijm voor glasweefsel, 10 kg", "kg", 10, 3500, 5),
  // Protection and preparation
  m("Afplaktape binnen, rol 50 m", "rol", 1, 450, null),
  m("Afplaktape buiten (UV-bestendig), rol", "rol", 1, 750, null),
  m("Stucloper 1 × 25 m, rol", "rol", 1, 2500, null),
  m("Afdekfolie 4 × 5 m", "stuk", 1, 300, null),
  m("Schuurpapier korrel 120, pak", "stuk", 1, 1200, null),
  m("Schuurpapier korrel 180, pak", "stuk", 1, 1200, null),
  m("Ontvetter, 1 liter", "liter", 1, 900, null),
];

export const EXAMPLE_PRICE_LABEL = "Voorbeeldprijs – pas aan naar jouw inkoopprijs";
