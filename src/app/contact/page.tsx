import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, WHATSAPP_NUMBER } from "@/data/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact Us",
  description: "Contact Ghana Growers about farmer registration, buyer requests, supplier registration, verification, partnerships, and platform support.",
  path: "/contact"
});

type ContactItem = {
  title: string;
  value: string;
  href: string | null;
  icon: LucideIcon;
};

const contactItems: ContactItem[] = [
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
  }
];

if (WHATSAPP_NUMBER !== "233000000000") {
  contactItems.push(
  {
    title: "Phone / WhatsApp",
    value: `+${WHATSAPP_NUMBER}`,
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    icon: Phone
  }
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="Contact Ghana Growers"
        description="Have a question about buying, selling, farmer registration, supplier applications or Ghana Growers? Send us a message."
        variant="compact"
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <aside className="grid gap-5">
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-ink">Operated by Emerge Agri Systems (E.A.Sy)</h2>
              <p className="mt-2 text-sm leading-7 text-ink/66">
                Ghana Growers is the public agricultural platform operated by Emerge Agri Systems. Use this contact page for farmer, buyer, supplier, verification, and partnership enquiries.
              </p>
            </div>
            {contactItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <article className="h-full rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-ink">{item.title}</h2>
                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-ink/64">{item.value}</p>
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
            <div className="rounded-md border border-leaf-900/10 bg-earth-50 p-5">
              <h2 className="text-lg font-black text-ink">Best way to get a useful reply</h2>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                Include your role, product or service, region, district, quantity if relevant, and the best phone number for follow-up.
              </p>
            </div>
          </aside>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
