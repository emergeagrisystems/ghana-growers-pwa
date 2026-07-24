import type { SVGProps } from "react";

export type LogoConceptKey = "connected" | "cultivated" | "fieldMarket" | "typographic";
export type LogoLayout = "horizontal" | "stacked" | "symbol" | "wordmark";
export type LogoColorMode = "accent" | "forest" | "cream" | "grayscale";

type LogoArtworkProps = {
  concept: LogoConceptKey;
  layout?: LogoLayout;
  colorMode?: LogoColorMode;
  className?: string;
  label?: string;
} & Omit<SVGProps<SVGSVGElement>, "children">;

const conceptNames: Record<LogoConceptKey, string> = {
  connected: "Connected Wordmark",
  cultivated: "Cultivated GG",
  fieldMarket: "Field-to-Market Mark",
  typographic: "Pure Typographic Wordmark"
};

function ConceptSymbol({
  concept,
  foreground,
  accent
}: {
  concept: LogoConceptKey;
  foreground: string;
  accent: string;
}) {
  if (concept === "connected") {
    return (
      <g fill="none" stroke={foreground} strokeLinecap="round" strokeLinejoin="round">
        <path d="M73 28a29 29 0 1 0 0 44" strokeWidth="9" />
        <path d="M52 51h29v20" strokeWidth="9" />
        <path d="M80 51h12" strokeWidth="5" />
        <circle cx="80" cy="51" r="4.5" fill={accent} stroke="none" />
      </g>
    );
  }

  if (concept === "cultivated") {
    return (
      <g fill="none" stroke={foreground} strokeLinecap="round" strokeLinejoin="round">
        <path d="M43 24H31a24 24 0 1 0 0 52h17V52H36" strokeWidth="8" />
        <path d="M81 30H69a20 20 0 1 0 0 40h17V54H75" strokeWidth="7" />
        <path d="M18 82c22-10 43-10 65 0" strokeWidth="3" />
        <circle cx="86" cy="54" r="4" fill={accent} stroke="none" />
      </g>
    );
  }

  if (concept === "fieldMarket") {
    return (
      <g fill="none" stroke={foreground} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 24c18 0 25 9 38 25M12 42c17 0 24 4 38 8M12 60c17 0 24-4 38-9M12 78c18 0 25-9 38-27" strokeWidth="5" />
        <path d="M54 50h34" strokeWidth="7" />
        <circle cx="53" cy="50" r="7" fill={accent} stroke="none" />
        <path d="M81 43l8 7-8 7" strokeWidth="4" />
      </g>
    );
  }

  return (
    <g fill="none" stroke={foreground} strokeLinecap="round" strokeLinejoin="round">
      <path d="M45 24H33a26 26 0 1 0 0 52h19V52H38" strokeWidth="8" />
      <path d="M82 24H70a26 26 0 1 0 0 52h19V52H75" strokeWidth="8" />
      <path d="M52 52h6" stroke={accent} strokeWidth="5" />
    </g>
  );
}

function Wordmark({
  concept,
  foreground,
  accent,
  x,
  top,
  align = "start"
}: {
  concept: LogoConceptKey;
  foreground: string;
  accent: string;
  x: number;
  top: number;
  align?: "start" | "middle";
}) {
  const anchor = align;
  const isTypographic = concept === "typographic";

  return (
    <g fill={foreground} textAnchor={anchor}>
      <text
        x={x}
        y={top}
        fontFamily={isTypographic ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif"}
        fontSize={isTypographic ? 24 : 20}
        fontWeight={isTypographic ? 700 : 800}
        letterSpacing={isTypographic ? 4 : 5}
      >
        GHANA
      </text>
      <text
        x={x}
        y={top + 42}
        fontFamily={isTypographic ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif"}
        fontSize={isTypographic ? 49 : 45}
        fontWeight="900"
        letterSpacing={isTypographic ? 0.5 : 0}
      >
        GROWERS
      </text>
      {concept === "connected" ? (
        <g fill="none" strokeLinecap="round">
          <path d={align === "middle" ? `M${x - 65} ${top + 52}h104q9 0 9-9v-2h24` : `M${x} ${top + 52}h104q9 0 9-9v-2h24`} stroke={foreground} strokeWidth="3" />
          <circle cx={align === "middle" ? x + 39 : x + 104} cy={top + 52} r="4" fill={accent} stroke="none" />
        </g>
      ) : null}
      {concept === "typographic" ? (
        <path
          d={align === "middle" ? `M${x - 40} ${top + 49}h80` : `M${x + 2} ${top + 49}h80`}
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeWidth="3"
        />
      ) : null}
    </g>
  );
}

export function LogoArtwork({
  concept,
  layout = "horizontal",
  colorMode = "accent",
  className,
  label,
  ...props
}: LogoArtworkProps) {
  const foreground =
    colorMode === "cream" ? "#F7F3E8" : colorMode === "grayscale" ? "#3F4540" : "#143A1F";
  const accent = colorMode === "accent" ? "#E8A33A" : foreground;
  const title = label ?? `${conceptNames[concept]} — ${layout} logo`;
  const description = "Ghana Growers identity concept rendered as scalable vector artwork.";

  if (layout === "symbol") {
    return (
      <svg className={className} viewBox="0 0 100 100" role="img" {...props}>
        <title>{title}</title>
        <desc>{description}</desc>
        <ConceptSymbol concept={concept} foreground={foreground} accent={accent} />
      </svg>
    );
  }

  if (layout === "wordmark") {
    return (
      <svg className={className} viewBox="0 0 400 108" role="img" {...props}>
        <title>{title}</title>
        <desc>{description}</desc>
        <Wordmark concept={concept} foreground={foreground} accent={accent} x={12} top={40} />
      </svg>
    );
  }

  if (layout === "stacked") {
    return (
      <svg className={className} viewBox="0 0 320 240" role="img" {...props}>
        <title>{title}</title>
        <desc>{description}</desc>
        <g transform="translate(110 8)">
          <ConceptSymbol concept={concept} foreground={foreground} accent={accent} />
        </g>
        <Wordmark concept={concept} foreground={foreground} accent={accent} x={160} top={160} align="middle" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 520 120" role="img" {...props}>
      <title>{title}</title>
      <desc>{description}</desc>
      <g transform="translate(8 10)">
        <ConceptSymbol concept={concept} foreground={foreground} accent={accent} />
      </g>
      <Wordmark concept={concept} foreground={foreground} accent={accent} x={132} top={45} />
    </svg>
  );
}

export const logoConceptNames = conceptNames;
