export type QuoteStatus = "draft" | "sent" | "viewed" | "reminded" | "accepted" | "rejected" | "expired";

const statusStyle: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: "Concept", className: "border-label/20 text-label-2" },
  sent: { label: "Verstuurd", className: "border-label/60 text-label" },
  viewed: { label: "Bekeken", className: "border-orange/50 bg-orange/10 text-orange" },
  reminded: { label: "Herinnerd", className: "border-tint/50 bg-tint-soft text-tint" },
  accepted: { label: "Akkoord", className: "border-green/50 bg-green/10 text-green" },
  rejected: { label: "Afgewezen", className: "border-red/50 bg-red/10 text-red" },
  expired: { label: "Verlopen", className: "border-label/15 text-label-3" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const { label, className } = statusStyle[status];
  return <span className={`text-section inline-flex rounded-control border px-2 py-[3px] text-[11px] ${className}`}>{label}</span>;
}
