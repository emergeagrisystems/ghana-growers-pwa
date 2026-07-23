import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  CloudSun,
  Handshake,
  HeartHandshake,
  Menu,
  MessageCircleQuestion,
  ScanSearch,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Store,
  UsersRound
} from "lucide-react";
import { ConnectionWordmarkLogo, CultivatedMonogramLogo, FieldSunriseLogo } from "@/components/BrandLabLogos";
import styles from "@/app/brand-lab/BrandLab.module.css";

export type BrandDirection = "harvest" | "growth" | "market";

type DirectionConfig = {
  name: string;
  character: string;
  accent: string;
  heroImage: string;
  headline: string;
  support: string;
  primary: string;
  primaryHref: string;
  secondary: string;
  secondaryHref: string;
  marketHeading: string;
  marketCopy: string;
};

const directionConfig: Record<BrandDirection, DirectionConfig> = {
  harvest: {
    name: "Harvest Energy",
    character: "Warm, energetic and welcoming",
    accent: "#F28C28",
    heroImage: "/images/hero/ghana-growers-trade-hero.png",
    headline: "Ghana's harvest, moving with purpose.",
    support: "A practical place for local buyers, reviewed growers and agricultural suppliers to find the next right connection.",
    primary: "Browse local produce",
    primaryHref: "/marketplace",
    secondary: "Sell your harvest",
    secondaryHref: "/submit-listing",
    marketHeading: "From field to a ready market",
    marketCopy: "Start with what you need, then review clear listing details before Ghana Growers helps make the connection."
  },
  growth: {
    name: "Fresh Growth",
    character: "Fresh, modern and agric-tech minded",
    accent: "#8DBF2D",
    heroImage: "/images/marketplace/pineapple-field.jpg",
    headline: "Grow smarter connections from field to market.",
    support: "Discover produce, farming tools and practical guidance in one calm platform built around Ghana's agricultural community.",
    primary: "Explore the marketplace",
    primaryHref: "/marketplace",
    secondary: "Open GG FarmMate",
    secondaryHref: "/farmer-hub",
    marketHeading: "A clearer way to discover local supply",
    marketCopy: "Browse by need, compare reviewed public information and request a connection without exposing private contact details."
  },
  market: {
    name: "Market Connection",
    character: "Human, active and trade focused",
    accent: "#E76F51",
    heroImage: "/images/marketplace/ghana-market-1.jpg",
    headline: "Where Ghana's growers and buyers meet.",
    support: "Bring trusted local trade closer through reviewed profiles, useful listing details and thoughtful introductions.",
    primary: "Find what you need",
    primaryHref: "/buy",
    secondary: "Join the network",
    secondaryHref: "/join",
    marketHeading: "Make the next market connection count",
    marketCopy: "Move from discovery to a reviewed request while Ghana Growers keeps personal details private."
  }
};

const paths = [
  { icon: ShoppingBasket, title: "For buyers", copy: "Browse produce and agricultural supply, then request the right connection.", action: "Start buying", href: "/buy" },
  { icon: Sprout, title: "For farmers", copy: "Present your harvest clearly and reach buyers through a reviewed listing process.", action: "Sell your harvest", href: "/sell" },
  { icon: Store, title: "For suppliers", copy: "Show useful farm inputs and equipment to people who need them.", action: "Join as a supplier", href: "/become-a-supplier" }
];

const marketplaceCategories = [
  { image: "/images/marketplace/fresh-tomatoes.jpg", title: "Fresh produce", copy: "Vegetables, fruits, grains, legumes and roots." },
  { image: "/images/marketplace/farm-inputs.jpg", title: "Farm inputs", copy: "Seeds, soil inputs and crop-care products." },
  { image: "/images/marketplace/logistics-truck.jpg", title: "Tools & equipment", copy: "Practical equipment for production and handling." }
];

const howItWorks = [
  { icon: ScanSearch, title: "Discover", copy: "Browse reviewed public information." },
  { icon: MessageCircleQuestion, title: "Request", copy: "Tell us what you need without exposing private contacts." },
  { icon: BadgeCheck, title: "Review", copy: "Ghana Growers checks the request and available public records." },
  { icon: Handshake, title: "Connect", copy: "Relevant parties decide whether to continue the conversation." }
];

function DirectionLogo({ direction, className }: { direction: BrandDirection; className?: string }) {
  const { accent } = directionConfig[direction];

  if (direction === "growth") return <CultivatedMonogramLogo className={className} accent={accent} />;
  if (direction === "market") return <ConnectionWordmarkLogo className={className} accent={accent} />;
  return <FieldSunriseLogo className={className} accent={accent} />;
}

function FarmerPlaceholder({ index }: { index: number }) {
  return (
    <article className={styles.farmerCard}>
      <div className={styles.farmerVisual} aria-hidden="true">
        <span>{String(index).padStart(2, "0")}</span>
        <svg viewBox="0 0 240 150" preserveAspectRatio="none">
          <path d="M0 112c44-34 81-34 120 0s76 34 120 0v38H0Z" />
          <path d="M0 132c45-24 82-24 120 0s77 24 120 0" />
        </svg>
      </div>
      <div className={styles.farmerBody}>
        <span className={styles.placeholderBadge}>Reviewed profile example</span>
        <h3>Farmer profile</h3>
        <p>Region and approved products appear here.</p>
        <span className={styles.fakeLink}>View profile <ArrowRight size={15} aria-hidden="true" /></span>
      </div>
    </article>
  );
}

export function BrandLab({ direction }: { direction: BrandDirection }) {
  const config = directionConfig[direction];
  const themeStyle = { "--lab-accent": config.accent } as CSSProperties;

  return (
    <div className={`${styles.labRoot} ${styles[direction]}`} style={themeStyle}>
      <aside className={styles.labBar} aria-label="Brand lab controls">
        <div>
          <span className={styles.labFlag}>Private design lab</span>
          <strong>Homepage direction: {config.name}</strong>
          <span>{config.character}</span>
        </div>
        <nav aria-label="Choose a homepage direction">
          {(Object.keys(directionConfig) as BrandDirection[]).map((key, index) => (
            <Link key={key} href={`/brand-lab?direction=${key}`} aria-current={direction === key ? "page" : undefined}>
              <span>{String.fromCharCode(65 + index)}</span>
              {directionConfig[key].name}
            </Link>
          ))}
        </nav>
      </aside>

      <header className={styles.conceptHeader}>
        <a href="#top" className={styles.logoLink} aria-label={`${config.name} Ghana Growers homepage`}>
          <DirectionLogo direction={direction} className={styles.headerLogo} />
        </a>
        <nav className={styles.desktopNav} aria-label="Concept navigation">
          <a href="#marketplace">Buy</a>
          <a href="#paths">Sell</a>
          <a href="#featured">Directory</a>
          <a href="#farmmate">GG FarmMate</a>
          <a href="#how">How it works</a>
        </nav>
        <a className={styles.headerAction} href="#join">Join the Network</a>
        <details className={styles.mobileNavigation}>
          <summary aria-label="Open navigation">
            <Menu size={22} aria-hidden="true" />
          </summary>
          <nav aria-label="Mobile concept navigation">
            <a href="#marketplace">Buy</a>
            <a href="#paths">Sell</a>
            <a href="#featured">Directory</a>
            <a href="#farmmate">GG FarmMate</a>
            <a href="#how">How it works</a>
          </nav>
        </details>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <Image src={config.heroImage} alt="Ghanaian agriculture and local market activity" fill priority sizes="100vw" />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroInner}>
            <span className={styles.heroKicker}>Buy Local. Sell Your Harvest. Grow With Us.</span>
            <h1>{config.headline}</h1>
            <p>{config.support}</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={config.primaryHref}>{config.primary}<ArrowRight size={18} aria-hidden="true" /></a>
              <a className={styles.secondaryAction} href={config.secondaryHref}>{config.secondary}</a>
            </div>
            <div className={styles.connectionNote}>
              <UsersRound size={19} aria-hidden="true" />
              <span>One network for farmers, buyers and suppliers</span>
            </div>
          </div>
        </section>

        <section id="paths" className={styles.pathways} aria-labelledby="pathways-title">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Choose your path</span>
            <h2 id="pathways-title">Start with what brings you here.</h2>
          </div>
          <div className={styles.pathGrid}>
            {paths.map(({ icon: Icon, ...path }) => (
              <article key={path.title}>
                <span className={styles.iconBox}><Icon size={23} aria-hidden="true" /></span>
                <h3>{path.title}</h3>
                <p>{path.copy}</p>
                <a href={path.href}>{path.action}<ArrowRight size={15} aria-hidden="true" /></a>
              </article>
            ))}
          </div>
        </section>

        <section id="marketplace" className={styles.marketSection} aria-labelledby="market-title">
          <div className={styles.marketCopy}>
            <span className={styles.eyebrow}>Marketplace</span>
            <h2 id="market-title">{config.marketHeading}</h2>
            <p>{config.marketCopy}</p>
            <a className={styles.textAction} href="/marketplace">Browse the marketplace<ArrowRight size={17} aria-hidden="true" /></a>
          </div>
          <div className={styles.marketGrid}>
            {marketplaceCategories.map((category, index) => (
              <article key={category.title} className={styles.marketCard}>
                <div className={styles.marketImage}>
                  <Image src={category.image} alt="" fill sizes="(max-width: 720px) 92vw, 30vw" />
                  <span>0{index + 1}</span>
                </div>
                <div><h3>{category.title}</h3><p>{category.copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="featured" className={styles.featuredSection} aria-labelledby="featured-title">
          <div className={styles.sectionHeadingRow}>
            <div>
              <span className={styles.eyebrow}>Design example — not live data</span>
              <h2 id="featured-title">Featured Farmers</h2>
              <p>A calm preview of how eligible, reviewed public profiles could be presented.</p>
            </div>
            <span className={styles.exampleTag}>Fictional layout placeholders</span>
          </div>
          <div className={styles.farmerGrid}>{[1, 2, 3, 4].map((index) => <FarmerPlaceholder index={index} key={index} />)}</div>
        </section>

        <section id="farmmate" className={styles.farmMateSection} aria-labelledby="farmmate-title">
          <div className={styles.farmMatePanel}>
            <div className={styles.farmMateIntro}>
              <span className={styles.eyebrow}>GG FarmMate</span>
              <h2 id="farmmate-title">Practical decisions, closer to the field.</h2>
              <p>Check conditions, inspect crop concerns and ask practical farming questions in one focused place.</p>
              <a className={styles.primaryAction} href="/farmer-hub">Open GG FarmMate<ArrowRight size={18} aria-hidden="true" /></a>
            </div>
            <div className={styles.toolList}>
              <div><span><ScanSearch size={22} /></span><div><strong>Crop Doctor</strong><p>Photo-guided next steps for crop concerns.</p></div></div>
              <div><span><CloudSun size={22} /></span><div><strong>Live Weather</strong><p>Local conditions for daily farm decisions.</p></div></div>
              <div><span><Bot size={22} /></span><div><strong>Ask FarmMate</strong><p>Short, practical answers for the farm.</p></div></div>
            </div>
          </div>
        </section>

        <section id="how" className={styles.howSection} aria-labelledby="how-title">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>How Ghana Growers works</span>
            <h2 id="how-title">Clear steps. Human review. Better connections.</h2>
          </div>
          <ol className={styles.steps}>
            {howItWorks.map(({ icon: Icon, ...step }, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <Icon size={24} aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.trustSection} aria-labelledby="trust-title">
          <div className={styles.trustImage}>
            <Image src="/images/marketplace/produce-packaging.jpg" alt="Fresh produce being prepared for market" fill sizes="(max-width: 760px) 100vw, 50vw" />
          </div>
          <div className={styles.trustCopy}>
            <span className={styles.eyebrow}>Trust through review</span>
            <h2 id="trust-title">Useful public information, reviewed with care.</h2>
            <p>Ghana Growers separates public profile information from private contact details and reviews requests before making introductions.</p>
            <ul>
              <li><ShieldCheck size={19} /><span>Public information follows clear eligibility rules.</span></li>
              <li><HeartHandshake size={19} /><span>Private contacts are not displayed automatically.</span></li>
              <li><Check size={19} /><span>Verified badges appear only where verification is confirmed.</span></li>
            </ul>
            <a className={styles.textAction} href="/about">Learn about Ghana Growers<ArrowRight size={17} /></a>
          </div>
        </section>

        <section id="join" className={styles.finalCta}>
          <span className={styles.eyebrow}>Built for local agriculture</span>
          <h2>Build trusted agricultural connections across Ghana.</h2>
          <p>Join a growing network for farmers, buyers, suppliers and practical agricultural support.</p>
          <div><a className={styles.primaryAction} href="/join">Join the Network<ArrowRight size={18} /></a><a className={styles.secondaryAction} href="/contact">Send us a message</a></div>
        </section>

        <section className={styles.logoBoard} aria-labelledby="logo-board-title">
          <div className={styles.sectionHeadingRow}>
            <div><span className={styles.eyebrow}>Identity studies</span><h2 id="logo-board-title">Three logo concepts</h2><p>Evaluation-only vectors designed to remain legible in one colour and at small sizes.</p></div>
            <span className={styles.exampleTag}>Concept SVGs — not production assets</span>
          </div>
          <div className={styles.logoGrid}>
            <article><span>A</span><FieldSunriseLogo accent="#F28C28" /><h3>Field & sunrise</h3><p>A welcoming horizon with cultivated rows.</p></article>
            <article><span>B</span><CultivatedMonogramLogo accent="#8DBF2D" /><h3>Cultivated GG</h3><p>A compact monogram built from field-line geometry.</p></article>
            <article><span>C</span><ConnectionWordmarkLogo accent="#E76F51" /><h3>Connected wordmark</h3><p>A strong text mark with one restrained connection detail.</p></article>
          </div>
          <div className={styles.oneColourRow}>
            <strong>One-colour check</strong>
            <FieldSunriseLogo /><CultivatedMonogramLogo /><ConnectionWordmarkLogo />
          </div>
        </section>

        <section className={styles.recommendation} aria-labelledby="recommendation-title">
          <div className={styles.recommendationLead}>
            <span className={styles.eyebrow}>Professional recommendation</span>
            <h2 id="recommendation-title">Build from Harvest Energy, with Fresh Growth discipline.</h2>
            <p>Harvest Energy offers the strongest long-term balance of warmth, Ghanaian relevance and marketplace momentum. Keep its mango accent controlled, then borrow Fresh Growth&apos;s cleaner spacing and FarmMate treatment.</p>
          </div>
          <dl>
            <div><dt>Strongest overall</dt><dd>Harvest Energy</dd></div>
            <div><dt>Best for trust</dt><dd>Fresh Growth</dd></div>
            <div><dt>Best for energy</dt><dd>Market Connection</dd></div>
            <div><dt>Long-term accent</dt><dd>Mango Orange</dd></div>
          </dl>
          <div className={styles.riskGrid}>
            <article><strong>Harvest Energy</strong><p>Risk: too much orange can feel promotional. Keep it to actions and small signals.</p></article>
            <article><strong>Fresh Growth</strong><p>Risk: lime can lose contrast. Pair it with Forest Green text, never small white type.</p></article>
            <article><strong>Market Connection</strong><p>Risk: coral can read as urgency. Reserve it for momentum, not trust states.</p></article>
          </div>
        </section>
      </main>

      <footer className={styles.conceptFooter}>
        <div><DirectionLogo direction={direction} className={styles.footerLogo} /><p>Buy Local. Sell Your Harvest. Grow With Us.</p></div>
        <nav aria-label="Concept footer"><a href="/buy">Buy</a><a href="/sell">Sell</a><a href="/directory">Directory</a><a href="/farmer-hub">GG FarmMate</a><a href="/learn">Learn</a><a href="/contact">Contact</a></nav>
        <p>Private design exploration. Not live Ghana Growers data.</p>
      </footer>
    </div>
  );
}
