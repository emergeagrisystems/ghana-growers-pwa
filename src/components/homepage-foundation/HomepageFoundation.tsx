"use client";

import { useState } from "react";
import { foundation } from "@/content/homepage/foundation";
import { FoundationBrand } from "./FoundationBrand";
import { foundationFont } from "./font";
import styles from "@/styles/homepage-foundation.module.css";

export function HomepageFoundation() {
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  return (
    <section className={`${styles.foundation} ${foundationFont.variable}`} aria-label={foundation.review} data-foundation>
      <div className={styles.inner}>
        <div className={styles.reviewBar}>
          <FoundationBrand />
          <p className={styles.eyebrow}>{foundation.review}</p>
        </div>
        <p className={styles.boundary} data-review-boundary>{foundation.boundary}</p>
        <p className={styles.introduction}>{foundation.introduction}</p>
        <section className={styles.palette} aria-labelledby="foundation-palette">
          <h2 id="foundation-palette">{foundation.paletteTitle}</h2>
          <p>{foundation.paletteIntro}</p>
          <ul className={styles.paletteGrid}>
            {foundation.lightPalette.map((colour) => (
              <li key={colour.token} className={styles.lightSample} data-palette={colour.token}>
                <h3>{colour.name}</h3><p>{colour.hex}</p><p>{colour.role}</p>
              </li>
            ))}
          </ul>
          <ul className={styles.accentList}>
            {foundation.accents.map((colour) => (
              <li key={colour.token}>
                <span className={styles.accentSample} data-palette={colour.token} aria-hidden="true" />
                <div><h3>{colour.name}</h3><p>{colour.hex} · {colour.role}</p></div>
              </li>
            ))}
          </ul>
          <p className={styles.paletteNote}>{foundation.paletteNote}</p>
        </section>
        <header className={styles.hero} data-palette-role="main">
          <p className={styles.eyebrow}>{foundation.sections[0]}</p>
          <h1>{foundation.headline}</h1>
          <p id="foundation-action-note" className={styles.heroNote}>{foundation.heroNote}</p>
          <div className={styles.actions} aria-describedby="foundation-action-note">
            {foundation.actions.map((action, index) => (
              <button key={action} type="button" disabled className={index === 0 ? styles.primary : styles.secondary}>{action}</button>
            ))}
          </div>
        </header>
        <section className={`${styles.section} ${styles.evidenceSection}`} data-palette-role="secondary" aria-labelledby="foundation-evidence">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{foundation.sections[1]}</p>
            <h2 id="foundation-evidence">{foundation.evidenceTitle}</h2>
            <p>{foundation.evidenceIntro}</p>
          </div>
          <ul className={styles.evidenceGrid}>
            {foundation.evidence.map((example) => (
              <li key={example.label} className={styles.evidenceCard}>
                <span className={styles.badge} data-tone={example.tone}>{example.label}</span>
                <p>{example.description}</p>
                {example.tone === "checked" && (
                  <div className={styles.provenance}>
                    <p>{foundation.source}</p><p>{foundation.scope}</p>
                    <p>{foundation.lastChecked} <time dateTime={foundation.checkedDateTime}>{foundation.checkedDate}</time></p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className={`${styles.section} ${styles.interfaceSection}`} data-palette-role="tint" aria-labelledby="foundation-states">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{foundation.sections[2]}</p>
            <h2 id="foundation-states">{foundation.statesTitle}</h2>
            <p>{foundation.statesIntro}</p>
          </div>
          <ul className={styles.stateList}>
            {foundation.states.map((example) => (
              <li key={example.label} className={styles.state} data-tone={example.tone}>
                <h3>{example.label}</h3><p>{example.description}</p>
              </li>
            ))}
          </ul>
          <div className={styles.feedback}>
            <h3>{foundation.feedbackTitle}</h3><p>{foundation.feedbackIntro}</p>
            <button type="button" className={styles.demoButton} onClick={() => setFeedbackVisible(true)}>{foundation.feedbackAction}</button>
            <p role="status" aria-live="polite" className={styles.feedbackResult}>{feedbackVisible ? foundation.feedback : ""}</p>
          </div>
        </section>
        <section className={styles.typeSection} aria-labelledby="foundation-type">
          <p className={styles.eyebrow}>{foundation.sections[3]}</p>
          <h2 id="foundation-type">{foundation.glyphTitle}</h2><p>{foundation.glyphIntro}</p>
          <p className={styles.glyphs}>{foundation.glyphs}</p>
        </section>
        <p className={styles.footer}>{foundation.footer}</p>
      </div>
    </section>
  );
}
