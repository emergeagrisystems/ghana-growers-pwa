/* eslint-disable @next/next/no-img-element */
import { ArrowRight, ClipboardList, MessagesSquare, Sprout, Store, Wheat } from "lucide-react";
import Link from "next/link";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { MamaGShowcase } from "./MamaGShowcase";
import { CategoryStrip } from "./CategoryStrip";
import refine from "./Refinements.module.css";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { EcosystemHeadline, HeadlineControl, HeroHeadlineProvider } from "./EcosystemHeadline";
import { HomeAskEntry } from "@/components/homepage/HomeAskEntry";
import { foundationFont } from "@/components/homepage-foundation/font";
import { cleanFarmerLocation, farmerCardProducts } from "@/lib/farmerDirectory";
import { getFarmersData, getSuppliersData } from "@/lib/supabase/publicData";
import styles from "./Stage1Homepage.module.css";

export async function Stage1Homepage() {
  const buyerRequests = getPublicWorkflowState("buyer-request-submissions");
  const farmerOpen = getPublicWorkflowState("farmer-registration").available;
  const supplierOpen = getPublicWorkflowState("supplier-registration").available;
  const productOpen = getPublicWorkflowState("listing-submissions").available;
  const [farmerResult, supplierResult] = await Promise.all([getFarmersData(), getSuppliersData()]);
  const farmers = farmerResult.status === "ready" ? farmerResult.data.slice(0, 3) : [];
  const suppliers = supplierResult.status === "ready" ? supplierResult.data.slice(0, 3) : [];
  return (
    <main className={`${styles.homepage} ${foundationFont.className}`}>
      <section className={styles.hero} aria-labelledby="homepage-hero-title">
        <picture className={styles.fieldPhoto}>
          <source media="(max-width: 700px)" srcSet="/hm1/hm1-growing-field-mobile.webp" />
          <source media="(max-width: 1100px)" srcSet="/hm1/hm1-growing-field-tablet.webp" />
          <img src="/hm1/hm1-growing-field-wide.webp" alt="" width="1680" height="946" fetchPriority="high" />
        </picture>
        <HeroHeadlineProvider>
          <div className={styles.heroCopy}>
            <EcosystemHeadline />
            <p>Discover farms, crops, seeds, livestock and farm equipment across Ghana.</p>
            <div className={styles.actions}>
              <Link href="/directory" className={styles.primaryButton}>Search Farms &amp; Suppliers</Link>
              <Link href="/join" className={styles.secondaryButton}>{farmerOpen || supplierOpen || productOpen ? "Get Listed Free" : "Get Listed Free · Closed"}</Link>
            </div>
          </div>
          <div className={styles.heroAssistant}>
            <HomeAskEntry />
            <HeadlineControl />
          </div>
        </HeroHeadlineProvider>
      </section>

      <section className={styles.buyerSection} aria-labelledby="buyer-title">
        <div className={styles.buyerBanner}>
          <span className={styles.buyerIcon}>
            <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M4 12h5l12-6v20L9 20H4zM7 21h5l2 7H9z" />
              <path d="M25 10l3-2m-2 8h4m-5 6l3 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className={styles.buyerCopy}>
            <h2 id="buyer-title">Tell Farmers What You Need</h2>
            <p>For wholesale buyers, restaurants, market traders, farmers, agribusinesses and households.</p>
            <p className={styles.buyerExample}><strong>Example request</strong><span>20 crates of tomatoes · Kumasi · Next week</span></p>
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
        <CategoryStrip />
      </section>

      <section className={styles.directory} aria-labelledby="farmer-title">
        <div className={refine.showcaseHead}><h2 id="farmer-title">Farm Showcase</h2>
          <div className={refine.showcaseActions}>
            <Link className={styles.primaryButton} href="/farmer-directory">Browse all farms</Link>
            <Link className={styles.secondaryButton} href="/join/farmer">+ Add my Farm{!farmerOpen && " · Closed"}</Link>
          </div>
        </div>
        {farmerResult.status === "unavailable" ? <p role="status" className={refine.compactNotice}>Published farms are temporarily unavailable. Please try again later.</p>
          : farmers.length ? <div className={`${styles.profileRail} ${refine.profileGrid}`} aria-label="Published farms">
            {farmers.map((farmer) => <article className={styles.profileCard} key={farmer.slug}><div className={styles.profileImage}>{farmer.hasRealPhoto && farmer.mainImage ? <FarmerProfileImage src={farmer.mainImage} alt={`${farmer.farmName} farm photo`} variant="card" fallbackKind="farmer" sizes="(max-width: 700px) 284px, (max-width: 980px) 50vw, 280px" /> : <span><Wheat aria-hidden="true" />Photo not available</span>}</div><div className={styles.profileBody}><h3>{farmer.farmName}</h3><p className={styles.productChip}>{farmerCardProducts(farmer).slice(0, 3).join(" · ") || "Profile details available"}</p><p>{cleanFarmerLocation(farmer)}</p><Link href={`/farmer-directory/${farmer.slug}`} aria-label={`View ${farmer.farmName} profile`}><ArrowRight aria-hidden="true" /></Link></div></article>)}
          </div> : <p className={refine.compactNotice}>No farms are published yet.</p>}
      </section>

      <section className={styles.directory} aria-labelledby="supplier-title">
        <div className={refine.showcaseHead}><h2 id="supplier-title">Agro-Supplier Showcase</h2>
          <div className={refine.showcaseActions}>
            <Link className={styles.primaryButton} href="/supplier-directory">Browse all suppliers</Link>
            <Link className={styles.secondaryButton} href="/become-a-supplier">+ Add my Business{!supplierOpen && " · Closed"}</Link>
          </div>
        </div>
        {supplierResult.status === "unavailable" ? <p role="status" className={refine.compactNotice}>Published suppliers are temporarily unavailable. Please try again later.</p>
          : suppliers.length ? <div className={`${styles.profileRail} ${refine.profileGrid}`} aria-label="Published suppliers">
            {suppliers.map((supplier) => <article className={styles.profileCard} key={supplier.slug}><div className={styles.profileImage}>{supplier.photos[0] ? <img src={supplier.photos[0]} alt={`${supplier.companyName} supplier profile`} /> : <span><Store aria-hidden="true" />Photo not available</span>}</div><div className={styles.profileBody}><h3>{supplier.companyName}</h3><p className={styles.productChip}>{supplier.productsServices.slice(0, 3).join(" · ") || "Supplier details available"}</p><p>{supplier.district}, {supplier.region}</p><Link href={`/supplier-directory/${supplier.slug}`} aria-label={`View ${supplier.companyName} profile`}><ArrowRight aria-hidden="true" /></Link></div></article>)}
          </div> : <p className={refine.compactNotice}>Supply farm inputs, equipment or services? <Link href="/become-a-supplier">Add your business here.</Link></p>}
      </section>

      <MamaGShowcase />

      <section className={styles.registration} aria-labelledby="registration-title">
        <div className={styles.registrationMedia}><picture><source media="(max-width: 700px)" srcSet="/hm1/nursery-mobile.webp" /><img src="/hm1/nursery-desktop.webp" alt="Grower tending young seedlings in trays under nursery shade netting" width="1200" height="800" loading="lazy" decoding="async" /></picture></div>
        <div className={styles.registrationCopy}><p className={styles.eyebrow}>JOIN THE NETWORK</p><h2 id="registration-title">Are you a farmer or supplier?</h2><p>Join Ghana Growers and help buyers discover your farm, products or services.</p><Link href="/submit-listing" className={styles.lightButton}>List a Product{!productOpen && " · Closed"}</Link></div>
      </section>

      <section className={styles.howItWorks} id="how-it-works" aria-labelledby="how-title">
        <picture className={styles.collectionPhoto}>
          <source media="(max-width: 700px)" srcSet="/hm1/maize-table-mobile.webp" />
          <img src="/hm1/maize-table-desktop.webp" alt="Hands inspecting maize kernels beside an open sack and a small weighing scale" width="1200" height="800" loading="lazy" decoding="async" />
        </picture>
        <div className={styles.steps}><p className={styles.eyebrow}>HOW IT WORKS</p><h2 id="how-title">Simple as 1, 2, 3.</h2><ol><li><span>1</span><div><h3>Search</h3><p>Browse farms, produce, agricultural suppliers and services.</p></div></li><li><span>2</span><div><h3>Enquire</h3><p>{buyerRequests.available ? "Send a private request with the product, quantity and area you need." : "Buyer requests are currently closed."}</p></div></li><li><span>3</span><div><h3>Connect</h3><p>Ghana Growers reviews requests and coordinates introductions where possible.</p></div></li></ol></div>
      </section>
      <nav aria-label="Homepage quick access" className={styles.dock}>
          <Link href="/farmer-directory"><Wheat />Farms</Link>
          <Link href="/supplier-directory"><Store />Suppliers</Link>
          <Link href="/farmer-hub" className={styles.dockAsk}><i><Sprout /></i>Mama G</Link>
          <Link href="/submit-buyer-request" aria-label={buyerRequests.available ? "Request — submit a private buyer request" : "Request — enquiries currently closed"}><ClipboardList />Request{!buyerRequests.available && <small>Closed</small>}</Link>
          <a href="https://wa.me/233208508868" target="_blank" rel="noopener noreferrer"><MessagesSquare aria-hidden="true" />WhatsApp</a>
        </nav>
    </main>
  );
}
