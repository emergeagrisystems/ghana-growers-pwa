/* eslint-disable @next/next/no-img-element */
"use client";

import { CloudSun, LayoutGrid, MessageSquareText, Pause, Play, ScanLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useVisiblePlayback } from "./ExhibitControls";
import { MamaWordmark } from "./MamaWordmark";
import styles from "./Refinements.module.css";

const slides = [
  { tab: "Crop Doctor", name: "Crop Doctor", question: "What’s eating my okro leaves?", detail: "Take a photo of the damage. See what might be causing it and what to check next." },
  { tab: "Ask Mama G", name: "Ask Mama G", question: "How far apart should I plant my okro?", detail: "Ask in your own words and get practical steps for your farm." },
  { tab: "Planting", name: "Crop Calendar & Planting Advisor", question: "Is my field ready to plant?", detail: "Check your soil before you plant. Once your crop is growing, see what to do next." },
  { tab: "Storage", name: "Storage Tips", question: "How do I keep my maize until market day?", detail: "See how to dry and store maize or pack fresh tomatoes after harvest." },
  { tab: "Weather", name: "Today’s Farm Weather", question: "Is rain likely on the farm today?", detail: "Check the chance of rain in your area before you plant, weed or harvest." }
] as const;

const illustratedTabs = [
  ["Today", CloudSun], ["Ask Mama G", MessageSquareText],
  ["Crop Doctor", ScanLine], ["Farm Tools", LayoutGrid],
] as const;

function Handset() {
  return (
    <figure className={styles.demoScreen}>
      <svg className={styles.phone} viewBox="0 0 400 680" role="img"
        aria-label="Illustrated handset showing Agoo! 👋 Mama G, sample weather and a crop photo check.">
        <image href="/rc1/homepage-mama-g-approved-layered.png" width="400" height="680" />
        {/* Overlay only the outdated screen content in the artwork's native coordinates. */}
        <g fill="white">
          <rect x="50" y="120" width="300" height="121" fill="#04545A" />
          <text x="70" y="145" fontSize="14" fontWeight="650">Sample weather · Accra</text>
          <text x="68" y="196" fontSize="49" fontWeight="700">28°C</text>
          <CloudSun x="257" y="154" width="53" height="53" stroke="#FFF2CD" strokeWidth="1.6" />
          <text x="70" y="222" fontSize="15">Partly cloudy</text>
        </g>
        <g fill="#244747">
          <path d="M50 537H350V614Q350 636 335 638H65Q50 636 50 614Z" fill="#FCFCFA" />
          <rect x="59" y="541" width="282" height="38" rx="19" fill="white" stroke="#78908A" />
          <MessageSquareText x="72" y="551" width="18" height="18" />
          <text x="100" y="565" fontSize="13">Ask Mama G…</text>
          <path d="M56 587H344" stroke="#D5DEDA" />
          {illustratedTabs.map(([label, Icon], i) => {
            const x = 88 + i * 75;
            return <g key={label}>
              {i === 1 && <rect x={x-36} y="590" width="72" height="44" rx="9" fill="#DFECE7" />}
              <Icon x={x-9} y="594" width="18" height="18" />
              <text x={x} y="627" textAnchor="middle" fontSize="11.5" fontWeight="650">{label}</text>
            </g>;
          })}
        </g>
      </svg>
    </figure>
  );
}

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
      <header><h2 id="mama-title">Meet <MamaWordmark treatment="light" /> — Your Digital FarmMate</h2>
        <p>Agricultural intelligence for Ghanaian farmers and the crops they grow.</p></header>
      <div className={styles.exhibit} onTouchStart={e => {start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}}
        onTouchCancel={() => {start.current=null;}}
        onTouchEnd={e => {
          if (!start.current) return;
          const dx=e.changedTouches[0].clientX-start.current.x, dy=e.changedTouches[0].clientY-start.current.y;
          start.current=null;
          if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4) select(index+(dx<0?1:-1));
        }}>
        <Handset />
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
