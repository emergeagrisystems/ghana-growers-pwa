import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "light";
};

const variants = {
  primary: "bg-leaf-600 text-white hover:bg-leaf-700",
  secondary: "bg-earth-500 text-ink hover:bg-earth-700 hover:text-white",
  light: "bg-white text-leaf-700 hover:bg-leaf-50"
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`focus-ring inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-bold shadow-soft transition ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
