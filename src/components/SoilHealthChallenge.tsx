"use client";

import Link from "next/link";
import { Bot, BookOpen, CheckCircle2, Circle, Leaf, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { soilHealthChallengeDays, soilHealthChallengeIntro } from "@/lib/soil-health-challenge";

const storageKey = "gg-soil-health-challenge-progress";

function readCompletedDays() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((day): day is number => typeof day === "number" && soilHealthChallengeDays.some((step) => step.day === day))
      : [];
  } catch {
    return [];
  }
}

function writeCompletedDays(days: number[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(days));
}

export function SoilHealthChallenge() {
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    const savedDays = readCompletedDays();
    const firstOpenDay = soilHealthChallengeDays.find((day) => !savedDays.includes(day.day))?.day ?? 7;

    setCompletedDays(savedDays);
    setActiveDay(firstOpenDay);
  }, []);

  const activeTask = soilHealthChallengeDays.find((day) => day.day === activeDay) ?? soilHealthChallengeDays[0];
  const completedCount = completedDays.length;
  const progressPercent = Math.round((completedCount / soilHealthChallengeDays.length) * 100);
  const isActiveComplete = completedDays.includes(activeTask.day);

  const completedSummary = useMemo(
    () =>
      soilHealthChallengeDays
        .filter((day) => completedDays.includes(day.day))
        .map((day) => `Day ${day.day}`)
        .join(", "),
    [completedDays]
  );

  function markActiveDayDone() {
    const nextCompleted = Array.from(new Set([...completedDays, activeTask.day])).sort((a, b) => a - b);
    const nextOpenDay = soilHealthChallengeDays.find((day) => !nextCompleted.includes(day.day))?.day;

    setCompletedDays(nextCompleted);
    writeCompletedDays(nextCompleted);

    if (nextOpenDay) {
      setActiveDay(nextOpenDay);
    }
  }

  return (
    <div className="bg-gradient-to-b from-earth-50 via-white to-leaf-50 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <aside className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
                <Leaf size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="gg-eyebrow">SOIL HEALTH</p>
                <h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-4xl">{soilHealthChallengeIntro.title}</h1>
              </div>
            </div>

            <p className="mt-4 text-base font-semibold leading-7 text-ink/68">{soilHealthChallengeIntro.body}</p>

            <div className="mt-6 rounded-md bg-leaf-50 p-4" aria-label={`Progress: Day ${activeTask.day} of 7, ${completedCount} completed`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-leaf-800">Day {activeTask.day} of 7</p>
                <p className="text-sm font-black text-ink/58">{completedCount}/7 done</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white ring-1 ring-leaf-900/10">
                <div className="h-full rounded-full bg-leaf-600" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="sr-only">{completedSummary ? `Completed: ${completedSummary}` : "No challenge days completed yet."}</p>
            </div>

            <div className="mt-5 grid gap-2" aria-label="7-day challenge steps">
              {soilHealthChallengeDays.map((day) => {
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
                  >
                    <StepIcon className={`mt-0.5 h-5 w-5 shrink-0 ${isActive ? "text-earth-500" : isCompleted ? "text-leaf-700" : "text-ink/36"}`} aria-hidden="true" />
                    <span>
                      <span className="block font-black">Day {day.day}</span>
                      <span>{day.shortLabel}</span>
                      {isCompleted ? <span className="mt-1 block text-xs uppercase tracking-wide">Completed</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="gg-eyebrow">TODAY&apos;S TASK</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-3xl">{activeTask.title}</h2>
              </div>
              <span className="inline-flex w-fit items-center rounded-md bg-earth-50 px-3 py-2 text-sm font-black text-leaf-800">
                Day {activeTask.day}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                  <h3 className="text-base font-black text-ink">Next step</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">{activeTask.nextStep}</p>
                </div>
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={markActiveDayDone}
                disabled={isActiveComplete}
                className="focus-ring rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-leaf-600/55"
              >
                {isActiveComplete ? `Day ${activeTask.day} Done` : `Mark Day ${activeTask.day} Done`}
              </button>
              <Link href="/farmer-hub?tool=ask" className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50">
                <Bot size={18} aria-hidden="true" />
                Ask FarmMate about compost
              </Link>
              <Link href="/learn/make-your-own-compost-for-healthy-soil" className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-leaf-900/15 bg-earth-50 px-5 py-3 text-sm font-black text-leaf-800 transition hover:bg-white">
                <BookOpen size={18} aria-hidden="true" />
                Read full compost lesson
              </Link>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
