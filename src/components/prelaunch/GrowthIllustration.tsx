import styles from "./Campaign.module.css";

// An original botanical plate. All motion is decorative and plays once.
function Leaf({ transform, shade }: { transform: string; shade: string }) {
  return <g transform={transform}>
    <path fill={shade} d="M0 0C13-4 15-20 37-28S82-36 107-31C88-21 83-5 60 4S19 7 0 0Z" />
    <g fill="none" stroke="#e0dfa4" strokeWidth=".9" opacity=".8">
      <path d="M2 0Q44 0 98-28M23-3l9-15M37-6l12-16M52-12l14-14M69-18l12-10M23-3l12 6M38-7l15 7M54-12l14 5M70-19l11 3" />
    </g>
  </g>;
}

export function GrowthIllustration() {
  return <svg viewBox="0 0 540 370" className={styles.plate} aria-hidden="true" focusable="false" data-growth-plate>
    <defs>
      <radialGradient id="growth-sun"><stop stopColor="#f9dd92"/><stop offset="1" stopColor="#f6e9c5"/></radialGradient>
      <linearGradient id="growth-earth" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#ecd6ad"/><stop offset="1" stopColor="#faf7ee"/></linearGradient>
    </defs>
    <circle cx="278" cy="164" r="134" fill="url(#growth-sun)"/>
    <g fill="none" stroke="#b9bf95" strokeWidth="1.1">
      <path d="M31 254Q104 216 162 231T290 236T413 215Q460 208 510 224M46 254Q119 228 166 240M370 236Q448 211 497 230M392 239Q446 221 488 234"/>
    </g>
    <path d="M27 259Q111 243 189 250T332 249T513 241Q439 266 380 295T258 346Q191 335 132 300T27 259Z" fill="url(#growth-earth)"/>
    <g fill="none" stroke="#ac8864" strokeLinecap="round">
      <path d="M27 259Q111 243 189 250T332 249T513 241" strokeWidth="1.7"/>
      <path d="M64 266q44-11 85-9m-59 20q39-9 62-8m-30 15 18-4m209-21q35-9 75-9m-69 17 30-6m-13 14 13-4" />
      <g className={styles.roots} stroke="#926743" strokeWidth="1.8">
        <path d="M266 253q-4 17 3 31t-8 45m6-54q-18 3-30 14t-32 10m37-14-8-8m-8 17-6 11m48-24q17-2 28-14l21-7m-25 11 13 3m-34 19q15 2 22 17l13 7m-27-18 13-1m-27 15-14 7-6 9"/>
      </g>
    </g>
    <g className={styles.shoot}>
      <g fill="none" stroke="#416141" strokeLinecap="round">
        <path d="M266 252C271 224 253 207 261 179S279 121 271 74" strokeWidth="5"/>
        <path d="M261 210q-24-29-55-35m56 5q26-12 49-40m-39-8q-11-27-28-39m28 16q17-13 27-30" strokeWidth="3"/>
      </g>
      <Leaf transform="translate(211 176) scale(-.99 .91) rotate(9)" shade="#496e45"/>
      <Leaf transform="translate(304 148) rotate(-4) scale(1.07 .92)" shade="#456c49"/>
      <Leaf transform="translate(246 98) scale(-.74 .81) rotate(18)" shade="#74914e"/>
      <Leaf transform="translate(296 84) rotate(-20) scale(.66 .67)" shade="#80984c"/>
      <Leaf transform="translate(272 83) rotate(-72) scale(.42 .43)" shade="#9bab5d"/>
      <Leaf transform="translate(265 223) rotate(17) scale(.53 .5)" shade="#79934e"/>
    </g>
  </svg>;
}
