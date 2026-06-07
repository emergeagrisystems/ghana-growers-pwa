"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { buyerTypes } from "@/data/buyerTypes";
import { ghanaRegions } from "@/data/ghanaRegions";
import type { BuyerRegistrationPayload } from "@/lib/buyerRegistration";

type FormErrors = Partial<Record<keyof BuyerRegistrationPayload, string>>;
type FormState = Omit<BuyerRegistrationPayload, "privacyAccepted"> & { privacyAccepted: boolean };

const initialFormState: FormState = {
  name: "",
  businessName: "",
  phone: "",
  whatsapp: "",
  email: "",
  region: "",
  buyerType: "",
  productsInterestedIn: "",
  typicalPurchaseVolume: "",
  purchaseFrequency: "",
  additionalNotes: "",
  privacyAccepted: false
};

const fieldClass = "focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal";

export function BuyerRegistrationForm() {
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
      "name",
      "businessName",
      "phone",
      "whatsapp",
      "email",
      "region",
      "buyerType",
      "productsInterestedIn",
      "typicalPurchaseVolume",
      "purchaseFrequency"
    ];

    requiredFields.forEach((field) => {
      if (!String(form[field]).trim()) {
        nextErrors[field] = "This field is required.";
      }
    });

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
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
      const response = await fetch("/api/buyer-registration", {
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

      setSuccessMessage(data.message ?? "Thank you. Your buyer registration has been submitted.");
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
        <TextField label="Name" name="name" value={form.name} error={errors.name} onChange={(value) => updateField("name", value)} />
        <TextField label="Business Name" name="businessName" value={form.businessName} error={errors.businessName} onChange={(value) => updateField("businessName", value)} />
        <TextField label="Phone" name="phone" type="tel" value={form.phone} error={errors.phone} onChange={(value) => updateField("phone", value)} />
        <TextField label="WhatsApp" name="whatsapp" type="tel" value={form.whatsapp} error={errors.whatsapp} onChange={(value) => updateField("whatsapp", value)} />
        <TextField label="Email" name="email" type="email" value={form.email} error={errors.email} onChange={(value) => updateField("email", value)} />
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
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Buyer Type
          <select className={fieldClass} value={form.buyerType} onChange={(event) => updateField("buyerType", event.target.value)}>
            <option value="">Select buyer type</option>
            {buyerTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.buyerType ? <span className="text-xs font-bold text-tomato">{errors.buyerType}</span> : null}
        </label>
        <TextField label="Typical Purchase Volume" name="typicalPurchaseVolume" value={form.typicalPurchaseVolume} error={errors.typicalPurchaseVolume} onChange={(value) => updateField("typicalPurchaseVolume", value)} placeholder="Example: 20 crates weekly" />
        <TextField label="Purchase Frequency" name="purchaseFrequency" value={form.purchaseFrequency} error={errors.purchaseFrequency} onChange={(value) => updateField("purchaseFrequency", value)} placeholder="Daily, weekly, monthly, seasonal" />
        <TextAreaField label="Products Interested In" name="productsInterestedIn" value={form.productsInterestedIn} error={errors.productsInterestedIn} onChange={(value) => updateField("productsInterestedIn", value)} placeholder="Example: tomatoes, onions, eggs, plantain, poultry" />
        <TextAreaField label="Additional Notes" name="additionalNotes" value={form.additionalNotes} error={errors.additionalNotes} onChange={(value) => updateField("additionalNotes", value)} placeholder="Tell us about delivery needs, quality preferences, packaging, or supply timelines." />
      </div>

      <label className="mt-5 flex gap-3 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/75">
        <input
          className="mt-1 h-4 w-4 shrink-0 accent-leaf-600"
          type="checkbox"
          checked={form.privacyAccepted}
          onChange={(event) => updateField("privacyAccepted", event.target.checked)}
        />
        <span>
          I agree that Ghana Growers may store my buyer details, contact me about sourcing needs, and share relevant demand information with trusted farmers or support partners when needed.
          {errors.privacyAccepted ? <span className="mt-2 block text-xs font-bold text-tomato">{errors.privacyAccepted}</span> : null}
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-ink/25"
        >
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit Buyer Registration"}
        </button>
        <p className="text-xs leading-5 text-ink/55">Your buying needs are sent securely to the Ghana Growers sourcing team.</p>
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
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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
