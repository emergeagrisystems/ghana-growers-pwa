"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import type { LeadRequestSourceType } from "@/lib/leadRequests";

type RequestConnectionButtonProps = {
  sourceType: LeadRequestSourceType;
  sourceId: string;
  sourceName: string;
  productInterest?: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
  helperText?: string;
};

const successMessage = "Thank you. Ghana Growers has received your request and will connect you with the relevant farmer or supplier.";

export function RequestConnectionButton({
  sourceType,
  sourceId,
  sourceName,
  productInterest = "",
  label = "Request Connection",
  ariaLabel,
  className = "",
  helperText = ""
}: RequestConnectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/lead-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterName: formData.get("requesterName"),
        phone: formData.get("phone"),
        whatsapp: formData.get("whatsapp"),
        location: formData.get("location"),
        productInterest: formData.get("productInterest"),
        quantityNeeded: formData.get("quantityNeeded"),
        message: formData.get("message"),
        companyWebsite: formData.get("companyWebsite"),
        sourceType,
        sourceId,
        sourceName,
        sourcePage: window.location.pathname
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response?.ok) {
      setError(result?.error ?? "Could not submit your request. Please try again.");
      return;
    }

    form.reset();
    setSuccess(successMessage);
  }

  return (
    <>
      <div className={helperText ? "grid gap-2" : ""}>
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => {
            setIsOpen(true);
            setError("");
            setSuccess("");
          }}
          className={`gg-button-primary gap-2 ${className}`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
        {helperText ? <p className="text-xs font-semibold leading-5 text-ink/55">{helperText}</p> : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-md bg-white shadow-soft sm:rounded-md">
            <div className="flex items-start justify-between gap-4 border-b border-leaf-900/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">Request Connection</p>
                <h2 className="mt-1 text-xl font-black text-ink">{sourceName}</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  Ghana Growers will review your request and help connect you with the relevant contact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close connection request"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-leaf-900/10 text-ink/65 transition hover:bg-leaf-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitLead} className="grid gap-4 p-5">
              <input name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="grid gap-4 sm:grid-cols-2">
                <LeadField label="Full Name" name="requesterName" required />
                <LeadField label="Phone Number" name="phone" type="tel" required />
                <LeadField label="WhatsApp Number" name="whatsapp" type="tel" required />
                <LeadField label="Location" name="location" required />
                <LeadField label="Product Interested In" name="productInterest" defaultValue={productInterest} required />
                <LeadField label="Quantity Needed" name="quantityNeeded" />
              </div>
              <label className="grid gap-2 text-sm font-black text-ink">
                Message
                <textarea
                  name="message"
                  rows={4}
                  className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  placeholder="Share timing, delivery location, quality requirements, or any other details."
                />
              </label>

              {error ? <p className="rounded-md bg-tomato/10 px-4 py-3 text-sm font-black text-tomato">{error}</p> : null}
              {success ? <p className="rounded-md bg-leaf-50 px-4 py-3 text-sm font-black leading-6 text-leaf-700">{success}</p> : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gg-button-primary"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function LeadField({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = ""
}: {
  label: string;
  name: string;
  type?: "text" | "tel";
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-ink">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
      />
    </label>
  );
}
