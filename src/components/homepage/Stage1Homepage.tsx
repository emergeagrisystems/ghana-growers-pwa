/* eslint-disable @next/next/no-img-element */
import { ArrowRight, CalendarDays, Camera, CloudSun, ClipboardList, Megaphone, MessagesSquare, PackageCheck, Sprout, Store, Wheat } from "lucide-react";
import Link from "next/link";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { FounderApprovedMamaGPhone } from "@/components/homepage/FounderApprovedMamaGPhone";
import { MamaGFeatureList } from "./MamaGFeatureList";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { EcosystemHeadline } from "./EcosystemHeadline";
import { HomeAskEntry } from "@/components/homepage/HomeAskEntry";
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
  { title: "Ask Mama G", copy: "Ask a question about your farm.", icon: MessagesSquare },
  { title: "Crop Doctor", copy: "Share a crop photo for guidance.", icon: Camera },
  { title: "Crop Calendar & Planting Advisor", copy: "Check planting readiness and what to do next.", icon: CalendarDays },
  { title: "Storage tips", copy: "Get help handling and storing your harvest.", icon: PackageCheck },
  { title: "Today’s farm weather", copy: "Check local conditions before fieldwork.", icon: CloudSun }
] as const;

export async function Stage1Homepage() {
  const buyerRequests = getPublicWorkflowState("buyer-request-submissions");
  const [farmerResult, supplierResult] = await Promise.all([getFarmersData(), getSuppliersData()]);
  const farmers = farmerResult.status === "ready" ? farmerResult.data.slice(0, 4) : [];
  const suppliers = supplierResult.status === "ready" ? supplierResult.data.slice(0, 1) : [];
  return (
    <main className={`${styles.homepage} ${foundationFont.className}`}>
      <section className={styles.hero} aria-labelledby="homepage-hero-title">
        <picture className={styles.fieldPhoto}>
          <source media="(max-width: 700px)" srcSet="/hm1/hm1-growing-field-mobile.webp" />
          <source media="(max-width: 1100px)" srcSet="/hm1/hm1-growing-field-tablet.webp" />
          <img src="/hm1/hm1-growing-field-wide.webp" alt="" width="1680" height="946" fetchPriority="high" />
        </picture>
        <div className={styles.heroCopy}>
          <EcosystemHeadline />
          <p>Discover farms, crops, seeds, livestock and farm equipment across Ghana.</p>
          <div className={styles.actions}>
            <Link href="/directory" className={styles.primaryButton}>Search Farms &amp; Suppliers</Link>
            <Link href="/join" className={styles.secondaryButton}>Get Listed Free</Link>
          </div>
        </div>
        <HomeAskEntry />

      </section>

      <section className={styles.buyerSection} aria-labelledby="buyer-title">
        <div className={styles.buyerBanner}>
          <span className={styles.buyerIcon}><Megaphone aria-hidden="true" /></span>
          <div className={styles.buyerCopy}>
            <h2 id="buyer-title">Tell Farmers What You Need</h2>
            <p>For wholesale buyers, restaurants, market traders, farmers, agribusinesses and households.</p>
          </div>
          <div className={styles.buyerAction}>
            {buyerRequests.available ? (
              <Link href="/submit-buyer-request" className={styles.primaryButton}>Submit Buyer Request</Link>
            ) : (
              <>
                <span id="buyer-availability">Requests currently closed</span>
                <button type="button" disabled aria-describedby="buyer-availability">Submit Buyer Request</button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={styles.directory} aria-labelledby="directory-title">
        <div className={styles.directoryTop}><div><p className={styles.eyebrow}>DIRECTORY</p><h2 id="directory-title">Top Farms &amp; Agro-Suppliers</h2><p>Discover published farmers and suppliers.</p></div><Link href="/directory" className={styles.textLink}>View all <ArrowRight size={17} aria-hidden="true" /></Link></div>
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
        {farmers.length + suppliers.length > 1 ? <div className={styles.railCue}><span>Swipe profiles</span></div> : null}
        <div className={styles.directoryActions}><Link href="/directory" className={styles.primaryButton}>View all farms</Link><Link href="/join" className={styles.secondaryButton}>Register Your Farm or Shop</Link></div>
      </section>

      <section className={styles.mama} aria-labelledby="mama-title">
        <div className={styles.mamaHeading}><p className={styles.mamaTitle}>Meet Mama G</p><h2 id="mama-title">Your digital farm mate</h2></div>
        <div className={styles.mamaShowcase}>
          <div className={styles.phone}><FounderApprovedMamaGPhone /></div>
          <div className={styles.featureColumn}>
            <MamaGFeatureList>
              {mamaFeatures.map(({ title, copy, icon: Icon }) => (
                <li key={title}>
                  <span className={styles.featureIcon}><Icon size={22} aria-hidden="true" /></span>
                  <div><h3>{title}</h3><p>{copy}</p></div>
                </li>
              ))}
            </MamaGFeatureList>
            <Link href="/farmer-hub" className={styles.primaryButton}>Open Mama G</Link>
          </div>
        </div>
      </section>

      <section className={styles.categorySection} aria-labelledby="category-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>Explore</p><h2 id="category-title">Agricultural categories</h2></div>
        <p className={styles.categoryIntro}>A starting point for discovering farms, supplies and equipment.</p>
        <div className={styles.categoryRail} tabIndex={0} role="region" aria-label="Agricultural categories">{categories.map((category) => <article key={category.title}><picture><source media="(max-width: 520px)" srcSet={`/stage1-media/${category.stem}-116.webp`} /><img src={`/stage1-media/${category.stem}-168.webp`} alt="" width="168" height="168" /></picture><h3>{category.title}</h3></article>)}</div>
        <div className={styles.railCue}><span>Swipe categories</span></div>
        <div className={styles.categoryActions}><Link href="/directory" className={styles.secondaryButton}>Browse Farms &amp; Suppliers</Link></div>
      </section>

      <section className={styles.registration} aria-labelledby="registration-title">
        <div className={styles.registrationMedia}><picture><source media="(max-width: 700px)" srcSet="/hm1/nursery-mobile.webp" /><img src="/hm1/nursery-desktop.webp" alt="Grower tending young seedlings in trays under nursery shade netting" width="1200" height="800" loading="lazy" decoding="async" /></picture></div>
        <div className={styles.registrationCopy}><p className={styles.eyebrow}>JOIN THE NETWORK</p><h2 id="registration-title">Are you a farmer or supplier?</h2><p>Join Ghana Growers and help buyers discover your farm, products or services.</p><Link href="/submit-listing" className={styles.lightButton}>List a Product</Link></div>
      </section>

      <section className={styles.howItWorks} id="how-it-works" aria-labelledby="how-title">
        <picture className={styles.collectionPhoto}>
          <source media="(max-width: 700px)" srcSet="/hm1/maize-table-mobile.webp" />
          <img src="/hm1/maize-table-desktop.webp" alt="Hands inspecting maize kernels beside an open sack and a small weighing scale" width="1200" height="800" loading="lazy" decoding="async" />
        </picture>
        <div className={styles.steps}><p className={styles.eyebrow}>HOW IT WORKS</p><h2 id="how-title">Simple as 1, 2, 3.</h2><ol><li><span>1</span><div><h3>Search</h3><p>Browse farms, produce, agricultural suppliers and services.</p></div></li><li><span>2</span><div><h3>Enquire</h3><p>Buyer requests are currently closed while the managed enquiry service is prepared.</p></div></li><li><span>3</span><div><h3>Connect</h3><p>When enabled, Ghana Growers will coordinate suitable introductions where possible.</p></div></li></ol></div>
      </section>
      <nav aria-label="Homepage quick access" className={styles.dock}>
          <Link href="/directory"><Wheat />Farms</Link>
          <Link href="/supplier-directory"><Store />Suppliers</Link>
          <Link href="/farmer-hub" className={styles.dockAsk}><i><Sprout /></i>Mama G</Link>
          <Link href="/submit-buyer-request" aria-label="Request — enquiries currently closed"><ClipboardList />Request</Link>
          <span aria-disabled="true"><MessagesSquare />WhatsApp<small>Unavailable</small></span>
        </nav>
    </main>
  );
}
