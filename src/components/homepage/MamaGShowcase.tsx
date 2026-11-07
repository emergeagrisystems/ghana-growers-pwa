/* eslint-disable @next/next/no-img-element */
"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useVisiblePlayback } from "./ExhibitControls";
import { MamaWordmark } from "./MamaWordmark";
import styles from "./Refinements.module.css";

const slides = [
  { tab: "Crop Doctor", name: "Crop Doctor", image: "doctor", question: "What’s eating my okro leaves?", detail: "Take a photo of the damage. See what might be causing it and what to check next." },
  { tab: "Ask Mama G", name: "Ask Mama G", image: "ask", question: "How far apart should I plant my okro?", detail: "Ask in your own words and get practical steps for your farm." },
  { tab: "Planting", name: "Crop Calendar & Planting Advisor", image: "planting", question: "Is my field ready to plant?", detail: "Check your soil before you plant. Once your crop is growing, see what to do next." },
  { tab: "Storage", name: "Storage Tips", image: "storage", question: "How do I keep my maize until market day?", detail: "See how to dry and store maize or pack fresh tomatoes after harvest." },
  { tab: "Weather", name: "Today’s Farm Weather", image: "weather", question: "Is rain likely on the farm today?", detail: "Check the chance of rain in your area before you plant, weed or harvest." }
] as const;

export function MamaGShowcase() {
  const [index, setIndex] = useState(0);
  const playback = useVisiblePlayback();
  const start = useRef<{x:number;y:number} | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const slide = slides[index];
  const select = (n: number) => { playback.setPaused(true); setIndex((n + slides.length) % slides.length); };
  useEffect(() => {
    if (!playback.playing) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 8000);
    return () => clearInterval(timer);
  }, [playback.playing]);

  return <section className={styles.showcase} aria-labelledby="mama-title">
    <div className={styles.showcaseInner} ref={playback.ref}>
      <header><h2 id="mama-title">Meet <MamaWordmark treatment="dark" /> — Your Digital FarmMate</h2>
        <p>Agricultural intelligence for Ghanaian farmers and the crops they grow.</p></header>
      <div className={styles.exhibit} onTouchStart={e => {start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}}
        onTouchCancel={() => {start.current=null;}}
        onTouchEnd={e => {
          if (!start.current) return;
          const dx=e.changedTouches[0].clientX-start.current.x, dy=e.changedTouches[0].clientY-start.current.y;
          start.current=null;
          if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4) select(index+(dx<0?1:-1));
        }}>
        <figure className={styles.demoScreen}><div className={styles.phone}><img key={slide.image} src={`/hm1/nov07/demo-${slide.image}.webp`} alt={`Example screen from ${slide.name}`} width="390" height="680" loading="lazy" /></div><figcaption>Example tool screen</figcaption></figure>
        <div className={styles.featureBody}>
          <div className={styles.slideCopy} aria-live={playback.paused || playback.reduced ? "polite" : "off"}>
            {slides.map(item => <div key={item.tab} aria-hidden={item!==slide} className={item===slide?styles.activeCopy:styles.hiddenCopy}>
              <p className={styles.featureName}>{item.name}</p><h3>{item.question}</h3><p>{item.detail}</p>
            </div>)}
          </div>
          <Link className={styles.openMama} href="/farmer-hub">Open Mama G</Link>
          <div className={styles.selectors} role="group" aria-label="Mama G feature selector">
            {slides.map((item,i) => <button key={item.tab} type="button" ref={el=>{buttons.current[i]=el;}}
              aria-pressed={i===index} onClick={()=>select(i)} onKeyDown={e=>{
                const next=e.key==="ArrowRight"?(i+1)%5:e.key==="ArrowLeft"?(i+4)%5:e.key==="Home"?0:e.key==="End"?4:null;
                if(next!==null){e.preventDefault();select(next);buttons.current[next]?.focus();}
              }}>{item.tab}</button>)}
            {!playback.reduced && <button type="button" aria-label={playback.paused?"Play feature rotation":"Pause feature rotation"}
              onClick={()=>playback.setPaused(!playback.paused)}>{playback.paused?<Play size={16}/>:<Pause size={16}/>}</button>}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
