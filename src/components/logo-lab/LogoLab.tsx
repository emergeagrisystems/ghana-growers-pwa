import { LogoArtwork, logoConceptNames, type LogoColorMode, type LogoConceptKey, type LogoLayout } from "@/components/logo-lab/LogoArtwork";
import styles from "@/app/logo-lab/LogoLab.module.css";

type ConceptReview = {
  key: LogoConceptKey;
  letter: string;
  summary: string;
  rationale: string;
  typeface: string;
  licence: string;
  modifications: string;
  spacing: string;
  websiteUse: string;
  weakness: string;
  scores: Record<string, number>;
};

const concepts: ConceptReview[] = [
  {
    key: "connected",
    letter: "A",
    summary: "A confident wordmark with a cultivated route built into the lockup.",
    rationale: "The connection line links the name to Ghana Growers’ role between farmers, buyers and suppliers without becoming a separate decorative flourish.",
    typeface: "Manrope ExtraBold, with Arial used as the dependency-free lab fallback.",
    licence: "Manrope is available under the SIL Open Font License 1.1 and is appropriate for commercial identity use.",
    modifications: "The G terminal becomes a route; the amber node marks a useful connection rather than a decorative sun or leaf.",
    spacing: "Wide GHANA tracking creates authority; tighter GROWERS spacing keeps the trading name compact and legible.",
    websiteUse: "Use Manrope selectively for navigation and product UI, not as a wholesale replacement for the site’s editorial display face.",
    weakness: "The connection detail needs careful optical adjustment when final lettering is converted to outlines.",
    scores: { Distinctiveness: 9, Agriculture: 8, Trust: 9, Modernity: 9, "Small size": 8, "One colour": 9, Website: 10, Packaging: 9, "Generic risk": 2 }
  },
  {
    key: "cultivated",
    letter: "B",
    summary: "Two readable G forms shaped by field rows and connected paths.",
    rationale: "The monogram gives Ghana Growers a compact asset for app icons, social avatars and stamps while retaining an agricultural rhythm.",
    typeface: "Manrope Bold paired with custom path-built GG geometry.",
    licence: "Manrope’s SIL OFL 1.1 licence supports commercial use; the symbol itself is original vector geometry.",
    modifications: "Both G crossbars share a route junction; lower field lines are reduced at favicon sizes.",
    spacing: "A generous symbol-to-wordmark gap prevents the monogram from reading as part of the first word.",
    websiteUse: "Useful for utility labels and app surfaces; the monogram should not replace the full name in first-contact contexts.",
    weakness: "Without the wordmark, geometric GG marks can drift toward generic technology branding if the cultivated lower lines are removed.",
    scores: { Distinctiveness: 8, Agriculture: 8, Trust: 8, Modernity: 9, "Small size": 10, "One colour": 9, Website: 9, Packaging: 9, "Generic risk": 4 }
  },
  {
    key: "fieldMarket",
    letter: "C",
    summary: "Field rows converge into one reviewed route toward market access.",
    rationale: "The mark describes movement from many farms into one managed connection point, then onward to buyers.",
    typeface: "Source Sans 3 Black, with Arial used as the lab fallback.",
    licence: "Source Sans 3 is available under the SIL Open Font License 1.1 and supports commercial use.",
    modifications: "The route junction is the only amber element; row endings and terminal are rounded for a practical, human tone.",
    spacing: "A compact symbol sits beside a broad wordmark so the movement reads left to right without crowding the name.",
    websiteUse: "Source Sans 3 could support operational interfaces, but the final identity should retain a distinct editorial display face.",
    weakness: "The converging route can resemble logistics or distribution software if used without the agricultural name.",
    scores: { Distinctiveness: 8, Agriculture: 9, Trust: 8, Modernity: 8, "Small size": 7, "One colour": 8, Website: 8, Packaging: 8, "Generic risk": 4 }
  },
  {
    key: "typographic",
    letter: "D",
    summary: "A timeless name-led identity with a restrained custom joining detail.",
    rationale: "The brand earns recognition through proportion, hierarchy and lettering rather than a standalone farming illustration.",
    typeface: "Source Serif 4 Black with custom terminals; Georgia is used as the dependency-free lab fallback.",
    licence: "Source Serif 4 is available under the SIL Open Font License 1.1 and supports commercial identity work.",
    modifications: "The G terminals align into a subtle connection stroke; no letter is replaced by an icon.",
    spacing: "GHANA is deliberately open and measured while GROWERS carries the visual weight at small header sizes.",
    websiteUse: "The family could inform editorial headings, but body copy and controls should remain in the existing sans-serif system.",
    weakness: "It is the least explicitly agricultural direction and depends on consistently excellent typography to feel proprietary.",
    scores: { Distinctiveness: 7, Agriculture: 5, Trust: 10, Modernity: 7, "Small size": 9, "One colour": 10, Website: 9, Packaging: 10, "Generic risk": 3 }
  }
];

const variants: Array<{ label: string; layout: LogoLayout; colorMode: LogoColorMode; surface: "cream" | "forest" | "white" }> = [
  { label: "Horizontal wordmark", layout: "wordmark", colorMode: "accent", surface: "cream" },
  { label: "Compact stacked", layout: "stacked", colorMode: "accent", surface: "cream" },
  { label: "Symbol + wordmark", layout: "horizontal", colorMode: "accent", surface: "white" },
  { label: "Symbol alone", layout: "symbol", colorMode: "accent", surface: "cream" },
  { label: "One-colour Forest", layout: "horizontal", colorMode: "forest", surface: "white" },
  { label: "Cream on Forest", layout: "horizontal", colorMode: "cream", surface: "forest" },
  { label: "Forest on cream", layout: "horizontal", colorMode: "forest", surface: "cream" },
  { label: "Restrained Amber accent", layout: "horizontal", colorMode: "accent", surface: "white" },
  { label: "Grayscale", layout: "horizontal", colorMode: "grayscale", surface: "white" },
  { label: "Reversed compact", layout: "stacked", colorMode: "cream", surface: "forest" }
];

const scoreLabels = ["Distinctiveness", "Agriculture", "Trust", "Modernity", "Small size", "One colour", "Website", "Packaging", "Generic risk"];

function ConceptIndex() {
  return (
    <nav className={styles.conceptIndex} aria-label="Logo lab sections">
      <a href="#comparison">Compare</a>
      {concepts.map((concept) => <a href={`#concept-${concept.key}`} key={concept.key}>{concept.letter}</a>)}
      <a href="#headers">Headers</a>
      <a href="#small-size">Small sizes</a>
      <a href="#evaluation">Evaluation</a>
    </nav>
  );
}

function ComparisonBoard() {
  return (
    <section className={styles.section} id="comparison">
      <div className={styles.sectionIntro}>
        <span>Full comparison board</span>
        <h2>Four routes to one practical Ghanaian identity.</h2>
        <p>Every direction is original vector artwork, uses the same approved palette, and remains intelligible without Harvest Amber.</p>
      </div>
      <div className={styles.comparisonGrid}>
        {concepts.map((concept) => (
          <article className={styles.comparisonCard} key={concept.key}>
            <div className={styles.conceptNumber}>{concept.letter}</div>
            <LogoArtwork concept={concept.key} layout="horizontal" className={styles.comparisonLogo} />
            <div>
              <h3>{logoConceptNames[concept.key]}</h3>
              <p>{concept.summary}</p>
              <a href={`#concept-${concept.key}`}>Review direction</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VariantBoard({ concept }: { concept: ConceptReview }) {
  return (
    <div className={styles.variantGrid}>
      {variants.map((variant) => (
        <div className={`${styles.variantTile} ${styles[variant.surface]}`} key={variant.label}>
          <span>{variant.label}</span>
          <LogoArtwork
            concept={concept.key}
            layout={variant.layout}
            colorMode={variant.colorMode}
            className={variant.layout === "symbol" ? styles.symbolVariant : styles.logoVariant}
            label={`${logoConceptNames[concept.key]} — ${variant.label}`}
          />
        </div>
      ))}
    </div>
  );
}

function UsageMockups({ concept }: { concept: ConceptReview }) {
  return (
    <div className={styles.mockupGrid}>
      <div className={`${styles.mockup} ${styles.desktopHeaderMockup}`}>
        <span>Desktop website header</span>
        <LogoArtwork concept={concept.key} layout="horizontal" className={styles.headerLockup} />
        <div className={styles.mockNav}><i /><i /><i /><b /></div>
      </div>
      <div className={`${styles.mockup} ${styles.mobileHeaderMockup}`}>
        <span>Mobile header</span>
        <LogoArtwork concept={concept.key} layout="horizontal" className={styles.mobileLockup} />
        <div className={styles.menuMark}><i /><i /><i /></div>
      </div>
      <div className={`${styles.mockup} ${styles.appMockup}`}>
        <span>PWA / app icon</span>
        <div className={styles.appIcon}><LogoArtwork concept={concept.key} layout="symbol" /></div>
        <small>48px and 192px</small>
      </div>
      <div className={`${styles.mockup} ${styles.whatsappMockup}`}>
        <span>WhatsApp profile</span>
        <div className={styles.roundAvatar}><LogoArtwork concept={concept.key} layout="symbol" colorMode="cream" /></div>
        <strong>Ghana Growers</strong>
      </div>
      <div className={`${styles.mockup} ${styles.handbookMockup}`}>
        <span>Farmer handbook</span>
        <LogoArtwork concept={concept.key} layout="stacked" colorMode="cream" />
        <strong>Practical growing notes</strong>
        <small>Field edition</small>
      </div>
      <div className={`${styles.mockup} ${styles.crateMockup}`}>
        <span>Produce crate label</span>
        <div className={styles.crateLabel}>
          <LogoArtwork concept={concept.key} layout="horizontal" colorMode="forest" />
          <b>Reviewed listing route</b>
        </div>
      </div>
      <div className={`${styles.mockup} ${styles.socialMockup}`}>
        <span>Social avatar</span>
        <div className={styles.squareAvatar}><LogoArtwork concept={concept.key} layout="symbol" colorMode="cream" /></div>
      </div>
      <div className={`${styles.mockup} ${styles.backgroundMockup}`}>
        <span>Light and dark surfaces</span>
        <div><LogoArtwork concept={concept.key} layout="wordmark" colorMode="forest" /></div>
        <div><LogoArtwork concept={concept.key} layout="wordmark" colorMode="cream" /></div>
      </div>
    </div>
  );
}

function SmallSizeRow({ concept }: { concept: ConceptReview }) {
  return (
    <div className={styles.sizeRow}>
      <strong>{logoConceptNames[concept.key]}</strong>
      {[16, 32, 48, 192].map((size) => (
        <div key={size}>
          <LogoArtwork concept={concept.key} layout="symbol" style={{ width: size, height: size }} />
          <span>{size}px</span>
        </div>
      ))}
      <div className={styles.mobileHeaderTest}>
        <LogoArtwork concept={concept.key} layout="horizontal" />
        <span>Mobile header</span>
      </div>
      <div className={styles.desktopHeaderTest}>
        <LogoArtwork concept={concept.key} layout="horizontal" />
        <span>Desktop header</span>
      </div>
    </div>
  );
}

function ConceptSection({ concept }: { concept: ConceptReview }) {
  return (
    <section className={`${styles.section} ${styles.conceptSection}`} id={`concept-${concept.key}`}>
      <div className={styles.conceptHeading}>
        <div className={styles.conceptNumber}>{concept.letter}</div>
        <div>
          <span>Identity direction</span>
          <h2>{logoConceptNames[concept.key]}</h2>
          <p>{concept.rationale}</p>
        </div>
      </div>

      <VariantBoard concept={concept} />

      <div className={styles.reviewGrid}>
        <div>
          <span>Typography approach</span>
          <h3>{concept.typeface}</h3>
          <p>{concept.licence}</p>
        </div>
        <div>
          <span>Custom detail</span>
          <p>{concept.modifications}</p>
        </div>
        <div>
          <span>Spacing rationale</span>
          <p>{concept.spacing}</p>
        </div>
        <div>
          <span>Website relationship</span>
          <p>{concept.websiteUse}</p>
        </div>
      </div>

      <div className={styles.subheading}>
        <span>Realistic applications</span>
        <h3>Legibility before decoration.</h3>
      </div>
      <UsageMockups concept={concept} />
    </section>
  );
}

function HeaderComparison() {
  return (
    <section className={`${styles.section} ${styles.headerSection}`} id="headers">
      <div className={styles.sectionIntro}>
        <span>Website-header comparison</span>
        <h2>The full name stays visible at first contact.</h2>
        <p>The compact symbol supports the interface but never replaces Ghana Growers where recognition is still being built.</p>
      </div>
      <div className={styles.headerComparison}>
        {concepts.map((concept) => (
          <div key={concept.key}>
            <LogoArtwork concept={concept.key} layout="horizontal" />
            <nav aria-hidden="true"><i /><i /><i /><b /></nav>
          </div>
        ))}
      </div>
    </section>
  );
}

function SmallSizeBoard() {
  return (
    <section className={`${styles.section} ${styles.sizeSection}`} id="small-size">
      <div className={styles.sectionIntro}>
        <span>Small-size and favicon test</span>
        <h2>Recognition from sixteen pixels upward.</h2>
        <p>Fine field-row details intentionally simplify at small sizes; the primary silhouette and both G forms must remain clear.</p>
      </div>
      <div className={styles.sizeBoard}>
        {concepts.map((concept) => <SmallSizeRow concept={concept} key={concept.key} />)}
      </div>
    </section>
  );
}

function MonochromeBoard() {
  return (
    <section className={`${styles.section} ${styles.monoSection}`} id="monochrome">
      <div className={styles.sectionIntro}>
        <span>Monochrome and reversed</span>
        <h2>No colour dependency.</h2>
        <p>Harvest Amber is an optional connection cue. Every concept remains complete as a one-colour stamp.</p>
      </div>
      <div className={styles.monoGrid}>
        {concepts.map((concept) => (
          <article key={concept.key}>
            <div><LogoArtwork concept={concept.key} layout="horizontal" colorMode="forest" /></div>
            <div><LogoArtwork concept={concept.key} layout="horizontal" colorMode="cream" /></div>
            <strong>{logoConceptNames[concept.key]}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function Evaluation() {
  return (
    <section className={`${styles.section} ${styles.evaluation}`} id="evaluation">
      <div className={styles.sectionIntro}>
        <span>Professional evaluation</span>
        <h2>A wordmark-first system with a purpose-built compact icon.</h2>
        <p>The recommended identity family combines the best long-form and small-format performers without forcing one asset to do every job.</p>
      </div>

      <div className={styles.scoreTableWrap}>
        <table className={styles.scoreTable}>
          <thead>
            <tr>
              <th>Direction</th>
              {scoreLabels.map((label) => <th key={label}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {concepts.map((concept) => (
              <tr key={concept.key}>
                <th>{concept.letter}. {logoConceptNames[concept.key]}</th>
                {scoreLabels.map((label) => <td key={label}>{concept.scores[label]}/10</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.recommendationGrid}>
        <article>
          <span>Strongest full wordmark</span>
          <h3>Connected Wordmark</h3>
          <p>It explains connection without illustration, remains authoritative in one colour, and fits website and packaging contexts with the least compromise.</p>
        </article>
        <article>
          <span>Strongest compact icon</span>
          <h3>Cultivated GG</h3>
          <p>Its paired G silhouette is the clearest at 16–48px. Keep the lower cultivated lines simplified in the smallest master.</p>
        </article>
        <article>
          <span>Strongest one-colour version</span>
          <h3>Pure Typographic Wordmark</h3>
          <p>It loses nothing without Amber and prints especially well as a stamp, handbook masthead or crate label.</p>
        </article>
        <article className={styles.primaryRecommendation}>
          <span>Best long-term identity direction</span>
          <h3>Connected Wordmark + Cultivated GG icon</h3>
          <p>Use the Connected Wordmark as the official identity, then deploy Cultivated GG as the app icon, favicon, social avatar and compact stamp. Final development should harmonise their geometry before either replaces production assets.</p>
        </article>
      </div>

      <div className={styles.riskGrid}>
        {concepts.map((concept) => (
          <div key={concept.key}>
            <strong>{concept.letter}. {logoConceptNames[concept.key]}</strong>
            <p>{concept.weakness}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LogoLab() {
  return (
    <div className={styles.logoLab}>
      <header className={styles.labHeader}>
        <div>
          <span>Private identity exploration</span>
          <strong>Ghana Growers Logo Lab</strong>
        </div>
        <ConceptIndex />
      </header>

      <main>
        <section className={styles.hero}>
          <div>
            <span>Identity sprint · evaluation only</span>
            <h1>One trusted name.<br />A flexible identity family.</h1>
            <p>Four original directions for a practical agricultural platform connecting farmers, buyers and suppliers across Ghana.</p>
          </div>
          <div className={styles.heroMark}>
            <LogoArtwork concept="connected" layout="stacked" colorMode="cream" />
          </div>
        </section>

        <ComparisonBoard />
        {concepts.map((concept) => <ConceptSection concept={concept} key={concept.key} />)}
        <HeaderComparison />
        <SmallSizeBoard />
        <MonochromeBoard />
        <Evaluation />
      </main>

      <footer className={styles.labFooter}>
        <strong>Ghana Growers Logo Lab</strong>
        <p>Concept artwork only. No production logo asset has been changed.</p>
      </footer>
    </div>
  );
}
