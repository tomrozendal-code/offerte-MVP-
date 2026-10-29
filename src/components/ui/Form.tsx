"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";

/**
 * Result of a server action that saves a form. `values` holds what was submitted, so the form can show
 * it again: React clears a form after submitting, and the painter should never lose what they typed.
 */
export type FormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

/** Value to show in a field: what was just submitted, otherwise the stored value. */
export function shown(state: FormState, name: string, stored: string): string {
  return state.values ? (state.values[name] ?? "") : stored;
}

/** Same for a checkbox: unchecked boxes are not submitted at all. */
export function shownChecked(state: FormState, name: string, stored: boolean): boolean {
  return state.values ? state.values[name] === "on" : stored;
}

export const initialFormState: FormState = { status: "idle" };

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  /** Text after the input, e.g. "€" or "m²/uur". */
  suffix?: ReactNode;
} & Omit<ComponentProps<"input">, "name">;

/** Label on the left, input on the right, as in the iOS Settings app. */
export function Field({ label, name, error, hint, suffix, className = "", ...input }: FieldProps) {
  const id = `f-${name}`;
  return (
    <div data-separator className="border-b border-separator px-4 py-2.5">
      <div className="flex min-h-[32px] items-center gap-3">
        <label htmlFor={id} className="text-body w-[42%] shrink-0">
          {label}
        </label>
        <input
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`text-body min-w-0 flex-1 bg-transparent text-right text-label outline-none placeholder:text-label-3 ${className}`}
          {...input}
        />
        {suffix && <span className="text-body shrink-0 text-label-2">{suffix}</span>}
      </div>
      {hint && !error && <p className="text-footnote mt-1 text-label-2">{hint}</p>}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

type TextAreaProps = { label: string; name: string; error?: string; hint?: ReactNode } & Omit<ComponentProps<"textarea">, "name">;

export function TextArea({ label, name, error, hint, ...props }: TextAreaProps) {
  const id = `f-${name}`;
  return (
    <div data-separator className="border-b border-separator px-4 py-3">
      <label htmlFor={id} className="text-subhead mb-1.5 block text-label-2">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={5}
        className="text-body w-full resize-y rounded-[10px] bg-surface-2 px-3 py-2 outline-none placeholder:text-label-3"
        {...props}
      />
      {hint && !error && <p className="text-footnote mt-1 text-label-2">{hint}</p>}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

type SelectProps = { label: string; name: string; options: { value: string; label: string }[]; error?: string } & Omit<ComponentProps<"select">, "name">;

export function Select({ label, name, options, error, ...props }: SelectProps) {
  const id = `f-${name}`;
  return (
    <div data-separator className="border-b border-separator px-4 py-2.5">
      <div className="flex min-h-[32px] items-center gap-3">
        <label htmlFor={id} className="text-body flex-1">
          {label}
        </label>
        <select id={id} name={name} className="text-body max-w-[60%] bg-transparent text-right text-label-2 outline-none" {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

type ToggleProps = { label: string; name: string; defaultChecked?: boolean; hint?: ReactNode };

/** iOS-style switch. Submits "on" when switched on. */
export function Toggle({ label, name, defaultChecked, hint }: ToggleProps) {
  const id = `f-${name}`;
  return (
    <div data-separator className="border-b border-separator px-4 py-2.5">
      <label htmlFor={id} className="flex min-h-[32px] cursor-pointer items-center gap-3">
        <span className="text-body flex-1">{label}</span>
        <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill transition-colors peer-checked:bg-green peer-focus-visible:ring-2 peer-focus-visible:ring-tint after:absolute after:left-[2px] after:top-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] after:transition-transform peer-checked:after:translate-x-[20px]" />
      </label>
      {hint && <p className="text-footnote mt-1 text-label-2">{hint}</p>}
    </div>
  );
}

type ChoiceProps = { name: string; value: string; label: string; description?: ReactNode; defaultChecked?: boolean };

/** One option of a single choice list, with a checkmark like iOS. */
export function Choice({ name, value, label, description, defaultChecked }: ChoiceProps) {
  const id = `f-${name}-${value}`;
  return (
    <label data-separator htmlFor={id} className="flex cursor-pointer items-start gap-3 border-b border-separator px-4 py-3 active:bg-fill">
      <input id={id} type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex-1">
        <span className="text-body block">{label}</span>
        {description && <span className="text-subhead mt-0.5 block text-label-2">{description}</span>}
      </span>
      <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-tint opacity-0 peer-checked:opacity-100" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

export function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-footnote mt-1 text-red">
      {error}
    </p>
  );
}

/** Save button that shows progress while the form is being saved. */
export function SubmitButton({ children = "Opslaan", ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? "Bezig met opslaan…" : children}
    </Button>
  );
}

/** Green "saved" or red error message at the top of a form. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  const saved = state.status === "saved";
  return (
    <div role="status" className={`text-subhead rounded-2xl px-4 py-3 ${saved ? "bg-green/15 text-label" : "bg-red/12 text-label"}`}>
      <strong className={`font-semibold ${saved ? "text-green" : "text-red"}`}>{saved ? "Opgeslagen." : "Niet opgeslagen."}</strong>{" "}
      {state.message ?? (saved ? "" : "Controleer de rode velden.")}
    </div>
  );
}
