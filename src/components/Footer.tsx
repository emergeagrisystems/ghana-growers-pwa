import Link from "next/link";
import { Mail, MapPin, Sprout } from "lucide-react";
import { navigation, siteConfig } from "@/data/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function Footer() {
  return (
    <footer className="border-t border-leaf-900/10 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-xl font-black">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-earth-500 text-ink">
              <Sprout size={23} aria-hidden="true" />
            </span>
            Ghana Growers
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{siteConfig.description}</p>
          <div className="mt-5 grid gap-2 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <MapPin size={16} aria-hidden="true" />
              {siteConfig.location}
            </span>
            <a className="flex items-center gap-2 hover:text-earth-500" href={`mailto:${siteConfig.email}`}>
              <Mail size={16} aria-hidden="true" />
              {siteConfig.email}
            </a>
          </div>
          <WhatsAppButton
            message="Hello Ghana Growers, I would like to make an inquiry."
            className="mt-6 bg-earth-500 text-ink hover:bg-white hover:text-ink"
          />
          <Link
            href="/join/farmer"
            className="focus-ring mt-3 inline-flex rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white hover:bg-leaf-700"
          >
            Join as a Farmer
          </Link>
          <Link
            href="/join/buyer"
            className="focus-ring ml-0 mt-3 inline-flex rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-700 hover:bg-leaf-50 sm:ml-3"
          >
            Join as a Buyer
          </Link>
          <Link
            href="/join/supplier"
            className="focus-ring mt-3 inline-flex rounded-md bg-earth-500 px-4 py-3 text-sm font-black text-ink hover:bg-white sm:ml-3"
          >
            Become a Supplier
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {navigation.filter((item) => item.title !== "Home").map((item) => (
            <div key={item.href}>
              <Link href={item.href} className="font-black text-white hover:text-earth-500">
                {item.title}
              </Link>
              {item.children ? (
                <div className="mt-3 grid gap-2">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} className="text-sm text-white/65 hover:text-earth-500">
                      {child.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/55">
        &copy; {new Date().getFullYear()} Ghana Growers. Built for trusted agricultural trade in Ghana.
      </div>
    </footer>
  );
}
