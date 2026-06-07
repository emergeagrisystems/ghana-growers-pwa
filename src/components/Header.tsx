"use client";

import Link from "next/link";
import { ChevronDown, Menu, Sprout, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-leaf-900/10 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-md text-lg font-black text-leaf-700">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-leaf-600 text-white">
            <Sprout size={23} aria-hidden="true" />
          </span>
          Ghana Growers
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className="focus-ring inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-ink/80 transition hover:bg-leaf-50 hover:text-leaf-700"
              >
                {item.title}
                {item.children ? <ChevronDown size={15} aria-hidden="true" /> : null}
              </Link>
              {item.children ? (
                <div className="invisible absolute left-0 top-full w-56 translate-y-2 rounded-md border border-leaf-900/10 bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
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

        <Link
          href="/marketplace"
          className="focus-ring hidden rounded-md bg-earth-500 px-4 py-2 text-sm font-black text-ink transition hover:bg-earth-700 hover:text-white lg:inline-flex"
        >
          Browse Shop
        </Link>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen((value) => !value)}
          className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-leaf-900/10 bg-white text-ink lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-leaf-900/10 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navigation.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="focus-ring block rounded-md px-3 py-2 font-bold text-ink hover:bg-leaf-50"
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
          </div>
        </div>
      ) : null}
    </header>
  );
}
