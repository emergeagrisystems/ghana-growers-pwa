"use client";

import { Bot, CalendarDays, Camera, Sprout, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { CropDoctor } from "@/components/CropDoctor";
import type { CropDoctorHandoffContext } from "@/lib/farmmate/crop-doctor-vision";
import { findPlantingAdvisorGuidance, plantingAdvisorCrops } from "@/lib/farmmate/planting-advisor-specialist";

type ToolKey = "ask" | "doctor" | "calendar" | "planting";

const cropCalendar = [
  { crop: "Maize", window: "Major season planting", timing: "Mar-Jun", action: "Check rainfall before sowing." },
  { crop: "Tomato", window: "Nursery and transplanting", timing: "Dry season", action: "Use mulch and steady irrigation." },
  { crop: "Yam", window: "Mound preparation", timing: "Nov-Mar", action: "Prepare seed yam and staking material." }
];

const tools = [
  { key: "ask" as const, title: "Ask FarmMate", icon: Bot, description: "Ask any farming question.", action: "Ask" },
  { key: "doctor" as const, title: "Crop Doctor", icon: Camera, description: "Upload a crop photo for guided checks.", action: "Upload" },
  { key: "calendar" as const, title: "Crop Calendar", icon: CalendarDays, description: "Plan your season.", action: "View Calendar" },
  { key: "planting" as const, title: "Planting Advisor", icon: Sprout, description: "Find the best time to plant.", action: "Start" }
];

function CropCalendarExperience() {
  return (
    <article id="crop-calendar" className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <CalendarDays size={24} aria-hidden="true" />
      </span>
      <h2 className="mt-4 gg-card-title">Crop Calendar</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Plan your season.</p>
      <div className="mt-5 grid gap-3">
        {cropCalendar.map((item) => (
          <div key={item.crop} className="rounded-md bg-leaf-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-ink">{item.crop}</p>
              <p className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-leaf-700">{item.timing}</p>
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
  const [selectedCrop, setSelectedCrop] = useState("Maize");
  const selectedGuidance = findPlantingAdvisorGuidance(selectedCrop) ?? plantingAdvisorCrops.find((guidance) => guidance.crop === "Maize") ?? null;

  return (
    <article id="planting-advisor" className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <Sprout size={24} aria-hidden="true" />
      </span>
      <h2 className="mt-4 gg-card-title">Planting Advisor</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Find the best time to plant.</p>
      <div className="mt-5 grid gap-3">
        <label className="grid gap-2 text-sm font-black text-ink">
          Crop
          <select className="gg-field min-h-12" value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value)}>
            {plantingAdvisorCrops.map((guidance) => (
              <option key={guidance.crop}>{guidance.crop}</option>
            ))}
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
      <div className="mt-4 rounded-md bg-leaf-50 p-4">
        <p className="text-sm font-black text-leaf-700">Planting guidance</p>
        <p className="mt-1 text-sm leading-6 text-ink/68">
          {selectedGuidance
            ? `${selectedGuidance.suitablePlantingConditions[0]} ${selectedGuidance.whenToDelayPlanting[0]}`
            : "Choose a crop and check soil moisture, drainage and planting material before planting."}
        </p>
      </div>
    </article>
  );
}

export function FarmTools() {
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [prefillQuestion, setPrefillQuestion] = useState("");
  const [cropDoctorHandoff, setCropDoctorHandoff] = useState<CropDoctorHandoffContext | null>(null);
  const activeToolMeta = tools.find((tool) => tool.key === activeTool);
  const sheetBackground =
    activeTool === "ask" ? "bg-gradient-to-b from-white via-earth-50 to-leaf-50" : "bg-earth-50";

  function openTool(tool: ToolKey) {
    setIsClosing(false);
    setActiveTool(tool);
  }

  useEffect(() => {
    const tool = searchParams.get("tool");

    if (tool === "ask" || tool === "doctor" || tool === "calendar" || tool === "planting") {
      openTool(tool);
    }
  }, [searchParams]);

  useEffect(() => {
    function handleOpenTool(event: Event) {
      const tool = (event as CustomEvent<ToolKey>).detail;

      if (["ask", "doctor", "calendar", "planting"].includes(tool)) {
        openTool(tool);
      }
    }

    window.addEventListener("gg-farmmate-open-tool", handleOpenTool);

    return () => {
      window.removeEventListener("gg-farmmate-open-tool", handleOpenTool);
    };
  }, []);

  function closeTool() {
    setIsClosing(true);
    window.setTimeout(() => {
      setActiveTool(null);
      setIsClosing(false);
    }, 180);
  }

  function askFarmMateFromDoctor(handoff: CropDoctorHandoffContext | string) {
    if (typeof handoff === "string") {
      setPrefillQuestion(handoff);
      setCropDoctorHandoff(null);
      openTool("ask");
      return;
    }

    setPrefillQuestion(handoff.question);
    setCropDoctorHandoff(handoff);
    openTool("ask");
  }

  function openCropDoctorFromAsk() {
    openTool("doctor");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h2 className="gg-section-title">Choose a farm tool</h2>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              onClick={() => openTool(tool.key)}
              className="flex min-h-60 min-w-[82vw] snap-start flex-col items-start rounded-md border border-leaf-900/10 bg-white p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-leaf-700/25 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:min-w-[44vw] md:min-w-0"
            >
              <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-6 gg-card-title">{tool.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">{tool.description}</p>
              <span className="mt-auto inline-flex min-h-12 items-center justify-center rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900">
                {tool.action}
              </span>
            </button>
          );
        })}
      </div>

      {activeTool ? (
        <div
          className={`fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] ${isClosing ? "animate-[farmFadeOut_180ms_ease-in_forwards]" : "animate-[farmFadeIn_180ms_ease-out]"}`}
          role="dialog"
          aria-modal="true"
          aria-label={activeToolMeta?.title}
        >
          <div className={`absolute inset-x-0 bottom-0 max-h-[94vh] overflow-hidden rounded-t-xl ${sheetBackground} shadow-2xl ${isClosing ? "animate-[farmSheetOut_180ms_ease-in_forwards]" : "animate-[farmSheetIn_240ms_cubic-bezier(0.2,0.8,0.2,1)]"}`}>
            <div className="mx-auto h-1.5 w-12 rounded-full bg-ink/12 mt-3" aria-hidden="true" />
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 border-b border-leaf-900/10 px-4 py-4 sm:px-6">
              <div>
                <p className="gg-eyebrow text-leaf-700">GG FarmMate</p>
                <h2 className="text-xl font-black text-ink">{activeToolMeta?.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeTool}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                aria-label="Close tool"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[calc(94vh-5rem)] overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mx-auto max-w-2xl">
                {activeTool === "ask" ? <AskFarmMate prefillQuestion={prefillQuestion} cropDoctorHandoff={cropDoctorHandoff} onOpenCropDoctor={openCropDoctorFromAsk} /> : null}
                {activeTool === "doctor" ? <CropDoctor onAskFarmMateAboutThis={askFarmMateFromDoctor} /> : null}
                {activeTool === "calendar" ? <CropCalendarExperience /> : null}
                {activeTool === "planting" ? <PlantingAdvisorExperience /> : null}
              </div>
            </div>
          </div>
          <style jsx global>{`
            @keyframes farmSheetIn {
              from {
                transform: translateY(18%);
                opacity: 0.96;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }

            @keyframes farmSheetOut {
              from {
                transform: translateY(0);
                opacity: 1;
              }
              to {
                transform: translateY(12%);
                opacity: 0;
              }
            }

            @keyframes farmFadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes farmFadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ) : null}
    </section>
  );
}
