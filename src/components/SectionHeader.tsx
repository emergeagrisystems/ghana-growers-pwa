type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left"
}: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="gg-eyebrow mb-3">{eyebrow}</p>
      ) : null}
      <h2 className="gg-section-title">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-ink/70">{description}</p> : null}
    </div>
  );
}
