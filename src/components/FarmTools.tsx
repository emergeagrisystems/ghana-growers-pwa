"use client";

import { Bot, CalendarDays, Camera, Sprout, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { CropDoctor } from "@/components/CropDoctor";
import {
  cropCalendarFarmMateQuestion,
  cropCalendarGuides,
  cropCalendarSeasonOptions,
  farmMatePilotRegions,
  findCropCalendarGuide
} from "@/lib/farmmate/crop-calendar";
import type { CropDoctorHandoffContext } from "@/lib/farmmate/crop-doctor-vision";
import {
  findPlantingAdvisorGuidance,
  plantingAdvisorCrops,
  plantingAdvisorFarmMateQuestion
} from "@/lib/farmmate/planting-advisor-specialist";

type ToolKey = "ask" | "doctor" | "calendar" | "planting";

const tools = [
  { key: "ask" as const, title: "Ask FarmMate", icon: Bot, description: "Ask any farming question.", action: "Ask" },
  { key: "doctor" as const, title: "Crop Doctor", icon: Camera, description: "Upload a crop photo for guided checks.", action: "Upload" },
  { key: "calendar" as const, title: "Crop Calendar", icon: CalendarDays, description: "Plan your season.", action: "View Calendar" },
  { key: "planting" as const, title: "Planting Advisor", icon: Sprout, description: "Find the best time to plant.", action: "Start" }
];

function GuidanceItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-leaf-900/10 bg-white p-3.5">
      <dt className="text-xs font-black uppercase tracking-[0.1em] text-leaf-700">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold leading-6 text-ink/70">{children}</dd>
    </div>
  );
}

function CropCalendarExperience({ onAskFarmMateAboutThis }: { onAskFarmMateAboutThis: (question: string) => void }) {
  const [selectedCrop, setSelectedCrop] = useState("Maize");
  const [selectedRegion, setSelectedRegion] = useState("Ashanti");
  const [selectedSeason, setSelectedSeason] = useState("");
  const selectedGuide = findCropCalendarGuide(selectedCrop) ?? cropCalendarGuides[0];

  return (
    <article id="crop-calendar" className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <CalendarDays size={24} aria-hidden="true" />
      </span>
      <h2 className="mt-4 gg-card-title">Crop Calendar</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Choose a crop and region to see a practical stage-by-stage guide.</p>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Select crop
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value)}>
            {cropCalendarGuides.map((guide) => (
              <option key={guide.crop}>{guide.crop}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Select region
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
            {farmMatePilotRegions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">
          Planting month or season <span className="font-semibold text-ink/50">(optional)</span>
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedSeason} onChange={(event) => setSelectedSeason(event.target.value)}>
            <option value="">Not sure yet</option>
            {cropCalendarSeasonOptions.map((season) => (
              <option key={season}>{season}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-leaf-700">Typical guide</p>
            <h3 className="mt-1 break-words text-lg font-black text-ink">{selectedGuide.crop} in {selectedRegion}</h3>
          </div>
          {selectedSeason ? <span className="max-w-full rounded-md bg-white px-3 py-1.5 text-xs font-black text-leaf-700">{selectedSeason}</span> : null}
        </div>
        <p className="mt-3 break-words text-sm font-semibold leading-6 text-ink/68">{selectedGuide.seasonNote}</p>

        <ol className="mt-5 grid min-w-0 gap-3" aria-label={`${selectedGuide.crop} crop timeline`}>
          {selectedGuide.stages.map((item) => (
            <li key={`${item.timing}-${item.stage}`} className="min-w-0 rounded-md border border-leaf-900/10 bg-white p-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-md bg-earth-50 px-2.5 py-1 text-xs font-black text-earth-700">{item.timing}</span>
                <h4 className="break-words text-sm font-black text-ink">{item.stage}</h4>
              </div>
              <p className="mt-2 break-words text-sm font-semibold leading-6 text-ink/66">{item.guidance}</p>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-xs font-bold leading-5 text-ink/58">
          Typical guide. Adjust based on rainfall, soil condition, crop growth and local extension guidance. This is not a guaranteed planting or harvest date.
        </p>
        <button
          type="button"
          onClick={() => onAskFarmMateAboutThis(cropCalendarFarmMateQuestion(selectedGuide.crop, selectedRegion))}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
        >
          Ask FarmMate about this
        </button>
      </section>
    </article>
  );
}

function PlantingAdvisorExperience({ onAskFarmMateAboutThis }: { onAskFarmMateAboutThis: (question: string) => void }) {
  const [selectedCrop, setSelectedCrop] = useState("Maize");
  const [selectedRegion, setSelectedRegion] = useState("Ashanti");
  const selectedGuidance = findPlantingAdvisorGuidance(selectedCrop) ?? plantingAdvisorCrops.find((guidance) => guidance.crop === "Maize") ?? null;

  return (
    <article id="planting-advisor" className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <Sprout size={24} aria-hidden="true" />
      </span>
      <h2 className="mt-4 gg-card-title">Planting Advisor</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Find the best time to plant.</p>
      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Crop
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value)}>
            {plantingAdvisorCrops.map((guidance) => (
              <option key={guidance.crop}>{guidance.crop}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Region
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
            {farmMatePilotRegions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedGuidance ? (
        <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-leaf-700">Typical guide</p>
          <h3 className="mt-1 break-words text-lg font-black text-ink">{selectedGuidance.crop} in {selectedRegion}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">Local timing can vary by district and current field conditions.</p>

          <dl className="mt-4 grid min-w-0 gap-3">
            <GuidanceItem label="Crop">{selectedGuidance.crop}</GuidanceItem>
            <GuidanceItem label="Region">{selectedRegion}</GuidanceItem>
            <GuidanceItem label="Planting suitability">{selectedGuidance.suitablePlantingConditions[0]}</GuidanceItem>
            <GuidanceItem label="Best planting period or season note">{selectedGuidance.plantingSeasonNotes[0]}</GuidanceItem>
            <GuidanceItem label="Spacing guidance">{selectedGuidance.spacingGuidance[0]}</GuidanceItem>
            <GuidanceItem label="Soil preparation">{selectedGuidance.soilPreparation[0]}</GuidanceItem>
            <GuidanceItem label="Water/rain condition">{selectedGuidance.waterRainfallNeeds[0]}</GuidanceItem>
            <GuidanceItem label="What to avoid">{selectedGuidance.whenToDelayPlanting[0]}</GuidanceItem>
            <GuidanceItem label="Next step">{selectedGuidance.nextBestAction}</GuidanceItem>
          </dl>

          <p className="mt-4 text-xs font-bold leading-5 text-ink/58">Adjust based on rainfall, soil condition and local extension guidance. Yield and timing are not guaranteed.</p>
          <button
            type="button"
            onClick={() => onAskFarmMateAboutThis(plantingAdvisorFarmMateQuestion(selectedGuidance.crop, selectedRegion))}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
          >
            Ask FarmMate about this
          </button>
        </section>
      ) : null}
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

  function openAskFarmMateWithQuestion(question: string) {
    setPrefillQuestion(question);
    setCropDoctorHandoff(null);
    openTool("ask");
  }

  function askFarmMateFromDoctor(handoff: CropDoctorHandoffContext | string) {
    if (typeof handoff === "string") {
      openAskFarmMateWithQuestion(handoff);
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
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="gg-section-title">Choose a farm tool</h2>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              onClick={() => openTool(tool.key)}
              className="flex min-h-48 min-w-[82vw] snap-start flex-col items-start rounded-md border border-leaf-900/10 bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-leaf-700/25 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:min-w-[44vw] md:min-w-0"
            >
              <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 gg-card-title">{tool.title}</h3>
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

            <div className="max-h-[calc(94vh-5rem)] overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mx-auto min-w-0 max-w-2xl">
                {activeTool === "ask" ? <AskFarmMate prefillQuestion={prefillQuestion} cropDoctorHandoff={cropDoctorHandoff} onOpenCropDoctor={openCropDoctorFromAsk} /> : null}
                {activeTool === "doctor" ? <CropDoctor onAskFarmMateAboutThis={askFarmMateFromDoctor} /> : null}
                {activeTool === "calendar" ? <CropCalendarExperience onAskFarmMateAboutThis={openAskFarmMateWithQuestion} /> : null}
                {activeTool === "planting" ? <PlantingAdvisorExperience onAskFarmMateAboutThis={openAskFarmMateWithQuestion} /> : null}
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
