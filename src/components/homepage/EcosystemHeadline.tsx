"use client";

import { Pause, Play } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import styles from "./Stage1Homepage.module.css";

const categories = ["Farms.", "Agri Suppliers.", "Fresh Produce.", "Farm Technology."];

const HeadlineContext = createContext({ word: categories[0], paused: false, reduced: true, toggle: () => {} });

export function HeroHeadlineProvider({ children }: { children: ReactNode }) {
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
  return <HeadlineContext.Provider value={{ word, paused, reduced, toggle: () => setPaused(value => !value) }}>{children}</HeadlineContext.Provider>;
}

export function EcosystemHeadline() {
  const { word } = useContext(HeadlineContext);
  return <div className={styles.headline}>
    <h1 id="homepage-hero-title" aria-label="Farms, agricultural suppliers, fresh produce and farm technology. All in one place.">
      <span className={styles.categoryLine} aria-hidden="true"><mark key={word}>{word}</mark></span>
      All in one place.
    </h1>
  </div>;
}

export function HeadlineControl() {
  const { paused, reduced, toggle } = useContext(HeadlineContext);
  return <div className={styles.headlineControl}>
    {!reduced && <button type="button" onClick={toggle}
      onFocus={event => {
        if (event.currentTarget.matches(":focus-visible")) {
          event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        }
      }}
      aria-label={paused ? "Resume changing headline" : "Pause changing headline"}>
      {paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
    </button>}
  </div>;
}
