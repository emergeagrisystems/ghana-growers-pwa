import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  BookOpen,
  Check,
  Handshake,
  HeartHandshake,
  MessageCircleQuestion,
  PackageOpen,
  ScanSearch,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Store,
  Wrench
} from "lucide-react";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { PublicDataUnavailable } from "@/components/PublicDataUnavailable";
import { SafeImage } from "@/components/SafeImage";
import { homepageFarmMateTools } from "@/data/farmmatePublicTools";
import {
  cleanFarmerLocation,
  farmerCardProducts,
  farmerImagePosition
} from "@/lib/farmerDirectory";
import { createPageMetadata } from "@/lib/seo";
import { getFarmersData } from "@/lib/supabase/publicData";
import styles from "./HomePage.module.css";

export const metadata = createPageMetadata({
  title: "Buy, Sell and Grow Through Ghana Agriculture",
  description:
    "Buy farm produce, sell harvests and agricultural supplies, and use practical farming tools through Ghana Growers.",
  path: "/"
});

const marketplaceRoutes = [
  {
    title: "Fresh Produce",
    summary: "Vegetables, fruits, grains, legumes, roots and more.",
    href: "/marketplace?category=fresh-produce",
    icon: ShoppingBasket
  },
  {
    title: "Farm Inputs",
    summary: "Seeds, soil inputs, crop care and farm supplies.",
    href: "/marketplace?category=farm-inputs",
    icon: PackageOpen
  },
  {
    title: "Livestock",
    summary: "Browse the livestock listings currently available.",
    href: "/marketplace?category=livestock",
    icon: Beef
  },
  {
    title: "Tools & Equipment",
    summary: "Practical tools and equipment for farm work.",
    href: "/marketplace?category=tools-equipment",
    icon: Wrench
  }
];

const heroMarketplaceCategories = [
  {
    title: "Fresh Produce",
    href: "/marketplace?category=fresh-produce",
    image: "/images/marketplace/ghana-market-1.jpg",
    imageAlt: "Fresh produce displayed at a Ghanaian market"
  },
  {
    title: "Livestock",
    href: "/marketplace?category=livestock",
    image: "/images/crops/poultry.jpg",
    imageAlt: "Cattle on a Ghanaian farm"
  },
  {
    title: "Farm Inputs",
    href: "/marketplace?category=farm-inputs",
    image: "/images/marketplace/farm-inputs.jpg",
    imageAlt: "Farm inputs arranged in an agricultural supply shop"
  },
  {
    title: "Tools & Equipment",
    href: "/marketplace?category=tools-equipment",
    image: "/images/marketplace/farm-activity-1.jpg",
    imageAlt: "Farmer working with a hand tool in a field"
  }
];

const rolePaths = [
  {
    title: "For buyers",
    text: "Browse current listings or ask Ghana Growers to help source what you need.",
    action: "Start buying",
    href: "/buy",
    icon: ShoppingBasket
  },
  {
    title: "For farmers",
    text: "Present your harvest clearly and submit listings for review before publication.",
    action: "Sell your harvest",
    href: "/sell",
    icon: Sprout
  },
  {
    title: "For suppliers",
    text: "Apply to supply farm inputs, equipment or agricultural services through the network.",
    action: "Supplier information",
    href: "/become-a-supplier",
    icon: Store
  }
];

const howItWorks = [
  {
    title: "Discover",
    text: "Browse public listings, farmer profiles and practical tools.",
    icon: ScanSearch
  },
  {
    title: "Request",
    text: "Tell Ghana Growers what you want to buy, sell or source.",
    icon: MessageCircleQuestion
  },
  {
    title: "Ghana Growers reviews",
    text: "The team checks the request and the available public information.",
    icon: BadgeCheck
  },
  {
    title: "Connect",
    text: "Relevant parties decide whether to continue the conversation.",
    icon: Handshake
  }
];

export default async function HomePage() {
  const farmerResult = await getFarmersData();
  const publicFarmers = farmerResult.status === "ready" ? farmerResult.data.slice(0, 3) : [];

  return (
    <div className={styles.homepage}>
      <section className={styles.hero} aria-labelledby="homepage-hero-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>For farmers, buyers &amp; suppliers</p>
            <h1 id="homepage-hero-title" className={styles.heroTitle}>
              <span>Buy.</span>
              <span>Sell.</span>
              <span>Grow.</span>
            </h1>
            <p className={styles.heroSupport}>
              Buy farm produce, sell your harvest or agricultural supplies, and grow through better market access and practical farming tools.
            </p>
          </div>

          <div className={styles.heroDeck}>
            <article className={`${styles.heroCard} ${styles.marketplacePanel}`}>
              <div className={styles.marketplacePanelIntro}>
                <h2>Explore the Marketplace</h2>
                <p>Browse current produce, livestock, farm inputs and equipment.</p>
              </div>

              <nav className={styles.heroCategoryGrid} aria-label="Marketplace categories">
                {heroMarketplaceCategories.map((category) => (
                  <Link href={category.href} key={category.title} className={styles.heroCategoryLink}>
                    <span className={styles.heroCategoryImage}>
                      <SafeImage
                        src={category.image}
                        alt={category.imageAlt}
                        fill
                        fallbackKind="marketplace"
                        sizes="(max-width: 540px) 40vw, (max-width: 820px) 20vw, 110px"
                        className="object-cover"
                      />
                    </span>
                    <span>{category.title}</span>
                  </Link>
                ))}
              </nav>

              <Link href="/marketplace" className={`${styles.amberButton} ${styles.marketplaceButton}`}>
                Browse Marketplace
                <ArrowRight size={17} aria-hidden="true" />
              </Link>

              <div className={styles.sellerPrompt}>
                <p>
                  Selling produce or farm supplies?{" "}
                  <Link href="/submit-listing">
                    Submit a listing <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </p>
                <small>Listings are reviewed before appearing publicly.</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.roleSection} aria-labelledby="role-paths-title">
        <div className={styles.sectionShell}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Choose your path</p>
            <h2 id="role-paths-title">Start with what brings you here.</h2>
          </div>
          <div className={styles.roleGrid}>
            {rolePaths.map(({ icon: Icon, ...path }) => (
              <article key={path.title}>
                <span className={styles.iconBox}><Icon size={22} aria-hidden="true" /></span>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
                <Link href={path.href}>{path.action}<ArrowRight size={15} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.marketBand} aria-labelledby="marketplace-routes-title">
        <div className={styles.marketBandInner}>
          <div className={styles.marketBandCopy}>
            <p className={styles.eyebrow}>Marketplace</p>
            <h2 id="marketplace-routes-title">Four clear routes into agricultural trade.</h2>
            <p>Browse current listings, review the available details and request support when the right supply is not yet listed.</p>
            <Link href="/submit-buyer-request" className={styles.lightTextLink}>
              Submit a sourcing request <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.marketRouteGrid}>
            {marketplaceRoutes.map(({ icon: Icon, ...route }) => (
              <Link href={route.href} key={route.title} className={styles.marketRoute}>
                <span><Icon size={23} aria-hidden="true" /></span>
                <div>
                  <h3>{route.title}</h3>
                  <p>{route.summary}</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {farmerResult.status === "unavailable" ? (
        <PublicDataUnavailable kind="farmer" />
      ) : publicFarmers.length > 0 ? (
        <section className={styles.farmerSection} aria-labelledby="homepage-farmers-title">
          <div className={styles.sectionShell}>
            <div className={styles.headingRow}>
              <div className={styles.sectionIntro}>
                <p className={styles.eyebrow}>Farmer Directory</p>
                <h2 id="homepage-farmers-title">Meet farmers on Ghana Growers.</h2>
                <p>Only public profiles that meet Ghana Growers&apos; eligibility rules appear here.</p>
              </div>
              <Link href="/farmer-directory" className={styles.outlineButton}>
                View Farmer Directory <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.farmerGrid}>
              {publicFarmers.map((farmer) => {
                const products = farmerCardProducts(farmer);
                const visibleProducts = products.slice(0, 3);
                const hasPublicImage = Boolean(farmer.hasRealPhoto && farmer.mainImage);

                return (
                  <article className={styles.farmerCard} key={farmer.slug}>
                    <div className={styles.farmerImage}>
                      {hasPublicImage ? (
                        <FarmerProfileImage
                          src={farmer.mainImage!}
                          alt={`${farmer.farmName} farm photo`}
                          variant="card"
                          fallbackKind="farmer"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          landscapePositionClass={farmerImagePosition(farmer)}
                        />
                      ) : (
                        <div className={styles.photoPlaceholder}>
                          <Sprout size={30} aria-hidden="true" />
                          <span>Photo coming soon</span>
                        </div>
                      )}
                      {farmer.verificationStatus === "Verified" ? (
                        <span className={styles.verifiedBadge}><BadgeCheck size={14} aria-hidden="true" />Reviewed profile</span>
                      ) : null}
                    </div>
                    <div className={styles.farmerBody}>
                      <h3>{farmer.farmName}</h3>
                      <p className={styles.location}>{cleanFarmerLocation(farmer)}</p>
                      <div className={styles.productList}>
                        {visibleProducts.map((product) => <span key={product}>{product}</span>)}
                      </div>
                      <Link href={`/farmer-directory/${farmer.slug}`}>
                        View profile <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.farmMateSection} aria-labelledby="farmmate-title">
        <div className={styles.farmMatePanel}>
          <div className={styles.farmMateIntro}>
            <p className={styles.eyebrow}>GG FarmMate</p>
            <h2 id="farmmate-title">Practical decisions, closer to the field.</h2>
            <p>Check conditions, inspect crop concerns and ask practical farming questions in one focused place.</p>
            <Link href="/farmer-hub" className={styles.amberButton}>
              Open GG FarmMate <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.farmMateProduct} aria-label="Available GG FarmMate tools">
            <div className={styles.productHeader}>
              <span>GG FarmMate</span>
              <span>Practical farming help</span>
            </div>
            <p className={styles.productPrompt}>What would you like help with today?</p>
            <div className={styles.toolGrid}>
              {homepageFarmMateTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.title}>
                    <span><Icon size={22} aria-hidden="true" /></span>
                    <div><strong>{tool.title}</strong><p>{tool.description}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <aside className={styles.learnCard}>
            <span><BookOpen size={22} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>Skills Center</p>
            <h3>Learn practical farming skills.</h3>
            <p>Explore clear guides for crops, soil, harvest and everyday farm decisions.</p>
            <Link href="/learn">Open Skills Center <ArrowRight size={15} aria-hidden="true" /></Link>
          </aside>
        </div>
      </section>

      <section className={styles.howSection} aria-labelledby="how-it-works-title">
        <div className={styles.sectionShell}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>How Ghana Growers works</p>
            <h2 id="how-it-works-title">Clear steps. Human review. Better connections.</h2>
          </div>
          <ol className={styles.steps}>
            {howItWorks.map(({ icon: Icon, ...step }, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <Icon size={27} aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.trustImage}>
          <SafeImage
            src="/images/marketplace/produce-packaging.jpg"
            alt="Fresh produce being prepared for market"
            fill
            fallbackKind="marketplace"
            sizes="(max-width: 780px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className={styles.trustCopy}>
          <p className={styles.eyebrow}>Trust through review</p>
          <h2 id="trust-title">Useful public information, reviewed with care.</h2>
          <p>Ghana Growers separates public profile information from private contact details and reviews requests before making introductions.</p>
          <ul>
            <li><ShieldCheck size={19} aria-hidden="true" /><span>Public profiles follow clear eligibility rules.</span></li>
            <li><HeartHandshake size={19} aria-hidden="true" /><span>Private contacts are not displayed automatically.</span></li>
            <li><Check size={19} aria-hidden="true" /><span>Verification signals appear only where confirmed.</span></li>
          </ul>
          <Link href="/about">Learn about Ghana Growers <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="join-network-title">
        <p className={styles.eyebrow}>Built for local agriculture</p>
        <h2 id="join-network-title">Build useful agricultural connections across Ghana.</h2>
        <p>Join as a buyer or supplier, or learn how farmers can prepare for the network while applications are being improved.</p>
        <div>
          <Link href="/join" className={styles.amberButton}>Join the Network <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/contact" className={styles.darkOutlineButton}>Contact Ghana Growers</Link>
        </div>
      </section>
    </div>
  );
}
