import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "filled" | "tinted" | "plain" | "destructive";

const base =
  "inline-flex min-h-[50px] w-full select-none items-center justify-center gap-2 rounded-[14px] px-5 text-headline transition-[opacity,transform] duration-150 active:scale-[0.98] active:opacity-70 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  filled: "bg-tint text-white",
  tinted: "bg-tint-soft text-tint",
  plain: "text-tint",
  destructive: "bg-red/12 text-red",
};

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "filled", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

type ButtonLinkProps = { href: string; variant?: Variant; children: ReactNode; className?: string };

export function ButtonLink({ href, variant = "filled", children, className = "" }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
