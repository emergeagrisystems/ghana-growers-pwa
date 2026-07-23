import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  Bot,
  Check,
  CloudSun,
  Handshake,
  HeartHandshake,
  Menu,
  MessageCircleQuestion,
  PackageOpen,
  ScanSearch,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Store,
  UsersRound,
  Wrench
} from "lucide-react";
import {
  ConnectionWordmarkLogo,
  CultivatedMonogramLogo,
  FieldSunriseLogo,
  RecommendedWordmarkLogo,
  RefinedCultivatedIcon
} from "@/components/BrandLabLogos";
import styles from "@/app/brand-lab/BrandLab.module.css";

export type BrandDirection = "harvest" | "growth" | "market" | "recommended";

type DirectionConfig = {
  name: string;
  character: string;
  accent: string;
  heroImage: string;
  headline: string;
  headlineLines?: string[];
  campaignLine?: string;
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
  },
  recommended: {
    name: "Recommended Direction",
    character: "Warm, trusted and ready to grow",
    accent: "#F28C28",
    heroImage: "/images/hero/ghana-growers-trade-hero.png",
    headline: "Buy Local. Sell Your Harvest. Grow With Us.",
    headlineLines: ["Buy Local.", "Sell Your Harvest.", "Grow With Us."],
    campaignLine: "Ghana's harvest, moving with purpose",
    support: "Ghana Growers connects farmers, buyers and agricultural suppliers through a reviewed marketplace and practical farming tools.",
    primary: "Browse the marketplace",
    primaryHref: "/marketplace",
    secondary: "Sell your harvest",
    secondaryHref: "/submit-listing",
    marketHeading: "Four clear routes into local agricultural trade",
    marketCopy: "Find the right marketplace pathway, review useful public information and request a connection without exposing private contact details."
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

const recommendedMarketplaceRoutes = [
  { icon: ShoppingBasket, title: "Fresh Produce", copy: "Vegetables, fruits, grains, legumes, roots and more.", href: "/marketplace?category=Fresh%20Produce" },
  { icon: PackageOpen, title: "Farm Inputs", copy: "Seeds, soil inputs, crop protection and farm supplies.", href: "/marketplace?category=Farm%20Inputs" },
  { icon: Beef, title: "Livestock", copy: "Reviewed public listings for animals and livestock supply.", href: "/marketplace?category=Livestock" },
  { icon: Wrench, title: "Tools & Equipment", copy: "Practical tools and equipment for production and handling.", href: "/marketplace?category=Tools%20%26%20Equipment" }
];

const recommendedFarmers = [
  { name: "Adom Field Collective", region: "Eastern Region example", crops: "Maize · Groundnuts" },
  { name: "Nhyira Harvest Farm", region: "Ashanti Region example", crops: "Tomatoes · Pepper" },
  { name: "Savanna Roots Farm", region: "Northern Region example", crops: "Yam · Cowpea" }
];

const howItWorks = [
  { icon: ScanSearch, title: "Discover", copy: "Browse reviewed public information." },
  { icon: MessageCircleQuestion, title: "Request", copy: "Tell us what you need without exposing private contacts." },
  { icon: BadgeCheck, title: "Ghana Growers reviews", copy: "The team checks the request and available public records." },
  { icon: Handshake, title: "Connect", copy: "Relevant parties decide whether to continue the conversation." }
];

function DirectionLogo({ direction, className }: { direction: BrandDirection; className?: string }) {
  const { accent } = directionConfig[direction];

  if (direction === "growth") return <CultivatedMonogramLogo className={className} accent={accent} />;
  if (direction === "market") return <ConnectionWordmarkLogo className={className} accent={accent} />;
  if (direction === "recommended") return <RecommendedWordmarkLogo className={className} accent={accent} />;
  return <FieldSunriseLogo className={className} accent={accent} />;
}

function FarmerPlaceholder({ index, farmer }: { index: number; farmer?: (typeof recommendedFarmers)[number] }) {
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
        <h3>{farmer?.name ?? "Farmer profile"}</h3>
        <p>{farmer ? `${farmer.region} · ${farmer.crops}` : "Region and approved products appear here."}</p>
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
            <span className={styles.heroKicker}>{config.campaignLine ?? "Buy Local. Sell Your Harvest. Grow With Us."}</span>
            <h1 className={config.headlineLines ? styles.heroHeadlineLines : undefined}>
              {config.headlineLines
                ? config.headlineLines.map((line) => <span key={line}>{line}</span>)
                : config.headline}
            </h1>
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
          {direction === "recommended" ? (
            <div className={styles.marketRouteGrid}>
              {recommendedMarketplaceRoutes.map(({ icon: Icon, ...route }) => (
                <a key={route.title} href={route.href} className={styles.marketRoute}>
                  <span><Icon size={24} aria-hidden="true" /></span>
                  <div><h3>{route.title}</h3><p>{route.copy}</p></div>
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : (
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
          )}
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
          <div className={styles.farmerGrid}>
            {direction === "recommended"
              ? recommendedFarmers.map((farmer, index) => <FarmerPlaceholder index={index + 1} farmer={farmer} key={farmer.name} />)
              : [1, 2, 3, 4].map((index) => <FarmerPlaceholder index={index} key={index} />)}
          </div>
        </section>

        <section id="farmmate" className={styles.farmMateSection} aria-labelledby="farmmate-title">
          <div className={styles.farmMatePanel}>
            <div className={styles.farmMateIntro}>
              <span className={styles.eyebrow}>GG FarmMate</span>
              <h2 id="farmmate-title">Practical decisions, closer to the field.</h2>
              <p>Check conditions, inspect crop concerns and ask practical farming questions in one focused place.</p>
              <a className={styles.primaryAction} href="/farmer-hub">Open GG FarmMate<ArrowRight size={18} aria-hidden="true" /></a>
            </div>
            {direction === "recommended" ? (
              <div className={styles.farmMateProduct} aria-label="GG FarmMate interface concept">
                <div className={styles.deviceTop}><span>GG FarmMate</span><span>Practical farming help</span></div>
                <div className={styles.devicePrompt}>What would you like help with today?</div>
                <div className={styles.deviceTools}>
                  <div><span><ScanSearch size={23} /></span><div><strong>Crop Doctor</strong><p>Check a crop concern from a photo.</p></div></div>
                  <div><span><Bot size={23} /></span><div><strong>Ask FarmMate</strong><p>Get a short, practical next step.</p></div></div>
                </div>
                <div className={styles.weatherStrip}><CloudSun size={20} /><span><strong>Live Weather</strong> supports daily field decisions.</span></div>
              </div>
            ) : (
              <div className={styles.toolList}>
                <div><span><ScanSearch size={22} /></span><div><strong>Crop Doctor</strong><p>Photo-guided next steps for crop concerns.</p></div></div>
                <div><span><CloudSun size={22} /></span><div><strong>Live Weather</strong><p>Local conditions for daily farm decisions.</p></div></div>
                <div><span><Bot size={22} /></span><div><strong>Ask FarmMate</strong><p>Short, practical answers for the farm.</p></div></div>
              </div>
            )}
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
            <div><span className={styles.eyebrow}>Identity studies</span><h2 id="logo-board-title">Recommended identity system</h2><p>A wordmark-first identity with a dedicated, simplified app icon for small digital spaces.</p></div>
            <span className={styles.exampleTag}>Concept SVGs — not production assets</span>
          </div>
          <div className={styles.recommendedLogoGrid}>
            <article className={styles.wordmarkStudy}>
              <span>Preferred wordmark</span>
              <RecommendedWordmarkLogo accent="#F28C28" />
              <h3>Connected Wordmark, refined</h3>
              <p>The connection detail now sits within the wordmark composition, keeping Ghana Growers prominent and the Mango signal purposeful.</p>
            </article>
            <article className={styles.iconStudy}>
              <span>Preferred app icon</span>
              <div className={styles.iconScaleRow}>
                <RefinedCultivatedIcon accent="#F28C28" />
                <RefinedCultivatedIcon accent="#F28C28" />
                <RefinedCultivatedIcon accent="#F28C28" />
              </div>
              <h3>Cultivated GG, simplified</h3>
              <p>Clearer double-G geometry for 16px, 32px and 192px use without a generic technology feel.</p>
            </article>
          </div>
          <div className={styles.oneColourRow}>
            <strong>One-colour check</strong>
            <RecommendedWordmarkLogo accent="currentColor" />
            <RefinedCultivatedIcon accent="currentColor" />
            <span>Header · packaging · social · favicon</span>
          </div>
        </section>

        <section className={styles.recommendation} aria-labelledby="recommendation-title">
          <div className={styles.recommendationLead}>
            <span className={styles.eyebrow}>Professional recommendation</span>
            <h2 id="recommendation-title">Recommended Direction is the preferred homepage.</h2>
            <p>It combines Harvest Energy&apos;s warmth and image-led momentum with Fresh Growth&apos;s spacing discipline and stronger FarmMate product presence. Mango remains controlled so Forest Green, Cream and real agricultural imagery carry the brand.</p>
          </div>
          <dl>
            <div><dt>Preferred homepage</dt><dd>Recommended Direction</dd></div>
            <div><dt>Energetic accent</dt><dd>Mango Orange</dd></div>
            <div><dt>Identity foundation</dt><dd>Connected Wordmark</dd></div>
            <div><dt>App icon direction</dt><dd>Refined Cultivated GG</dd></div>
          </dl>
          <div className={styles.riskGrid}>
            <article><strong>Accent discipline</strong><p>Keep Mango near 5–10% of the composition and away from long or thin text.</p></article>
            <article><strong>Trust language</strong><p>Continue using reviewed for general public records and reserve verified for confirmed statuses.</p></article>
            <article><strong>Small-size identity</strong><p>Use the refined GG icon below wordmark sizes; do not squeeze the full name into favicon spaces.</p></article>
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
