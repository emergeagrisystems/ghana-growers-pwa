"use client";

import { Bot, CalendarDays, Camera, Sprout, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { CropDoctor } from "@/components/CropDoctor";
import {
  cropCalendarGuides,
  farmMatePilotRegions,
  findCropCalendarGuide
} from "@/lib/farmmate/crop-calendar";
import type { CropDoctorHandoffContext } from "@/lib/farmmate/crop-doctor-vision";
import { cropCalendarPosition, matchingWeatherForRegion, plantingReadiness, type PlantingFieldState } from "@/lib/farmmate/experience-decisions";
import { farmMateRegions } from "@/lib/farmmate/regions";
import { FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY, type WeatherDecisionSummary } from "@/lib/farmmate/weather";
import {
  findPlantingAdvisorGuidance,
  plantingAdvisorCrops
} from "@/lib/farmmate/planting-advisor-specialist";

type ToolKey = "ask" | "doctor" | "calendar" | "planting";

const tools = [
  { key: "ask" as const, title: "Ask Mama G", icon: Bot, description: "Ask any farming question.", action: "Ask" },
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
  const [plantingState, setPlantingState] = useState<"yes" | "not-yet" | "unknown">("yes");
  const [plantingDate, setPlantingDate] = useState("");
  const [observedStage, setObservedStage] = useState("");
  const selectedGuide = findCropCalendarGuide(selectedCrop) ?? cropCalendarGuides[0];
  const position = plantingState === "yes" ? cropCalendarPosition(selectedGuide, plantingDate) : null;
  const observedStageIndex = selectedGuide.stages.findIndex((stage) => stage.stage === observedStage);
  const currentStage = position?.current ?? (observedStageIndex >= 0 ? selectedGuide.stages[observedStageIndex] : null);
  const nextStage = position?.next ?? (observedStageIndex >= 0 ? selectedGuide.stages[observedStageIndex + 1] : undefined);
  const regionNote = farmMateRegions.find((region) => region.name === selectedRegion);
  const currentTask = currentStage?.guidance ?? (plantingState === "not-yet" ? selectedGuide.seasonNote : "Check the crop's visible growth stage in the field before using a dated stage.");
  const stageLabel = position ? `${position.current.stage} · about week ${position.week}` : currentStage?.stage ?? (plantingState === "not-yet" ? "Before planting" : "Stage not confirmed");

  return (
    <article id="crop-calendar" className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <CalendarDays size={24} aria-hidden="true" />
      </span>
      <h2 className="sr-only">Crop Calendar</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Find the current task from your planting date, or plan before planting.</p>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Select crop
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => { setSelectedCrop(event.target.value); setObservedStage(""); }}>
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
          Have you already planted?
          <select className="gg-field min-h-12 w-full max-w-full" value={plantingState} onChange={(event) => setPlantingState(event.target.value as typeof plantingState)}>
            <option value="yes">Yes</option>
            <option value="not-yet">Not yet</option>
            <option value="unknown">Not sure of the exact date</option>
          </select>
        </label>
        {plantingState === "yes" ? <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">
          Planting date, if known
          <input type="date" className="gg-field min-h-12 w-full max-w-full" value={plantingDate} onChange={(event) => setPlantingDate(event.target.value)} />
        </label> : null}
        {plantingState !== "not-yet" && !position ? <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">If the date is unknown, what stage can you see?
          <select className="gg-field min-h-12" value={observedStage} onChange={(event) => setObservedStage(event.target.value)}><option value="">Not sure</option>{selectedGuide.stages.map((stage) => <option key={stage.stage} value={stage.stage}>{stage.stage}</option>)}</select>
        </label> : null}
      </div>

      <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-leaf-700">Current stage · {selectedGuide.crop}</p>
        <h3 className="mt-1 break-words text-lg font-black text-ink">{stageLabel}</h3>
        <p className="mt-3 text-sm font-black text-ink">What to do now</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{currentTask}</p>
        <p className="mt-3 text-sm font-black text-ink">Next important action</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{nextStage ? `${nextStage.timing}: ${nextStage.guidance}` : plantingState === "not-yet" ? "Check soil moisture, drainage and planting readiness before choosing a date." : "Confirm the visible stage of the crop; the date alone cannot prove its growth stage."}</p>
        <p className="mt-3 text-xs font-semibold leading-5 text-ink/62">{regionNote ? `${selectedRegion}: ${regionNote.advisoryNotes[0]}` : `No approved district-specific calendar for ${selectedRegion}; check local conditions with an extension officer.`}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-ink/58">Stages are approximate. Check the plant itself; weather and variety can shift timing.</p>
        <details className="mt-4 rounded-md bg-white p-3">
          <summary className="cursor-pointer text-sm font-black text-leaf-700">View full crop timeline</summary>
          <ol className="mt-3 grid min-w-0 gap-3" aria-label={`${selectedGuide.crop} crop timeline`}>
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
        </details>
        <button
          type="button"
          onClick={() => onAskFarmMateAboutThis(`I am growing ${selectedGuide.crop} in ${selectedRegion}. ${position ? `I planted on ${plantingDate}; the calendar estimates week ${position.week}, ${position.current.stage}.` : plantingState === "not-yet" ? "I have not planted yet." : `The planting date is unknown; observed stage: ${currentStage?.stage ?? "not sure"}.`} The current task is: ${currentTask} What should I check and do next?`)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
        >
          Ask Mama G about this stage
        </button>
      </section>
    </article>
  );
}

function PlantingAdvisorExperience({ onAskFarmMateAboutThis }: { onAskFarmMateAboutThis: (question: string) => void }) {
  const [selectedCrop, setSelectedCrop] = useState("Maize");
  const [selectedRegion, setSelectedRegion] = useState("Ashanti");
  const [field, setField] = useState<PlantingFieldState>({ planningNow: "yes", irrigation: "unknown", moisture: "unknown", prepared: "partly" });
  const [weather, setWeather] = useState<WeatherDecisionSummary | null>(null);
  const selectedGuidance = findPlantingAdvisorGuidance(selectedCrop) ?? plantingAdvisorCrops.find((guidance) => guidance.crop === "Maize") ?? null;
  const weatherForRegion = matchingWeatherForRegion(weather, selectedRegion);
  const decision = plantingReadiness(field, weatherForRegion);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
      const parsed = value ? JSON.parse(value) as WeatherDecisionSummary : null;
      const age = Date.now() - Date.parse(parsed?.lastUpdatedAt ?? "");
      setWeather(parsed?.liveWeatherAvailable && age >= 0 && age <= 24 * 60 * 60 * 1000 ? parsed : null);
    } catch { setWeather(null); }
  }, []);

  return (
    <article id="planting-advisor" className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <Sprout size={24} aria-hidden="true" />
      </span>
      <h2 className="sr-only">Planting Advisor</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Check your field before deciding whether to plant.</p>
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-ink">Planning to plant now?
          <select className="gg-field min-h-12" value={field.planningNow} onChange={(event) => setField({ ...field, planningNow: event.target.value as PlantingFieldState["planningNow"] })}><option value="yes">Yes</option><option value="later">Not yet</option></select>
        </label>
        <label className="grid gap-2 text-sm font-black text-ink">Reliable irrigation?
          <select className="gg-field min-h-12" value={field.irrigation} onChange={(event) => setField({ ...field, irrigation: event.target.value as PlantingFieldState["irrigation"] })}><option value="unknown">Not sure</option><option value="yes">Yes</option><option value="no">No</option></select>
        </label>
        <label className="grid gap-2 text-sm font-black text-ink">Field soil now
          <select className="gg-field min-h-12" value={field.moisture} onChange={(event) => setField({ ...field, moisture: event.target.value as PlantingFieldState["moisture"] })}><option value="unknown">Not sure</option><option value="moist">Moist</option><option value="dry">Dry</option><option value="waterlogged">Waterlogged</option></select>
        </label>
        <label className="grid gap-2 text-sm font-black text-ink">Land preparation
          <select className="gg-field min-h-12" value={field.prepared} onChange={(event) => setField({ ...field, prepared: event.target.value as PlantingFieldState["prepared"] })}><option value="partly">Partly ready</option><option value="ready">Ready</option><option value="not-yet">Not yet</option></select>
        </label>
      </div>

      {selectedGuidance ? (
        <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-leaf-700">Planting readiness · {selectedGuidance.crop} · {selectedRegion}</p>
          <h3 className="mt-1 break-words text-lg font-black text-ink">{decision.status}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/70">{decision.why}</p>
          <p className="mt-3 text-sm font-black text-ink">What to check</p><p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{decision.check}</p>
          <p className="mt-3 text-sm font-black text-ink">Next step</p><p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{decision.next}</p>
          <p className="mt-3 text-xs font-semibold leading-5 text-ink/60">{weatherForRegion ? `Forecast context: ${weatherForRegion.locationName}, ${weatherForRegion.rainChancePercent ?? "unknown"}% rain chance. It does not measure your field.` : "No matching live regional forecast is available. Check local conditions."}</p>
          <details className="mt-4 rounded-md bg-white p-3"><summary className="cursor-pointer text-sm font-black text-leaf-700">More planting details</summary>
            <dl className="mt-3 grid gap-3"><GuidanceItem label="Season">{selectedGuidance.plantingSeasonNotes[0]}</GuidanceItem><GuidanceItem label="Soil preparation">{selectedGuidance.soilPreparation[0]}</GuidanceItem><GuidanceItem label="Water">{selectedGuidance.waterRainfallNeeds[0]}</GuidanceItem><GuidanceItem label="Spacing — verify locally">{selectedGuidance.spacingGuidance[0]}</GuidanceItem></dl>
          </details>
          <p className="mt-3 text-xs font-bold leading-5 text-ink/58">Exact timing and spacing need local agronomic review. Yield is not guaranteed.</p>
          <button
            type="button"
            onClick={() => onAskFarmMateAboutThis(`I am considering planting ${selectedGuidance.crop} in ${selectedRegion}. I am ${field.planningNow === "yes" ? "planning to plant now" : "planning ahead"}. My field is ${field.moisture}; land is ${field.prepared}; irrigation is ${field.irrigation}. The Planting Advisor says ${decision.status.toLowerCase()}: ${decision.why} What should I check and do next?`)}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
          >
            Ask Mama G about this
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
  const [doctorPrefillCrop, setDoctorPrefillCrop] = useState("");
  const activeToolMeta = tools.find((tool) => tool.key === activeTool);
  const sheetBackground =
    activeTool === "ask" ? "bg-gradient-to-b from-white via-earth-50 to-leaf-50" : "bg-earth-50";

  function openTool(tool: ToolKey, fromHandoff = false) {
    if (tool === "ask" && !fromHandoff) {
      setPrefillQuestion("");
      setCropDoctorHandoff(null);
    }
    if (tool === "doctor" && !fromHandoff) setDoctorPrefillCrop("");
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
    function handleAskContext(event: Event) {
      const question = (event as CustomEvent<string>).detail;
      if (typeof question === "string" && question.trim()) {
        setPrefillQuestion(question);
        setCropDoctorHandoff(null);
        setIsClosing(false);
        setActiveTool("ask");
      }
    }
    window.addEventListener("gg-farmmate-open-ask-with-context", handleAskContext);

    return () => {
      window.removeEventListener("gg-farmmate-open-tool", handleOpenTool);
      window.removeEventListener("gg-farmmate-open-ask-with-context", handleAskContext);
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
    openTool("ask", true);
  }

  function askFarmMateFromDoctor(handoff: CropDoctorHandoffContext | string) {
    if (typeof handoff === "string") {
      openAskFarmMateWithQuestion(handoff);
      return;
    }

    setPrefillQuestion(handoff.question);
    setCropDoctorHandoff(handoff);
    openTool("ask", true);
  }

  function openCropDoctorFromAsk(crop?: string) {
    setDoctorPrefillCrop(crop ?? "");
    openTool("doctor", true);
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
              <span data-mama-brand={tool.key === "ask" ? "ask-icon" : undefined} className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-5 gg-card-title">{tool.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">{tool.description}</p>
              <span data-mama-brand={tool.key === "ask" ? "ask-card-action" : undefined} className="mt-auto inline-flex min-h-12 items-center justify-center rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900">
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
                <p className="gg-eyebrow text-leaf-700">Ask Mama G</p>
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
                {activeTool === "doctor" ? <CropDoctor prefillCrop={doctorPrefillCrop} onAskFarmMateAboutThis={askFarmMateFromDoctor} /> : null}
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
