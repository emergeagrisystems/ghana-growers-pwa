"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";

const userTypes = ["Farmer", "Buyer", "Supplier"];

export function PrelaunchWaitlistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(false);
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    setIsSubmitting(false);

    if (!response?.ok || !result?.ok) {
      setError(result?.error ?? "We could not save your waiting list request. Please try again.");
      return;
    }

    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <form
      className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-sm font-black uppercase text-earth-700">Join Waiting List</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Get notified when Ghana Growers opens</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Register your interest and the Ghana Growers team will follow up when onboarding begins.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Name
          <input required name="name" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" placeholder="Your full name" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-ink/75">
            Phone
            <input required name="phone" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" placeholder="+233..." />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink/75">
            WhatsApp Number
            <input required name="whatsapp" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" placeholder="+233..." />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Email
          <input required type="email" name="email" className="focus-ring rounded-md border border-leaf-900/15 px-3 py-3 font-normal" placeholder="name@example.com" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          User Type
          <select required name="userType" className="focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal">
            {userTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white shadow-soft transition hover:bg-leaf-700"
      >
        <Send size={17} aria-hidden="true" />
        {isSubmitting ? "Submitting..." : "Join Waiting List"}
      </button>

      {submitted ? (
        <p className="mt-4 flex items-start gap-2 rounded-md bg-leaf-50 p-3 text-sm font-bold text-leaf-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          Thank you. Your interest has been noted for launch follow-up.
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-tomato">{error}</p> : null}
    </form>
  );
}
