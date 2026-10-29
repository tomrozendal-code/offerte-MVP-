"use client";

import { useActionState } from "react";
import { Field, FormMessage, type FormState, SubmitButton, TextArea, initialFormState, shown } from "@/components/ui/Form";
import { ListGroup } from "@/components/ui/List";
import type { ProfileRow } from "@/lib/settings/toCalcSettings";
import { saveCompany } from "../actions";

export function CompanyForm({ profile }: { profile: ProfileRow }) {
  const [state, action] = useActionState<FormState, FormData>(saveCompany, initialFormState);
  const e = state.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-7">
      <FormMessage state={state} />
      <ListGroup header="Bedrijf">
        <Field label="Bedrijfsnaam" name="companyName" defaultValue={shown(state, "companyName", profile.company_name ?? "")} error={e.companyName} autoComplete="organization" required />
        <Field label="Straat en nr." name="street" defaultValue={shown(state, "street", profile.street ?? "")} error={e.street} autoComplete="street-address" />
        <Field label="Postcode" name="postalCode" defaultValue={shown(state, "postalCode", profile.postal_code ?? "")} error={e.postalCode} autoComplete="postal-code" placeholder="1234 AB" />
        <Field label="Plaats" name="city" defaultValue={shown(state, "city", profile.city ?? "")} error={e.city} autoComplete="address-level2" />
      </ListGroup>

      <ListGroup header="Contact" footer="Klanten kunnen je hierop bereiken. Herinneringen gaan met dit e-mailadres als antwoordadres.">
        <Field label="E-mail" name="email" type="email" inputMode="email" defaultValue={shown(state, "email", profile.email ?? "")} error={e.email} autoComplete="email" />
        <Field label="Telefoon" name="phone" type="tel" inputMode="tel" defaultValue={shown(state, "phone", profile.phone ?? "")} error={e.phone} autoComplete="tel" placeholder="06 12345678" />
      </ListGroup>

      <ListGroup header="Administratie">
        <Field label="KVK-nummer" name="kvkNumber" inputMode="numeric" defaultValue={shown(state, "kvkNumber", profile.kvk_number ?? "")} error={e.kvkNumber} placeholder="12345678" />
        <Field label="Btw-id" name="vatNumber" defaultValue={shown(state, "vatNumber", profile.vat_number ?? "")} error={e.vatNumber} placeholder="NL123456789B01" autoCapitalize="characters" />
        <Field label="IBAN" name="iban" defaultValue={shown(state, "iban", profile.iban ?? "")} error={e.iban} placeholder="NL00 BANK 0123 4567 89" autoCapitalize="characters" />
      </ListGroup>

      <ListGroup header="Offerte">
        <Field label="Geldig" name="quoteValidityDays" inputMode="numeric" defaultValue={shown(state, "quoteValidityDays", String(profile.quote_validity_days))} error={e.quoteValidityDays} suffix="dagen" />
        <TextArea label="Voorwaarden onderaan de offerte" name="termsText" defaultValue={shown(state, "termsText", profile.terms_text ?? "")} error={e.termsText} placeholder="Bijvoorbeeld: betaling binnen 14 dagen na oplevering." />
      </ListGroup>

      <SubmitButton />
    </form>
  );
}
