"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Contact form</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Send Ghana Growers a message</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          Use this form for onboarding, buyer demand, supplier registration, partnership, or general platform questions.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-ink/75">
          Full Name
          <input required name="name" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-black text-ink/75">
          Email
          <input required type="email" name="email" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-black text-ink/75">
          Phone / WhatsApp
          <input name="phone" inputMode="tel" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-black text-ink/75">
          Enquiry Type
          <select name="type" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal">
            <option>Farmer onboarding</option>
            <option>Buyer request</option>
            <option>Supplier registration</option>
            <option>Partnership</option>
            <option>Verification or trust issue</option>
            <option>General enquiry</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black text-ink/75 sm:col-span-2">
          Message
          <textarea required name="message" className="focus-ring min-h-32 rounded-md border border-leaf-900/15 px-3 py-3 font-normal" />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-leaf-700 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-800 sm:w-auto"
      >
        Send Message
      </button>

      {submitted ? (
        <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm font-bold text-leaf-800">
          Thank you. Your message has been captured. Ghana Growers will review the enquiry and follow up through the contact details provided.
        </p>
      ) : null}
    </form>
  );
}
