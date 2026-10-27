/* eslint-disable @next/next/no-img-element */
import { ArrowRight, CalendarDays, Camera, CloudSun, PackageCheck, Plus, ShoppingBasket, Sprout, Store, Wheat } from "lucide-react";
import Link from "next/link";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { ApprovedMamaGPhone } from "@/components/homepage/ApprovedMamaGPhone";
import { HowItWorksVideo } from "@/components/homepage/HowItWorksVideo";
import { foundationFont } from "@/components/homepage-foundation/font";
import { cleanFarmerLocation, farmerCardProducts } from "@/lib/farmerDirectory";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
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

const GENERATED_MEDIA_DISCLOSURE = "Illustrative AI-generated imagery. It does not depict actual Ghana Growers members, farms or transactions.";

export async function Stage1Homepage() {
  const [farmerResult, supplierResult] = await Promise.all([getFarmersData(), getSuppliersData()]);
  const farmers = farmerResult.status === "ready" ? farmerResult.data.slice(0, 4) : [];
  const suppliers = supplierResult.status === "ready" ? supplierResult.data.slice(0, 1) : [];
  const farmerWorkflow = getPublicWorkflowState("farmer-registration");
  const supplierWorkflow = getPublicWorkflowState("supplier-registration");
  const buyerWorkflow = getPublicWorkflowState("lead-requests");

  return (
    <main className={`${styles.homepage} ${foundationFont.className}`}>
      <section className={styles.hero} aria-labelledby="homepage-hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Ghana&apos;s agricultural network</p>
          <h1 id="homepage-hero-title">Find Farms, Produce &amp; Suppliers</h1>
          <p>Ghana&apos;s hub for local farms, wholesale buyers and agricultural suppliers — grow and trade with confidence.</p>
          <div className={styles.actions}>
            <button type="button" disabled className={styles.primaryButton} title="Registration is not open yet"><Plus size={18} aria-hidden="true" />Get Listed Free</button>
            <Link href="/directory" className={styles.secondaryButton}>Browse Farms &amp; Suppliers</Link>
          </div>
          <p className={styles.availability}>{farmerWorkflow.publicMessage} Published directory profiles remain available to browse.</p>
        </div>
        <div className={styles.heroMedia}>
          <picture>
            <source media="(max-width: 520px)" srcSet="/stage1-media/hero-clay-map-640.webp" />
            <source media="(max-width: 1100px)" srcSet="/stage1-media/hero-clay-map-1088.webp" />
            <img src="/stage1-media/hero-clay-map-1600.webp" alt="Illustrative clay map of Ghana with agricultural produce and connection markers" width="1600" height="1195" fetchPriority="high" aria-describedby="hero-generated-media-disclosure" />
          </picture>
          <p id="hero-generated-media-disclosure" className={styles.imageDisclosure}>{GENERATED_MEDIA_DISCLOSURE}</p>
        </div>
      </section>

      <section className={styles.gateways} aria-labelledby="gateway-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>START HERE</p><h2 id="gateway-title">What would you like to do?</h2></div>
        <div className={styles.gatewayGrid}>
          <article className={styles.gatewayCard}><Store aria-hidden="true" /><h3>Show What You Offer</h3><p>{farmerWorkflow.publicMessage} {supplierWorkflow.publicMessage}</p><span className={styles.closedAction}>Registration closed</span></article>
          <article className={`${styles.gatewayCard} ${styles.mamaGateway}`}><Sprout aria-hidden="true" /><h3>Mama G — Digital Farm Mate</h3><p>Ask a farming question or use practical farm tools.</p><Link href="/farmer-hub">Ask Mama G <ArrowRight size={17} aria-hidden="true" /></Link></article>
          <article className={styles.gatewayCard}><ShoppingBasket aria-hidden="true" /><h3>Looking to Buy?</h3><p>Browse published farms and suppliers. {buyerWorkflow.publicMessage}</p><Link href="/directory">Browse the directory <ArrowRight size={17} aria-hidden="true" /></Link></article>
        </div>
      </section>

      <section className={styles.directory} aria-labelledby="directory-title">
        <div className={styles.directoryTop}><div><p className={styles.eyebrow}>DIRECTORY</p><h2 id="directory-title">Find Farms &amp; Agro-Suppliers</h2><p>Discover published farmers and suppliers.</p></div><Link href="/directory" className={styles.textLink}>View all <ArrowRight size={17} aria-hidden="true" /></Link></div>
        {farmerResult.status === "unavailable" || supplierResult.status === "unavailable" ? (
          <p className={styles.emptyState} role="status">Published profiles are temporarily unavailable. Please try again later.</p>
        ) : farmers.length + suppliers.length === 0 ? (
          <p className={styles.emptyState}>No farmer or supplier profiles are published yet.</p>
        ) : (
          <div className={styles.profileRail} aria-label="Published directory profiles">
            {farmers.map((farmer) => <article className={styles.profileCard} key={farmer.slug}><div className={styles.profileImage}>{farmer.hasRealPhoto && farmer.mainImage ? <FarmerProfileImage src={farmer.mainImage} alt={`${farmer.farmName} farm photo`} variant="card" fallbackKind="farmer" sizes="(max-width: 520px) 78vw, 280px" /> : <span><Wheat aria-hidden="true" />Photo unavailable</span>}</div><div className={styles.profileBody}><h3>{farmer.farmName}</h3><p>{cleanFarmerLocation(farmer)}</p><p>{farmerCardProducts(farmer).slice(0, 3).join(" · ") || "Profile details available"}</p><Link href={`/farmer-directory/${farmer.slug}`}>View profile</Link></div></article>)}
            {suppliers.map((supplier) => <article className={styles.profileCard} key={supplier.slug}><div className={styles.profileImage}>{supplier.photos[0] ? <img src={supplier.photos[0]} alt="" /> : <span><Store aria-hidden="true" />Photo unavailable</span>}</div><div className={styles.profileBody}><h3>{supplier.companyName}</h3><p>{supplier.district}, {supplier.region}</p><p>{supplier.productsServices.slice(0, 3).join(" · ")}</p><Link href={`/supplier-directory/${supplier.slug}`}>View profile</Link></div></article>)}
          </div>
        )}
        <div className={styles.directoryActions}><Link href="/directory" className={styles.primaryButton}>Browse Farms &amp; Suppliers</Link><button disabled type="button" className={styles.secondaryButton} title="Registration is not open yet"><Plus size={18} aria-hidden="true" />Add your farm</button></div>
      </section>

      <section className={styles.mama} aria-labelledby="mama-title">
        <div className={styles.phone}><ApprovedMamaGPhone /></div>
        <div className={styles.mamaContent}><p className={styles.eyebrow}>MEET MAMA G</p><h2 id="mama-title">Your digital farm mate</h2><p>Practical support for questions, crop checks, planning, harvest and weather-aware farm decisions.</p><div className={styles.mamaFeatures}>{mamaFeatures.map(({ title, copy, icon: Icon }) => <article key={title}><span><Icon size={21} aria-hidden="true" /></span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div><Link href="/farmer-hub" className={styles.primaryButton}>Ask Mama G <ArrowRight size={18} aria-hidden="true" /></Link><p className={styles.aiNote}>Mama G uses AI and can make mistakes. Check labels and seek qualified local advice for important decisions.</p></div>
      </section>

      <section className={styles.registration} aria-labelledby="registration-title">
        <div className={styles.registrationMedia}><picture><source media="(max-width: 520px)" srcSet="/stage1-media/registration-r1-720.webp" /><source media="(max-width: 1100px)" srcSet="/stage1-media/registration-r1-1200.webp" /><img src="/stage1-media/registration-r1-1600.webp" alt="Illustrative farmer holding a phone in a farm setting" width="1600" height="1067" loading="lazy" decoding="async" aria-describedby="registration-generated-media-disclosure" /></picture><p id="registration-generated-media-disclosure" className={styles.imageDisclosure}>{GENERATED_MEDIA_DISCLOSURE}</p></div>
        <div className={styles.registrationCopy}><p className={styles.eyebrow}>JOIN THE NETWORK</p><h2 id="registration-title">Are you a farmer or supplier?</h2><p>Join Ghana Growers and help buyers discover your farm, products or services. Basic listing is planned to be free.</p><button type="button" disabled className={styles.lightButton} title={farmerWorkflow.publicMessage}><Plus size={18} aria-hidden="true" />Get Listed Free</button><p>{farmerWorkflow.publicMessage}</p></div>
      </section>

      <section className={styles.categorySection} aria-labelledby="category-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>EXPLORE</p><h2 id="category-title">Explore agricultural categories</h2></div>
        <div className={styles.categoryRail} role="group" aria-label="Agricultural categories" aria-describedby="category-generated-media-disclosure">{categories.map((category) => <article key={category.title}><picture><source media="(max-width: 520px)" srcSet={`/stage1-media/${category.stem}-116.webp`} /><img src={`/stage1-media/${category.stem}-168.webp`} alt="" width="168" height="168" /></picture><h3>{category.title}</h3></article>)}</div>
        <p id="category-generated-media-disclosure" className={styles.categoryDisclosure}>{GENERATED_MEDIA_DISCLOSURE}</p>
        <div className={styles.categoryActions}><button type="button" disabled className={styles.secondaryButton} title={buyerWorkflow.publicMessage}>Request Produce</button><Link href="/directory" className={styles.primaryButton}>Browse Farms &amp; Suppliers</Link></div>
      </section>

      <section className={styles.howItWorks} id="how-it-works" aria-labelledby="how-title">
        <HowItWorksVideo />
        <div className={styles.steps}><p className={styles.eyebrow}>HOW IT WORKS</p><h2 id="how-title">Simple as 1, 2, 3.</h2><ol><li><span>1</span><div><h3>Search</h3><p>Browse farms, produce, agricultural suppliers and services.</p></div></li><li><span>2</span><div><h3>Enquire</h3><p>{buyerWorkflow.publicMessage}</p></div></li><li><span>3</span><div><h3>Connect</h3><p>When enabled, Ghana Growers will coordinate suitable introductions where possible.</p></div></li></ol></div>
      </section>
    </main>
  );
}
