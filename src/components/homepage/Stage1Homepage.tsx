/* eslint-disable @next/next/no-img-element */
import { ArrowRight, CalendarDays, Camera, CloudSun, PackageCheck, ShoppingBasket, Sprout, Store, Wheat } from "lucide-react";
import Link from "next/link";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { FounderApprovedMamaGPhone } from "@/components/homepage/FounderApprovedMamaGPhone";
import { HowItWorksVideo } from "@/components/homepage/HowItWorksVideo";
import { foundationFont } from "@/components/homepage-foundation/font";
import { cleanFarmerLocation, farmerCardProducts } from "@/lib/farmerDirectory";
import { getFarmersData, getSuppliersData } from "@/lib/supabase/publicData";
import styles from "./Stage1Homepage.module.css";

const categories = [
  { title: "Fresh Produce", stem: "fresh-produce" },
  { title: "Grains & Staples", stem: "grains-staples" },
  { title: "Livestock & Poultry", stem: "livestock-poultry" },
  { title: "Seeds & Agricultural Inputs", stem: "inputs-supplies" },
  { title: "Farm Equipment & Tools", stem: "equipment-a-tools" }
] as const;

const mamaFeatures = [
  { title: "Ask Mama G", copy: "Get practical help with everyday farm decisions.", icon: Sprout },
  { title: "Check a crop problem", copy: "Share a clear photo of the affected part.", icon: Camera },
  { title: "Plan your crop", copy: "Use the calendar and planting tools.", icon: CalendarDays },
  { title: "Harvest & Storage", copy: "Reduce loss with practical next steps.", icon: PackageCheck },
  { title: "Farm with the weather", copy: "Use live forecast context for farm tasks.", icon: CloudSun }
] as const;

export async function Stage1Homepage() {
  const [farmerResult, supplierResult] = await Promise.all([getFarmersData(), getSuppliersData()]);
  const farmers = farmerResult.status === "ready" ? farmerResult.data.slice(0, 4) : [];
  const suppliers = supplierResult.status === "ready" ? supplierResult.data.slice(0, 1) : [];
  return (
    <main className={`${styles.homepage} ${foundationFont.className}`}>
      <section className={styles.hero} aria-labelledby="homepage-hero-title">
        <div className={styles.heroCopy}>
          <h1 id="homepage-hero-title">Find Farms, Produce &amp; Suppliers</h1>
          <p>Ghana&apos;s hub for local farms, wholesale buyers and agricultural suppliers — grow and trade with confidence.</p>
          <div className={styles.actions}>
            <Link href="/join" className={styles.primaryButton}>Register Your Farm or Shop</Link>
            <Link href="/directory" className={styles.secondaryButton}>Browse Farms &amp; Suppliers</Link>
          </div>
        </div>
        <div className={styles.heroMedia}>
          <picture>
            <source media="(max-width: 520px)" srcSet="/stage1-media/hero-clay-map-640.webp" />
            <source media="(max-width: 1100px)" srcSet="/stage1-media/hero-clay-map-1088.webp" />
            <img src="/stage1-media/hero-clay-map-1600.webp" alt="Illustrative clay map of Ghana with agricultural produce and connection markers" width="1600" height="1195" fetchPriority="high" />
          </picture>
        </div>
      </section>

      <section className={styles.gateways} aria-label="Start here">
        <div className={styles.gatewayGrid}>
          <article className={`${styles.gatewayCard} ${styles.offerGateway}`}><span className={styles.gatewayIcon}><Store aria-hidden="true" /></span><h3>Show What You Offer</h3><p>List your farm or shop and help wholesale buyers discover what you offer.</p><Link href="/join">Register Your Farm or Shop <ArrowRight size={17} aria-hidden="true" /></Link></article>
          <article className={`${styles.gatewayCard} ${styles.mamaGateway}`}><span className={styles.gatewayIcon}><Sprout aria-hidden="true" /></span><h3>Mama G — Digital Farm Mate</h3><p>Ask about crop troubles, pests or planting dates. Get practical answers.</p><Link href="/farmer-hub">Ask Mama G <ArrowRight size={17} aria-hidden="true" /></Link></article>
          <article className={`${styles.gatewayCard} ${styles.buyerGateway}`}><span className={styles.gatewayIcon}><ShoppingBasket aria-hidden="true" /></span><h3>Looking to Buy?</h3><p>Share your produce or supply needs. Ghana Growers can help route the request when enquiries open.</p><Link href="/submit-buyer-request">Request Product <ArrowRight size={17} aria-hidden="true" /></Link></article>
        </div>
      </section>

      <section className={styles.directory} aria-labelledby="directory-title">
        <div className={styles.directoryTop}><div><p className={styles.eyebrow}>DIRECTORY</p><h2 id="directory-title">Find Farms &amp; Agro-Suppliers</h2><p>Discover published farmers and suppliers.</p></div><Link href="/directory" className={styles.textLink}>View all <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <nav className={styles.directoryTabs} aria-label="Directory types">
          <Link href="/directory" aria-current="page">Farms</Link>
          <Link href="/supplier-directory">Suppliers &amp; Services</Link>
        </nav>
        {farmerResult.status === "unavailable" || supplierResult.status === "unavailable" ? (
          <p className={styles.emptyState} role="status">Published profiles are temporarily unavailable. Please try again later.</p>
        ) : farmers.length + suppliers.length === 0 ? (
          <p className={styles.emptyState}>No farmer or supplier profiles are published yet.</p>
        ) : (
          <div className={styles.profileRail} aria-label="Published directory profiles">
            {farmers.map((farmer) => <article className={styles.profileCard} key={farmer.slug}><div className={styles.profileImage}>{farmer.hasRealPhoto && farmer.mainImage ? <FarmerProfileImage src={farmer.mainImage} alt={`${farmer.farmName} farm photo`} variant="card" fallbackKind="farmer" sizes="(max-width: 700px) 284px, (max-width: 980px) 50vw, 280px" /> : <span><Wheat aria-hidden="true" />Photo not available</span>}</div><div className={styles.profileBody}><h3>{farmer.farmName}</h3><p className={styles.productChip}>{farmerCardProducts(farmer).slice(0, 3).join(" · ") || "Profile details available"}</p><p>{cleanFarmerLocation(farmer)}</p><Link href={`/farmer-directory/${farmer.slug}`} aria-label={`View ${farmer.farmName} profile`}><ArrowRight aria-hidden="true" /></Link></div></article>)}
            {suppliers.map((supplier) => <article className={styles.profileCard} key={supplier.slug}><div className={styles.profileImage}>{supplier.photos[0] ? <img src={supplier.photos[0]} alt={`${supplier.companyName} supplier profile`} /> : <span><Store aria-hidden="true" />Photo not available</span>}</div><div className={styles.profileBody}><h3>{supplier.companyName}</h3><p className={styles.productChip}>{supplier.productsServices.slice(0, 3).join(" · ") || "Supplier details available"}</p><p>{supplier.district}, {supplier.region}</p><Link href={`/supplier-directory/${supplier.slug}`} aria-label={`View ${supplier.companyName} profile`}><ArrowRight aria-hidden="true" /></Link></div></article>)}
          </div>
        )}
        {farmers.length + suppliers.length > 0 ? <div className={styles.railCue}><span>Swipe profiles</span><span aria-hidden="true">● ○ ○ ○</span></div> : null}
        <div className={styles.directoryActions}><Link href="/directory" className={styles.primaryButton}>View all farms</Link><Link href="/join" className={styles.secondaryButton}>Register Your Farm or Shop</Link></div>
      </section>

      <section className={styles.mama} aria-labelledby="mama-title">
        <div className={styles.mamaHeading}><p className={styles.mamaTitle}>Meet Mama G</p><h2 id="mama-title">Your digital farm mate</h2></div>
        <div className={styles.mamaShowcase}>
          <div className={styles.phone}><FounderApprovedMamaGPhone /></div>
          <div className={styles.mamaFeatures}>{mamaFeatures.map(({ title, copy, icon: Icon }) => <article key={title}><span><Icon size={21} aria-hidden="true" /></span><div><h3>{title}</h3><p>{copy}</p></div><ArrowRight className={styles.featureArrow} size={17} aria-hidden="true" /></article>)}</div>
        </div>
      </section>

      <section className={styles.registration} aria-labelledby="registration-title">
        <div className={styles.registrationMedia}><picture><source media="(max-width: 520px)" srcSet="/stage1-media/registration-r1-720.webp" /><source media="(max-width: 1100px)" srcSet="/stage1-media/registration-r1-1200.webp" /><img src="/stage1-media/registration-r1-1600.webp" alt="Illustrative farmer holding a phone in a farm setting" width="1600" height="1067" loading="lazy" decoding="async" /></picture></div>
        <div className={styles.registrationCopy}><p className={styles.eyebrow}>JOIN THE NETWORK</p><h2 id="registration-title">Are you a farmer or supplier?</h2><p>Join Ghana Growers and help buyers discover your farm, products or services.</p><Link href="/submit-listing" className={styles.lightButton}>List a Product</Link></div>
      </section>

      <section className={styles.categorySection} aria-labelledby="category-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>EXPLORE</p><h2 id="category-title">Explore agricultural categories</h2></div>
        <p className={styles.categoryIntro}>A starting point for discovering farms, supplies and equipment.</p>
        <div className={styles.categoryRail} role="group" aria-label="Agricultural categories">{categories.map((category) => <article key={category.title}><picture><source media="(max-width: 520px)" srcSet={`/stage1-media/${category.stem}-116.webp`} /><img src={`/stage1-media/${category.stem}-168.webp`} alt="" width="168" height="168" /></picture><h3>{category.title}</h3></article>)}</div>
        <div className={styles.railCue}><span>Swipe categories</span><span aria-hidden="true">● ○ ○ ○ ○</span></div>
        <div className={styles.categoryActions}><Link href="/submit-buyer-request" className={styles.primaryButton}>Are you a buyer? Request Product</Link><Link href="/directory" className={styles.secondaryButton}>Browse Farms &amp; Suppliers</Link></div>
      </section>

      <section className={styles.howItWorks} id="how-it-works" aria-labelledby="how-title">
        <HowItWorksVideo />
        <div className={styles.steps}><p className={styles.eyebrow}>HOW IT WORKS</p><h2 id="how-title">Simple as 1, 2, 3.</h2><ol><li><span>1</span><div><h3>Search</h3><p>Browse farms, produce, agricultural suppliers and services.</p></div></li><li><span>2</span><div><h3>Enquire</h3><p>Buyer requests are currently closed while the managed enquiry service is prepared.</p></div></li><li><span>3</span><div><h3>Connect</h3><p>When enabled, Ghana Growers will coordinate suitable introductions where possible.</p></div></li></ol></div>
      </section>
    </main>
  );
}
