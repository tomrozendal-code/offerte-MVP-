"use client";

import { useActionState } from "react";
import { Field, FormMessage, type FormState, SubmitButton, initialFormState, shown } from "@/components/ui/Form";
import { ListGroup } from "@/components/ui/List";
import { centsToInput, numberToInput } from "@/lib/settings/parse";
import type { ProfileRow } from "@/lib/settings/toCalcSettings";
import { saveRates } from "../actions";

export function RatesForm({ profile }: { profile: ProfileRow }) {
  const [state, action] = useActionState<FormState, FormData>(saveRates, initialFormState);
  const e = state.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-7">
      <FormMessage state={state} />
      <ListGroup header="Arbeid" footer="Alle bedragen zijn zonder btw.">
        <Field label="Uurtarief" name="hourlyRate" inputMode="decimal" defaultValue={shown(state, "hourlyRate", centsToInput(profile.hourly_rate_cents))} error={e.hourlyRate} suffix="€ / uur" placeholder="0,00" />
        <Field label="Voorrijkosten" name="travelCost" inputMode="decimal" defaultValue={shown(state, "travelCost", centsToInput(profile.travel_cost_cents || null))} error={e.travelCost} suffix="€" placeholder="0,00" />
        <Field
          label="Minimumbedrag"
          name="minimumAmount"
          inputMode="decimal"
          defaultValue={shown(state, "minimumAmount", centsToInput(profile.minimum_amount_cents || null))}
          error={e.minimumAmount}
          suffix="€"
          placeholder="0,00"
          hint="Kleiner dan dit? Dan komt er een regel 'Aanvulling tot minimumbedrag' bij."
        />
      </ListGroup>

      <ListGroup header="Materiaal">
        <Field
          label="Opslag"
          name="materialMarkup"
          inputMode="decimal"
          defaultValue={shown(state, "materialMarkup", profile.material_markup_bp ? numberToInput(profile.material_markup_bp / 100) : "")}
          error={e.materialMarkup}
          suffix="%"
          placeholder="0"
          hint="Komt bovenop je inkoopprijs."
        />
      </ListGroup>

      <ListGroup header="Sauswerk" footer="Gebruikt als je bij het inspreken niet zegt hoeveel lagen. Op de offerte staat dan '(standaard)'.">
        <Field label="Standaard lagen" name="defaultCoats" inputMode="numeric" defaultValue={shown(state, "defaultCoats", String(profile.default_coats))} error={e.defaultCoats} suffix="lagen" />
      </ListGroup>

      <SubmitButton />
    </form>
  );
}
