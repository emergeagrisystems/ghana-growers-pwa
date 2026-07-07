"use client";

import Link from "next/link";
import { CheckCircle2, ImagePlus, Send, Sprout } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";
import type { FarmerRegistrationPayload } from "@/lib/farmerRegistration";

type FormErrors = Partial<Record<keyof FarmerRegistrationPayload | "form", string>>;

const fieldClass = "gg-field min-w-0 w-full";

export function FarmerRegistrationForm() {
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
      const response = await fetch("/api/farmer-registration", {
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
        throw new Error(data.errors?.form || data.message || "Farmer application could not be submitted.");
      }

      form.reset();
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We could not submit your farmer application. Please check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section id="farmer-application" className="rounded-xl border border-leaf-900/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
          <CheckCircle2 size={28} aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-earth-700">Application received</p>
        <h2 className="mt-3 text-3xl font-black text-ink">We&apos;ve received your farmer application.</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
          Our team will review your farm information and contact you with the next steps.
        </p>
        <div className="mt-6 grid gap-3">
          {[
            "Review your application",
            "Prepare your farmer profile",
            "Review your produce and availability",
            "Contact you within one business day"
          ].map((step) => (
            <div key={step} className="flex items-center gap-3 rounded-xl bg-leaf-50 px-4 py-3 text-sm font-bold text-ink/75">
              <CheckCircle2 size={17} className="shrink-0 text-leaf-700" aria-hidden="true" />
              {step}
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/farmer-hub" className="gg-button-primary">
            Open GG FarmMate
          </Link>
          <Link href="/marketplace" className="gg-button-secondary">
            Explore Marketplace
          </Link>
          <Link href="/" className="gg-button-light">
            Return Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form id="farmer-application" onSubmit={handleSubmit} className="rounded-xl border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Farmer Application</p>
        <h2 className="mt-3 text-3xl font-black text-ink">Tell us about your farm</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          These details help Ghana Growers prepare your farmer profile, understand your produce, and contact you with the right opportunities.
        </p>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <TextField label="Farmer Name" name="farmerName" error={errors.farmerName || errors.fullName} />
        <TextField label="Farm Name (optional)" name="farmName" error={errors.farmName} />
        <TextField label="Phone Number" name="phoneNumber" type="tel" error={errors.phoneNumber} />
        <TextField label="WhatsApp Number (optional)" name="whatsappNumber" type="tel" error={errors.whatsappNumber} />
        <TextField label="Email (optional)" name="emailAddress" type="email" error={errors.emailAddress} />
        <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
          Region
          <select className={fieldClass} name="region" defaultValue="">
            <option value="">Select region</option>
            {ghanaRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.region ? <span className="text-xs font-bold text-tomato">{errors.region}</span> : null}
        </label>
        <TextField label="District / Town" name="districtTown" error={errors.districtTown || errors.district} />
        <TextField label="Farm Size (optional)" name="farmSize" error={errors.farmSize || errors.farmSizeAcres} placeholder="Example: 2 acres" />
      </div>

      <div className="mt-7 grid gap-5">
        <TextAreaField
          label="Main Crops / Produce"
          name="mainCrops"
          error={errors.mainCrops || errors.products}
          placeholder="Example: tomatoes, maize, onions, cassava, goats, poultry"
        />
        <TextField label="Other Produce (optional)" name="otherProduce" error={errors.otherProduce} />
        <TextField label="Current Availability" name="currentAvailability" error={errors.currentAvailability} placeholder="Example: Tomatoes available now / Maize ready in August" />
        <TextField label="Harvest Season (optional)" name="harvestSeason" error={errors.harvestSeason || errors.expectedHarvestPeriod} placeholder="Example: July to September" />
        <TextAreaField
          label="Short Farm Description"
          name="farmDescription"
          error={errors.farmDescription || errors.additionalNotes}
          placeholder="Briefly describe your farm, produce quality, supply capacity, and what buyers should know."
        />
      </div>

      <fieldset className="mt-7 min-w-0 rounded-xl border border-leaf-900/10 bg-mist p-4 sm:p-5">
        <legend className="px-2 text-sm font-black text-ink">Do you currently have produce available?</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <RadioPill name="hasAvailableProduce" value="Yes" label="Yes, produce is available" />
          <RadioPill name="hasAvailableProduce" value="No" label="Not right now" />
        </div>
        {errors.hasAvailableProduce ? <p className="mt-3 text-xs font-bold text-tomato">{errors.hasAvailableProduce}</p> : null}
      </fieldset>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <FileField label="Upload Farmer Photo (optional)" name="farmerPhoto" hint="JPG, PNG, WEBP. Max 5MB." />
        <FileField label="Upload Farm Photos (optional)" name="farmPhotos" hint="Multiple photos allowed. Max 5MB each." multiple error={errors.farmPhotoUrls} />
        <FileField label="Upload Produce Photos (optional)" name="producePhotos" hint="Multiple photos allowed. Max 5MB each." multiple error={errors.producePhotoUrls} />
      </div>

      <label className="mt-7 flex min-h-11 gap-3 rounded-xl bg-leaf-50 p-4 text-sm leading-6 text-ink/75 ring-1 ring-leaf-900/10">
        <input name="agreement" className="mt-1 h-4 w-4 shrink-0 accent-leaf-700" type="checkbox" />
        <span>
          I agree to provide accurate farm information and follow Ghana Growers marketplace and quality guidelines.
          {errors.agreement || errors.privacyAccepted ? <span className="mt-2 block text-xs font-bold text-tomato">{errors.agreement ?? errors.privacyAccepted}</span> : null}
        </span>
      </label>

      {errorMessage ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-tomato">{errorMessage}</p> : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={isSubmitting} className="gg-button-primary gap-2">
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit Farmer Application"}
        </button>
        <p className="text-xs leading-5 text-ink/55">Ghana Growers reviews farmer applications before public visibility.</p>
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

function RadioPill({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-ink/72 ring-1 ring-leaf-900/10 transition hover:ring-leaf-700/30">
      <input name={name} value={value} type="radio" className="h-4 w-4 shrink-0 accent-leaf-700" />
      <span className="truncate">{label}</span>
    </label>
  );
}

function FileField({
  label,
  name,
  hint,
  multiple,
  error
}: {
  label: string;
  name: string;
  hint: string;
  multiple?: boolean;
  error?: string;
}) {
  return (
    <label className="grid min-w-0 gap-3 rounded-xl border border-dashed border-leaf-900/20 bg-mist p-4 text-sm font-bold text-ink/75">
      <span className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-leaf-700 ring-1 ring-leaf-900/10">
          <ImagePlus size={18} aria-hidden="true" />
        </span>
        {label}
      </span>
      <input name={name} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="min-w-0 text-xs font-semibold text-ink/60 file:mr-3 file:rounded-xl file:border-0 file:bg-leaf-700 file:px-3 file:py-2 file:text-xs file:font-black file:text-white" />
      <span className="text-xs font-semibold leading-5 text-ink/52">{hint}</span>
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}
