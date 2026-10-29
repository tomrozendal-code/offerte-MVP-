"use client";

import { useActionState } from "react";
import { Choice, FieldError, FormMessage, type FormState, SubmitButton, initialFormState, shown } from "@/components/ui/Form";
import { ListGroup } from "@/components/ui/List";
import type { MaterialVatMode } from "@/lib/calc/types";
import { saveVat } from "../actions";

export function VatForm({ mode }: { mode: MaterialVatMode | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveVat, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-7">
      <FormMessage state={state} />
      <ListGroup
        header="Btw op materialen"
        footer={
          <>
            <strong className="font-semibold text-label">Check dit met je boekhouder.</strong> De app kiest dit niet voor je. Zolang je niets kiest, rekent
            de app geen btw uit bij offertes met materiaal.
          </>
        }
      >
        <Choice
          name="materialVatMode"
          value="follow_labor"
          label="Zelfde tarief als het werk"
          description="Materiaal krijgt hetzelfde tarief als het arbeidsloon, dus 9% bij een woning ouder dan 2 jaar."
          defaultChecked={shown(state, "materialVatMode", mode ?? "") === "follow_labor"}
        />
        <Choice
          name="materialVatMode"
          value="always_standard"
          label="Altijd 21%"
          description="Materiaal krijgt altijd het algemene tarief, ook als het werk 9% is."
          defaultChecked={shown(state, "materialVatMode", mode ?? "") === "always_standard"}
        />
      </ListGroup>
      <FieldError error={state.errors?.materialVatMode} />
      <SubmitButton />
    </form>
  );
}
