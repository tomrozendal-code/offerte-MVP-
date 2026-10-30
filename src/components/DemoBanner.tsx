/** Shown in demo mode (AI_PROVIDER=demo): the AI is off and every description gives the same example. */
export function DemoBanner() {
  return (
    <p className="text-subhead rounded-card border-l-[3px] border-orange bg-orange/10 px-4 py-3">
      <strong className="font-semibold">DEMO-modus.</strong> De AI staat uit. Wat je typt wordt niet gelezen; je krijgt altijd hetzelfde voorbeeld. Alleen voor testen.
    </p>
  );
}
