"use client";

import { CalendarDays, Camera, CloudSun, Sprout, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { CropDoctor } from "@/components/CropDoctor";
import { CanIFarmTodayExperience } from "@/components/FarmMateWeatherFoundation";
import {
  cropCalendarGuides,
  farmMatePilotRegions,
  findCropCalendarGuide
} from "@/lib/farmmate/crop-calendar";
import type { CropDoctorHandoffContext } from "@/lib/farmmate/crop-doctor-vision";
import type { FarmMateToolHandoff } from "@/lib/farmmate/tool-handoff";
import { cropCalendarPosition, matchingWeatherForRegion, plantingReadiness, type FarmTaskChecks, type PlantingFieldState } from "@/lib/farmmate/experience-decisions";
import { FarmMateDecisionStatus, type FarmMateDecisionStatusValue } from "@/components/FarmMateDecisionStatus";
import { FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY, FARM_MATE_WEATHER_LOCATION_STORAGE_KEY, supportedFarmMateWeatherLocations, type WeatherDecisionSummary } from "@/lib/farmmate/weather";
import {
  findPlantingAdvisorGuidance,
  plantingAdvisorCrops
} from "@/lib/farmmate/planting-advisor-specialist";

type ToolKey = "ask" | "doctor" | "calendar" | "planting" | "weather";

const tools = [
  { key: "doctor" as const, title: "Crop Doctor", icon: Camera, description: "Check a crop problem" },
  { key: "calendar" as const, title: "Crop Calendar", icon: CalendarDays, description: "What should I do now?" },
  { key: "planting" as const, title: "Planting Advisor", icon: Sprout, description: "Am I ready to plant?" },
  { key: "weather" as const, title: "Can I Farm Today?", icon: CloudSun, description: "Check today's farm conditions" }
];

function GuidanceItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-leaf-900/10 bg-white p-3.5">
      <dt className="text-xs font-black uppercase tracking-[0.1em] text-leaf-700">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold leading-6 text-ink/70">{children}</dd>
    </div>
  );
}

function CropCalendarExperience({ onAskFarmMateAboutThis, knownCrop, knownRegion, onContextChange }: {
  onAskFarmMateAboutThis: (handoff: FarmMateToolHandoff) => void;
  knownCrop: string;
  knownRegion: string;
  onContextChange: (crop: string, region: string) => void;
}) {
  const [selectedCrop, setSelectedCrop] = useState(knownCrop);
  const [selectedRegion, setSelectedRegion] = useState(knownRegion);
  const [plantingState, setPlantingState] = useState<"unselected" | "yes" | "not-yet" | "unknown">("unselected");
  const [plantingDate, setPlantingDate] = useState("");
  const [observedStage, setObservedStage] = useState("");
  const selectedGuide = findCropCalendarGuide(selectedCrop) ?? cropCalendarGuides[0];
  const position = plantingState === "yes" ? cropCalendarPosition(selectedGuide, plantingDate) : null;
  const observedStageIndex = selectedGuide.stages.findIndex((stage) => stage.stage === observedStage);
  const currentStage = position?.current ?? (observedStageIndex >= 0 ? selectedGuide.stages[observedStageIndex] : null);
  const nextStage = position?.next ?? (observedStageIndex >= 0 ? selectedGuide.stages[observedStageIndex + 1] : undefined);
  const currentTask = !selectedCrop ? "Choose a crop first." : currentStage?.guidance ?? (plantingState === "not-yet" ? selectedGuide.seasonNote : plantingState === "unselected" ? "First say whether this crop has been planted." : "Check the crop's visible growth stage in the field before using a dated stage.");
  const stageLabel = !selectedCrop ? "Crop not selected" : position ? `${position.current.stage} · about week ${position.week}` : currentStage?.stage ?? (plantingState === "not-yet" ? "Before planting" : plantingState === "unselected" ? "Not enough information" : "Stage not confirmed");

  useEffect(() => { setSelectedRegion(knownRegion); }, [knownRegion]);
  useEffect(() => { setSelectedCrop(knownCrop); }, [knownCrop]);

  return (
    <article id="crop-calendar" className="min-w-0 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
      <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
        <CalendarDays size={24} aria-hidden="true" />
      </span>
      <h2 className="sr-only">Crop Calendar</h2>
      <p className="mt-2 text-sm leading-6 text-ink/66">Find the current task from your planting date, or plan before planting.</p>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">
          Have you planted this crop?
          <select className="gg-field min-h-12 w-full max-w-full" value={plantingState} onChange={(event) => setPlantingState(event.target.value as typeof plantingState)}>
            <option value="unselected">Choose one</option>
            <option value="yes">Yes, I know the date</option>
            <option value="unknown">Yes, but I do not know the date</option>
            <option value="not-yet">Not yet</option>
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Select crop
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => { setSelectedCrop(event.target.value); setObservedStage(""); onContextChange(event.target.value, selectedRegion); }}>
            <option value="">Choose crop</option>
            {cropCalendarGuides.map((guide) => (
              <option key={guide.crop}>{guide.crop}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Select region
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedRegion} onChange={(event) => { setSelectedRegion(event.target.value); onContextChange(selectedCrop, event.target.value); }}>
            <option value="">Choose region</option>
            {farmMatePilotRegions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </label>
        {plantingState === "yes" ? <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">
          Planting date, if known
          <input type="date" className="gg-field min-h-12 w-full max-w-full" value={plantingDate} onChange={(event) => setPlantingDate(event.target.value)} />
        </label> : null}
        {plantingState !== "not-yet" && plantingState !== "unselected" && !position ? <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">If the date is unknown, what stage can you see?
          <select className="gg-field min-h-12" value={observedStage} onChange={(event) => setObservedStage(event.target.value)}><option value="">Not sure</option>{selectedGuide.stages.map((stage) => <option key={stage.stage} value={stage.stage}>{stage.stage}</option>)}</select>
        </label> : null}
      </div>

      <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-leaf-700">Current stage{selectedCrop ? ` · ${selectedGuide.crop}` : ""}</p>
        <h3 className="mt-1 break-words text-lg font-black text-ink">{stageLabel}</h3>
        <p className="mt-3 text-sm font-black text-ink">What to do now</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{currentTask}</p>
        <p className="mt-3 text-sm font-black text-ink">Coming next</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{!selectedCrop ? "Choose the crop to view its approximate stages." : nextStage ? `${nextStage.timing}: ${nextStage.guidance}` : plantingState === "not-yet" ? "Check soil moisture, drainage and planting readiness before choosing a date." : "Confirm the visible stage of the crop; the date alone cannot prove its growth stage."}</p>
        <p className="mt-3 text-xs font-semibold leading-5 text-ink/62">{selectedRegion ? `${selectedRegion} is context only; this timeline is approximate, not a region-specific planting window.` : "This timeline is approximate, not a region-specific planting window."}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-ink/58">Stages are approximate. Check the plant itself; weather and variety can shift timing.</p>
        {selectedCrop ? <details className="mt-4 rounded-md bg-white p-3">
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
        </details> : null}
        <button
          type="button"
          disabled={!selectedCrop || plantingState === "unselected"}
          onClick={() => onAskFarmMateAboutThis({
            source: "calendar",
            question: `What should I do now for ${selectedGuide.crop}?`,
            chips: [selectedGuide.crop, selectedRegion || "Region not selected", stageLabel],
            crop: selectedGuide.crop,
            region: selectedRegion || undefined,
            stage: stageLabel,
            task: currentTask,
            fieldNotes: [plantingState === "yes" && position ? `Planting date: ${plantingDate}; approximate week ${position.week}.` : plantingState === "not-yet" ? "Not planted yet." : `Planting date unknown; observed stage: ${currentStage?.stage ?? "unconfirmed"}.`, `Calendar task: ${currentTask}`]
          })}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
        >
          Ask Mama G about this stage
        </button>
      </section>
    </article>
  );
}

function PlantingAdvisorExperience({ onAskFarmMateAboutThis, knownCrop, knownRegion, onContextChange, initialChecks }: {
  onAskFarmMateAboutThis: (handoff: FarmMateToolHandoff) => void;
  knownCrop: string;
  knownRegion: string;
  onContextChange: (crop: string, region: string) => void;
  initialChecks?: FarmTaskChecks | null;
}) {
  const [selectedCrop, setSelectedCrop] = useState(knownCrop);
  const [selectedRegion, setSelectedRegion] = useState(knownRegion);
  const [field, setField] = useState<PlantingFieldState>({ planningNow: "yes", irrigation: "unknown", moisture: "unknown", drainage: "unknown", prepared: "unknown" });
  const [weather, setWeather] = useState<WeatherDecisionSummary | null>(null);
  const selectedGuidance = findPlantingAdvisorGuidance(selectedCrop) ?? null;
  const weatherForRegion = matchingWeatherForRegion(weather, selectedRegion);
  const decision = plantingReadiness(field, weatherForRegion);

  useEffect(() => { setSelectedRegion(knownRegion); }, [knownRegion]);
  useEffect(() => { setSelectedCrop(knownCrop); }, [knownCrop]);
  useEffect(() => {
    if (!initialChecks) return;
    setField((current) => ({
      ...current,
      moisture: initialChecks.soil === "dry" || initialChecks.soil === "moist" || initialChecks.soil === "waterlogged" ? initialChecks.soil : current.moisture,
      drainage: initialChecks.drainage === "good" || initialChecks.drainage === "poor" ? initialChecks.drainage : current.drainage
    }));
  }, [initialChecks]);

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
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => { setSelectedCrop(event.target.value); onContextChange(event.target.value, selectedRegion); }}>
            <option value="">Choose crop</option>
            {plantingAdvisorCrops.map((guidance) => (
              <option key={guidance.crop}>{guidance.crop}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-black text-ink">
          Region
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedRegion} onChange={(event) => { setSelectedRegion(event.target.value); onContextChange(selectedCrop, event.target.value); }}>
            <option value="">Choose region</option>
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
        <label className="grid gap-2 text-sm font-black text-ink">Field drainage
          <select className="gg-field min-h-12" value={field.drainage} onChange={(event) => setField({ ...field, drainage: event.target.value as PlantingFieldState["drainage"] })}><option value="unknown">Not sure</option><option value="good">Drains well</option><option value="poor">Drains poorly</option></select>
        </label>
        <label className="grid gap-2 text-sm font-black text-ink">Land preparation
          <select className="gg-field min-h-12" value={field.prepared} onChange={(event) => setField({ ...field, prepared: event.target.value as PlantingFieldState["prepared"] })}><option value="unknown">Not sure</option><option value="partly">Partly ready</option><option value="ready">Ready</option><option value="not-yet">Not yet</option></select>
        </label>
      </div>

      {selectedGuidance ? (
        <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-leaf-700">Planting readiness · {selectedGuidance.crop}{selectedRegion ? ` · ${selectedRegion}` : ""}</p>
          <div className="mt-2"><FarmMateDecisionStatus status={decision.status as FarmMateDecisionStatusValue} /></div>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/70">{decision.why}</p>
          <p className="mt-3 text-sm font-black text-ink">Check first</p><p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{decision.check}</p>
          <p className="mt-3 text-sm font-black text-ink">Next step</p><p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{decision.next}</p>
          <p className="mt-3 text-xs font-semibold leading-5 text-ink/60">{weatherForRegion ? `Forecast context: ${weatherForRegion.locationName}, ${weatherForRegion.rainChancePercent ?? "unknown"}% rain chance. It does not measure your field.` : "No matching live regional forecast is available. Check local conditions."}</p>
          <details className="mt-4 rounded-md bg-white p-3"><summary className="cursor-pointer text-sm font-black text-leaf-700">More planting details</summary>
            <dl className="mt-3 grid gap-3"><GuidanceItem label="Season">{selectedGuidance.plantingSeasonNotes[0]}</GuidanceItem><GuidanceItem label="Soil preparation">{selectedGuidance.soilPreparation[0]}</GuidanceItem><GuidanceItem label="Water">{selectedGuidance.waterRainfallNeeds[0]}</GuidanceItem><GuidanceItem label="Spacing — verify locally">{selectedGuidance.spacingGuidance[0]}</GuidanceItem></dl>
          </details>
          <p className="mt-3 text-xs font-bold leading-5 text-ink/58">Exact timing and spacing need local agronomic review. Yield is not guaranteed.</p>
          <button
            type="button"
            onClick={() => onAskFarmMateAboutThis({
              source: "planting",
              question: `Am I ready to plant ${selectedGuidance.crop}?`,
              chips: [selectedGuidance.crop, selectedRegion || "Region not selected", decision.status],
              crop: selectedGuidance.crop,
              region: selectedRegion || undefined,
              status: decision.status,
              fieldNotes: [`Planning: ${field.planningNow}; soil: ${field.moisture}; drainage: ${field.drainage}.`, `Irrigation: ${field.irrigation}; land: ${field.prepared}.`, weatherForRegion ? `Live daily forecast: ${weatherForRegion.locationName}; rain chance ${weatherForRegion.rainChancePercent ?? "unknown"}%.` : "Matching live forecast unavailable.", `Advisor reason: ${decision.why}`]
            })}
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
  const activeToolRef = useRef<ToolKey | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const dashboardPosition = useRef(0);
  const [prefillQuestion, setPrefillQuestion] = useState("");
  const [cropDoctorHandoff, setCropDoctorHandoff] = useState<CropDoctorHandoffContext | null>(null);
  const [toolHandoff, setToolHandoff] = useState<FarmMateToolHandoff | null>(null);
  const [doctorPrefillCrop, setDoctorPrefillCrop] = useState("");
  const [plantingPrefillChecks, setPlantingPrefillChecks] = useState<FarmTaskChecks | null>(null);
  const [knownCrop, setKnownCrop] = useState("");
  const [knownRegion, setKnownRegion] = useState("");
  const knownRegionTouched = useRef(false);
  const activeToolMeta = activeTool === "ask" ? { title: "Ask Mama G" } : tools.find((tool) => tool.key === activeTool);
  const sheetBackground =
    activeTool === "ask" ? "bg-gradient-to-b from-white via-earth-50 to-leaf-50" : "bg-earth-50";

  const openTool = useCallback((tool: ToolKey, fromHandoff = false) => {
    if (!activeToolRef.current) dashboardPosition.current = window.scrollY;
    if (tool === "ask" && !fromHandoff) {
      setPrefillQuestion("");
      setCropDoctorHandoff(null);
      setToolHandoff(null);
    }
    if (tool === "doctor" && !fromHandoff) setDoctorPrefillCrop("");
    if (tool === "planting" && !fromHandoff) setPlantingPrefillChecks(null);
    setIsClosing(false);
    activeToolRef.current = tool;
    setActiveTool(tool);
  }, []);

  useEffect(() => {
    const tool = searchParams.get("tool");

    if (tool === "ask" || tool === "doctor" || tool === "calendar" || tool === "planting" || tool === "weather") {
      openTool(tool);
    }
  }, [searchParams, openTool]);

  useEffect(() => {
    if (knownRegionTouched.current) return;
    try {
      const raw = window.localStorage.getItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
      const weather = raw ? JSON.parse(raw) as WeatherDecisionSummary : null;
      const savedKey = window.localStorage.getItem(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY);
      const location = supportedFarmMateWeatherLocations.find((item) => item.key === savedKey || weather?.locationName === `${item.name} / ${item.region}` || weather?.locationName === item.name);
      if (location) setKnownRegion(location.region);
    } catch { /* Use the default region until the farmer chooses one. */ }
  }, [activeTool]);

  useEffect(() => {
    function handleOpenTool(event: Event) {
      const tool = (event as CustomEvent<ToolKey>).detail;

      if (["ask", "doctor", "calendar", "planting", "weather"].includes(tool)) {
        openTool(tool);
      }
    }

    window.addEventListener("gg-farmmate-open-tool", handleOpenTool);
    function handleAskContext(event: Event) {
      const question = (event as CustomEvent<string>).detail;
      if (typeof question === "string" && question.trim()) {
        setPrefillQuestion(question);
        setCropDoctorHandoff(null);
        setToolHandoff(null);
        openTool("ask", true);
      }
    }
    window.addEventListener("gg-farmmate-open-ask-with-context", handleAskContext);

    return () => {
      window.removeEventListener("gg-farmmate-open-tool", handleOpenTool);
      window.removeEventListener("gg-farmmate-open-ask-with-context", handleAskContext);
    };
  }, [openTool]);

  function closeTool() {
    setIsClosing(true);
    window.setTimeout(() => {
      setActiveTool(null);
      activeToolRef.current = null;
      setIsClosing(false);
      window.scrollTo({ top: dashboardPosition.current, behavior: "auto" });
    }, 180);
  }

  function openAskFarmMateWithQuestion(handoff: string | FarmMateToolHandoff) {
    setPrefillQuestion(typeof handoff === "string" ? handoff : handoff.question);
    setToolHandoff(typeof handoff === "string" ? null : handoff);
    setCropDoctorHandoff(null);
    openTool("ask", true);
  }

  function askFarmMateFromDoctor(handoff: CropDoctorHandoffContext | string) {
    if (typeof handoff === "string") {
      openAskFarmMateWithQuestion(handoff);
      return;
    }

    setPrefillQuestion(handoff.question);
    setToolHandoff(null);
    setCropDoctorHandoff(handoff);
    openTool("ask", true);
  }

  function openCropDoctorFromAsk(crop?: string) {
    setDoctorPrefillCrop(crop ?? "");
    openTool("doctor", true);
  }

  function rememberFarmContext(crop: string, region: string) {
    setKnownCrop(crop);
    setKnownRegion(region);
    knownRegionTouched.current = Boolean(region);
  }

  return (
    <section className="mt-7">
      <div className="mb-3">
        <h2 className="text-lg font-black text-ink sm:text-xl">Farm tools</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              onClick={() => openTool(tool.key)}
              className="flex min-h-36 min-w-0 flex-col items-start rounded-md border border-leaf-900/10 bg-white p-3.5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-leaf-700/25 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:min-h-40 sm:p-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-700/10">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-black leading-5 text-ink sm:text-base">{tool.title}</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-ink/65 sm:text-sm">{tool.description}</p>
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
                {activeTool !== "ask" ? <p className="gg-eyebrow text-leaf-700">Ask Mama G</p> : null}
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
                {activeTool === "ask" ? <AskFarmMate prefillQuestion={prefillQuestion} cropDoctorHandoff={cropDoctorHandoff} toolHandoff={toolHandoff} onOpenCropDoctor={openCropDoctorFromAsk} /> : null}
                {activeTool === "doctor" ? <CropDoctor prefillCrop={doctorPrefillCrop} onAskFarmMateAboutThis={askFarmMateFromDoctor} /> : null}
                {activeTool === "calendar" ? <CropCalendarExperience knownCrop={knownCrop} knownRegion={knownRegion} onContextChange={rememberFarmContext} onAskFarmMateAboutThis={openAskFarmMateWithQuestion} /> : null}
                {activeTool === "planting" ? <PlantingAdvisorExperience knownCrop={knownCrop} knownRegion={knownRegion} initialChecks={plantingPrefillChecks} onContextChange={rememberFarmContext} onAskFarmMateAboutThis={openAskFarmMateWithQuestion} /> : null}
                {activeTool === "weather" ? <CanIFarmTodayExperience onAskFarmMateAboutThis={openAskFarmMateWithQuestion} onOpenPlantingAdvisor={(checks) => { setPlantingPrefillChecks(checks); openTool("planting", true); }} /> : null}
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
