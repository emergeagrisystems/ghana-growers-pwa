"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./Stage1Homepage.module.css";

const categories = ["Farms.", "Agri Suppliers.", "Fresh Produce.", "Farm Technology."];

export function EcosystemHeadline() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const interval = window.setInterval(() => setIndex(i => (i + 1) % categories.length), 3600);
    return () => window.clearInterval(interval);
  }, [paused, reduced]);
  const word = categories[reduced ? 0 : index];
  return <div className={styles.headline}>
    <h1 id="homepage-hero-title" aria-label="Farms, agricultural suppliers, fresh produce and farm technology. All in one place.">
      <span className={styles.categoryLine} aria-hidden="true"><mark key={word}>{word}</mark></span>
      All in one place.
    </h1>
    {!reduced && <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume changing headline" : "Pause changing headline"}>
      {paused ? <Play size={15} /> : <Pause size={15} />}
    </button>}
  </div>;
}
