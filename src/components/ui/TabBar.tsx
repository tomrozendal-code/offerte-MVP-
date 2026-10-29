"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocIcon, GearIcon, MicIcon } from "./Icons";

const tabs = [
  { href: "/", label: "Offertes", Icon: DocIcon },
  { href: "/nieuw", label: "Nieuw", Icon: MicIcon },
  { href: "/instellingen", label: "Instellingen", Icon: GearIcon },
];

/** Bottom tab bar: large tap targets for one-handed use. */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-bar pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
      <ul className="mx-auto flex h-[60px] max-w-2xl">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active ? "text-tint" : "text-gray"
                }`}
              >
                <Icon className="size-[26px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
