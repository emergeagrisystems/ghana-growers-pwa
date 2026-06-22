import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  variant?: "default" | "compact";
};

export function PageHero({ eyebrow, title, description, children, variant = "default" }: PageHeroProps) {
  const isCompact = variant === "compact";

  return (
    <section className="border-b border-leaf-900/10 bg-[#ECE7D1]">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isCompact ? "py-8 sm:py-10" : "py-16"}`}>
        <p className="gg-eyebrow">{eyebrow}</p>
        <h1 className={`${isCompact ? "mt-3 text-2xl sm:text-4xl" : "mt-4 gg-hero-title"} sm:max-w-4xl`}>{title}</h1>
        <p className={`${isCompact ? "mt-3 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7" : "mt-5 max-w-3xl text-lg leading-8"} text-ink/70`}>{description}</p>
        {children ? <div className={isCompact ? "mt-5" : "mt-8"}>{children}</div> : null}
      </div>
    </section>
  );
}
