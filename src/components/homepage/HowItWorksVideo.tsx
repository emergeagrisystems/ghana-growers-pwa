"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./HowItWorksVideo.module.css";

export function HowItWorksVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => setReducedMotion(preference.matches);
    applyPreference();
    preference.addEventListener("change", applyPreference);
    return () => preference.removeEventListener("change", applyPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      video.currentTime = 0;
      return;
    }
    void video.play().catch(() => undefined);
  }, [reducedMotion]);

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  return (
    <div className={styles.column}>
      <div className={styles.frame}>
        <video
          ref={videoRef}
          className={styles.video}
          src="/stage1-media/how-it-works-stage1.mp4"
          muted
          playsInline
          preload="metadata"
          aria-label="Illustrative farming sequence showing a farmer inspecting crops"
        />
      </div>
      <button type="button" className={styles.replay} onClick={replay}>
        <RotateCcw size={16} aria-hidden="true" />
        Replay
      </button>
    </div>
  );
}
