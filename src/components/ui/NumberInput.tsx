"use client";

import { useState } from "react";
import { numberToInput, parseDutchNumber } from "@/lib/settings/parse";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  /** Highlights the field because the calculation needs it. */
  needed?: boolean;
  integer?: boolean;
  suffix?: string;
  className?: string;
};

/** Number field that understands Dutch input ("2,6") and keeps what was typed until it makes sense. */
export function NumberInput({ value, onChange, label, needed, integer, suffix, className = "" }: Props) {
  const [text, setText] = useState(numberToInput(value));
  const [invalid, setInvalid] = useState(false);

  function handle(next: string) {
    setText(next);
    if (next.trim() === "") {
      setInvalid(false);
      onChange(null);
      return;
    }
    const n = parseDutchNumber(next, integer ? 0 : 3);
    setInvalid(n === null);
    if (n !== null) onChange(n);
  }

  const border = invalid ? "border-red" : needed && value === null ? "border-orange bg-orange/10" : "border-separator";
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-caption text-label-2">{label}</span>
      <span className={`flex items-center rounded-control border ${border} bg-surface-2 px-2.5 focus-within:border-tint`}>
        <input
          inputMode={integer ? "numeric" : "decimal"}
          value={text}
          onChange={(e) => handle(e.target.value)}
          placeholder={needed ? "nodig" : "—"}
          aria-invalid={invalid || undefined}
          className="text-body tabular min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-label-3"
        />
        {suffix && <span className="text-subhead pl-1 text-label-2">{suffix}</span>}
      </span>
    </label>
  );
}
