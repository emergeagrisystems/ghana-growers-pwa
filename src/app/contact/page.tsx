import { Mail, MapPin, Sprout } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/data/site";

export const metadata = {
  title: "Contact Us",
  description: "Contact Ghana Growers about farmer, buyer, supplier, and partnership enquiries."
};

const contactItems = [
  {
    title: "Email",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    icon: Mail
  },
  {
    title: "Location",
    value: siteConfig.location,
    href: null,
    icon: MapPin
  },
  {
    title: "Platform status",
    value: "Launching Soon",
    href: null,
    icon: Sprout
  }
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="Talk to Ghana Growers"
        description="Reach the Ghana Growers team about onboarding, partnerships, supplier registration, buyer interest, or farmer support."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {contactItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <article className="h-full rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                  <Icon size={21} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-black text-ink">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{item.value}</p>
              </article>
            );

            return item.href ? (
              <a key={item.title} href={item.href} className="focus-ring rounded-md">
                {content}
              </a>
            ) : (
              <div key={item.title}>{content}</div>
            );
          })}
        </div>
      </section>
    </>
  );
}
