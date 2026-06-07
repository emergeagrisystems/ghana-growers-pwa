import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { whatsappCommunities } from "@/data/whatsappCommunities";

export const metadata = {
  title: "WhatsApp Communities",
  description:
    "Join Ghana Growers WhatsApp communities for farmers, buyers, and agricultural suppliers in Ghana."
};

export default function WhatsAppCommunitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="WhatsApp Communities"
        title="Join the Ghana Growers community that fits your role"
        description="Farmers, buyers, and suppliers can use these WhatsApp communities for practical updates, produce demand, trusted connections, and everyday agricultural support."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="#farmers-community">Farmers Community</ButtonLink>
          <ButtonLink href="#buyers-community" variant="secondary">
            Buyers Community
          </ButtonLink>
          <ButtonLink href="#suppliers-community" variant="light">
            Suppliers Community
          </ButtonLink>
        </div>
      </PageHero>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Community hub"
            title="Stay connected beyond the website"
            description="Each group has a clear purpose so members can find useful information quickly and keep conversations focused on agriculture."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {whatsappCommunities.map((community) => {
              const Icon = community.icon;
              const id = community.title.toLowerCase().replaceAll(" ", "-");

              return (
                <article
                  id={id}
                  key={community.title}
                  className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-leaf-50 p-6 shadow-soft"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-600 text-white">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <p className="mt-5 text-xs font-black uppercase text-earth-700">{community.audience}</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">{community.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/70">{community.description}</p>

                  <div className="mt-6">
                    <h3 className="flex items-center gap-2 text-sm font-black text-ink">
                      <CheckCircle2 size={18} className="text-leaf-600" aria-hidden="true" />
                      Benefits
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                      {community.benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-earth-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <h3 className="flex items-center gap-2 text-sm font-black text-ink">
                      <ShieldCheck size={18} className="text-leaf-600" aria-hidden="true" />
                      Group rules
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                      {community.rules.map((rule) => (
                        <li key={rule} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-600" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={community.inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white shadow-soft transition hover:bg-leaf-700"
                  >
                    Join {community.title}
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-earth-500">Need help choosing?</p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Talk to Ghana Growers first</h2>
            <p className="mt-4 leading-7 text-white/70">
              If you are not sure which community to join, send a WhatsApp message and the team can guide you to the right group.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-black">Before joining</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Community posts are for agriculture, sourcing, supply, learning, and partnerships. Always confirm details before trading.
            </p>
            <WhatsAppButton
              message="Hello Ghana Growers, I need help choosing the right WhatsApp community."
              className="mt-6 bg-earth-500 text-ink hover:bg-earth-700 hover:text-white"
            />
          </div>
        </div>
      </section>
    </>
  );
}
