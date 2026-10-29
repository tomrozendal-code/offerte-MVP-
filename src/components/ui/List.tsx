import Link from "next/link";
import type { ReactNode } from "react";

type ListGroupProps = { header?: string; footer?: ReactNode; children: ReactNode };

/** "Inset grouped" list, like the iOS Settings app. */
export function ListGroup({ header, footer, children }: ListGroupProps) {
  return (
    <section>
      {header && <h2 className="text-footnote px-4 pb-1.5 uppercase text-label-2">{header}</h2>}
      <div className="overflow-hidden rounded-2xl bg-surface [&>*:last-child_[data-separator]]:border-b-0">{children}</div>
      {footer && <div className="text-footnote px-4 pt-1.5 text-label-2">{footer}</div>}
    </section>
  );
}

type ListRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  /** Background color of the rounded icon square, e.g. "bg-tint". */
  iconColor?: string;
  href?: string;
};

export function ListRow({ title, subtitle, value, icon, iconColor = "bg-tint", href }: ListRowProps) {
  const content = (
    <div className="flex min-h-[48px] items-center gap-3 pl-4">
      {icon && (
        <span className={`flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white ${iconColor}`}>
          {icon}
        </span>
      )}
      {/* The separator starts after the icon, as on iOS; ListGroup hides it on the last row. */}
      <div data-separator className="flex min-h-[48px] flex-1 items-center gap-2 border-b border-separator py-2.5 pr-4">
        <div className="min-w-0 flex-1">
          <div className="text-body truncate">{title}</div>
          {subtitle && <div className="text-subhead truncate text-label-2">{subtitle}</div>}
        </div>
        {value && <div className="text-body tabular shrink-0 text-label-2">{value}</div>}
        {href && <Chevron />}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-colors active:bg-fill">
      {content}
    </Link>
  ) : (
    <div>{content}</div>
  );
}

function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" className="shrink-0 text-label-3" aria-hidden>
      <path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
