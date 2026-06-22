"use client";

import { Send } from "lucide-react";
import { type FormEvent, useState } from "react";

type RegistrationFormProps = {
  title: string;
  audience: "farmer" | "buyer" | "supplier" | "partner";
};

export function RegistrationForm({ title, audience }: RegistrationFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
      <h3 className="text-xl font-black text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Share your interest and the Ghana Growers team will review your details for follow-up.
      </p>
      <input type="hidden" name="audience" value={audience} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Name
          <input
            className="gg-field"
            name="name"
            placeholder="Full name"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Phone
          <input
            className="gg-field"
            name="phone"
            placeholder="+233..."
            required
            type="tel"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75 sm:col-span-2">
          Location
          <input
            className="gg-field"
            name="location"
            placeholder="Town, district, region"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75 sm:col-span-2">
          What do you need?
          <textarea
            className="gg-field min-h-28"
            name="message"
            placeholder="Tell us what you sell, buy, supply, or want to discuss."
            required
          />
        </label>
      </div>
      <button
        type="submit"
        className="gg-button-primary mt-5 gap-2"
      >
        <Send size={17} aria-hidden="true" />
        Submit Interest
      </button>
      {submitted ? (
        <p className="mt-4 rounded-md bg-leaf-50 px-4 py-3 text-sm font-bold text-leaf-700">
          Thanks. This demo form is working locally and ready to connect to a real endpoint.
        </p>
      ) : null}
    </form>
  );
}
