import Link from "next/link";
import type { ReactNode } from "react";

type PageProps = {
  title: string;
  /** Optional element on the right of the navigation bar, e.g. a button. */
  action?: ReactNode;
  /** Back link on the left of the navigation bar, e.g. { href: "/instellingen", label: "Instellingen" }. */
  back?: { href: string; label: string };
  children: ReactNode;
};

/** iOS-style screen: translucent sticky bar plus a large title. */
export function Page({ title, action, back, children }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-2xl">
      <header className="sticky top-0 z-20 flex h-[calc(env(safe-area-inset-top)+44px)] items-end justify-between bg-bar px-2 pb-1 backdrop-blur-xl backdrop-saturate-150">
        {back ? (
          <Link href={back.href} className="text-body flex h-11 items-center gap-1 px-2 text-tint active:opacity-60">
            <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden>
              <path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        <div className="px-2">{action}</div>
      </header>
      <h1 className="text-large-title px-4 pb-2 pt-1">{title}</h1>
      <div className="flex flex-col gap-7 px-4 pb-8 pt-3">{children}</div>
    </main>
  );
}
