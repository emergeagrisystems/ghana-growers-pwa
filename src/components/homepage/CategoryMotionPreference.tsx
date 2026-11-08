"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const motionKey = "gg-reduce-category-motion";
const MotionContext = createContext<{
  reduceMotion: boolean | null;
  deviceReduced: boolean;
  changePreference: (reduce: boolean) => void;
} | null>(null);

export function CategoryMotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [deviceReduced, setDeviceReduced] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncDevice = () => setDeviceReduced(media.matches);
    function readPreference() {
      try { setReduceMotion(localStorage.getItem(motionKey) === "true"); }
      catch { setReduceMotion(false); }
    }
    function syncStorage(event: StorageEvent) {
      if (event.key === motionKey || event.key === null) readPreference();
    }
    syncDevice();
    readPreference();
    media.addEventListener("change", syncDevice);
    window.addEventListener("storage", syncStorage);
    return () => {
      media.removeEventListener("change", syncDevice);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  function changePreference(reduce: boolean) {
    setReduceMotion(reduce);
    try { localStorage.setItem(motionKey, String(reduce)); }
    catch { /* Keep the setting for this visit if storage is unavailable. */ }
  }

  return <MotionContext.Provider value={{ reduceMotion, deviceReduced, changePreference }}>
    {children}
  </MotionContext.Provider>;
}

export function useCategoryMotion() {
  const context = useContext(MotionContext);
  if (!context) throw new Error("Category motion requires CategoryMotionProvider");
  return context;
}
