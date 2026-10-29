"use client";

import { useActionState } from "react";
import { FieldError, SubmitButton } from "@/components/ui/Form";
import { type LoginState, sendMagicLink } from "./actions";

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [state, action] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <section className="rounded-card border border-separator bg-surface px-6 py-10 text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-card bg-green/10 text-3xl" aria-hidden>
          ✉️
        </span>
        <h2 className="text-title-2">Check je mail</h2>
        <p className="text-body mt-2 text-label-2">
          We hebben een inloglink gestuurd naar <strong className="text-label">{state.email}</strong>. Tik op de link in de mail om in te loggen.
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {linkError && (
        <p className="text-subhead rounded-card border-l-[3px] border-red bg-red/10 px-4 py-3">Deze inloglink werkt niet meer. Vraag hieronder een nieuwe aan.</p>
      )}
      <div className="rounded-card border border-separator bg-surface px-4 py-3 focus-within:border-tint">
        <label htmlFor="email" className="text-subhead mb-1 block text-label-2">
          E-mailadres
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="jij@voorbeeld.nl"
          className="text-body w-full bg-transparent py-1 outline-none placeholder:text-label-3"
        />
        <FieldError error={state.status === "error" ? state.message : undefined} />
      </div>
      <SubmitButton>Stuur inloglink</SubmitButton>
      <p className="text-footnote px-4 text-center text-label-2">Je krijgt een mail met een link. Geen wachtwoord nodig.</p>
    </form>
  );
}
