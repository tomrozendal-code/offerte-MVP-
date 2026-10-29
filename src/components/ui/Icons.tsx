// Simple line icons in the spirit of SF Symbols.
type IconProps = { className?: string };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function DocIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path {...stroke} d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export function MicIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...stroke} x="9" y="3" width="6" height="11" rx="3" />
      <path {...stroke} d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function GearIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="12" cy="12" r="3" />
      <path
        {...stroke}
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
      />
    </svg>
  );
}

export function PlusIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} strokeWidth={2.2} d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BuildingIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4" />
    </svg>
  );
}

export function EuroIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9" />
    </svg>
  );
}

export function ClockIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="12" cy="12" r="9" />
      <path {...stroke} d="M12 7v5l3 2" />
    </svg>
  );
}

export function BucketIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M5 8h14l-1.5 12a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1zM5 8a7 3 0 0 1 14 0" />
    </svg>
  );
}

export function PercentIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M19 5L5 19" />
      <circle {...stroke} cx="7" cy="7" r="2.5" />
      <circle {...stroke} cx="17" cy="17" r="2.5" />
    </svg>
  );
}
