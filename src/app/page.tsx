import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Check,
  Handshake,
  HeartHandshake,
  Leaf,
  MessageCircleQuestion,
  ScanSearch,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Store
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

const heroMarketplaceCategories = [
  {
    title: "Fruits & Vegetables",
    href: "/marketplace?category=fresh-produce",
    image: "/images/products/tomatoes.jpg",
    imageAlt: "Fresh fruits and vegetables arranged in market baskets"
  },
  {
    title: "Grains",
    href: "/marketplace?search=maize&category=fresh-produce",
    image: "/images/marketplace/produce-packaging.jpg",
    imageAlt: "Bagged agricultural produce at a supply yard"
  },
  {
    title: "Fertilizer",
    href: "/marketplace?search=fertilizer&category=farm-inputs",
    image: "/images/suppliers/supplier-3.jpg",
    imageAlt: "Packaged fertilizer bags stacked for agricultural supply"
  },
  {
    title: "Livestock",
    href: "/marketplace?category=livestock",
    image: "/images/products/eggs.jpg",
    imageAlt: "Cattle gathered on a Ghanaian farm"
  },
  {
    title: "Seeds",
    href: "/marketplace?search=seed&category=farm-inputs",
    image: "/images/marketplace/farm-activity-2.jpg",
    imageAlt: "Cocoa beans drying on raised trays"
  }
];

const heroTrustPoints = [
  {
    title: "Smart Farming Tools",
    icon: Bot
  },
  {
    title: "Reviewed Profiles",
    icon: BadgeCheck
  },
  {
    title: "Sustainable Practices",
    icon: Leaf
  }
];

const rolePaths = [
  {
    title: "Need farm-fresh produce?",
    text: "Browse current listings or tell Ghana Growers what you need.",
    action: "Browse Products",
    href: "/marketplace",
    icon: ShoppingBasket
  },
  {
    title: "Have a harvest to sell?",
    text: "Submit your produce for review and make it easier for buyers to find you.",
    action: "Sell Your Harvest",
    href: "/submit-listing",
    icon: Sprout
  },
  {
    title: "Supply farm inputs or tools?",
    text: "Apply to join the network and present your agricultural products for review.",
    action: "Join as a Supplier",
    href: "/become-a-supplier",
    icon: Store
  }
];

const howItWorks = [
  {
    title: "Explore",
    text: "Browse listings, farmer profiles and practical farming tools.",
    icon: ScanSearch
  },
  {
    title: "Send a request",
    text: "Tell Ghana Growers what you want to buy, sell or source.",
    icon: MessageCircleQuestion
  },
  {
    title: "We check the details",
    text: "We check the request and the available information.",
    icon: BadgeCheck
  },
  {
    title: "Decide to connect",
    text: "If there is a suitable fit, both sides decide whether to continue.",
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
            <p className={styles.eyebrow}>Agricultural sourcing made easy</p>
            <h1 id="homepage-hero-title" className={styles.heroTitle}>
              <span>Buy.</span>
              <span>Sell.</span>
              <span>Grow.</span>
            </h1>
            <p className={styles.heroIntro}>
              Need farm-fresh produce? Have a harvest to sell? Supply farm tools? You are in the right place.
            </p>
            <p className={styles.heroSupport}>
              Ghana Growers connects buyers, farmers and agricultural suppliers through a practical marketplace, public farmer profiles and smart farming tools—all in one place.
            </p>
          </div>

          <div className={styles.heroDeck}>
            <article className={`${styles.heroCard} ${styles.marketplacePanel}`}>
              <div className={styles.marketplacePanelIntro}>
                <div className={styles.marketplacePanelTitle}>
                  <span aria-hidden="true"><ShoppingBasket size={18} /></span>
                  <h2>Marketplace</h2>
                </div>
                <p>From fresh produce to farm supplies, explore current listings in one place.</p>
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
                Browse All Products
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

          <ul className={styles.heroTrustGrid} aria-label="How Ghana Growers supports its community">
            {heroTrustPoints.map(({ icon: Icon, title }) => (
              <li key={title}>
                <span className={styles.heroTrustIcon}><Icon size={18} aria-hidden="true" /></span>
                <strong>{title}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.roleSection} aria-labelledby="role-paths-title">
        <div className={styles.sectionShell}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>CHOOSE YOUR PATH</p>
            <h2 id="role-paths-title">What brings you here?</h2>
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

      <section className={styles.sourcingSection} aria-labelledby="sourcing-support-title">
        <div className={styles.sourcingInner}>
          <div className={styles.sourcingCopy}>
            <p className={styles.eyebrow}>SOURCING SUPPORT</p>
            <h2 id="sourcing-support-title">Can&apos;t find what you need?</h2>
            <p>Tell Ghana Growers what produce or agricultural supply you are looking for. We will review your request and follow up where a suitable option may be available.</p>
          </div>
          <div className={styles.sourcingAction}>
            <Link href="/submit-buyer-request" className={styles.amberButton}>
              Submit a sourcing request <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <small>Submitting a request does not guarantee availability.</small>
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
                <p>Explore farmers currently published on Ghana Growers, including their locations and products.</p>
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
            <h2 id="farmmate-title">Practical farming help, in one place.</h2>
            <p>Check field conditions, review crop concerns and ask everyday farming questions with GG FarmMate.</p>
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
            <h2 id="how-it-works-title">Four simple steps.</h2>
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
          <h2 id="trust-title">Public information, reviewed with care.</h2>
          <p>Ghana Growers keeps public profile information separate from private contact details and reviews requests before supporting an introduction.</p>
          <ul>
            <li><ShieldCheck size={19} aria-hidden="true" /><span>Public profiles are reviewed before they appear.</span></li>
            <li><HeartHandshake size={19} aria-hidden="true" /><span>Private contact details are not shown publicly.</span></li>
            <li><Check size={19} aria-hidden="true" /><span>Verification badges appear only when confirmed.</span></li>
          </ul>
          <Link href="/about">Learn about Ghana Growers <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="join-network-title">
        <p className={styles.eyebrow}>Built for local agriculture</p>
        <h2 id="join-network-title">Build better agricultural connections in Ghana.</h2>
        <p>Buyers can explore listings or submit a sourcing request. Farmers can present products for review, and suppliers can apply to join the network.</p>
        <div>
          <Link href="/join" className={styles.amberButton}>Join the Network <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/contact" className={styles.darkOutlineButton}>Contact Ghana Growers</Link>
        </div>
      </section>
    </div>
  );
}
