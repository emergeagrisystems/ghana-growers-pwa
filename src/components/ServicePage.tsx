import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";

type ServicePageCta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "light";
};

type ServicePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  formAudience: "farmer" | "buyer" | "supplier";
  whatsappMessage: string;
  ctaHref?: string;
  ctaLabel?: string;
  extraCtas?: ServicePageCta[];
};

export function ServicePage({
  eyebrow,
  title,
  description,
  points,
  formAudience,
  ctaHref,
  ctaLabel,
  extraCtas = []
}: ServicePageProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        <div className="flex flex-col gap-3 sm:flex-row">
          {ctaHref && ctaLabel ? <ButtonLink href={ctaHref}>{ctaLabel}</ButtonLink> : null}
          {extraCtas.map((cta) => (
            <ButtonLink key={cta.href} href={cta.href} variant={cta.variant}>
              {cta.label}
            </ButtonLink>
          ))}
        </div>
      </PageHero>
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-black text-ink">What you can do</h2>
            <div className="mt-6 grid gap-4">
              {points.map((point) => (
                <div key={point} className="flex gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-leaf-600" size={21} aria-hidden="true" />
                  <p className="font-semibold leading-6 text-ink/75">{point}</p>
                </div>
              ))}
            </div>
          </div>
          {formAudience === "farmer" || formAudience === "buyer" || formAudience === "supplier" ? (
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-6 shadow-soft">
              <h3 className="text-2xl font-black text-ink">
                {formAudience === "farmer"
                  ? "Ready to register your farm?"
                  : formAudience === "buyer"
                    ? "Ready to register as a buyer?"
                    : "Ready to become a supplier?"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink/70">
                {formAudience === "farmer"
                  ? "Use the complete farmer registration form to share your farm details, products, harvest period, and contact information."
                  : formAudience === "buyer"
                    ? "Use the complete buyer registration form to share what you buy, how much you need, and how often you purchase."
                    : "Use the complete supplier registration form to list your products, services, coverage area, and company details."}
              </p>
              <div className="mt-5">
                <ButtonLink
                  href={
                    formAudience === "farmer"
                      ? "/join/farmer"
                      : formAudience === "buyer"
                        ? "/join/buyer"
                        : "/supplier-registration"
                  }
                >
                  {formAudience === "farmer"
                    ? "Join as a Farmer"
                    : formAudience === "buyer"
                      ? "Join as a Buyer"
                      : "Become a Supplier"}
                </ButtonLink>
              </div>
            </div>
          ) : (
            <RegistrationForm title={`Join the Network as a ${formAudience}`} audience={formAudience} />
          )}
        </div>
      </section>
    </>
  );
}
