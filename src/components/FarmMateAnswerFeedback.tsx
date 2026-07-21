"use client";

import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import {
  FARM_MATE_ANSWER_FEEDBACK_PATH,
  FARM_MATE_PILOT_TRUST_NOTE,
  farmMateAnswerFeedbackOptions,
  farmMateWrongAnswerReasons,
  storeFarmMatePreparedAnswerFeedback,
  type FarmMateAnswerFeedbackInput,
  type FarmMateAnswerFeedbackType,
  type FarmMateFeedbackTool,
  type FarmMateWrongAnswerReason
} from "@/lib/farmmate/answer-feedback";

type FeedbackContext = Omit<
  FarmMateAnswerFeedbackInput,
  "timestamp" | "feedbackType" | "wrongReason" | "optionalText"
> & { tool: FarmMateFeedbackTool };

export function FarmMateAnswerFeedback({
  prompt,
  wrongButtonLabel,
  context,
  copyText,
  showTrustNote = true
}: {
  prompt: string;
  wrongButtonLabel: string;
  context: FeedbackContext;
  copyText?: string;
  showTrustNote?: boolean;
}) {
  const [feedbackType, setFeedbackType] = useState<FarmMateAnswerFeedbackType | null>(null);
  const [wrongReason, setWrongReason] = useState<FarmMateWrongAnswerReason | null>(null);
  const [optionalText, setOptionalText] = useState("");
  const [feedbackTimestamp, setFeedbackTimestamp] = useState("");
  const [feedbackPreparationFailed, setFeedbackPreparationFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "error">("");

  function prepareFeedback(nextType: FarmMateAnswerFeedbackType, nextReason: FarmMateWrongAnswerReason | null = null) {
    const timestamp = new Date().toISOString();
    const isWrongAnswer = nextType === "wrong_answer";
    setFeedbackType(nextType);
    setWrongReason(nextReason);
    if (!isWrongAnswer) {
      setOptionalText("");
    }
    setFeedbackTimestamp(timestamp);

    const prepared = storeFarmMatePreparedAnswerFeedback(window.sessionStorage, {
      ...context,
      timestamp,
      feedbackType: nextType,
      wrongReason: isWrongAnswer ? nextReason ?? undefined : undefined,
      optionalText: isWrongAnswer ? optionalText || undefined : undefined
    });
    setFeedbackPreparationFailed(!prepared);
  }

  function prepareMoreFeedback() {
    const timestamp = feedbackTimestamp || new Date().toISOString();
    const prepared = storeFarmMatePreparedAnswerFeedback(window.sessionStorage, {
      ...context,
      timestamp,
      feedbackType: feedbackType ?? undefined,
      wrongReason: feedbackType === "wrong_answer" ? wrongReason ?? undefined : undefined,
      optionalText: feedbackType === "wrong_answer" ? optionalText || undefined : undefined
    });
    setFeedbackPreparationFailed(!prepared);
  }

  async function copyAnswer() {
    if (!copyText?.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section className="mt-3 min-w-0 max-w-full overflow-hidden rounded-md border border-leaf-900/10 bg-white/80 p-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black text-ink/68">{prompt}</p>
        {copyText ? (
          <button
            type="button"
            onClick={copyAnswer}
            className="inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
          >
            {copyStatus === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            Copy answer
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex min-w-0 max-w-full flex-wrap gap-2">
        {farmMateAnswerFeedbackOptions.map((option) => {
          const label = option.value === "wrong_answer" ? wrongButtonLabel : option.label;
          const isSelected = feedbackType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => prepareFeedback(option.value)}
              className={`min-h-11 max-w-full rounded-md px-3 py-2 text-left text-xs font-black leading-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 ${
                isSelected
                  ? "bg-leaf-700 text-white"
                  : "bg-leaf-50 text-leaf-700 ring-1 ring-leaf-900/10 hover:bg-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {feedbackType === "wrong_answer" ? (
        <div className="mt-3 min-w-0 max-w-full rounded-md bg-earth-50 p-3">
          <p className="text-xs font-black text-ink">What was wrong?</p>
          <div className="mt-2 flex min-w-0 max-w-full flex-wrap gap-2">
            {farmMateWrongAnswerReasons.map((reason) => (
              <button
                key={reason.value}
                type="button"
                aria-pressed={wrongReason === reason.value}
                onClick={() => prepareFeedback("wrong_answer", reason.value)}
                className={`min-h-11 max-w-full rounded-md px-3 py-2 text-left text-xs font-bold leading-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 ${
                  wrongReason === reason.value
                    ? "bg-leaf-700 text-white"
                    : "bg-white text-ink/70 ring-1 ring-leaf-900/10 hover:bg-leaf-50"
                }`}
              >
                {reason.label}
              </button>
            ))}
          </div>
          <label className="mt-3 grid min-w-0 max-w-full gap-1.5 text-xs font-black text-ink">
            Add a note <span className="font-semibold text-ink/50">Optional</span>
            <textarea
              value={optionalText}
              onChange={(event) => setOptionalText(event.target.value.slice(0, 400))}
              className="gg-field min-h-16 w-full max-w-full resize-y bg-white text-sm"
              rows={2}
            />
          </label>
        </div>
      ) : null}

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={FARM_MATE_ANSWER_FEEDBACK_PATH}
          onClick={prepareMoreFeedback}
          className="inline-flex min-h-11 max-w-full items-center rounded-md px-2 py-2 text-xs font-black text-leaf-700 underline decoration-leaf-700/35 underline-offset-4"
        >
          Send more feedback
        </Link>
        <p className="text-xs font-semibold text-ink/55" aria-live="polite">
          {copyStatus === "copied"
            ? "Copied"
            : copyStatus === "error"
              ? "Copy failed. Please try again."
              : feedbackPreparationFailed
                ? "Feedback could not be prepared. You can still send more feedback."
                : feedbackType
                  ? "Feedback prepared"
                  : ""}
        </p>
      </div>

      {showTrustNote ? <p className="mt-2 text-xs font-semibold leading-5 text-ink/50">{FARM_MATE_PILOT_TRUST_NOTE}</p> : null}
    </section>
  );
}
