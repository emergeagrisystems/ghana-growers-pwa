import { BriefcaseBusiness, Mail } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/data/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Careers",
  description: "Career opportunities and CV submissions at Ghana Growers.",
  path: "/about/careers"
});

const jobs = [
  "Field Community Coordinator",
  "Marketplace Operations Assistant",
  "Agricultural Content Contributor"
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Work with Ghana Growers"
        description="Ghana Growers is building a practical agricultural network across Ghana. Interested candidates can send a CV and short note for future opportunities."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6 lg:px-8">
          {jobs.map((job) => (
            <div key={job} className="flex flex-col gap-4 rounded-md border border-leaf-900/10 bg-leaf-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness className="text-leaf-600" size={24} aria-hidden="true" />
                <div>
                  <h2 className="font-black text-ink">{job}</h2>
                  <p className="text-sm text-ink/65">Future opportunity</p>
                </div>
              </div>
              <a className="gg-button-primary gap-2" href={`mailto:${siteConfig.email}?subject=CV submission - ${encodeURIComponent(job)}`}>
                <Mail size={17} aria-hidden="true" />
                Send CV
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
