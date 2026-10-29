export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "expired";

const statusStyle: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: "Concept", className: "bg-fill text-label-2" },
  sent: { label: "Verstuurd", className: "bg-tint-soft text-tint" },
  viewed: { label: "Bekeken", className: "bg-orange/15 text-orange" },
  accepted: { label: "Akkoord", className: "bg-green/15 text-green" },
  expired: { label: "Verlopen", className: "bg-red/12 text-red" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const { label, className } = statusStyle[status];
  return <span className={`text-footnote inline-flex rounded-full px-2.5 py-0.5 font-semibold ${className}`}>{label}</span>;
}
