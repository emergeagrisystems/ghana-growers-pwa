"use client";

import { Bot, Camera, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { buildFarmMateResponse, FarmMateBrainResponse } from "@/lib/farmmate/decision-engine";

const suggestions = [
  "Can I spray today?",
  "Tomato leaves turning yellow",
  "Best fertilizer for maize"
];

type FollowUpAnswer = {
  question: string;
  answer: string;
};

function sectionBody(response: FarmMateBrainResponse, title: string) {
  return response.sections.find((section) => section.title === title)?.body ?? [];
}

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
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const canAsk = question.trim().length > 0 && !isThinking;
  const followUpQuestions = response?.flow?.followUpQuestions ?? [];
  const currentFollowUp = followUpQuestions[followUpIndex];

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
    setFollowUpIndex(0);
    setFollowUpAnswers([]);
    setShowRecommendation(false);
    setIsThinking(true);

    window.setTimeout(() => {
      const farmMateResponse = buildFarmMateResponse(trimmedQuestion);
      setResponse(farmMateResponse);
      setShowRecommendation(farmMateResponse.confidence === "high" || !farmMateResponse.flow);
      setIsThinking(false);
    }, 1200);
  }

  function answerFollowUp(answer: string) {
    if (!currentFollowUp) {
      return;
    }

    setFollowUpAnswers((answers) => [...answers, { question: currentFollowUp.question, answer }]);

    if (followUpIndex + 1 < followUpQuestions.length) {
      setFollowUpIndex((index) => index + 1);
      return;
    }

    setShowRecommendation(true);
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
          <div className="max-w-[92%] space-y-3">
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-4 text-sm font-semibold leading-6 text-ink/76">
              <p>I can help.</p>
              {showRecommendation ? (
                <p className="mt-2">Here is the practical next step based on what FarmMate knows locally.</p>
              ) : (
                <p className="mt-2">Let&apos;s narrow it down first. I&apos;ll ask one quick question at a time.</p>
              )}
            </div>

            {followUpAnswers.map((answer) => (
              <div key={`${answer.question}-${answer.answer}`} className="ml-auto max-w-[92%] rounded-md bg-white px-4 py-3 text-sm font-bold leading-6 text-ink/72 ring-1 ring-leaf-900/10">
                {answer.answer}
              </div>
            ))}

            {!showRecommendation && currentFollowUp ? (
              <div className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                <p className="text-sm font-black text-ink">{currentFollowUp.question}</p>
                <div className="mt-3 grid gap-2">
                  {(currentFollowUp.options ?? ["Yes", "No", "Not sure"]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answerFollowUp(option)}
                      className="min-h-11 rounded-md border border-leaf-900/15 bg-leaf-50 px-3 py-2 text-left text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showRecommendation ? (
              <div className="space-y-3">
                {[
                  ["Possible Cause", sectionBody(response, "Why this may happen")],
                  ["What to check", sectionBody(response, "What to check").slice(0, 2)],
                  ["Recommended Action", sectionBody(response, "Recommended action")],
                  ["Prevention", sectionBody(response, "Prevention")],
                  ["Next Best Action", sectionBody(response, "Next Best Action")]
                ].map(([title, body]) => (
                  <section key={title as string} className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                    <h3 className="text-sm font-black text-ink">{title as string}</h3>
                    <div className="mt-2 space-y-1">
                      {(body as string[]).map((line) => (
                        <p key={line} className="text-sm font-semibold leading-6 text-ink/72">
                          {line}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}

                {response.shouldShowCropDoctorAction && onOpenCropDoctor ? (
                  <button
                    type="button"
                    onClick={onOpenCropDoctor}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                  >
                    <Camera size={18} aria-hidden="true" />
                    Upload Crop Photo
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

