"use client";

import { Bot, Camera, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { buildFarmMateResponse, FarmMateBrainResponse } from "@/lib/farmmate/decision-engine";

const suggestions = [
  "Can I spray today?",
  "Tomato leaves turning yellow",
  "Best fertilizer for maize"
];

export function AskFarmMate({
  prefillQuestion,
  onOpenCropDoctor
}: {
  prefillQuestion?: string;
  onOpenCropDoctor?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [response, setResponse] = useState<FarmMateBrainResponse | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const canAsk = question.trim().length > 0 && !isThinking;

  useEffect(() => {
    function handlePrefill(event: Event) {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        setQuestion(customEvent.detail);
      }
    }

    window.addEventListener("gg-farmmate-prefill", handlePrefill);
    return () => window.removeEventListener("gg-farmmate-prefill", handlePrefill);
  }, []);

  useEffect(() => {
    if (prefillQuestion) {
      setQuestion(prefillQuestion);
    }
  }, [prefillQuestion]);

  function askFarmMate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isThinking) {
      return;
    }

    setAskedQuestion(trimmedQuestion);
    setResponse(null);
    setIsThinking(true);

    window.setTimeout(() => {
      setResponse(buildFarmMateResponse(trimmedQuestion));
      setIsThinking(false);
    }, 1200);
  }

  return (
    <article id="assistant" className="rounded-md border border-leaf-900/10 bg-white/95 p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
          <Bot size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 className="gg-card-title">Ask FarmMate</h2>
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={askFarmMate}>
        <label className="grid gap-2" htmlFor="ask-farmmate-question">
          <span className="sr-only">What would you like help with today?</span>
          <textarea
            id="ask-farmmate-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: Why are my tomato leaves turning yellow?"
            className="gg-field min-h-36 resize-none bg-leaf-50/70 px-4 py-4 text-base leading-7 focus:bg-white"
          />
        </label>

        <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuestion(suggestion)}
              className="min-h-11 rounded-md border border-leaf-900/15 bg-white px-3 py-2 text-left text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!canAsk}
          className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
        >
          {isThinking ? <Loader2 className="animate-spin" size={20} aria-hidden="true" /> : <Send size={20} aria-hidden="true" />}
          Ask FarmMate
        </button>
      </form>

      <div className="mt-5 space-y-3" aria-live="polite">
        {askedQuestion ? (
          <div className="ml-auto max-w-[92%] rounded-md bg-leaf-600 px-4 py-3 text-sm font-bold leading-6 text-white">
            {askedQuestion}
          </div>
        ) : null}

        {isThinking ? (
          <div className="flex max-w-[92%] items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
            <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
            FarmMate is thinking...
          </div>
        ) : null}

        {response ? (
          <div className="max-w-[92%] rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-4 text-sm font-semibold leading-6 text-ink/76">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black uppercase tracking-[0.1em] text-leaf-700">
                {response.intent.label.replaceAll("_", " ")}
              </span>
              <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black uppercase tracking-[0.1em] text-ink/56">
                {response.confidence} confidence
              </span>
            </div>
            <div className="space-y-4">
              {response.sections.map((section, index) => (
                <section key={section.title}>
                  <h3 className="text-sm font-black text-ink">
                    {index + 1}. {section.title}
                  </h3>
                  <div className="mt-1 space-y-1">
                    {section.body.map((line) => (
                      <p key={line} className="text-sm font-semibold leading-6 text-ink/72">
                        {line}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            {response.shouldShowCropDoctorAction && onOpenCropDoctor ? (
              <button
                type="button"
                onClick={onOpenCropDoctor}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
              >
                <Camera size={18} aria-hidden="true" />
                Upload Crop Photo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

