"use client";

import { useActionState } from "react";
import { Field, FormMessage, type FormState, Select, SubmitButton, TextArea, Toggle, initialFormState, shown, shownChecked } from "@/components/ui/Form";
import { ListGroup } from "@/components/ui/List";
import { DEFAULT_REMINDER_TEXT } from "@/lib/settings/defaults";
import type { ProfileRow } from "@/lib/settings/toCalcSettings";
import { saveFollowUp } from "../actions";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7).map((h) => ({ value: String(h), label: `${h}:00` }));

export function FollowUpForm({ profile }: { profile: ProfileRow }) {
  const [state, action] = useActionState<FormState, FormData>(saveFollowUp, initialFormState);
  const e = state.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-7">
      <FormMessage state={state} />
      <ListGroup
        header="Meldingen"
        footer="Je krijgt een melding als een klant je offerte opent, akkoord geeft of afwijst. Op een iPhone werken pushmeldingen alleen als je de app op je beginscherm zet (Deel → Zet op beginscherm)."
      >
        <Toggle label="Pushmelding" name="notifyPush" defaultChecked={shownChecked(state, "notifyPush", profile.notify_push)} />
        <Toggle label="E-mail" name="notifyEmail" defaultChecked={shownChecked(state, "notifyEmail", profile.notify_email)} />
      </ListGroup>

      <ListGroup header="Herinneringen" footer="Geen reactie? Dan stuurt de app de klant een vriendelijke herinnering namens jou. Maximaal twee keer, nooit na de vervaldatum, en direct gestopt bij akkoord of afwijzing.">
        <Toggle label="Herinneringen sturen" name="remindersEnabled" defaultChecked={shownChecked(state, "remindersEnabled", profile.reminders_enabled)} />
        <Field label="Eerste na" name="firstReminderDay" inputMode="numeric" defaultValue={shown(state, "firstReminderDay", String(profile.reminder_days[0] ?? 3))} error={e.firstReminderDay} suffix="dagen" />
        <Field
          label="Tweede na"
          name="secondReminderDay"
          inputMode="numeric"
          defaultValue={shown(state, "secondReminderDay", profile.reminder_days[1] != null ? String(profile.reminder_days[1]) : "")}
          error={e.secondReminderDay}
          suffix="dagen"
          placeholder="geen"
        />
        <Select label="Versturen om" name="reminderHour" options={HOURS} defaultValue={shown(state, "reminderHour", String(profile.reminder_hour))} error={e.reminderHour} />
      </ListGroup>

      <ListGroup header="Tekst van de herinnering" footer="{klant}, {bedrijf} en {link} worden automatisch ingevuld. Laat leeg voor de standaardtekst.">
        <TextArea label="Jouw tekst" name="reminderText" rows={10} defaultValue={shown(state, "reminderText", profile.reminder_text ?? "")} placeholder={DEFAULT_REMINDER_TEXT} error={e.reminderText} />
      </ListGroup>

      <SubmitButton />
    </form>
  );
}
