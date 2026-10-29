"use client";

import { useActionState } from "react";
import { FieldError, FormMessage, type FormState, SubmitButton, initialFormState, shown } from "@/components/ui/Form";
import { ListGroup } from "@/components/ui/List";
import { NORM_LABELS, NORM_UNITS, UNIT_HINTS } from "@/lib/calc/norms";
import type { NormKey } from "@/lib/calc/types";
import { numberToInput } from "@/lib/settings/parse";
import type { NormRow } from "@/lib/settings/toCalcSettings";
import { saveNorms } from "../actions";

const GROUPS: { header: string; keys: NormKey[]; footer?: string }[] = [
  { header: "Sauzen", keys: ["wall_paint", "ceiling_paint"], footer: "Hoeveel m² je per uur sausbaar maakt, voor één laag." },
  { header: "Voorbereiding en reparatie", keys: ["preparation", "peeling_prep", "crack_repair"] },
  { header: "Lakwerk", keys: ["door_paint", "door_peeling_prep", "frame_paint", "skirting_paint"] },
];

export function NormsForm({ norms }: { norms: NormRow[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveNorms, initialFormState);
  const byKey = new Map(norms.map((n) => [n.work_type, n]));
  return (
    <form action={action} className="flex flex-col gap-7">
      <FormMessage state={state} />
      {GROUPS.map((g) => (
        <ListGroup key={g.header} header={g.header} footer={g.footer}>
          {g.keys.map((key) => (
            <NormRowInput key={key} normKey={key} state={state} current={byKey.get(key)} />
          ))}
        </ListGroup>
      ))}
      <p className="text-footnote -mt-3 px-4 text-label-2">Laat een veld leeg als je die klus niet doet. De app rekent alleen met normen die jij invult.</p>
      <SubmitButton />
    </form>
  );
}

function NormRowInput({ normKey, state, current }: { normKey: NormKey; state: FormState; current?: NormRow }) {
  const units = NORM_UNITS[normKey];
  const error = state.errors?.[`${normKey}.value`];
  const id = `f-${normKey}`;
  return (
    <div data-separator className="border-b border-separator px-4 py-2.5">
      <label htmlFor={id} className="text-body block">
        {NORM_LABELS[normKey]}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={id}
          name={`${normKey}.value`}
          inputMode="decimal"
          defaultValue={shown(state, `${normKey}.value`, current ? numberToInput(Number(current.value)) : "")}
          placeholder="—"
          aria-invalid={error ? true : undefined}
          className="text-body tabular w-24 rounded-control border border-separator bg-surface-2 px-3 py-1.5 text-right outline-none placeholder:text-label-3 focus:border-tint"
        />
        {units.length === 1 ? (
          <>
            <input type="hidden" name={`${normKey}.unit`} value={units[0]} />
            <span className="text-subhead text-label-2">{UNIT_HINTS[units[0]]}</span>
          </>
        ) : (
          <select
            name={`${normKey}.unit`}
            defaultValue={shown(state, `${normKey}.unit`, current?.unit ?? units[0])}
            aria-label={`Eenheid voor ${NORM_LABELS[normKey]}`}
            className="text-subhead min-w-0 flex-1 rounded-control border border-separator bg-surface-2 px-2 py-1.5 text-label-2 outline-none focus:border-tint"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {UNIT_HINTS[u]}
              </option>
            ))}
          </select>
        )}
      </div>
      <FieldError error={error} />
    </div>
  );
}
