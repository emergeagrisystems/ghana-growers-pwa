"use client";

import { Bot, Camera, CalendarDays, Sprout } from "lucide-react";
import { homepage as copy } from "@/content/homepage/amended";
import styles from "@/styles/amended-homepage.module.css";

const groups = [
  {label: "Explore", items: ["Marketplace", "Ask Wuobi", "Learn"]},
  {label: "Find", items: ["Farmers", "Suppliers & Services"]},
  {label: "How it works", items: ["How Ghana Growers works", "How information is checked"]}
];
function Pending({label}: {label: string}) {
  return <button type="button" disabled title="Destination unavailable in this Preview">{label}</button>;
}
function Navigation() {
  return <><div className={styles.navGroups}>{groups.map(group => <details key={group.label} onKeyDown={event => {
    if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
  }}><summary>{group.label}</summary><div className={styles.navPanel}><p>Unavailable in Preview</p>{group.items.map(label => <Pending key={label} label={label}/>)}</div></details>)}<Pending label="About Ghana Growers"/></div><div className={styles.headerActions}><Pending label="List a Product"/><Pending label="Join"/></div></>;
}
export function PreviewHeader() {
  return <header className={styles.previewHeader} data-preview-header><div className={styles.headerInner}>
    <div className={styles.wordmark}>Ghana Growers<span>Protected Preview</span></div>
    <nav aria-label="Homepage navigation" className={styles.desktopNav}><Navigation/></nav>
    <details className={styles.mobileNav} onKeyDown={event => {if(event.key === "Escape"){event.currentTarget.open=false;event.currentTarget.querySelector("summary")?.focus();}}}><summary>Menu</summary><nav aria-label="Mobile homepage navigation"><Navigation/><p className={styles.availability}>Destinations unavailable in Preview</p></nav></details>
  </div></header>;
}
export function PreviewFooter() {
  return <footer className={styles.previewFooter} data-preview-footer><div className={styles.footerInner}><div className={styles.footerBrand}><strong>Ghana Growers</strong><p>Protected homepage Preview</p><p>Synthetic records. No live offers.</p></div>{groups.map(group => <div key={group.label}><h2>{group.label}</h2>{group.items.map(label => <Pending key={label} label={label}/>)}</div>)}</div><div className={styles.footerBase}><Pending label="About Ghana Growers"/><p>Destinations unavailable in Preview</p><p>{copy.footer}</p></div></footer>;
}
const icons = [Bot, Camera, Sprout, CalendarDays];
const actions = ["Ask", "Upload", "Start", "View Calendar"];
// Static visual adaptation of FarmTools.tsx selector. No runtime tool imports or advice.
export function ToolInterfacePreview({compact = false}: {compact?: boolean}) {
  return <div className={compact ? styles.miniInterface : styles.toolInterface} data-tool-interface>
    <div className={styles.interfaceBar}><strong>{compact ? "Farming Tools" : "Ghana Growers"}</strong><span>UI Preview</span></div>
    <p className={styles.interfaceTitle}>Choose a farm tool</p>
    <div className={styles.interfaceGrid}>{copy.tools.map((tool,index) => {const Icon=icons[index];return <div key={tool.name} className={styles.interfaceCard}><Icon size={compact ? 16 : 20} aria-hidden="true"/><strong>{tool.name}</strong>{!compact && <><span>{tool.description}</span><button type="button" disabled title="Tool unavailable in this Preview">{actions[index]}</button></>}</div>;})}</div>
    <p className={styles.interfaceNote}>Static interface preview · tools inactive</p>
  </div>;
}
