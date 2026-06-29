"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, ImagePlus, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";

type FormErrors = Record<string, string | undefined>;

const supplierCategories = [
  "Seeds",
  "Fertilizer",
  "Agrochemicals",
  "Machinery",
  "Irrigation",
  "Packaging",
  "Logistics & Transport",
  "Storage & Cold Chain",
  "Veterinary",
  "Finance",
  "Insurance",
  "Agricultural Services",
  "Other"
];

const fieldClass = "gg-field min-w-0 w-full";

export function SupplierOnboardingForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setErrorMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/supplier-registration", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        errors?: FormErrors;
      };

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? {});
        throw new Error("Supplier application could not be submitted.");
      }

      form.reset();
      setSubmitted(true);
    } catch {
      setErrorMessage("We could not submit your supplier application. Please check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section id="supplier-application" className="rounded-xl border border-leaf-900/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
          <CheckCircle2 size={28} aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-earth-700">Application received</p>
        <h2 className="mt-3 text-3xl font-black text-ink">We&apos;ve received your supplier application.</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
          Our team will review your business information and contact you with the next steps.
        </p>
        <div className="mt-6 grid gap-3">
          {[
            "Review your application",
            "Verify your business details",
            "Prepare your supplier profile",
            "Contact you within one business day"
          ].map((step) => (
            <div key={step} className="flex items-center gap-3 rounded-xl bg-leaf-50 px-4 py-3 text-sm font-bold text-ink/75">
              <CheckCircle2 size={17} className="shrink-0 text-leaf-700" aria-hidden="true" />
              {step}
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/marketplace" className="gg-button-primary">
            Explore Marketplace
          </Link>
          <Link href="/" className="gg-button-secondary">
            Return Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form id="supplier-application" onSubmit={handleSubmit} className="rounded-xl border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-8">
      <input type="hidden" name="onboardingFlow" value="true" />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Supplier Application</p>
        <h2 className="mt-3 text-3xl font-black text-ink">Tell us about your business</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          These details help Ghana Growers understand your products, service area, and readiness before preparing a supplier profile.
        </p>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <TextField label="Business Name" name="businessName" error={errors.businessName} />
        <TextField label="Contact Person" name="contactPerson" error={errors.contactPerson} />
        <TextField label="Phone Number" name="phone" type="tel" error={errors.phone} />
        <TextField label="Email" name="email" type="email" error={errors.email} />
        <TextField label="Website / Social Media Link (optional)" name="websiteUrl" type="url" error={errors.websiteUrl} placeholder="https://..." />
        <TextField label="Business Registration Number (optional)" name="registrationNumber" error={errors.registrationNumber} />
      </div>

      <fieldset className="mt-7 min-w-0 rounded-xl border border-leaf-900/10 bg-mist p-4 sm:p-5">
        <legend className="px-2 text-sm font-black text-ink">Supplier Category</legend>
        <p className="mt-1 text-sm leading-6 text-ink/62">Choose every area your business can support.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {supplierCategories.map((category) => (
            <CheckboxPill key={category} name="categories" value={category} label={category} />
          ))}
        </div>
        {errors.categories || errors.supplierCategory ? <p className="mt-3 text-xs font-bold text-tomato">{errors.categories ?? errors.supplierCategory}</p> : null}
      </fieldset>

      <fieldset className="mt-7 min-w-0 rounded-xl border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
        <legend className="px-2 text-sm font-black text-ink">Regions Served</legend>
        <p className="mt-1 text-sm leading-6 text-ink/62">Select the regions where you can sell, deliver, or support customers.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ghanaRegions.map((region) => (
            <CheckboxPill key={region} name="regionsServed" value={region} label={region} />
          ))}
        </div>
        {errors.regionsServed || errors.region ? <p className="mt-3 text-xs font-bold text-tomato">{errors.regionsServed ?? errors.region}</p> : null}
      </fieldset>

      <div className="mt-7 grid gap-5">
        <TextAreaField
          label="Products or Services Offered"
          name="productsServicesOffered"
          error={errors.productsServicesOffered}
          placeholder="Example: hybrid maize seed, fertilizer supply, irrigation installation, cold storage, transport, veterinary support"
        />
        <TextAreaField
          label="Short Business Description"
          name="businessDescription"
          error={errors.businessDescription}
          placeholder="Briefly explain who you serve, where you operate, and what customers can expect."
        />
        <TextField label="Years in Business (optional)" name="yearsInBusiness" error={errors.yearsInBusiness} />
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <FileField icon={ImagePlus} label="Upload Logo (optional)" name="logoImage" accept="image/jpeg,image/png,image/webp" hint="JPG, PNG, WEBP. Max 5MB." error={errors.logoImageUrl} />
        <FileField icon={ImagePlus} label="Upload Product / Business Photos (optional)" name="productPhotos" accept="image/jpeg,image/png,image/webp" hint="Multiple photos allowed. Max 5MB each." multiple error={errors.photoUrls} />
        <FileField icon={FileCheck2} label="Upload Certificates (optional)" name="certificates" accept="application/pdf,image/jpeg,image/png,image/webp" hint="PDF or image files. Max 8MB each." multiple error={errors.certificateUrls} />
      </div>

      <label className="mt-7 flex gap-3 rounded-xl bg-leaf-50 p-4 text-sm leading-6 text-ink/75 ring-1 ring-leaf-900/10">
        <input name="ggStandardAgreement" className="mt-1 h-4 w-4 shrink-0 accent-leaf-700" type="checkbox" />
        <span>
          I agree to uphold the Ghana Growers Quality Standard and provide accurate business information.
          {errors.ggStandardAgreement || errors.privacyAccepted ? <span className="mt-2 block text-xs font-bold text-tomato">{errors.ggStandardAgreement ?? errors.privacyAccepted}</span> : null}
        </span>
      </label>

      {errorMessage ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-tomato">{errorMessage}</p> : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={isSubmitting} className="gg-button-primary gap-2">
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit Supplier Application"}
        </button>
        <p className="text-xs leading-5 text-ink/55">Ghana Growers reviews supplier applications before public visibility.</p>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  error,
  type = "text",
  placeholder
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
      {label}
      <input className={fieldClass} name={name} placeholder={placeholder} type={type} />
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  error,
  placeholder
}: {
  label: string;
  name: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
      {label}
      <textarea className={`${fieldClass} min-h-32`} name={name} placeholder={placeholder} />
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}

function CheckboxPill({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <label className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-ink/72 ring-1 ring-leaf-900/10 transition hover:ring-leaf-700/30">
      <input name={name} value={value} type="checkbox" className="h-4 w-4 shrink-0 accent-leaf-700" />
      <span className="truncate">{label}</span>
    </label>
  );
}

function FileField({
  icon: Icon,
  label,
  name,
  accept,
  hint,
  multiple,
  error
}: {
  icon: typeof ImagePlus;
  label: string;
  name: string;
  accept: string;
  hint: string;
  multiple?: boolean;
  error?: string;
}) {
  return (
    <label className="grid min-w-0 gap-3 rounded-xl border border-dashed border-leaf-900/20 bg-mist p-4 text-sm font-bold text-ink/75">
      <span className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-leaf-700 ring-1 ring-leaf-900/10">
          <Icon size={18} aria-hidden="true" />
        </span>
        {label}
      </span>
      <input name={name} type="file" accept={accept} multiple={multiple} className="min-w-0 text-xs font-semibold text-ink/60 file:mr-3 file:rounded-xl file:border-0 file:bg-leaf-700 file:px-3 file:py-2 file:text-xs file:font-black file:text-white" />
      <span className="text-xs font-semibold leading-5 text-ink/52">{hint}</span>
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}
