"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Stage1Homepage.module.css";

export function MamaGFeatureList({ children }: { children: ReactNode }) {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const element = list.current;
    if (!element || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.highlight = "once";
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <ul ref={list} className={styles.mamaFeatures}>{children}</ul>;
}
