"use client";

import Link from "next/link";
import { ChevronDown, Menu, Sprout, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/farmer-hub") {
      return pathname === "/farmer-hub" || pathname.startsWith("/farmer-hub/");
    }

    if (href === "/buy") {
      return pathname === "/buy" || pathname.startsWith("/buy/") || pathname === "/marketplace" || pathname.startsWith("/marketplace/") || pathname.startsWith("/services/buy") || pathname === "/submit-buyer-request";
    }

    if (href === "/sell") {
      return pathname === "/sell" || pathname.startsWith("/sell/") || pathname.startsWith("/services/farmers") || pathname === "/submit-produce-listing";
    }

    if (href === "/directory") {
      return pathname === "/directory" || pathname.startsWith("/farmer-directory") || pathname.startsWith("/supplier-directory");
    }

    if (href === "/learn") {
      return pathname === "/learn" || pathname.startsWith("/learn/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    setOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu({ restoreFocus: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-leaf-900 text-white backdrop-blur">
      <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 pr-14 sm:px-6 sm:pr-16 lg:px-8 lg:py-2.5">
        <Link href="/" className="focus-ring flex max-w-[calc(100vw-4.5rem)] min-w-0 items-center gap-2 rounded-md text-sm font-black text-white sm:text-base">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-earth-500 text-leaf-900 sm:h-9 sm:w-9">
            <Sprout size={20} aria-hidden="true" />
          </span>
          <span className="truncate">Ghana Growers</span>
        </Link>

        <div className="hidden items-center gap-1.5 lg:flex">
          {navigation.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`focus-ring inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold transition duration-200 hover:bg-white/10 hover:text-earth-100 ${
                  isActive(item.href) ? "bg-earth-50 text-leaf-900 ring-1 ring-white/20" : "text-white/82"
                }`}
              >
                {item.title}
                {item.children ? <ChevronDown size={15} aria-hidden="true" /> : null}
              </Link>
              {item.children ? (
                <div className="invisible absolute left-0 top-full w-56 translate-y-2 rounded-md border border-white/10 bg-leaf-900 p-2 opacity-0 shadow-soft transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="focus-ring block rounded-md px-3 py-2 text-sm font-semibold text-white/78 hover:bg-white/10 hover:text-earth-100"
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/join"
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-earth-500 px-5 py-2 text-sm font-black text-leaf-900 shadow-sm transition duration-200 hover:bg-earth-100"
          >
            Join the Network
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className="focus-ring absolute right-3 top-1/2 grid h-11 w-11 shrink-0 -translate-y-1/2 place-items-center rounded-md border border-white/15 bg-white/[0.08] text-white transition hover:bg-white/[0.12] sm:right-6 lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open ? (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-60px)] overflow-y-auto border-t border-white/10 bg-leaf-900 px-4 py-3 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navigation.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => closeMenu({ restoreFocus: true })}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`focus-ring block min-h-11 rounded-md px-3 py-2.5 font-bold transition hover:bg-white/10 ${
                    isActive(item.href) ? "bg-earth-50 text-leaf-900 ring-1 ring-white/20" : "text-white/84"
                  }`}
                >
                  {item.title}
                </Link>
                {item.children ? (
                  <div className="ml-3 border-l border-leaf-900/10 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => closeMenu({ restoreFocus: true })}
                        className="focus-ring block min-h-10 rounded-md px-3 py-2 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-earth-100"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Link
              href="/join"
              onClick={() => closeMenu({ restoreFocus: true })}
              className="focus-ring mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-earth-500 px-5 py-2.5 text-sm font-black text-leaf-900 shadow-sm transition hover:bg-earth-100"
            >
              Join the Network
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
