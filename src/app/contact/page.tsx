import { Facebook, Linkedin, Mail, MapPin, Phone, Sprout } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, WHATSAPP_NUMBER } from "@/data/site";

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
    title: "Phone / WhatsApp",
    value: `+${WHATSAPP_NUMBER}`,
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    icon: Phone
  },
  {
    title: "Platform status",
    value: "Launching Soon",
    href: null,
    icon: Sprout
  }
];

const socialLinks = [
  { title: "Facebook", href: "#", icon: Facebook },
  { title: "LinkedIn", href: "#", icon: Linkedin }
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
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <aside className="grid gap-5">
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
              <h2 className="text-lg font-black text-ink">Social links</h2>
              <p className="mt-2 text-sm leading-6 text-ink/62">Follow Ghana Growers updates as public onboarding expands.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.title} href={item.href} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                      <Icon size={16} aria-hidden="true" />
                      {item.title}
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
