"use client";

import { CheckCircle2, ImagePlus, Send, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";
import { supplierCategories } from "@/data/supplierCategories";
import type { SupplierRegistrationPayload } from "@/lib/supplierRegistration";

type FormErrors = Partial<Record<keyof SupplierRegistrationPayload | "logoImage", string>>;
type FormState = Omit<SupplierRegistrationPayload, "privacyAccepted"> & { privacyAccepted: boolean };

const initialFormState: FormState = {
  companyName: "",
  contactPerson: "",
  phone: "",
  whatsapp: "",
  email: "",
  region: "",
  district: "",
  supplierCategory: "",
  productsServicesOffered: "",
  deliveryCoverage: "",
  website: "",
  description: "",
  logoImageUrl: "",
  privacyAccepted: false
};

const fieldClass = "focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal";

export function SupplierRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: FormErrors = {};
    const requiredFields: Array<keyof FormState> = [
      "contactPerson",
      "phone",
      "whatsapp",
      "region",
      "district",
      "supplierCategory",
      "productsServicesOffered",
      "deliveryCoverage"
    ];

    requiredFields.forEach((field) => {
      if (!String(form[field]).trim()) {
        nextErrors[field] = "This field is required.";
      }
    });

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.website && !/^https?:\/\/.+\..+/.test(form.website)) {
      nextErrors.website = "Enter a valid website URL starting with http:// or https://.";
    }

    if (!form.privacyAccepted) {
      nextErrors.privacyAccepted = "You must accept the privacy notice.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateLogoPreview(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setErrors((current) => ({ ...current, logoImage: undefined, logoImageUrl: undefined }));

    if (!file) {
      setLogoPreview("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLogoPreview("");
      event.target.value = "";
      setErrors((current) => ({ ...current, logoImage: "Upload a JPG, PNG, or WEBP image." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoPreview("");
      event.target.value = "";
      setErrors((current) => ({ ...current, logoImage: "Image must be 5MB or smaller." }));
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogoImage() {
    const fileInput = document.getElementById("supplier-logo-image") as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
    setLogoPreview("");
    setErrors((current) => ({ ...current, logoImage: undefined, logoImageUrl: undefined }));
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
      const formData = new FormData(event.currentTarget);
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
        throw new Error("Registration could not be submitted.");
      }

      setSuccessMessage(data.message ?? "Thank you. Your supplier registration has been submitted.");
      setForm(initialFormState);
      setLogoPreview("");
      event.currentTarget.reset();
    } catch {
      setErrorMessage("We could not submit your registration. Please check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Company Name (optional)" name="companyName" value={form.companyName} error={errors.companyName} onChange={(value) => updateField("companyName", value)} />
        <TextField label="Contact Person" name="contactPerson" value={form.contactPerson} error={errors.contactPerson} onChange={(value) => updateField("contactPerson", value)} />
        <TextField label="Phone Number" name="phone" type="tel" value={form.phone} error={errors.phone} onChange={(value) => updateField("phone", value)} />
        <TextField label="WhatsApp Number" name="whatsapp" type="tel" value={form.whatsapp} error={errors.whatsapp} onChange={(value) => updateField("whatsapp", value)} />
        <TextField label="Email (optional)" name="email" type="email" value={form.email} error={errors.email} onChange={(value) => updateField("email", value)} />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Region
          <select name="region" className={fieldClass} value={form.region} onChange={(event) => updateField("region", event.target.value)}>
            <option value="">Select region</option>
            {ghanaRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.region ? <span className="text-xs font-bold text-tomato">{errors.region}</span> : null}
        </label>
        <TextField label="District" name="district" value={form.district} error={errors.district} onChange={(value) => updateField("district", value)} />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Category
          <select name="supplierCategory" className={fieldClass} value={form.supplierCategory} onChange={(event) => updateField("supplierCategory", event.target.value)}>
            <option value="">Select category</option>
            {supplierCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.supplierCategory ? <span className="text-xs font-bold text-tomato">{errors.supplierCategory}</span> : null}
        </label>
        <TextField label="Website (optional)" name="website" type="url" value={form.website} error={errors.website} onChange={(value) => updateField("website", value)} placeholder="https://example.com" />
        <TextAreaField label="Products/Services" name="productsServicesOffered" value={form.productsServicesOffered} error={errors.productsServicesOffered} onChange={(value) => updateField("productsServicesOffered", value)} placeholder="Example: seeds, irrigation pumps, cold storage, transport, packaging" />
        <TextAreaField label="Delivery Coverage" name="deliveryCoverage" value={form.deliveryCoverage} error={errors.deliveryCoverage} onChange={(value) => updateField("deliveryCoverage", value)} placeholder="Example: Greater Accra, Eastern Region, nationwide delivery, pickup in Kumasi" />
        <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
          Logo/Image upload (optional)
          <div className="rounded-md border border-dashed border-leaf-900/20 bg-leaf-50 p-4">
            {logoPreview ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoPreview} alt="Selected supplier logo preview" className="h-28 w-28 rounded-md object-cover ring-1 ring-leaf-900/10" />
                <div className="grid gap-2">
                  <p className="text-sm font-black text-ink">Image selected</p>
                  <button type="button" onClick={removeLogoImage} className="focus-ring inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-ink ring-1 ring-leaf-900/10 transition hover:bg-leaf-50">
                    <X size={14} aria-hidden="true" />
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-ink/60">Upload a supplier logo, shop image, product photo, or service image.</p>
                <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  <ImagePlus size={15} aria-hidden="true" />
                  JPG, PNG, WEBP
                </span>
              </div>
            )}
            <input id="supplier-logo-image" name="logoImage" type="file" accept="image/jpeg,image/png,image/webp" className="mt-4 w-full text-sm font-semibold text-ink/65 file:mr-4 file:rounded-md file:border-0 file:bg-leaf-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-leaf-700" onChange={updateLogoPreview} />
            <span className="mt-2 block text-xs font-semibold text-ink/50">Maximum file size: 5MB.</span>
          </div>
          {errors.logoImage || errors.logoImageUrl ? <span className="text-xs font-bold text-tomato">{errors.logoImage ?? errors.logoImageUrl}</span> : null}
        </label>
        <TextAreaField label="Additional Notes (optional)" name="description" value={form.description} error={errors.description} onChange={(value) => updateField("description", value)} placeholder="Share service capacity, operating days, delivery terms, or ideal customers." />
      </div>

      <label className="mt-5 flex gap-3 rounded-md bg-leaf-50 p-4 text-sm leading-6 text-ink/75">
        <input
          name="privacyAccepted"
          className="mt-1 h-4 w-4 shrink-0 accent-leaf-600"
          type="checkbox"
          checked={form.privacyAccepted}
          onChange={(event) => updateField("privacyAccepted", event.target.checked)}
        />
        <span>
          I agree that Ghana Growers may store my supplier details, contact me about platform onboarding, and share relevant service information with farmers, buyers, or partners when needed.
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
          {isSubmitting ? "Submitting..." : "Submit Supplier Registration"}
        </button>
        <p className="text-xs leading-5 text-ink/55">Your supplier details are sent securely to the Ghana Growers partnerships team.</p>
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
