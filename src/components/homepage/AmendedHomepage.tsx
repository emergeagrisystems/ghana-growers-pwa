"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { MobileCardBrowser } from "./MobileCardBrowser";
import { PreviewHeader, PreviewFooter, ToolInterfacePreview } from "./PreviewChrome";
import { homepage as copy } from "@/content/homepage/amended";
import { categoryListings, discover, type HomepageData } from "@/lib/homepage/discovery";
import { foundationFont } from "@/components/homepage-foundation/font";
import styles from "@/styles/amended-homepage.module.css";

function UnavailableAction({label}: {label: string}) {
  return <button type="button" disabled className={styles.action} title={copy.unavailableAction}>{label}</button>;
}

function Tabs({names, selected, onChange, id}: {names: readonly string[]; selected: number; onChange: (index: number) => void; id: string}) {
  return <div className={styles.tabs} role="tablist" aria-label={id === "directory" ? copy.directoryTitle : copy.marketplaceTitle}>
    {names.map((name, index) => <button type="button" key={name} id={`${id}-tab-${index}`} role="tab" aria-selected={selected === index} aria-controls={`${id}-panel`} tabIndex={selected === index ? 0 : -1}
      onClick={() => onChange(index)} onKeyDown={event => {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % names.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + names.length) % names.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = names.length - 1;
        else return;
        event.preventDefault(); onChange(next); document.getElementById(`${id}-tab-${next}`)?.focus();
      }}>{name}</button>)}
  </div>;
}

export function AmendedHomepage({data}: {data: HomepageData}) {
  const [directoryTab, setDirectoryTab] = useState(0);
  const [marketTab, setMarketTab] = useState(0);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const searchId = useId();
  const directoryReady = data.directory.status === "ready";
  const profiles = discover(data.directory.items, "", directoryTab === 0 ? "farmer" : "supplier").slice(0, 4);
  const results = submitted === null ? [] : discover(data.directory.items, submitted);
  const listings = categoryListings(data.listings.items, copy.marketplaceTabs[marketTab]).slice(0, 4);
  return <section className={`${styles.page} ${foundationFont.variable}`} data-amended-homepage aria-label={copy.review}>
    <PreviewHeader />
    <aside className={styles.review}><strong>{copy.review}</strong><p>{copy.boundary}</p><p>Unresolved destinations remain disabled. No operational destinations or editorial resources are enabled by these fixtures.</p><p>{copy.mediaUnavailable}. The device is a static interface preview with inactive tools.</p><p data-fixture-notice><strong>{copy.fixtureNotice}</strong></p></aside>
    <header className={styles.hero} data-homepage-hero>
      <div className={styles.heroInner}>
        <p className={styles.brand}>Local · Fresh · Sustainable</p>
        <h1>{copy.headline}</h1>
        <div className={styles.actions}>{copy.actions.map(label => <UnavailableAction key={label} label={label} />)}</div>
        <form className={styles.search} onSubmit={event => { event.preventDefault(); if (directoryReady) setSubmitted(query.trim()); }}>
          <label htmlFor={searchId}>{copy.searchLabel}</label>
          <div><input id={searchId} type="search" value={query} disabled={!directoryReady} maxLength={120} onChange={event => setQuery(event.target.value)} placeholder={copy.searchHint} aria-describedby={directoryReady ? undefined : `${searchId}-hint`} /><button type="submit" disabled={!directoryReady}>Search</button></div>
          {!directoryReady && <p id={`${searchId}-hint`}>{copy.directoryUnavailable}</p>}
        </form>
        <div className={styles.shortcuts} aria-label="Popular searches">{copy.shortcuts.map(label => <button key={label} type="button" disabled={!directoryReady || label === "Farmland"} title={label === "Farmland" ? "Farmland discovery is not available" : undefined} onClick={() => {setQuery(label); setSubmitted(label);}}><span>{label}</span></button>)}</div>
        {submitted !== null && directoryReady && <section className={styles.results} aria-label="Search results"><h2>Search results</h2><p role="status">{results.length} {results.length === 1 ? "profile" : "profiles"} found in the synthetic dataset{submitted ? ` for “${submitted}”` : ""}.</p><ul>{results.map(entry => <li key={entry.id}><strong>{entry.name}</strong><p className={styles.availability}>{copy.fixtureLabel}</p><p>{entry.region} · {entry.products.join(", ")}</p></li>)}</ul></section>}
        <div className={styles.heroMedia}>
          <div className={styles.landscapePlaceholder} data-hero-placeholder role="img" aria-label={copy.mediaUnavailable}><div className={styles.fieldLines} aria-hidden="true"><i/><i/><i/></div></div>
        </div>
      </div>
    </header>
    <div className={styles.toolsStrip} data-tools-teaser><h2>{copy.toolsTitle}</h2><p className={styles.toolsIntro}>{copy.toolsIntro}</p><ul>{copy.toolsBenefits.map(benefit => <li key={benefit}><Check size={12} aria-hidden="true"/><strong>{benefit}</strong></li>)}</ul><div className={styles.deviceCue} data-device-cue><ToolInterfacePreview compact /></div></div>
    <section className={`${styles.section} ${styles.sage}`} aria-labelledby="homepage-directory">
      <div className={styles.sectionInner}><div className={styles.headingRow}><h2 id="homepage-directory">{copy.directoryTitle}</h2><UnavailableAction label={copy.directoryActions[directoryTab]} /></div>
        <Tabs names={copy.directoryTabs} selected={directoryTab} onChange={setDirectoryTab} id="directory" />
        <div id="directory-panel" role="tabpanel" aria-labelledby={`directory-tab-${directoryTab}`} tabIndex={0}>
          {!directoryReady ? <p className={styles.empty}>{copy.directoryUnavailable}</p> : profiles.length === 0 ? <p className={styles.empty}>No Preview fixtures match this category.</p> : <MobileCardBrowser key={directoryTab} label={directoryTab === 0 ? "farmer" : "supplier"}>{profiles.map(entry => <article key={entry.id}><div className={styles.profilePlaceholder}><span aria-hidden="true">{entry.kind === "farmer" ? "PF" : "PS"}</span><p>{entry.kind === "farmer" ? copy.profilePlaceholder : copy.servicePlaceholder}</p></div><h3>{entry.name}</h3><p className={styles.availability}>{copy.fixtureLabel}</p><p>{entry.region}</p><p>{entry.products.join(", ")}</p><p className={styles.availability}>Profile destination unavailable</p></article>)}</MobileCardBrowser>}
        </div>
      </div>
    </section>
    <section className={`${styles.section} ${styles.neutral}`} aria-labelledby="homepage-tools"><div className={`${styles.sectionInner} ${styles.showcase}`}>
      <ToolInterfacePreview /><div><p className={styles.eyebrow}>Farming tools</p><h2 id="homepage-tools">{copy.toolsHeading}</h2><ul className={styles.toolList}>{copy.tools.map(tool => <li key={tool.name}><strong>{tool.name}</strong><span>{tool.description}</span></li>)}</ul><p className={styles.availability}>Working names. Tool entry remains unavailable pending its own checks.</p></div>
    </div></section>
    <section className={`${styles.section} ${styles.cream}`} aria-labelledby="homepage-marketplace"><div className={styles.sectionInner}>
      <div className={styles.headingRow}><h2 id="homepage-marketplace">{copy.marketplaceTitle}</h2><UnavailableAction label={copy.marketplaceAction} /></div>
      <Tabs names={copy.marketplaceTabs} selected={marketTab} onChange={setMarketTab} id="marketplace" />
      <div id="marketplace-panel" role="tabpanel" aria-labelledby={`marketplace-tab-${marketTab}`} tabIndex={0}>{data.listings.status === "unavailable" ? <p className={styles.empty}>{copy.marketplaceUnavailable}</p> : listings.length === 0 ? <p className={styles.empty}>No Preview fixtures match this category.</p> : <MobileCardBrowser key={marketTab} label="listing">{listings.map(entry => <article key={entry.id}><div className={styles.cropPlaceholder}><span aria-hidden="true">{entry.category}</span><p>{copy.cropPlaceholder}</p></div><h3>{entry.title}</h3><p className={styles.availability}>{copy.fixtureLabel}</p><p>{entry.seller} · {entry.location}</p><p className={styles.availability}>Listing details unavailable</p></article>)}</MobileCardBrowser>}</div>
    </div></section>
    <section className={`${styles.section} ${styles.neutral}`} aria-labelledby="homepage-how"><div className={styles.sectionInner}>
      <div className={styles.headingRow}><h2 id="homepage-how">{copy.howTitle}</h2><UnavailableAction label={copy.howAction} /></div><ol className={styles.steps}>{copy.steps.map((step, index) => <li key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </div></section>
    <section className={`${styles.section} ${styles.sage}`} aria-labelledby="homepage-learn"><div className={styles.sectionInner}>
      <div className={styles.headingRow}><h2 id="homepage-learn">{copy.learnTitle}</h2><UnavailableAction label={copy.learnAction} /></div>{data.resources.status === "unavailable" ? <p className={styles.empty}>{copy.learnUnavailable}</p> : data.resources.items.length === 0 ? <p className={styles.empty}>No reviewed resources are available.</p> : <MobileCardBrowser label="Learn" resources>{data.resources.items.slice(0, 3).map(entry => <article key={entry.id}><div className={styles.resourcePlaceholder} aria-hidden="true">{entry.format === "Video" ? "Video Preview" : entry.format}</div><p className={styles.eyebrow}>{entry.format === "Video" ? "Video Preview" : entry.format}</p><h3>{entry.title}</h3><p className={styles.availability}>{copy.resourcePlaceholder}</p><p className={styles.availability}>Resource destination unavailable</p></article>)}</MobileCardBrowser>}
    </div></section>
    <section className={styles.audience} aria-labelledby="homepage-audience"><h2 id="homepage-audience">{copy.audienceTitle}</h2><div>{copy.audiences.map(label => <UnavailableAction key={label} label={label} />)}</div><p>{copy.unavailableAction}</p></section>
    <PreviewFooter />
  </section>;
}
