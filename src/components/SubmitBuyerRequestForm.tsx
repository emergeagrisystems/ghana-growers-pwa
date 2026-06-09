"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";

const fieldClass = "focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal";
const buyerTypes = ["Trader", "Market Woman", "Restaurant", "Processor", "Exporter", "Institution", "Wholesaler", "Retailer"];

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
      setError(result?.error ?? "Could not submit this buyer request. Please check the form and try again.");
      return;
    }

    event.currentTarget.reset();
    setSuccess(result.message ?? "Thank you. Your submission has been received and will be reviewed by Ghana Growers.");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Product Needed" name="productNeeded" required />
        <TextField label="Quantity" name="quantity" required />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Region
          <select required name="region" className={fieldClass}>
            <option value="">Select region</option>
            {ghanaRegions.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
        <TextField label="District" name="district" required />
        <TextField label="Buyer Name" name="buyerName" required />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Buyer Type
          <select required name="buyerType" className={fieldClass}>
            <option value="">Select buyer type</option>
            {buyerTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <TextField label="WhatsApp Number" name="whatsappNumber" type="tel" required />
        <TextField label="Deadline" name="deadline" type="date" required />
        <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
          Notes
          <textarea name="notes" className={`${fieldClass} min-h-28`} placeholder="Add preferred delivery location, budget range, quality needs, or pickup details." />
        </label>
      </div>

      <SubmitButton isSubmitting={isSubmitting} label="Submit Buyer Request" />
      <Messages success={success} error={error} />
    </form>
  );
}

function TextField({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <input required={required} name={name} type={type} className={fieldClass} />
    </label>
  );
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={isSubmitting} className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-ink/25">
      <Send size={17} aria-hidden="true" />
      {isSubmitting ? "Submitting..." : label}
    </button>
  );
}

function Messages({ success, error }: { success: string; error: string }) {
  return (
    <>
      {success ? <p className="mt-5 flex gap-2 rounded-md bg-leaf-50 p-4 text-sm font-bold text-leaf-700"><CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />{success}</p> : null}
      {error ? <p className="mt-5 rounded-md bg-red-50 p-4 text-sm font-bold text-tomato">{error}</p> : null}
    </>
  );
}
