import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";

type ServicePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  formAudience: "farmer" | "buyer" | "supplier";
  whatsappMessage: string;
};

export function ServicePage({
  eyebrow,
  title,
  description,
  points,
  formAudience,
  whatsappMessage
}: ServicePageProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        <WhatsAppButton message={whatsappMessage} />
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
          <RegistrationForm title={`Join Ghana Growers as a ${formAudience}`} audience={formAudience} />
        </div>
      </section>
    </>
  );
}
