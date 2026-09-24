import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "light";
};

const variants = {
  primary: "gg-button-primary",
  secondary: "gg-button-secondary",
  light: "gg-text-link"
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={variants[variant]}
    >
      {children}
    </Link>
  );
}
