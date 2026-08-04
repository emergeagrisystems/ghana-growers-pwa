"use client";

import Link from "next/link";
import { CheckCircle2, FileText, ImagePlus, Send } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";

type FormErrors = Record<string, string | undefined>;

const fieldClass = "gg-field min-w-0 w-full";

function createSubmissionToken() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function FarmerRegistrationForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionToken, setSubmissionToken] = useState("");
  const [applicationReference, setApplicationReference] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmissionToken(createSubmissionToken());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || submitted || !submissionToken) return;

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
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        reference?: string;
        errors?: FormErrors;
      };

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? {});
        throw new Error(data.errors?.form || data.message || "Farmer application could not be submitted.");
      }

      setApplicationReference(data.reference ?? "");
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? error.message
        : "We could not submit your farmer application. Check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section id="farmer-application" className="rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft sm:p-8" aria-live="polite">
        <div className="grid h-14 w-14 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10">
          <CheckCircle2 size={28} aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-earth-700">Application received</p>
        <h2 className="mt-3 text-3xl font-black text-ink">Thank you for registering your farm.</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">
          Ghana Growers will review the information and may contact you for more details. Registration does not publish a public profile automatically.
        </p>
        {applicationReference ? (
          <p className="mt-5 rounded-md bg-mist px-4 py-3 text-sm font-bold text-ink/72">
            Application reference: <span className="font-black text-leaf-800">{applicationReference}</span>
          </p>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/join" className="gg-button-primary">Back to Join the Network</Link>
          <Link href="/farmer-hub" className="gg-button-secondary">Open GG FarmMate</Link>
        </div>
      </section>
    );
  }

  return (
    <form id="farmer-application" onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-8">
      <input type="hidden" name="submissionToken" value={submissionToken} />
      <input name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-700">Farmer application</p>
        <h2 className="mt-3 text-3xl font-black text-ink">Tell us about your farm</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Required fields help Ghana Growers identify, contact and review your farm. Optional details can be added now or discussed later.
        </p>
      </div>

      <fieldset className="mt-7 min-w-0">
        <legend className="text-lg font-black text-ink">Contact information</legend>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <TextField label="Your name" name="applicantName" required error={errors.applicantName} />
          <TextField label="Farm name" optional name="farmName" error={errors.farmName} />
          <TextField label="Phone number" optional name="phoneNumber" type="tel" error={errors.phoneNumber} />
          <TextField label="WhatsApp number" optional name="whatsappNumber" type="tel" error={errors.whatsappNumber} />
          <TextField label="Email" optional name="email" type="email" error={errors.email} />
        </div>
        <p className="mt-3 text-xs leading-5 text-ink/58">Provide at least one phone or WhatsApp number so Ghana Growers can contact you.</p>
        {errors.contact ? <p className="mt-2 text-xs font-bold text-tomato">{errors.contact}</p> : null}
      </fieldset>

      <fieldset className="mt-8 min-w-0 border-t border-leaf-900/10 pt-7">
        <legend className="text-lg font-black text-ink">Farm and location</legend>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
            Region <RequiredMark />
            <select className={fieldClass} name="region" defaultValue="" required>
              <option value="">Select region</option>
              {ghanaRegions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
            {errors.region ? <FieldError>{errors.region}</FieldError> : null}
          </label>
          <TextField label="District" name="district" required error={errors.district} />
          <TextField label="Farm location or community" optional name="farmLocation" error={errors.farmLocation} />
          <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
            Farm type <RequiredMark />
            <select className={fieldClass} name="farmType" defaultValue="" required>
              <option value="">Select farm type</option>
              <option value="Crop">Crop</option>
              <option value="Livestock">Livestock</option>
              <option value="Mixed">Mixed</option>
            </select>
            {errors.farmType ? <FieldError>{errors.farmType}</FieldError> : null}
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-8 min-w-0 border-t border-leaf-900/10 pt-7">
        <legend className="text-lg font-black text-ink">What you grow or produce</legend>
        <div className="mt-4 grid gap-5">
          <TextAreaField
            label="Crops or products"
            name="cropsProducts"
            required
            error={errors.cropsProducts}
            placeholder="Example: maize, cassava, tomatoes, goats"
            hint="Separate items with commas."
          />
          <TextAreaField
            label="Farming or supply information"
            optional
            name="productionDetails"
            error={errors.productionDetails}
            placeholder="Tell us briefly about your farm and how you produce or supply these items."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Current availability" optional name="currentAvailability" error={errors.currentAvailability} placeholder="Example: maize available in September" />
            <TextField label="Supply frequency" optional name="supplyFrequency" error={errors.supplyFrequency} placeholder="Example: seasonal or monthly" />
            <TextField label="Harvest season" optional name="harvestSeason" error={errors.harvestSeason} />
            <TextField label="Delivery preference" optional name="deliveryPreference" error={errors.deliveryPreference} placeholder="Example: farm pickup" />
          </div>
          <TextAreaField
            label="Application message"
            optional
            name="applicationMessage"
            error={errors.applicationMessage}
            placeholder="Add anything else Ghana Growers should know for the initial review."
          />
        </div>
      </fieldset>

      <fieldset className="mt-8 min-w-0 border-t border-leaf-900/10 pt-7">
        <legend className="text-lg font-black text-ink">Optional photos and documents</legend>
        <p className="mt-2 text-sm leading-6 text-ink/62">Files stay private during application review and are not added to a public profile automatically.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FileField label="Main farmer or farm image" name="profileImage" hint="One JPG, PNG or WEBP image. Maximum 5MB." error={errors.profileImage} />
          <FileField label="Farm images" name="farmImages" hint="Up to four JPG, PNG or WEBP images. Maximum 5MB each." multiple error={errors.farmImages} />
          <FileField label="Produce images" name="produceImages" hint="Up to four JPG, PNG or WEBP images. Maximum 5MB each." multiple error={errors.produceImages} />
          <FileField label="Supporting documents" name="documents" hint="Up to three PDF or image files. Maximum 8MB each." multiple documents error={errors.documents} />
        </div>
      </fieldset>

      <label className="mt-8 flex min-h-11 gap-3 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/75 ring-1 ring-leaf-900/10">
        <input name="agreementAccepted" className="mt-1 h-4 w-4 shrink-0 accent-leaf-700" type="checkbox" required />
        <span>
          I confirm that the information is accurate and agree that Ghana Growers may review this application and contact me about it. <RequiredMark />
          {errors.agreementAccepted ? <span className="mt-2 block text-xs font-bold text-tomato">{errors.agreementAccepted}</span> : null}
        </span>
      </label>

      {errorMessage ? (
        <div className="mt-5 rounded-md bg-red-50 p-4 text-sm font-bold text-tomato" role="alert">
          <p>{errorMessage}</p>
          <p className="mt-1 font-semibold">Your entries are still here. Review them and try again.</p>
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={isSubmitting || !submissionToken} className="gg-button-primary min-h-11 gap-2 disabled:cursor-not-allowed disabled:opacity-60">
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit Farmer Application"}
        </button>
        <p className="text-xs leading-5 text-ink/55">Submitting an application does not publish a profile or listing.</p>
      </div>
    </form>
  );
}

function RequiredMark() {
  return <span className="text-tomato" aria-label="required">*</span>;
}

function FieldError({ children }: { children: string }) {
  return <span className="text-xs font-bold text-tomato">{children}</span>;
}

function TextField({
  label,
  name,
  error,
  type = "text",
  placeholder,
  optional,
  required
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
      <span>{label} {required ? <RequiredMark /> : optional ? <span className="font-semibold text-ink/48">Optional</span> : null}</span>
      <input className={fieldClass} name={name} placeholder={placeholder} type={type} required={required} />
      {error ? <FieldError>{error}</FieldError> : null}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  error,
  placeholder,
  hint,
  optional,
  required
}: {
  label: string;
  name: string;
  error?: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-ink/75">
      <span>{label} {required ? <RequiredMark /> : optional ? <span className="font-semibold text-ink/48">Optional</span> : null}</span>
      <textarea className={`${fieldClass} min-h-28`} name={name} placeholder={placeholder} required={required} />
      {hint ? <span className="text-xs font-semibold text-ink/52">{hint}</span> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </label>
  );
}

function FileField({
  label,
  name,
  hint,
  multiple,
  documents,
  error
}: {
  label: string;
  name: string;
  hint: string;
  multiple?: boolean;
  documents?: boolean;
  error?: string;
}) {
  const Icon = documents ? FileText : ImagePlus;
  return (
    <label className="grid min-w-0 gap-3 rounded-md border border-dashed border-leaf-900/20 bg-mist p-4 text-sm font-bold text-ink/75">
      <span className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
          <Icon size={18} aria-hidden="true" />
        </span>
        {label} <span className="font-semibold text-ink/48">Optional</span>
      </span>
      <input
        name={name}
        type="file"
        accept={documents ? "image/jpeg,image/png,image/webp,application/pdf" : "image/jpeg,image/png,image/webp"}
        multiple={multiple}
        className="min-w-0 text-xs font-semibold text-ink/60 file:mr-3 file:rounded-md file:border-0 file:bg-leaf-700 file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
      />
      <span className="text-xs font-semibold leading-5 text-ink/52">{hint}</span>
      {error ? <FieldError>{error}</FieldError> : null}
    </label>
  );
}
