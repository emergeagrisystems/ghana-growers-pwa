type LogoProps = {
  compact?: boolean;
  className?: string;
  accent?: string;
};

export function FieldSunriseLogo({ compact = false, className, accent = "#F28C28" }: LogoProps) {
  return (
    <svg className={className} viewBox={compact ? "0 0 52 52" : "0 0 330 72"} role="img" aria-label="Ghana Growers field and sunrise logo concept">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 39h52" strokeWidth="4" />
        <path d="M13 48c11-7 26-7 42 0M18 57c9-5 20-5 32 0" strokeWidth="3" />
        <path d="M21 38a13 13 0 0 1 26 0" stroke={accent} strokeWidth="5" />
      </g>
      {compact ? null : (
        <g fill="currentColor">
          <text x="78" y="31" fontSize="22" fontWeight="800">GHANA</text>
          <text x="78" y="58" fontSize="31" fontWeight="900">GROWERS</text>
        </g>
      )}
    </svg>
  );
}

export function CultivatedMonogramLogo({ compact = false, className, accent = "#8DBF2D" }: LogoProps) {
  return (
    <svg className={className} viewBox={compact ? "0 0 52 52" : "0 0 330 72"} role="img" aria-label="Ghana Growers cultivated line monogram logo concept">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M56 18H34C18 18 11 27 11 38s8 20 21 20h20V39H34" strokeWidth="6" />
        <path d="M46 26c-11 0-18 5-18 13s7 13 18 13" stroke={accent} strokeWidth="4" />
        <path d="M22 47c8-5 17-5 27 0" strokeWidth="2.5" />
      </g>
      {compact ? null : (
        <g fill="currentColor">
          <text x="78" y="31" fontSize="22" fontWeight="800">GHANA</text>
          <text x="78" y="58" fontSize="31" fontWeight="900">GROWERS</text>
        </g>
      )}
    </svg>
  );
}

export function ConnectionWordmarkLogo({ compact = false, className, accent = "#E76F51" }: LogoProps) {
  return (
    <svg className={className} viewBox={compact ? "0 0 52 52" : "0 0 330 72"} role="img" aria-label="Ghana Growers connected wordmark logo concept">
      {compact ? (
        <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M42 17c-4-5-9-7-15-7-11 0-19 7-19 16s8 17 19 17h15V27H28" />
          <path d="M15 45c7-5 15-5 24 0" stroke={accent} strokeWidth="3" />
        </g>
      ) : (
        <g fill="currentColor">
          <text x="8" y="30" fontSize="22" fontWeight="800">GHANA</text>
          <text x="8" y="61" fontSize="34" fontWeight="900">GROWERS</text>
          <circle cx="281" cy="51" r="7" fill={accent} />
          <path d="M256 51h18M288 51h24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export function RecommendedWordmarkLogo({ compact = false, className, accent = "#F28C28" }: LogoProps) {
  if (compact) {
    return <RefinedCultivatedIcon className={className} accent={accent} />;
  }

  return (
    <svg className={className} viewBox="0 0 360 78" role="img" aria-label="Recommended Ghana Growers connected wordmark logo concept">
      <g fill="currentColor">
        <text x="8" y="31" fontSize="22" fontWeight="800">GHANA</text>
        <text x="8" y="66" fontSize="36" fontWeight="900">GROWERS</text>
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M207 57h22c8 0 12-5 12-12v-4" stroke="currentColor" strokeWidth="4" />
        <path d="M241 41c0-8 5-13 13-13h21" stroke={accent} strokeWidth="5" />
        <circle cx="282" cy="28" r="5" fill={accent} stroke="none" />
        <path d="M291 28h37" stroke="currentColor" strokeWidth="4" />
      </g>
    </svg>
  );
}

export function RefinedCultivatedIcon({ className, accent = "#F28C28" }: Omit<LogoProps, "compact">) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Refined cultivated GG app icon concept">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M53 14H31C18 14 10 21 10 32s8 18 21 18h22V34H35" stroke="currentColor" strokeWidth="6" />
        <path d="M47 22H34c-8 0-13 4-13 10s5 10 13 10h10v-8h-9" stroke={accent} strokeWidth="4.5" />
      </g>
    </svg>
  );
}
