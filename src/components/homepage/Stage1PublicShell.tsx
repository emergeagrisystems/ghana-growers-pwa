"use client";

import { Leaf, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { foundationFont } from "@/components/homepage-foundation/font";
import styles from "./Stage1PublicShell.module.css";

const publicLinks = [
  { label: "Ask Mama G", href: "/farmer-hub" },
  { label: "Farms & Suppliers", href: "/directory" }
] as const;

export function Stage1PublicHeader() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className={`${styles.header} ${foundationFont.className}`}>
      <nav className={styles.navigation} aria-label="Main navigation">
        <Link href="/" className={styles.brand}>
          <Leaf size={24} aria-hidden="true" />
          <span>GHANA GROWERS</span>
        </Link>
        <div className={styles.desktopLinks}>
          {publicLinks.map((item) => (
            <Link href={item.href} key={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className={styles.navActions}>
          <button type="button" disabled className={styles.join} title="Registration is not open yet">
            <Plus size={18} aria-hidden="true" />
            Join
          </button>
          <button ref={trigger} type="button" className={styles.menuButton} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="stage1-mobile-menu" aria-label={open ? "Close navigation" : "Open navigation"}>
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {open ? (
        <nav id="stage1-mobile-menu" className={styles.mobileMenu} aria-label="Mobile navigation">
          {publicLinks.map((item) => <Link href={item.href} key={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}
          <p>Registration and sourcing enquiries are not open yet.</p>
        </nav>
      ) : null}
    </header>
  );
}

const footerGroups = [
  { title: "PLATFORM", links: publicLinks },
  { title: "COMPANY", links: [{ label: "About Us", href: "/about" }, { label: "How it works", href: "/#how-it-works" }, { label: "Careers", href: "/about/careers" }, { label: "Contact", href: "/contact" }] },
  { title: "INFORMATION", links: [{ label: "How information is checked", href: "/verification-process" }, { label: "Privacy policy", href: "/privacy-policy" }, { label: "Terms of use", href: "/terms-of-use" }] }
] as const;

export function Stage1PublicFooter() {
  return (
    <footer className={`${styles.footer} ${foundationFont.className}`}>
      <div className={styles.columns}>
        <div className={styles.footerBrand}>
          <Link href="/">GHANA GROWERS</Link>
          <strong>Direct Connections. Smart Innovations.</strong>
          <p>Find farms, produce and agricultural suppliers across Ghana.</p>
        </div>
        <div className={styles.destinations}>
          {footerGroups.map((group) => <nav aria-label={group.title} key={group.title}><h2>{group.title}</h2>{group.links.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}</nav>)}
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Ghana Growers</p>
        <p>Powered by Emerge Agri Systems (E.A.Sy.)</p>
      </div>
    </footer>
  );
}
