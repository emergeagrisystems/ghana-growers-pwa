"use client";

import Link from "next/link";
import { ChevronDown, Menu, Sprout, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-leaf-900/10 bg-white shadow-[0_10px_35px_rgba(20,58,31,0.08)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-md text-sm font-black text-[#143A1F] sm:text-lg">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-leaf-600 text-white sm:h-10 sm:w-10">
            <Sprout size={21} aria-hidden="true" />
          </span>
          <span className="truncate">Ghana Growers</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className="focus-ring inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-ink transition hover:bg-leaf-50 hover:text-leaf-700"
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

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/join"
            className="focus-ring rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-700"
          >
            Join Ghana Growers
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen((value) => !value)}
          className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-md border border-leaf-900/10 bg-white text-ink sm:h-11 sm:w-11 lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open ? (
        <div className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-leaf-900/10 bg-white px-4 py-4 lg:hidden">
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
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="focus-ring mt-2 block rounded-md bg-leaf-600 px-3 py-3 text-center font-black text-white hover:bg-leaf-700"
            >
              Join Ghana Growers
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
