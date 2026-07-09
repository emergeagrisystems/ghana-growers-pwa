"use client";

import Link from "next/link";
import { Bot, CheckCircle2, Circle, Leaf, RotateCcw, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentLearnChallenge,
  getLearnChallengeById,
  isChallengeComplete,
  LEARN_CHALLENGE_STORAGE_KEY,
  learnChallenges,
  nextOpenChallengeDay,
  type LearnChallenge,
  type LearnChallengeProgress
} from "@/lib/learn-challenges";

function readProgress(): LearnChallengeProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_CHALLENGE_STORAGE_KEY) ?? "null") as Partial<LearnChallengeProgress> | null;

    if (!parsed?.challengeId || !Array.isArray(parsed.completedDays)) {
      return null;
    }

    const challenge = getLearnChallengeById(parsed.challengeId);

    if (!challenge) {
      return null;
    }

    return {
      challengeId: challenge.id,
      completedDays: parsed.completedDays.filter((day): day is number => typeof day === "number" && challenge.days.some((step) => step.day === day))
    };
  } catch {
    return null;
  }
}

function writeProgress(progress: LearnChallengeProgress) {
  window.localStorage.setItem(LEARN_CHALLENGE_STORAGE_KEY, JSON.stringify(progress));
}

function removeProgress() {
  window.localStorage.removeItem(LEARN_CHALLENGE_STORAGE_KEY);
}

function farmMateHref(prompt?: string) {
  return prompt ? `/farmer-hub?tool=ask&question=${encodeURIComponent(prompt)}` : "/farmer-hub?tool=ask";
}

export function SoilHealthChallenge() {
  const [challenge, setChallenge] = useState<LearnChallenge>(() => getCurrentLearnChallenge());
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const saved = readProgress();

    if (saved) {
      const savedChallenge = getLearnChallengeById(saved.challengeId) ?? getCurrentLearnChallenge();
      const nextDay = nextOpenChallengeDay(savedChallenge, saved.completedDays);

      setChallenge(savedChallenge);
      setCompletedDays(saved.completedDays);
      setActiveDay(nextDay);
      setHasStarted(true);
      return;
    }

    const current = getCurrentLearnChallenge();
    setChallenge(current);
    setCompletedDays([]);
    setActiveDay(1);
    setHasStarted(false);
  }, []);

  const activeTask = challenge.days.find((day) => day.day === activeDay) ?? challenge.days[0];
  const completedCount = completedDays.length;
  const progressPercent = Math.round((completedCount / challenge.durationDays) * 100);
  const isActiveComplete = completedDays.includes(activeTask.day);
  const isComplete = isChallengeComplete(challenge, completedDays);
  const primaryButtonText = !hasStarted ? "Start Day 1" : isComplete ? "Challenge complete" : isActiveComplete ? `Continue Day ${nextOpenChallengeDay(challenge, completedDays)}` : `Mark Day ${activeTask.day} Done`;

  const completedSummary = useMemo(
    () =>
      challenge.days
        .filter((day) => completedDays.includes(day.day))
        .map((day) => `Day ${day.day}`)
        .join(", "),
    [challenge.days, completedDays]
  );

  function startChallenge() {
    const nextProgress = { challengeId: challenge.id, completedDays: [] };
    setHasStarted(true);
    setCompletedDays([]);
    setActiveDay(1);
    writeProgress(nextProgress);
  }

  function markActiveDayDone() {
    if (!hasStarted) {
      startChallenge();
      return;
    }

    if (isComplete) {
      return;
    }

    if (isActiveComplete) {
      setActiveDay(nextOpenChallengeDay(challenge, completedDays));
      return;
    }

    const nextCompleted = Array.from(new Set([...completedDays, activeTask.day])).sort((a, b) => a - b);
    const nextOpenDay = nextOpenChallengeDay(challenge, nextCompleted);

    setCompletedDays(nextCompleted);
    writeProgress({ challengeId: challenge.id, completedDays: nextCompleted });

    if (nextOpenDay) {
      setActiveDay(nextOpenDay);
    }
  }

  function resetChallenge() {
    removeProgress();
    const current = getCurrentLearnChallenge();
    setChallenge(current);
    setCompletedDays([]);
    setActiveDay(1);
    setHasStarted(false);
  }

  return (
    <div className="bg-gradient-to-b from-earth-50 via-white to-leaf-50 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr] lg:items-start">
          <aside className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
                <Leaf size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="gg-eyebrow">Current Challenge</p>
                <h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-4xl">{challenge.title}</h1>
              </div>
            </div>

            <p className="mt-4 text-base font-semibold leading-7 text-ink/68">{challenge.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-ink/58">
              <span className="rounded-md bg-leaf-50 px-3 py-2">{challenge.durationDays} days</span>
              <span className="rounded-md bg-leaf-50 px-3 py-2">{challenge.category}</span>
              <span className="rounded-md bg-earth-50 px-3 py-2">Saved on this phone only.</span>
            </div>

            <div className="mt-6 rounded-md bg-leaf-50 p-4" aria-label={`Progress: Day ${activeTask.day} of ${challenge.durationDays}, ${completedCount} completed`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-leaf-800">Day {activeTask.day} of {challenge.durationDays}</p>
                <p className="text-sm font-black text-ink/58">{completedCount}/{challenge.durationDays} done</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white ring-1 ring-leaf-900/10">
                <div className="h-full rounded-full bg-leaf-600" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-ink/55">Saved on this phone only.</p>
              <p className="sr-only">{completedSummary ? `Completed: ${completedSummary}` : "No challenge days completed yet."}</p>
            </div>

            <div className="mt-5 grid gap-2" aria-label={`${challenge.durationDays}-day challenge steps`}>
              {challenge.days.map((day) => {
                const isCompleted = completedDays.includes(day.day);
                const isActive = day.day === activeTask.day;
                const StepIcon = isCompleted ? CheckCircle2 : Circle;

                return (
                  <button
                    key={day.day}
                    type="button"
                    onClick={() => setActiveDay(day.day)}
                    className={`focus-ring flex w-full items-start gap-3 rounded-md p-3 text-left text-sm font-bold leading-5 transition ${
                      isActive ? "bg-leaf-700 text-white shadow-sm" : "bg-leaf-50 text-ink/72 hover:bg-earth-50"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Day ${day.day}: ${day.title}${isCompleted ? ", completed" : ""}`}
                  >
                    <StepIcon className={`mt-0.5 h-5 w-5 shrink-0 ${isActive ? "text-earth-500" : isCompleted ? "text-leaf-700" : "text-ink/36"}`} aria-hidden="true" />
                    <span>
                      <span className="block font-black">Day {day.day}</span>
                      <span>{day.title}</span>
                      {isCompleted ? <span className="mt-1 block text-xs uppercase tracking-wide">Completed</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={resetChallenge}
              className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-leaf-900/15 bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-leaf-50"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset challenge
            </button>
          </aside>

          <main className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="gg-eyebrow">{isComplete ? "Challenge complete" : "Today's task"}</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-3xl">{activeTask.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/66">{activeTask.task}</p>
              </div>
              <span className="inline-flex w-fit items-center rounded-md bg-earth-50 px-3 py-2 text-sm font-black text-leaf-800">
                Day {activeTask.day} of {challenge.durationDays}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(activeTask.actionSteps ?? []).map((step, index) => (
                <div key={step} className="rounded-md bg-leaf-50 p-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                    {index + 1}
                  </span>
                  <p className="mt-2 text-sm font-black leading-5 text-ink">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <section className="rounded-md bg-leaf-50 p-4">
                <h3 className="text-base font-black text-ink">What you need</h3>
                <ul className="mt-3 grid gap-2">
                  {activeTask.whatYouNeed.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-ink/68">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-md bg-earth-50 p-4">
                <h3 className="text-base font-black text-ink">Why it matters</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/68">{activeTask.whyItMatters}</p>
              </section>
            </div>

            <section className="mt-4 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="gg-icon gg-icon-standard h-10 w-10 shrink-0">
                  <Sprout size={19} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-black text-ink">How to do it</h3>
                  <ol className="mt-3 grid list-decimal gap-2 pl-5">
                    {activeTask.howToDoIt.map((step) => (
                      <li key={step} className="text-sm font-semibold leading-6 text-ink/68">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-md bg-leaf-50 p-4">
                <h3 className="text-base font-black text-ink">Done when</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">{activeTask.doneWhen}</p>
              </section>
              <section className="rounded-md bg-earth-50 p-4">
                <h3 className="text-base font-black text-ink">Common mistake</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">{activeTask.commonMistake}</p>
              </section>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={markActiveDayDone}
                disabled={isComplete}
                className="focus-ring rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-leaf-600/55"
              >
                {primaryButtonText}
              </button>
              <Link href={farmMateHref(activeTask.farmMatePrompt)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50">
                <Bot size={18} aria-hidden="true" />
                Ask FarmMate
              </Link>
            </div>
          </main>
        </div>

        <section className="mt-8 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
          <p className="gg-eyebrow">Challenge rotation</p>
          <h2 className="mt-2 text-xl font-black text-ink">Other practical challenges</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {learnChallenges.map((item) => (
              <div key={item.id} className={`rounded-md p-4 ring-1 ring-leaf-900/10 ${item.id === challenge.id ? "bg-leaf-50" : "bg-white"}`}>
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">{item.durationDays} days</p>
                <h3 className="mt-2 text-base font-black leading-6 text-ink">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
