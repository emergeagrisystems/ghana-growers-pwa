"use client";

import { Bot, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const suggestions = [
  "Can I spray today?",
  "Tomato leaves turning yellow",
  "Best fertilizer for maize",
  "When should I harvest pepper?",
  "Market price of tomatoes"
];

const demoResponses: Record<string, string> = {
  "can i spray today?":
    "Spray only if the leaves are dry, wind is low, and rain is not expected for at least 4-6 hours. Early morning is usually safer than afternoon. If clouds are building quickly, wait until tomorrow morning.",
  "tomato leaves turning yellow":
    "Tomato leaves usually turn yellow because of excess watering, nitrogen deficiency or early disease.\n\nCheck the lower leaves first.\n\nAvoid watering every day.\n\nIf you can upload a photo, Crop Doctor can help identify the exact problem.",
  "best fertilizer for maize":
    "For maize, many farmers use a balanced starter fertilizer early, then add nitrogen when the plants are growing strongly. Apply fertilizer into moist soil and keep it away from direct contact with the seed or stem.",
  "when should i harvest pepper?":
    "Harvest pepper when fruits are firm, shiny, and the size or color your buyer wants. Pick in the cool morning, avoid bruising, and sort damaged fruits before packing.",
  "market price of tomatoes":
    "Tomato prices can change quickly by market, quality, and supply volume. Check your nearest market, compare crate sizes, and confirm whether the buyer wants fresh table tomatoes or processing-grade tomatoes."
};

function responseForQuestion(question: string) {
  const normalized = question.trim().toLowerCase();
  const matchedKey = Object.keys(demoResponses).find((key) => normalized.includes(key.replace("?", "")));

  if (matchedKey) {
    return demoResponses[matchedKey];
  }

  return "Start by checking the crop, soil moisture, recent weather, and any changes in fertilizer or spraying. Keep notes on what you see today, then compare again tomorrow. For crop symptoms, a clear photo in Crop Doctor can help narrow the problem.";
}

export function AskFarmMate({ prefillQuestion }: { prefillQuestion?: string }) {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const canAsk = question.trim().length > 0 && !isThinking;
  const responseParagraphs = useMemo(() => response.split("\n\n").filter(Boolean), [response]);

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
    setResponse("");
    setIsThinking(true);

    window.setTimeout(() => {
      setResponse(responseForQuestion(trimmedQuestion));
      setIsThinking(false);
    }, 1200);
  }

  return (
    <article id="assistant" className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
          <Bot size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 className="gg-card-title">Ask FarmMate</h2>
          <p className="mt-2 text-sm leading-6 text-ink/66">
            Ask farming questions and receive practical guidance for your farm.
          </p>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={askFarmMate}>
        <label className="grid gap-2 text-sm font-black text-ink" htmlFor="ask-farmmate-question">
          What would you like help with today?
          <textarea
            id="ask-farmmate-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What would you like help with today?"
            className="gg-field min-h-32 resize-none px-4 py-4 text-base leading-7"
          />
        </label>

        <p className="rounded-md bg-leaf-50 px-3 py-2 text-sm font-semibold leading-6 text-ink/62">
          Example: Why are my tomato leaves turning yellow?
        </p>

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
            {responseParagraphs.map((paragraph) => (
              <p key={paragraph} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

