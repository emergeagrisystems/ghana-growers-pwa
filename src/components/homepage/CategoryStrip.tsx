/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useId, useState } from "react";
import styles from "./Refinements.module.css";

const categories = [
  ["Fruits & Vegetables","fruits-vegetables"], ["Legumes","legumes"], ["Livestock","livestock"],
  ["Seeds","seeds"], ["Grain","grain"], ["Honey","honey"], ["Farmland","farmland"],
  ["Herbs & Spices","herbs-spices"], ["Farm Equipment","farm-equipment"], ["Meat","meat"],
  ["Oil","oil"], ["Nuts & Edible Seeds","nuts-edible-seeds"], ["Eggs","eggs"],
  ["Poultry","poultry"], ["Tubers","tubers"]
] as const;

const motionKey = "gg-reduce-category-motion";

export function CategoryStrip() {
  const inkFilter = useId();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [deviceReduced, setDeviceReduced] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncDevice = () => setDeviceReduced(media.matches);
    function readPreference() {
      try { setReduceMotion(localStorage.getItem(motionKey) === "true"); }
      catch { setReduceMotion(false); }
    }
    syncDevice();
    readPreference();
    media.addEventListener("change", syncDevice);
    window.addEventListener("storage", readPreference);
    return () => {
      media.removeEventListener("change", syncDevice);
      window.removeEventListener("storage", readPreference);
    };
  }, []);

  function changePreference(reduce: boolean) {
    setReduceMotion(reduce);
    try { localStorage.setItem(motionKey, String(reduce)); }
    catch { /* The preference still applies for this visit. */ }
  }

  const gliding = reduceMotion === false && !deviceReduced;
  const items = categories.map(([label, stem]) => (
    <li key={stem}><span><img src={`/hm1/nov07/${stem}.webp`} width="46" height="46"
      alt="" draggable={false} style={{filter: `url(#${inkFilter})`}} /></span><strong>{label}</strong></li>
  ));
  return <div className={styles.categories}>
    <svg className={styles.inkDefinition} aria-hidden="true" focusable="false" width="0" height="0">
      <defs><filter id={inkFilter} colorInterpolationFilters="sRGB">
        {/* Map the original outlines and shading to forest ink. Preserve the transparent paper. */}
        <feColorMatrix type="matrix" values="0 0 0 0 .024  0 0 0 0 .310  0 0 0 0 .263  -.32 -1.07 -.11 0 1.22" />
        <feComposite in2="SourceAlpha" operator="in" />
      </filter></defs>
    </svg>
    <div className={styles.categoryHead}>
      <h2 id="category-title">Agriculture Categories</h2>
      {reduceMotion !== null && <label className={styles.motionPreference}>
        <input type="checkbox" checked={deviceReduced || reduceMotion} disabled={deviceReduced}
          onChange={event => changePreference(event.target.checked)} />
        {deviceReduced ? "Reduced motion (device setting)" : "Reduce category motion"}
      </label>}
    </div>
    <div className={styles.categoryWindow}>
      <div className={styles.categoryTrack} data-gliding={gliding}
        style={{animationDuration: `${categories.length * 5.5}s`}}>
        <ul className={styles.categoryRail} role="list" aria-labelledby="category-title">{items}</ul>
        {gliding && <ul className={styles.categoryRail} role="list" aria-hidden="true">{items}</ul>}
      </div>
    </div>
  </div>;
}
