import type { ReactNode } from "react";

type PageProps = {
  title: string;
  /** Optional element on the right of the navigation bar, e.g. a button. */
  action?: ReactNode;
  children: ReactNode;
};

/** iOS-style screen: translucent sticky bar plus a large title. */
export function Page({ title, action, children }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-2xl">
      <header className="sticky top-0 z-20 flex h-[calc(env(safe-area-inset-top)+44px)] items-end justify-end bg-bar px-4 pb-2.5 backdrop-blur-xl backdrop-saturate-150">
        {action}
      </header>
      <h1 className="text-large-title px-4 pb-2 pt-1">{title}</h1>
      <div className="flex flex-col gap-7 px-4 pb-8 pt-3">{children}</div>
    </main>
  );
}
