"use client";

import Link from "next/link";
import { ChevronDown, Menu, Sprout, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/directory") {
      return pathname === "/directory" || pathname.startsWith("/farmer-directory") || pathname.startsWith("/supplier-directory");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-leaf-900/10 bg-[#FFFDF2]/95 shadow-[0_8px_28px_rgba(20,58,31,0.055)] backdrop-blur">
      <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 pr-14 sm:px-6 sm:pr-16 lg:px-8 lg:py-2.5">
        <Link href="/" className="focus-ring flex max-w-[calc(100vw-4.5rem)] min-w-0 items-center gap-2 rounded-md text-sm font-black text-[#143A1F] sm:text-base">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-leaf-600 text-white sm:h-9 sm:w-9">
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
                className={`focus-ring inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold transition duration-200 hover:bg-leaf-50 hover:text-leaf-700 ${
                  isActive(item.href) ? "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-700/10" : "text-ink/78"
                }`}
              >
                {item.title}
                {item.children ? <ChevronDown size={15} aria-hidden="true" /> : null}
              </Link>
              {item.children ? (
                <div className="invisible absolute left-0 top-full w-56 translate-y-2 rounded-md border border-leaf-900/10 bg-white p-2 opacity-0 shadow-soft transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="focus-ring block rounded-md px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-leaf-50 hover:text-leaf-700"
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
            className="gg-button-primary px-4 py-2"
          >
            Join Network
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen((value) => !value)}
          className="focus-ring absolute right-3 top-1/2 grid h-9 w-9 shrink-0 -translate-y-1/2 place-items-center rounded-md border border-leaf-900/10 bg-white/90 text-ink sm:right-6 sm:h-10 sm:w-10 lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open ? (
        <div className="max-h-[calc(100dvh-60px)] overflow-y-auto border-t border-leaf-900/10 bg-[#FFFDF2] px-4 py-3 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navigation.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`focus-ring block rounded-md px-3 py-2 font-bold hover:bg-leaf-50 ${
                    isActive(item.href) ? "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-700/10" : "text-ink"
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
                        onClick={() => setOpen(false)}
                        className="focus-ring block rounded-md px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-leaf-50 hover:text-leaf-700"
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
              onClick={() => setOpen(false)}
              className="gg-button-primary mt-2 block text-center"
            >
              Join Network
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
