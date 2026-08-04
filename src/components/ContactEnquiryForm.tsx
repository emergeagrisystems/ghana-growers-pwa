"use client";

import { ArrowRight, RotateCcw, Send } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type { ContactEnquiryField, ContactEnquiryType } from "@/lib/contactEnquiryContracts";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  subject: string;
  website: string;
  message: string;
  companyWebsite: string;
};

type SubmissionResult = {
  reference?: string;
};

const initialValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  organisation: "",
  subject: "",
  website: "",
  message: "",
  companyWebsite: ""
};

function createSubmissionToken() {
  return globalThis.crypto?.randomUUID?.() ?? "";
}

export function ContactEnquiryForm({ enquiryType }: { enquiryType: ContactEnquiryType }) {
  const partnership = enquiryType === "Partnership";
  const [values, setValues] = useState<FormValues>(initialValues);
  const [submissionToken, setSubmissionToken] = useState("");
  const [errors, setErrors] = useState<Partial<Record<ContactEnquiryField, string>>>({});
  const [formError, setFormError] = useState("");
  const [isConflict, setIsConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    setSubmissionToken(createSubmissionToken());
  }, []);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    setFormError("");
    setIsConflict(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || submitted || !submissionToken) return;

    setIsSubmitting(true);
    setErrors({});
    setFormError("");
    setIsConflict(false);

    const response = await fetch("/api/contact-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enquiryType, ...values, submissionToken })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      errors?: Partial<Record<ContactEnquiryField, string>>;
      message?: string;
      reference?: string;
    } | null;

    setIsSubmitting(false);
    if (!response?.ok || !result?.ok) {
      setErrors(result?.errors ?? {});
      setFormError(result?.message || result?.errors?.form || "Could not send your enquiry. Your entries are still here. Please try again.");
      setIsConflict(response?.status === 409);
      return;
    }

    setSubmitted({ reference: result.reference });
  }

  function startNewEnquiry() {
    setSubmissionToken(createSubmissionToken());
    setErrors({});
    setFormError("");
    setIsConflict(false);
  }

  if (submitted) {
    return (
      <section className="rounded-md border border-leaf-700/15 bg-leaf-50 p-6 shadow-soft sm:p-8" role="status">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-leaf-700 text-white">
          <Send className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="gg-eyebrow mt-5">Stored securely</p>
        <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">
          {partnership ? "Partnership enquiry received" : "Message received"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-ink/66">
          {partnership
            ? "Ghana Growers has received your enquiry. We will review the information and follow up where appropriate."
            : "Ghana Growers has received your message. We will review it and follow up where appropriate."}
        </p>
        {submitted.reference ? (
          <p className="mt-5 inline-flex rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10">
            Reference: {submitted.reference}
          </p>
        ) : null}
      </section>
    );
  }

  const fieldClass = "gg-field min-h-12";
  const labelClass = "grid gap-2 text-sm font-black text-ink/75";

  return (
    <form onSubmit={handleSubmit} className="relative rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6" noValidate>
      <div>
        <p className="gg-eyebrow">{partnership ? "Partnership enquiry" : "Contact form"}</p>
        <h2 className="mt-2 text-2xl font-black text-ink">
          {partnership ? "Work with Ghana Growers" : "Contact Ghana Growers"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          {partnership
            ? "Tell us how your organisation would like to support farmers, market access, training, technology or agricultural services."
            : "Have a question about buying, selling, farmer registration, supplier applications or Ghana Growers? Send us a message."}
        </p>
      </div>

      <label className="hidden" aria-hidden="true">
        Company website
        <input
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
          value={values.companyWebsite}
          onChange={(event) => update("companyWebsite", event.target.value)}
        />
      </label>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>
          <input name="name" className={fieldClass} value={values.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input name="email" className={fieldClass} type="email" value={values.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Phone or WhatsApp" optional error={errors.phone}>
          <input name="phone" className={fieldClass} value={values.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" inputMode="tel" aria-invalid={Boolean(errors.phone)} />
        </Field>
        {partnership ? (
          <Field label="Organisation" required error={errors.organisation}>
            <input name="organisation" className={fieldClass} value={values.organisation} onChange={(event) => update("organisation", event.target.value)} autoComplete="organization" aria-invalid={Boolean(errors.organisation)} />
          </Field>
        ) : (
          <Field label="Subject" optional error={errors.subject}>
            <input name="subject" className={fieldClass} value={values.subject} onChange={(event) => update("subject", event.target.value)} aria-invalid={Boolean(errors.subject)} />
          </Field>
        )}
        {partnership ? (
          <>
            <Field label="Partnership interest" required error={errors.subject}>
              <input name="subject" className={fieldClass} value={values.subject} onChange={(event) => update("subject", event.target.value)} aria-invalid={Boolean(errors.subject)} />
            </Field>
            <Field label="Website" optional error={errors.website}>
              <input name="website" className={fieldClass} type="url" value={values.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" autoComplete="url" aria-invalid={Boolean(errors.website)} />
            </Field>
          </>
        ) : null}
        <Field label="Message" required error={errors.message} className="sm:col-span-2">
          <textarea name="message" className={`${fieldClass} min-h-36 resize-y`} value={values.message} onChange={(event) => update("message", event.target.value)} aria-invalid={Boolean(errors.message)} />
        </Field>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-ink/58">Your message and contact details are kept private.</p>

      {formError ? (
        <div className="mt-4 rounded-md bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato" role="alert">
          <p>{formError}</p>
          {isConflict ? (
            <button type="button" onClick={startNewEnquiry} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-700">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Start a new enquiry
            </button>
          ) : null}
        </div>
      ) : null}

      <button type="submit" disabled={isSubmitting || !submissionToken} className="gg-button-primary mt-5 min-h-12 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
        {isSubmitting ? "Sending..." : formError && !isConflict ? "Retry" : partnership ? "Submit Partnership Enquiry" : "Send Message"}
        {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  optional,
  error,
  className = "",
  children
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid gap-2 text-sm font-black text-ink/75 ${className}`}>
      <span>{label} {optional ? <span className="font-semibold text-ink/45">Optional</span> : null}{required ? <span className="font-semibold text-earth-700">Required</span> : null}</span>
      {children}
      {error ? <span className="text-xs font-bold text-tomato">{error}</span> : null}
    </label>
  );
}
