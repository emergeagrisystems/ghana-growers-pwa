import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { FarmMatePilotFeedbackForm } from "@/components/FarmMatePilotFeedbackForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "GG FarmMate Feedback",
  description: "Share pilot feedback to help Ghana Growers improve GG FarmMate before wider launch.",
  path: "/farmer-hub/feedback"
});

export default function FarmMateFeedbackPage() {
  return (
    <main className="bg-gradient-to-b from-white via-earth-50 to-leaf-50/70 text-ink">
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-12">
        <div>
          <Link href="/farmer-hub" className="inline-flex items-center gap-2 text-sm font-black text-leaf-700">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to GG FarmMate
          </Link>
          <p className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-leaf-700 shadow-sm">
            <MessageSquareText size={16} aria-hidden="true" />
            Pilot feedback
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-ink sm:text-5xl">Help improve GG FarmMate</h1>
          <p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
            Tell us what you tried, what worked, and what should be clearer before GG FarmMate reaches more farmers.
          </p>
          <div className="mt-6 rounded-md border border-leaf-900/10 bg-white/80 p-4 text-sm font-semibold leading-6 text-ink/62 shadow-sm">
            Please do not share phone numbers or exact farm locations here. This pilot form is only for product feedback.
          </div>
        </div>

        <FarmMatePilotFeedbackForm />
      </section>
    </main>
  );
}
