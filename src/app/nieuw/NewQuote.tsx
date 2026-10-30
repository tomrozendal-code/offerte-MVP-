"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/ui/Form";
import { type AnalyzeState, analyze } from "./actions";

const EXAMPLE =
  "Bijvoorbeeld: Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van anderhalf bij één twintig. Woning uit 1985.";

export function NewQuote() {
  const [state, action] = useActionState<AnalyzeState, FormData>(analyze, { status: "idle" });
  // Start of the work on this quote, for measuring time saved (CLAUDE.md 11.5).
  const [startedAt] = useState(() => Date.now());

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="rounded-card border border-separator bg-surface px-4 py-3 focus-within:border-tint">
        <label htmlFor="text" className="text-section mb-2 block text-label-2">
          Beschrijf de klus
        </label>
        <textarea
          id="text"
          name="text"
          rows={7}
          required
          defaultValue={state.text}
          placeholder={EXAMPLE}
          className="text-body w-full resize-y bg-transparent outline-none placeholder:text-label-3"
        />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-subhead rounded-card border-l-[3px] border-red bg-red/10 px-4 py-3">
          {state.message}
        </p>
      )}
      <SubmitButton>Verwerken</SubmitButton>
      <p className="text-footnote px-1 text-label-2">
        Noem ruimtes, maten, aantal lagen en de staat van het werk. Wat je niet noemt, vraagt de app daarna. De AI ordent alleen; de app rekent alles met jouw eigen
        instellingen. Inspreken komt later.
      </p>
    </form>
  );
}
