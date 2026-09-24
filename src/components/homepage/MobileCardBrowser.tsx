"use client";

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "@/styles/amended-homepage.module.css";

/** Desktop grid; narrow-screen native scrolling with explicit navigation. No auto-advance. */
export function MobileCardBrowser({children, label, resources = false}: {children: ReactNode; label: string; resources?: boolean}) {
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const id = useId();
  const count = Children.count(children);
  function syncPosition() {
    const node = track.current;
    if (!node) return;
    const width = node.firstElementChild?.getBoundingClientRect().width ?? 0;
    const gap = parseFloat(getComputedStyle(node).columnGap) || 0;
    setPosition(node.scrollWidth <= node.clientWidth + 1 ? 0 : Math.max(0, Math.min(count - 1, Math.round(node.scrollLeft / (width + gap)))));
  }
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      node.scrollTo({left: 0, behavior: "instant"});
      setPosition(0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function move(next: number) {
    const node = track.current;
    const target = node?.children[Math.max(0, Math.min(count - 1, next))];
    if (!node || !target || !node.firstElementChild) return;
    const left = target.getBoundingClientRect().left - node.firstElementChild.getBoundingClientRect().left;
    node.scrollTo({left, behavior: "instant"});
    syncPosition();
  }
  return <div className={styles.cardBrowser} data-card-browser={label}>
    <div ref={track} id={id} className={`${styles.cards} ${resources ? styles.resourceCards : ""} ${styles.cardTrack}`} data-card-track tabIndex={0} role="group" aria-label={`${label} cards`} onScroll={syncPosition} onKeyDown={event => {
      if (event.target !== event.currentTarget || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth + 1) return;
      if (event.key === "ArrowRight") move(position + 1);
      else if (event.key === "ArrowLeft") move(position - 1);
      else if (event.key === "Home") move(0);
      else if (event.key === "End") move(count - 1);
      else return;
      event.preventDefault();
    }}>{children}</div>
    <div className={styles.cardControls} data-card-controls>
      <button type="button" aria-label={`Previous ${label} card`} aria-controls={id} disabled={position === 0} onClick={() => move(position - 1)}>Previous</button>
      <span role="status" aria-live="polite" aria-atomic="true">{position + 1} of {count}</span>
      <button type="button" aria-label={`Next ${label} card`} aria-controls={id} disabled={position === count - 1} onClick={() => move(position + 1)}>Next</button>
    </div>
  </div>;
}
