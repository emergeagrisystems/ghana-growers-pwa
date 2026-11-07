/* eslint-disable @next/next/no-img-element */
"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVisiblePlayback } from "./ExhibitControls";
import styles from "./Refinements.module.css";

const categories = [
  ["Fruits & Vegetables","fruits-vegetables"], ["Legumes","legumes"], ["Livestock","livestock"],
  ["Seeds","seeds"], ["Grain","grain"], ["Honey","honey"], ["Farmland","farmland"],
  ["Herbs & Spices","herbs-spices"], ["Farm Equipment","farm-equipment"], ["Meat","meat"],
  ["Oil","oil"], ["Nuts & Edible Seeds","nuts-edible-seeds"], ["Eggs","eggs"],
  ["Poultry","poultry"], ["Tubers","tubers"]
] as const;

export function CategoryStrip() {
  const playback = useVisiblePlayback();
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ overflow: false, start: true, end: false });
  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const extent = el.scrollWidth - el.clientWidth;
    setEdges({ overflow: extent > 1, start: el.scrollLeft < 2, end: el.scrollLeft >= extent - 2 });
  }, []);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [measure]);
  const step = useCallback((direction: number) => {
    const el = rail.current;
    if (!el || el.children.length < 2) return;
    const stride = el.children[1].getBoundingClientRect().left - el.children[0].getBoundingClientRect().left;
    el.scrollBy({ left: stride * direction, behavior: playback.reduced ? "instant" : "smooth" });
  }, [playback.reduced]);
  useEffect(() => {
    if (!playback.playing || !edges.overflow || edges.end) return;
    const timer = window.setInterval(() => step(1), 5500);
    return () => window.clearInterval(timer);
  }, [playback.playing, edges.overflow, edges.end, step]);
  const manualStep = (direction: number) => { playback.setPaused(true); step(direction); };

  return <div ref={playback.ref} className={styles.categories}>
    <div className={styles.categoryHead}>
      <div><p className={styles.eyebrow}>Explore</p><h2 id="category-title">Agricultural categories</h2></div>
      {edges.overflow && <div className={styles.controls} aria-label="Category controls">
        <button type="button" aria-label="Previous category" disabled={edges.start} onClick={() => manualStep(-1)}><ChevronLeft /></button>
        {!playback.reduced && <button type="button" aria-label={playback.paused ? "Play categories" : "Pause categories"} disabled={edges.end} onClick={() => playback.setPaused(!playback.paused)}>{playback.paused ? <Play/> : <Pause/>}</button>}
        <button type="button" aria-label="Next category" disabled={edges.end} onClick={() => manualStep(1)}><ChevronRight /></button>
      </div>}
    </div>
    <ul ref={rail} aria-labelledby="category-title" className={styles.categoryRail} tabIndex={edges.overflow ? 0 : undefined}
      onScroll={measure} onFocus={() => playback.setPaused(true)} onPointerDown={() => playback.setPaused(true)} onWheel={() => playback.setPaused(true)}
      onKeyDown={e => {
        playback.setPaused(true);
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1); }
      }}>
      {categories.map(([label,stem]) => <li key={stem}><span><img src={`/hm1/nov07/${stem}.webp`} width="100" height="100" loading="lazy" alt="" /></span><strong>{label}</strong></li>)}
    </ul>
  </div>;
}
