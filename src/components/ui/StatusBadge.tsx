export type QuoteStatus = "draft" | "sent" | "viewed" | "reminded" | "accepted" | "rejected" | "expired";

const statusStyle: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: "Concept", className: "bg-fill text-label-2" },
  sent: { label: "Verstuurd", className: "bg-tint-soft text-tint" },
  viewed: { label: "Bekeken", className: "bg-orange/15 text-orange" },
  reminded: { label: "Herinnerd", className: "bg-[#af52de]/15 text-[#af52de]" },
  accepted: { label: "Akkoord", className: "bg-green/15 text-green" },
  rejected: { label: "Afgewezen", className: "bg-red/12 text-red" },
  expired: { label: "Verlopen", className: "bg-fill text-label-3" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const { label, className } = statusStyle[status];
  return <span className={`text-footnote inline-flex rounded-full px-2.5 py-0.5 font-semibold ${className}`}>{label}</span>;
}
