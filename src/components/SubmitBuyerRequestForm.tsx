"use client";

import { CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";

const fieldClass = "gg-field min-w-0 w-full";
const deliveryOptions = ["Buyer Pickup", "Deliver to buyer", "Collection point", "Flexible / discuss with Ghana Growers"];
const nextSteps = [
  "Review your sourcing request",
  "Look for suitable farmers, sellers or suppliers",
  "Confirm availability where possible",
  "Contact you with the next steps"
];

export function SubmitBuyerRequestForm() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/buyer-request-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null;

    setIsSubmitting(false);

    if (!response?.ok || !result?.ok) {
      setError(result?.error ?? "We could not complete your sourcing request right now. Please check the form and try again.");
      return;
    }

    event.currentTarget.reset();
    setSuccess(result.message ?? "We have received your sourcing request.");
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      {success ? <SourcingConfirmation message={success} /> : null}

      <fieldset disabled={Boolean(success)} className={success ? "hidden" : ""}>
        <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Request Supply</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Tell us what you need</h2>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            These details help Ghana Growers understand the product, location, timing, and volume before review.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Buyer Name" name="buyerName" required />
          <TextField label="Company Name (optional)" name="companyName" />
          <TextField label="Phone Number" name="phoneNumber" type="tel" required />
          <TextField label="WhatsApp Number" name="whatsappNumber" type="tel" required />
          <label className="grid gap-2 text-sm font-bold text-ink/75">
            Region
            <select required name="region" className={fieldClass}>
              <option value="">Select region</option>
              {ghanaRegions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>
          <TextField label="District" name="district" required />
          <TextField label="Product Needed" name="productNeeded" required helper="Name the crop, livestock, input, or service you want Ghana Growers to source." />
          <TextField label="Quantity Needed" name="quantityNeeded" required helper="Estimate volume, crates, bags, tonnes, cartons, or recurring need." />
          <label className="grid gap-2 text-sm font-bold text-ink/75">
            Preferred Delivery
            <select required name="preferredDelivery" className={fieldClass}>
              <option value="">Select preferred delivery</option>
              {deliveryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <span className="text-xs font-semibold leading-5 text-ink/50">This helps us understand pickup, delivery, or collection needs before matching.</span>
          </label>
          <TextField label="Deadline" name="deadline" type="date" required />
          <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
            Additional Notes
            <textarea name="additionalNotes" className={`${fieldClass} min-h-28`} placeholder="Add budget range, quality needs, delivery address, preferred contact time, or recurring supply needs." />
          </label>
        </div>

        <div className="mt-5 grid gap-2 rounded-md border border-leaf-900/10 bg-leaf-50 p-4 text-sm leading-6 text-ink/68">
          <p>Your contact details and request information are kept private and are not shown publicly.</p>
          <p className="font-bold text-ink">Submitting a request does not guarantee availability or a match.</p>
        </div>

        <SubmitButton isSubmitting={isSubmitting} label="Request Supply" />
      </fieldset>
      <Messages error={error} />
    </form>
  );
}

function SourcingConfirmation({ message }: { message: string }) {
  return (
    <section role="status" className="rounded-md bg-leaf-50 p-5 text-ink ring-1 ring-leaf-900/10">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-leaf-700" aria-hidden="true" />
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Sourcing request received</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{message}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/68">
            Our team will review your requirements and follow up where a suitable option may be available.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {nextSteps.map((step) => (
          <p key={step} className="flex items-start gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold leading-6 text-ink/70 ring-1 ring-leaf-900/10">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
            {step}
          </p>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/marketplace" className="gg-button-primary">
          Browse Marketplace
        </Link>
        <Link href="/" className="gg-button-secondary">
          Return Home
        </Link>
      </div>
    </section>
  );
}

function TextField({ label, name, type = "text", required = false, helper = "" }: { label: string; name: string; type?: string; required?: boolean; helper?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <input required={required} name={name} type={type} className={fieldClass} />
      {helper ? <span className="text-xs font-semibold leading-5 text-ink/50">{helper}</span> : null}
    </label>
  );
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={isSubmitting} className="gg-button-primary mt-6 gap-2">
      <Send size={17} aria-hidden="true" />
      {isSubmitting ? "Submitting..." : label}
    </button>
  );
}

function Messages({ error }: { error: string }) {
  return (
    <>
      {error ? <p className="mt-5 rounded-md bg-red-50 p-4 text-sm font-bold text-tomato">{error}</p> : null}
    </>
  );
}
