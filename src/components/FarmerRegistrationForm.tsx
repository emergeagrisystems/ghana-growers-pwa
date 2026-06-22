"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";
import type { FarmerRegistrationPayload } from "@/lib/farmerRegistration";

type FormErrors = Partial<Record<keyof FarmerRegistrationPayload, string>>;
type FormState = Omit<FarmerRegistrationPayload, "privacyAccepted"> & { privacyAccepted: boolean };

const initialFormState: FormState = {
  fullName: "",
  farmName: "",
  phoneNumber: "",
  whatsappNumber: "",
  emailAddress: "",
  region: "",
  district: "",
  farmSizeAcres: "",
  farmType: "Crop",
  products: "",
  expectedHarvestPeriod: "",
  additionalNotes: "",
  privacyAccepted: false
};

const fieldClass = "gg-field";

export function FarmerRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: FormErrors = {};
    const requiredFields: Array<keyof FormState> = [
      "fullName",
      "farmName",
      "phoneNumber",
      "whatsappNumber",
      "emailAddress",
      "region",
      "district",
      "farmSizeAcres",
      "farmType",
      "products",
      "expectedHarvestPeriod"
    ];

    requiredFields.forEach((field) => {
      if (!String(form[field]).trim()) {
        nextErrors[field] = "This field is required.";
      }
    });

    if (form.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress)) {
      nextErrors.emailAddress = "Enter a valid email address.";
    }

    if (form.farmSizeAcres && Number(form.farmSizeAcres) <= 0) {
      nextErrors.farmSizeAcres = "Enter a farm size greater than zero.";
    }

    if (!form.privacyAccepted) {
      nextErrors.privacyAccepted = "You must accept the privacy notice.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/farmer-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        errors?: FormErrors;
      };

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? {});
        throw new Error("Registration could not be submitted.");
      }

      setSuccessMessage(data.message ?? "Thank you. Your farmer registration has been submitted.");
      setForm(initialFormState);
    } catch {
      setErrorMessage("We could not submit your registration. Please check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Full Name" name="fullName" value={form.fullName} error={errors.fullName} onChange={(value) => updateField("fullName", value)} />
        <TextField label="Farm Name" name="farmName" value={form.farmName} error={errors.farmName} onChange={(value) => updateField("farmName", value)} />
        <TextField label="Phone Number" name="phoneNumber" type="tel" value={form.phoneNumber} error={errors.phoneNumber} onChange={(value) => updateField("phoneNumber", value)} />
        <TextField label="WhatsApp Number" name="whatsappNumber" type="tel" value={form.whatsappNumber} error={errors.whatsappNumber} onChange={(value) => updateField("whatsappNumber", value)} />
        <TextField label="Email Address" name="emailAddress" type="email" value={form.emailAddress} error={errors.emailAddress} onChange={(value) => updateField("emailAddress", value)} />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Region
          <select className={fieldClass} value={form.region} onChange={(event) => updateField("region", event.target.value)}>
            <option value="">Select region</option>
            {ghanaRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.region ? <span className="text-xs font-bold text-tomato">{errors.region}</span> : null}
        </label>
        <TextField label="District" name="district" value={form.district} error={errors.district} onChange={(value) => updateField("district", value)} />
        <TextField label="Farm Size (Acres)" name="farmSizeAcres" type="number" value={form.farmSizeAcres} error={errors.farmSizeAcres} onChange={(value) => updateField("farmSizeAcres", value)} />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Farm Type
          <select className={fieldClass} value={form.farmType} onChange={(event) => updateField("farmType", event.target.value as FormState["farmType"])}>
            <option value="Crop">Crop</option>
            <option value="Livestock">Livestock</option>
            <option value="Mixed">Mixed</option>
          </select>
          {errors.farmType ? <span className="text-xs font-bold text-tomato">{errors.farmType}</span> : null}
        </label>
        <TextAreaField label="Products Grown/Raised" name="products" value={form.products} error={errors.products} onChange={(value) => updateField("products", value)} placeholder="Example: tomatoes, maize, goats, poultry" />
        <TextField label="Expected Harvest Period" name="expectedHarvestPeriod" value={form.expectedHarvestPeriod} error={errors.expectedHarvestPeriod} onChange={(value) => updateField("expectedHarvestPeriod", value)} placeholder="Example: July to September" />
        <TextAreaField label="Additional Notes" name="additionalNotes" value={form.additionalNotes} error={errors.additionalNotes} onChange={(value) => updateField("additionalNotes", value)} placeholder="Tell us about supply volume, buyer needs, certifications, or support needed." />
      </div>

      <label className="mt-5 flex gap-3 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/75">
        <input
          className="mt-1 h-4 w-4 shrink-0 accent-leaf-600"
          type="checkbox"
          checked={form.privacyAccepted}
          onChange={(event) => updateField("privacyAccepted", event.target.checked)}
        />
        <span>
          I agree that Ghana Growers may store my registration details, contact me about farmer onboarding, and share relevant details with trusted buyers or support partners when needed. I understand I can request updates or deletion of my information.
          {errors.privacyAccepted ? <span className="mt-2 block text-xs font-bold text-tomato">{errors.privacyAccepted}</span> : null}
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="gg-button-primary gap-2"
        >
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit Farmer Registration"}
        </button>
        <p className="text-xs leading-5 text-ink/55">Your details are submitted securely to the Ghana Growers onboarding team.</p>
      </div>

      {successMessage ? (
        <p className="mt-5 flex gap-2 rounded-md bg-leaf-50 p-4 text-sm font-bold text-leaf-700">
          <CheckCircle2 className="shrink-0" size={18} aria-hidden="true" />
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? <p className="mt-5 rounded-md bg-red-50 p-4 text-sm font-bold text-tomato">{errorMessage}</p> : null}
    </form>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <input
        className={fieldClass}
        min={type === "number" ? "0.1" : undefined}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "0.1" : undefined}
        type={type}
        value={value}
      />
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
      {label}
      <textarea
        className={`${fieldClass} min-h-28`}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}
