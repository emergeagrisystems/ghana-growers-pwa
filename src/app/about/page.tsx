import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata = {
  title: "About",
  description: "Learn about the Ghana Growers mission, vision, and purpose."
};

const values = [
  ["Mission", "To connect Ghana's farmers, buyers, and agricultural suppliers through a trusted digital platform."],
  ["Vision", "A more connected agricultural economy where fresh produce, inputs, logistics, and knowledge move with less friction."],
  ["What we do", "We organize farmer access, buyer demand, supplier listings, learning content, and direct WhatsApp inquiry in one place."],
  ["Why Ghana Growers exists", "Many farmers struggle to find reliable buyers, while buyers and suppliers struggle to discover trusted local opportunities."]
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Ghana Growers"
        title="Building trusted digital connections for Ghana agriculture"
        description="Ghana Growers exists to make agricultural trade easier, more transparent, and more useful for the people who grow, buy, supply, package, transport, and support food systems."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/whatsapp-communities">Join WhatsApp Communities</ButtonLink>
          <ButtonLink href="/about/partner-with-us" variant="secondary">
            Partner With Us
          </ButtonLink>
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Our purpose" description="The platform is intentionally simple today so it can grow into verified farmer profiles, richer marketplace tools, and partner integrations later." />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {values.map(([title, body]) => (
              <div key={title} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6">
                <h2 className="text-xl font-black text-ink">{title}</h2>
                <p className="mt-3 leading-7 text-ink/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
