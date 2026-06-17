"use client";

import { FormEvent, useState } from "react";
import { Star, X } from "lucide-react";
import type { FeaturedEnquiryRole } from "@/lib/featuredEnquiries";

type FeaturedPlacementCTAProps = {
  defaultRole?: FeaturedEnquiryRole;
  defaultProfileName?: string;
  className?: string;
};

const successMessage = "Thank you. Ghana Growers has received your featured placement enquiry and will follow up with you.";

export function FeaturedPlacementCTA({ defaultRole = "Farmer", defaultProfileName = "", className = "" }: FeaturedPlacementCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/featured-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        whatsapp: formData.get("whatsapp"),
        email: formData.get("email"),
        role: formData.get("role"),
        profileOrListingName: formData.get("profileOrListingName"),
        featureRequest: formData.get("featureRequest"),
        message: formData.get("message"),
        companyWebsite: formData.get("companyWebsite")
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response?.ok) {
      setError(result?.error ?? "Could not submit your enquiry. Please try again.");
      return;
    }

    form.reset();
    setSuccess(successMessage);
  }

  return (
    <>
      <section className={`rounded-md border border-leaf-900/10 bg-leaf-50 p-5 sm:p-6 ${className}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              Featured placement
            </p>
            <h2 className="mt-2 text-xl font-black text-ink sm:text-2xl">Want more visibility on Ghana Growers?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
              Request featured placement for a farmer profile, supplier profile, or marketplace listing. Ghana Growers will review and follow up.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setError("");
              setSuccess("");
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-leaf-800"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            Request Featured Placement
          </button>
        </div>
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-md bg-white shadow-soft sm:rounded-md">
            <div className="flex items-start justify-between gap-4 border-b border-leaf-900/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">Featured Placement Enquiry</p>
                <h2 className="mt-1 text-xl font-black text-ink">Request extra visibility</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  This is an enquiry only. Ghana Growers will review your request before any paid placement is agreed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close featured placement enquiry"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-leaf-900/10 text-ink/65 transition hover:bg-leaf-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitEnquiry} className="grid gap-4 p-5">
              <input name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FeaturedField label="Name" name="name" required />
                <FeaturedField label="Phone" name="phone" type="tel" required />
                <FeaturedField label="WhatsApp" name="whatsapp" type="tel" required />
                <FeaturedField label="Email optional" name="email" type="email" />
                <label className="grid gap-2 text-sm font-black text-ink">
                  Role
                  <select
                    name="role"
                    defaultValue={defaultRole}
                    required
                    className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Listing Owner">Listing Owner</option>
                  </select>
                </label>
                <FeaturedField label="Profile or Listing Name" name="profileOrListingName" defaultValue={defaultProfileName} required />
              </div>

              <FeaturedField label="What would you like featured?" name="featureRequest" required />

              <label className="grid gap-2 text-sm font-black text-ink">
                Message
                <textarea
                  name="message"
                  rows={4}
                  className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  placeholder="Share the profile, product, timing, or visibility support you are interested in."
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
                  className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function FeaturedField({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = ""
}: {
  label: string;
  name: string;
  type?: "text" | "tel" | "email";
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

