"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "@/styles/amended-homepage.module.css";
export type HeroCandidate = {label: string; direction: string; id: string; src: string};
export function HeroShortlistControls({candidates,selected,onChange}: {candidates: readonly HeroCandidate[]; selected: string; onChange: (label: string)=>void}) {
 return <fieldset className={styles.heroComparison} data-hero-comparison><legend>Hero shortlist · founder comparison</legend><div>{candidates.map(candidate=><button key={candidate.label} type="button" aria-pressed={selected===candidate.label} title={candidate.direction} onClick={()=>onChange(candidate.label)}>{candidate.label}</button>)}</div><p role="status">Showing {selected}. No final selection recorded.</p><p>Generated illustrations only. Not evidence of Ghana Growers-owned land, facilities, supply or transactions. Identical crop and tint for every option.</p></fieldset>;
}
export function HeroShortlistImage({candidate}: {candidate: HeroCandidate}) {
 const [failed,setFailed]=useState(false);
 if(failed) return <div className={styles.fieldLines} role="img" aria-label="Hero candidate unavailable; provisional landscape placeholder"><i/><i/><i/></div>;
 return <Image unoptimized priority src={candidate.src} alt={`Illustrative agricultural landscape, shortlist ${candidate.label}; not evidence of Ghana Growers land or operations.`} fill className={styles.heroCandidatePhoto} data-hero-candidate={candidate.label} onError={()=>setFailed(true)}/>;
}
