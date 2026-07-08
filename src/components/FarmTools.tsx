"use client";

import { Bot, CalendarDays, Camera, Sprout, X } from "lucide-react";
import { useState } from "react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { CropDoctor } from "@/components/CropDoctor";

type ToolKey = "ask" | "doctor" | "calendar" | "planting";

const cropCalendar = [
  { crop: "Maize", window: "Major season planting", timing: "Mar-Jun", action: "Check rainfall before sowing." },
  { crop: "Tomato", window: "Nursery and transplanting", timing: "Dry season", action: "Use mulch and steady irrigation." },
  { crop: "Yam", window: "Mound preparation", timing: "Nov-Mar", action: "Prepare seed yam and staking material." }
];

const tools = [
  { key: "ask" as const, title: "Ask FarmMate", icon: Bot, emoji: "\uD83E\uDD16", description: "Ask any farming question.", action: "Open" },
  { key: "doctor" as const, title: "Crop Doctor", icon: Camera, emoji: "\uD83D\uDCF7", description: "Diagnose crop problems.", action: "Upload" },
  { key: "calendar" as const, title: "Crop Calendar", icon: CalendarDays, emoji: "\uD83D\uDCC5", description: "Plan your season.", action: "View Calendar" },
  { key: "planting" as const, title: "Planting Advisor", icon: Sprout, emoji: "\uD83C\uDF31", description: "Find the best time to plant.", action: "Start" }
];

function CropCalendarExperience() {
  return (
    <article id="crop-calendar" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:p-7">
      <CalendarDays className="text-[#2E7D32]" size={30} aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-black text-ink">{"\uD83D\uDCC5 Crop Calendar"}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Plan your season.</p>
      <div className="mt-5 grid gap-3">
        {cropCalendar.map((item) => (
          <div key={item.crop} className="rounded-md bg-[#FBFFE8] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-ink">{item.crop}</p>
              <p className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-[#2E7D32]">{item.timing}</p>
            </div>
            <p className="mt-2 text-sm font-bold text-ink/72">{item.window}</p>
            <p className="mt-1 text-sm leading-5 text-ink/58">{item.action}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PlantingAdvisorExperience() {
  return (
    <article id="planting-advisor" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:p-7">
      <Sprout className="text-[#2E7D32]" size={30} aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-black text-ink">{"\uD83C\uDF31 Planting Advisor"}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Find the best time to plant.</p>
      <div className="mt-5 grid gap-3">
        <label className="grid gap-2 text-sm font-black text-ink">
          Crop
          <select className="gg-field min-h-12">
            <option>Maize</option>
            <option>Tomato</option>
            <option>Yam</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black text-ink">
          Region
          <select className="gg-field min-h-12">
            <option>Ashanti</option>
            <option>Greater Accra</option>
            <option>Northern</option>
          </select>
        </label>
      </div>
      <div className="mt-4 rounded-md bg-[#2E7D32]/10 p-4">
        <p className="text-sm font-black text-[#2E7D32]">Demo advice</p>
        <p className="mt-1 text-sm leading-6 text-ink/68">Plant after two steady rains and avoid waterlogged soil.</p>
      </div>
    </article>
  );
}

export function FarmTools() {
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
  const [prefillQuestion, setPrefillQuestion] = useState("");
  const activeToolMeta = tools.find((tool) => tool.key === activeTool);

  function askFarmMateFromDoctor(question: string) {
    setPrefillQuestion(question);
    setActiveTool("ask");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-ink">{"\uD83C\uDF31 Farm Tools"}</h2>
        <p className="mt-2 text-sm font-semibold text-ink/58">Swipe to open the tool you need.</p>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              onClick={() => setActiveTool(tool.key)}
              className="flex min-h-56 min-w-[min(20rem,calc(100vw-2rem))] snap-start flex-col items-start rounded-lg border border-[#2E7D32]/10 bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-[#2E7D32]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32] sm:min-w-[calc((100%-1rem)/2)] lg:min-w-[calc((100%-2rem)/3)]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-md bg-[#2E7D32]/10 text-[#2E7D32]">
                <Icon size={30} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-2xl font-black text-ink">
                {tool.emoji} {tool.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">{tool.description}</p>
              <span className="mt-auto inline-flex min-h-11 items-center justify-center rounded-md bg-[#2E7D32] px-5 py-3 text-sm font-black text-white">
                {tool.action}
              </span>
            </button>
          );
        })}
      </div>

      {activeTool ? (
        <div className="fixed inset-0 z-50 bg-ink/35" role="dialog" aria-modal="true" aria-label={activeToolMeta?.title}>
          <div className="absolute inset-x-0 bottom-0 max-h-[94vh] overflow-hidden rounded-t-2xl bg-[#FBFFE8] shadow-2xl">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 border-b border-[#2E7D32]/10 px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2E7D32]">GG FarmMate</p>
                <h2 className="text-xl font-black text-ink">{activeToolMeta?.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="grid h-11 w-11 place-items-center rounded-md bg-white text-ink shadow-sm ring-1 ring-[#2E7D32]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
                aria-label="Close tool"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[calc(94vh-5rem)] overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto max-w-3xl">
                {activeTool === "ask" ? <AskFarmMate prefillQuestion={prefillQuestion} /> : null}
                {activeTool === "doctor" ? <CropDoctor onAskFarmMateAboutThis={askFarmMateFromDoctor} /> : null}
                {activeTool === "calendar" ? <CropCalendarExperience /> : null}
                {activeTool === "planting" ? <PlantingAdvisorExperience /> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
