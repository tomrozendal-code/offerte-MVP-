"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FieldError, FormMessage, type FormState, Select, SubmitButton, initialFormState, shown } from "@/components/ui/Form";
import { ListGroup } from "@/components/ui/List";
import { NORM_LABELS } from "@/lib/calc/norms";
import type { NormKey } from "@/lib/calc/types";
import { centsToInput, numberToInput } from "@/lib/settings/parse";
import { EXAMPLE_PRICE_LABEL } from "@/lib/settings/starterMaterials";
import type { MaterialRow } from "@/lib/settings/toCalcSettings";
import { deleteMaterial, saveMaterial } from "../actions";

const PAINT_WORK_TYPES: NormKey[] = ["wall_paint", "ceiling_paint", "door_paint", "frame_paint", "skirting_paint"];

const UNITS = [
  { value: "liter", label: "liter" },
  { value: "kg", label: "kg" },
  { value: "stuk", label: "stuk" },
  { value: "rol", label: "rol" },
];

export function MaterialForm({ material }: { material: MaterialRow | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveMaterial, initialFormState);
  const e = state.errors ?? {};
  return (
    <div className="flex flex-col gap-7">
      <form action={action} className="flex flex-col gap-7">
        <FormMessage state={state} />
        {material && <input type="hidden" name="id" value={material.id} />}
        {material && <input type="hidden" name="originalPriceCents" value={material.purchase_price_cents} />}
        {material?.is_example_price && (
          <p className="text-subhead rounded-card border-l-[3px] border-orange bg-orange/10 px-4 py-3">
            <strong className="font-semibold">{EXAMPLE_PRICE_LABEL}.</strong> Zodra je de prijs wijzigt, is het jouw eigen prijs.
          </p>
        )}

        <ListGroup header="Product">
          <Field label="Naam" name="name" defaultValue={shown(state, "name", material?.name ?? "")} error={e.name} placeholder="Muurverf mat wit" required />
          <Select label="Eenheid" name="unit" options={UNITS} defaultValue={shown(state, "unit", material?.unit ?? "liter")} error={e.unit} />
          <Field
            label="Verpakking"
            name="packageSize"
            inputMode="decimal"
            defaultValue={shown(state, "packageSize", material ? numberToInput(Number(material.package_size)) : "")}
            error={e.packageSize}
            placeholder="10"
            hint="Hoeveel zit er in één verpakking, in de eenheid hierboven."
          />
          <Field
            label="Inkoopprijs"
            name="purchasePrice"
            inputMode="decimal"
            defaultValue={shown(state, "purchasePrice", centsToInput(material?.purchase_price_cents))}
            error={e.purchasePrice}
            suffix="€"
            placeholder="0,00"
            hint="Per verpakking, zonder btw. Je opslag komt er automatisch bij."
          />
          <Field
            label="Verbruik"
            name="coverage"
            inputMode="decimal"
            defaultValue={shown(state, "coverage", material?.coverage_m2_per_unit_per_coat != null ? numberToInput(Number(material.coverage_m2_per_unit_per_coat)) : "")}
            error={e.coverage}
            suffix="m² per eenheid"
            placeholder="—"
            hint="Per laag. Staat op het technisch blad van de fabrikant. Leeg laten voor tape, kit en dergelijke."
          />
        </ListGroup>

        <ListGroup
          header="Gebruiken bij"
          footer="Bij muren en plafonds rekent de app dit materiaal automatisch mee. Voor deuren, kozijnen en plinten komt dat later; nu krijg je een melding om het zelf toe te voegen."
        >
          {PAINT_WORK_TYPES.map((key) => (
            <label key={key} data-separator className="flex min-h-[48px] cursor-pointer items-center gap-3 border-b border-separator px-4">
              <span className="text-body flex-1">{NORM_LABELS[key]}</span>
              <input type="checkbox" name="workTypes" value={key} defaultChecked={state.values ? (state.values.workTypes ?? "").split(",").includes(key) : material?.work_types.includes(key)} className="size-5 accent-[var(--tint)]" />
            </label>
          ))}
        </ListGroup>
        <FieldError error={e.workTypes} />

        <SubmitButton />
      </form>

      {material && (
        <form action={deleteMaterial}>
          <input type="hidden" name="id" value={material.id} />
          <Button type="submit" variant="destructive">
            Verwijderen
          </Button>
        </form>
      )}
    </div>
  );
}
