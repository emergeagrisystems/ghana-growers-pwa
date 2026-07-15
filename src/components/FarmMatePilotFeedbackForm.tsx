"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  farmMatePilotFeedbackContactPath,
  farmMatePilotFeedbackSuccessMessage,
  farmMatePilotFeedbackUnavailableMessage,
  farmMatePilotHelpfulnessOptions,
  farmMatePilotWouldUseAgainOptions
} from "@/lib/farmmate/pilot-feedback";

type FormStatus = "idle" | "submitting" | "success" | "error" | "unavailable";

export function FarmMatePilotFeedbackForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const isSubmitting = status === "submitting";

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      nameOrNickname: formData.get("nameOrNickname"),
      region: formData.get("region"),
      mainCrop: formData.get("mainCrop"),
      testedFeature: formData.get("testedFeature"),
      helpfulness: formData.get("helpfulness"),
      confusion: formData.get("confusion"),
      improvement: formData.get("improvement"),
      wouldUseAgain: formData.get("wouldUseAgain")
    };

    if (!String(payload.testedFeature ?? "").trim()) {
      setStatus("error");
      setMessage("Please tell us what you tested.");
      form.querySelector<HTMLElement>("[name='testedFeature']")?.focus();
      return;
    }

    if (!payload.helpfulness) {
      setStatus("error");
      setMessage("Please choose whether FarmMate was helpful.");
      form.querySelector<HTMLElement>("[name='helpfulness']")?.focus();
      return;
    }

    if (!payload.wouldUseAgain) {
      setStatus("error");
      setMessage("Please choose whether you would use FarmMate again.");
      form.querySelector<HTMLElement>("[name='wouldUseAgain']")?.focus();
      return;
    }

    setStatus("submitting");
    setMessage("");

    const response = await fetch("/api/farmmate/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!response?.ok) {
      const fallback = result?.error ?? farmMatePilotFeedbackUnavailableMessage;
      setStatus(response?.status === 503 ? "unavailable" : "error");
      setMessage(fallback);
      return;
    }

    form.reset();
    setStatus("success");
    setMessage(result?.message ?? farmMatePilotFeedbackSuccessMessage);
  }

  if (status === "success") {
    return (
      <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card sm:p-6">
        <div className="rounded-md bg-leaf-50 p-4" role="status" aria-live="polite">
          <h2 className="gg-card-title">Thank you</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/70">{message}</p>
        </div>
        <Link
          href="/farmer-hub"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-leaf-700 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
        >
          Back to GG FarmMate
        </Link>
      </article>
    );
  }

  return (
    <form onSubmit={submitFeedback} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-card sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-ink">
          Name or nickname <span className="font-semibold text-ink/50">Optional</span>
          <input name="nameOrNickname" className="gg-field min-h-12" autoComplete="name" />
        </label>
        <label className="grid gap-2 text-sm font-black text-ink">
          Region <span className="font-semibold text-ink/50">Optional</span>
          <input name="region" className="gg-field min-h-12" autoComplete="address-level1" />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-black text-ink">
        Main crop <span className="font-semibold text-ink/50">Optional</span>
        <input name="mainCrop" className="gg-field min-h-12" />
      </label>

      <label className="mt-4 grid gap-2 text-sm font-black text-ink">
        What did you test?
        <textarea name="testedFeature" className="gg-field min-h-28 resize-y" required />
      </label>

      <fieldset className="mt-5">
        <legend className="text-sm font-black text-ink">Was FarmMate helpful?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {farmMatePilotHelpfulnessOptions.map((option) => (
            <label key={option.value} className="flex min-h-12 items-center gap-2 rounded-md border border-leaf-900/10 bg-earth-50 px-3 py-2 text-sm font-bold text-ink/72">
              <input type="radio" name="helpfulness" value={option.value} required className="h-4 w-4 accent-leaf-700" />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 grid gap-2 text-sm font-black text-ink">
        What confused you?
        <textarea name="confusion" className="gg-field min-h-24 resize-y" />
      </label>

      <label className="mt-4 grid gap-2 text-sm font-black text-ink">
        What should we improve?
        <textarea name="improvement" className="gg-field min-h-24 resize-y" />
      </label>

      <fieldset className="mt-5">
        <legend className="text-sm font-black text-ink">Would you use FarmMate again?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {farmMatePilotWouldUseAgainOptions.map((option) => (
            <label key={option.value} className="flex min-h-12 items-center gap-2 rounded-md border border-leaf-900/10 bg-earth-50 px-3 py-2 text-sm font-bold text-ink/72">
              <input type="radio" name="wouldUseAgain" value={option.value} required className="h-4 w-4 accent-leaf-700" />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-5">
        {message ? (
          <div className={`rounded-md p-4 text-sm font-semibold leading-6 ${status === "unavailable" ? "bg-earth-50 text-ink/70" : "bg-red-50 text-red-700"}`}>
            <p>{message}</p>
            {status === "unavailable" ? (
              <Link href={farmMatePilotFeedbackContactPath} className="mt-2 inline-flex font-black text-leaf-700">
                Contact Ghana Growers
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-leaf-700 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-leaf-700/55 sm:w-auto"
      >
        {isSubmitting ? "Submitting feedback..." : "Submit feedback"}
      </button>
    </form>
  );
}
