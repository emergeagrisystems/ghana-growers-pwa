/* eslint-disable @next/next/no-img-element */
"use client";

import { useId } from "react";
import { useCategoryMotion } from "./CategoryMotionPreference";
import styles from "./Refinements.module.css";

const categories = [
  ["Fruits & Vegetables","fruits-vegetables"], ["Legumes","legumes"], ["Livestock","livestock"],
  ["Seeds","seeds"], ["Grain","grain"], ["Honey","honey"], ["Farmland","farmland"],
  ["Herbs & Spices","herbs-spices"], ["Farm Equipment","farm-equipment"], ["Meat","meat"],
  ["Oil","oil"], ["Nuts & Edible Seeds","nuts-edible-seeds"], ["Eggs","eggs"],
  ["Poultry","poultry"], ["Tubers","tubers"]
] as const;

export function CategoryStrip() {
  const inkFilter = useId();
  const { reduceMotion, deviceReduced } = useCategoryMotion();
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
