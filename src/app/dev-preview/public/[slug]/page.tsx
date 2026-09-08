import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewHeader, PreviewFooter } from "@/components/homepage/PreviewChrome";
import { foundationFont } from "@/components/homepage-foundation/font";
import { publicPreviewPages } from "@/content/public-preview";
import { getHomepagePreviewMedia } from "../../amended-homepage/media";
import styles from "@/styles/amended-homepage.module.css";

export const dynamic = "force-dynamic";
type Props = { params: { slug: string } };
function getPage(slug: string) {
  if (process.env.VERCEL_ENV === "production" || !Object.hasOwn(publicPreviewPages, slug)) notFound();
  return publicPreviewPages[slug as keyof typeof publicPreviewPages];
}
export function generateMetadata({params}: Props): Metadata {
  const page = getPage(params.slug);
  return { title: `${page.title} · Protected Preview`, description: page.intro,
    robots: {index:false,follow:false},
    openGraph: {title:page.title,description:page.intro,images:[]},
    twitter: {title:page.title,description:page.intro,images:[]} };
}
// Existing /dev-preview middleware protects HTML and RSC in both launch modes.
// No operational loaders, submissions, public fixtures or new access mechanism.
export default function PublicPreviewPage({params}: Props) {
  const page = getPage(params.slug);
  const {logo} = getHomepagePreviewMedia();
  return <div className={`${styles.page} ${foundationFont.variable}`} data-public-preview={params.slug}>
    <a className={styles.skipLink} href="#preview-content">Skip to page content</a>
    <PreviewHeader logo={logo}/>
    <aside className={styles.review} aria-label="Preview review boundary"><strong>Protected Preview · P09-1A</strong><p>Explanatory pages for founder review. Operational destinations remain unavailable; this Preview does not demonstrate live sourcing or support.</p></aside>
    <article id="preview-content" tabIndex={-1} className={styles.explanation} aria-labelledby="page-title">
      <a className={styles.backLink} href="/dev-preview/amended-homepage">Ghana Growers home</a>
      <header><p className={styles.eyebrow}>Ghana Growers</p><h1 id="page-title">{page.title}</h1><p className={styles.explanationIntro}>{page.intro}</p></header>
      <div className={styles.explanationSections}>{page.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}</div>
      <nav className={styles.relatedPages} aria-label="Related information">
        {params.slug !== "how-it-works" && <a href="/dev-preview/public/how-it-works">How Ghana Growers works</a>}
        {params.slug !== "how-information-is-checked" && <a href="/dev-preview/public/how-information-is-checked">How information is checked</a>}
        {params.slug !== "contact" && <a href="/dev-preview/public/contact">Contact</a>}
      </nav>
    </article>
    <PreviewFooter logo={logo}/>
  </div>;
}
