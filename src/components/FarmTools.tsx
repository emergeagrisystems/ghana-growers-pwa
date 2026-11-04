"use client";

import { ArrowLeft, CalendarDays, Camera, ChevronRight, CloudSun, Grid2X2, MessageCircle, PackageOpen, Sprout } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AskFarmMate } from "@/components/AskFarmMate";
import { HarvestStorageGuide } from "./HarvestStorageGuide";
import { CropDoctor } from "@/components/CropDoctor";
import { CanIFarmTodayExperience, FarmMateWeatherFoundation, useFarmWeather, WeatherShortcut } from "@/components/FarmMateWeatherFoundation";
import { takeHomeDraft } from "@/lib/farmmate/home-draft";
import { FARM_MATE_TOOL_LIMITS } from "@/lib/farmmate/usage/rules";
import styles from "./AdviserWorkspace.module.css";
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

type ToolKey = "ask" | "doctor" | "calendar" | "planting" | "weather" | "storage";

const tools = [
  { key: "planting" as const, title: "Planting Advisor", icon: Sprout, description: "Check whether your field is ready to plant." },
  { key: "calendar" as const, title: "Crop Calendar", icon: CalendarDays, description: "Find your crop’s stage and what to do next." },
  { key: "storage" as const, title: "Storage tips", icon: PackageOpen, description: "Get help handling and storing your harvest." }
];

function Choices<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: ReadonlyArray<readonly [T, string]>; onChange: (value: T) => void;
}) {
  return <fieldset className={styles.choiceGroup}><legend>{label}</legend><div>
    {options.map(([key, text]) => <label key={key}>
      <input type="radio" name={label} checked={value === key} onChange={() => onChange(key)} />{text}
    </label>)}
  </div></fieldset>;
}

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
  const [selectedCrop, setSelectedCrop] = useState(findCropCalendarGuide(knownCrop)?.crop ?? "");
  const [selectedRegion, setSelectedRegion] = useState(knownRegion);
  const [plantingState, setPlantingState] = useState<"unselected" | "yes" | "not-yet" | "unknown">("unselected");
  const [plantingDate, setPlantingDate] = useState("");
  const [observedStage, setObservedStage] = useState("");
  const selectedGuide = findCropCalendarGuide(selectedCrop) ?? cropCalendarGuides[0];
  const position = plantingState === "yes" ? cropCalendarPosition(selectedGuide, plantingDate) : null;
  const observedStageIndex = plantingState === "unknown" ? selectedGuide.stages.findIndex((stage) => stage.stage === observedStage) : -1;
  const currentStage = position?.current ?? (observedStageIndex >= 0 ? selectedGuide.stages[observedStageIndex] : null);
  const nextStage = position?.next ?? (observedStageIndex >= 0 ? selectedGuide.stages[observedStageIndex + 1] : undefined);
  const currentTask = !selectedCrop ? "Choose a crop first." : currentStage?.guidance ?? (plantingState === "not-yet" ? selectedGuide.seasonNote : plantingState === "unselected" ? "First say whether this crop has been planted." : "Check the crop's visible growth stage in the field before using a dated stage.");
  const stageLabel = !selectedCrop ? "Choose a crop" : position ? `${position.current.stage} · about week ${position.week}` : currentStage?.stage ?? (plantingState === "not-yet" ? "Before planting" : plantingState === "unselected" ? "Not enough information" : "Stage not confirmed");

  useEffect(() => { setSelectedRegion(knownRegion); }, [knownRegion]);
  useEffect(() => { setSelectedCrop(findCropCalendarGuide(knownCrop)?.crop ?? ""); }, [knownCrop]);

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
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => { setSelectedCrop(event.target.value); setObservedStage(""); setPlantingDate(""); setPlantingState("unselected"); onContextChange(event.target.value, selectedRegion); }}>
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
        {selectedCrop && <Choices label="Have you planted this crop?" value={plantingState} onChange={setPlantingState}
          options={[["yes", "I know the planting date"], ["unknown", "I’m unsure of the date"], ["not-yet", "Not planted yet"]]} />}
        {plantingState === "yes" ? <label className="grid min-w-0 gap-2 text-sm font-black text-ink sm:col-span-2">
          Planting date, if known
          <input type="date" className="gg-field min-h-12 w-full max-w-full" value={plantingDate} onChange={(event) => setPlantingDate(event.target.value)} />
        </label> : null}
        {plantingState === "unknown" && <Choices label="What growth stage can you see?" value={observedStage} onChange={setObservedStage}
          options={selectedGuide.stages.map(stage => [stage.stage, stage.stage] as const)} />}
      </div>

      {selectedCrop && (currentStage || plantingState === "not-yet") && <section className="mt-5 min-w-0 rounded-md bg-leaf-50 p-4 sm:p-5" aria-live="polite">
        <h3 className="font-black">What to do now</h3>
        <p className="mt-1 text-sm font-semibold leading-6">{currentTask}</p>
        <p className="mt-3 text-sm"><b>Current stage</b> · {stageLabel}</p>
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
      </section>}
    </article>
  );
}

function PlantingAdvisorExperience({ onAskFarmMateAboutThis, knownCrop, knownRegion, onContextChange, initialChecks, weather }: {
  onAskFarmMateAboutThis: (handoff: FarmMateToolHandoff) => void;
  knownCrop: string;
  knownRegion: string;
  onContextChange: (crop: string, region: string) => void;
  initialChecks?: FarmTaskChecks | null;
  weather: WeatherDecisionSummary | null;
}) {
  const [selectedCrop, setSelectedCrop] = useState(knownCrop);
  const [selectedRegion, setSelectedRegion] = useState(knownRegion);
  const [field, setField] = useState<PlantingFieldState>({ planningNow: "yes", irrigation: "unknown", moisture: "unknown", drainage: "unknown", prepared: "unknown" });
  const [step, setStep] = useState(0);
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
          <select className="gg-field min-h-12 w-full max-w-full" value={selectedCrop} onChange={(event) => { setStep(0); setSelectedCrop(event.target.value); onContextChange(event.target.value, selectedRegion); }}>
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
      {selectedGuidance && selectedRegion && <div className={styles.checkSteps}>
        <p className={styles.stepLabel}>Field checks · {step === 0 ? "1 of 2" : "2 of 2"}</p>
        {step === 0 ? <>
          <Choices label="Field soil now" value={field.moisture} options={[["unknown","Not sure"],["moist","Moist"],["dry","Dry"],["waterlogged","Waterlogged"]]} onChange={moisture => setField({...field,moisture})} />
          <Choices label="Field drainage" value={field.drainage ?? "unknown"} options={[["unknown","Not sure"],["good","Drains well"],["poor","Drains poorly"]]} onChange={drainage => setField({...field,drainage})} />
          <button type="button" className={styles.stepAction} onClick={() => setStep(1)}>Continue to preparation</button>
        </> : <>
          <button type="button" className={styles.textAction} onClick={() => setStep(0)}>Review soil and drainage</button>
          <Choices label="Planning to plant now?" value={field.planningNow} options={[["yes","Yes"],["later","Not yet"]]} onChange={planningNow => setField({...field,planningNow})} />
          <Choices label="Reliable irrigation?" value={field.irrigation} options={[["unknown","Not sure"],["yes","Yes"],["no","No"]]} onChange={irrigation => setField({...field,irrigation})} />
          <Choices label="Land preparation" value={field.prepared} options={[["unknown","Not sure"],["partly","Partly ready"],["ready","Ready"],["not-yet","Not yet"]]} onChange={prepared => setField({...field,prepared})} />
          {step === 1 && <button type="button" className={styles.stepAction} onClick={() => setStep(2)}>See planting readiness</button>}
        </>}
      </div>}

      {selectedGuidance && selectedRegion && step === 2 ? (
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
  const weather = useFarmWeather();
  const [askSession, setAskSession] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolKey | "tools">("ask");
  const workspace = useRef<HTMLElement>(null);
  const imported = useRef(false);
  const [prefillQuestion, setPrefillQuestion] = useState("");
  const [cropDoctorHandoff, setCropDoctorHandoff] = useState<CropDoctorHandoffContext | null>(null);
  const [toolHandoff, setToolHandoff] = useState<FarmMateToolHandoff | null>(null);
  const [doctorPrefillCrop, setDoctorPrefillCrop] = useState("");
  const [plantingPrefillChecks, setPlantingPrefillChecks] = useState<FarmTaskChecks | null>(null);
  const [knownCrop, setKnownCrop] = useState("");
  const [knownRegion, setKnownRegion] = useState("");
  const knownRegionTouched = useRef(false);
  const title = activeTool === "ask" ? "Ask Mama G" : activeTool === "doctor" ? "Crop Doctor" : activeTool === "weather" ? "Today" : activeTool === "storage" ? "Storage tips" : activeTool === "tools" ? "Farm Tools" : tools.find(tool => tool.key === activeTool)?.title;
  const openTool = useCallback((tool: ToolKey, fromHandoff = false) => {
    if (tool === "ask" && fromHandoff) setAskSession(id => id + 1);
    if (tool === "doctor" && !fromHandoff) setDoctorPrefillCrop("");
    if (tool === "planting" && !fromHandoff) setPlantingPrefillChecks(null);
    setActiveTool(tool);
  }, []);

  useEffect(() => {
    if (!imported.current) {
      imported.current = true;
      const fragment = window.location.hash;
      const receipt = /^#draft-([a-f0-9-]{36})$/i.exec(fragment)?.[1] ?? null;
      const question = takeHomeDraft(receipt);
      if (receipt) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      if (question) {
        setPrefillQuestion(question);
        openTool("ask", true);
        return;
      }
    }
    const tool = searchParams.get("tool");

    if (tool === "ask" || tool === "doctor" || tool === "calendar" || tool === "planting" || tool === "weather" || tool === "storage") {
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

      if (["ask", "doctor", "calendar", "planting", "weather", "storage"].includes(tool)) {
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

  // Size the workspace to the visible viewport as the software keyboard moves.
  // Keep the same textarea mounted so focus and IME composition survive resizes.
  useEffect(() => {
    const node = workspace.current;
    const viewport = window.visualViewport;
    if (!node) return;
    let frame = 0;
    function fit() {
      if (!node) return;
      const top = node.getBoundingClientRect().top - (viewport?.offsetTop ?? 0);
      const editing = node.querySelector("form:focus-within #ask-farmmate-question") !== null;
      // A negative top is real when the document scrolled before focus. Keep it
      // in the height so the composer lands at the visible bottom. Leave both
      // document scroll and the independently scrolling consultation untouched.
      const start = editing && window.matchMedia("(max-width: 700px)").matches ? top : Math.max(0, top);
      const available = Math.max(0, (viewport?.height ?? window.innerHeight) - start);
      node.toggleAttribute("data-keyboard-fit", editing && ((viewport?.height ?? window.innerHeight) < 540 || top < -70));
      node.style.setProperty("--adviser-height", available + "px");
    }
    function scheduleFit() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    }
    function onPageScroll() {
      // Ordinary page scrolling must still allow access to the footer. Input
      // focus and keyboard resize/pan each get their own fresh measurement.
      if (!node?.querySelector("form:focus-within #ask-farmmate-question")) scheduleFit();
    }
    fit();
    node.addEventListener("focusin", scheduleFit);
    node.addEventListener("focusout", scheduleFit);
    viewport?.addEventListener("resize", scheduleFit);
    viewport?.addEventListener("scroll", scheduleFit);
    window.addEventListener("resize", scheduleFit);
    window.addEventListener("scroll", onPageScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("focusin", scheduleFit);
      node.removeEventListener("focusout", scheduleFit);
      viewport?.removeEventListener("resize", scheduleFit);
      viewport?.removeEventListener("scroll", scheduleFit);
      window.removeEventListener("resize", scheduleFit);
      window.removeEventListener("scroll", onPageScroll);
    };
  }, []);

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

  const ask = FARM_MATE_TOOL_LIMITS.ask_farmmate;
  const doctor = FARM_MATE_TOOL_LIMITS.crop_doctor;
  const tabs = [
    { key: "weather", label: "Today", Icon: CloudSun },
    { key: "ask", label: "Ask Mama G", Icon: MessageCircle },
    { key: "doctor", label: "Crop Doctor", Icon: Camera },
    { key: "tools", label: "Farm Tools", Icon: Grid2X2 }
  ] as const;
  return <section ref={workspace} className={styles.workspace} aria-label="Mama G workspace" data-tool={activeTool}>
    <nav className={styles.nav} aria-label="Adviser navigation">
      {tabs.map(({key,label,Icon}) => {
        const subtool = activeTool === "calendar" || activeTool === "planting";
        return <button type="button" key={key} aria-label={label}
          aria-current={activeTool === key || (key === "tools" && (subtool || activeTool === "storage")) ? "page" : undefined}
          onClick={() => key === "tools" ? setActiveTool("tools") : openTool(key)}>
          <Icon size={20} aria-hidden="true" /><span>{label}</span>
        </button>;
      })}
    </nav>
    {activeTool === "ask" && <WeatherShortcut weather={weather} onOpen={() => openTool("weather")} />}

    <div className={styles.panel}>
      <header className={styles.panelTitle}><div><h1>{title}</h1>{(activeTool === "ask" || activeTool === "doctor") && <p>Your agricultural adviser</p>}</div>
        {activeTool !== "ask" && activeTool !== "doctor" && activeTool !== "tools" && activeTool !== "weather" &&
          <button type="button" onClick={() => setActiveTool("tools")}><ArrowLeft size={16} aria-hidden="true" /> Farm Tools</button>}
      </header>
      <div hidden={activeTool !== "ask"} className={styles.askPane}>
        <AskFarmMate key={askSession} prefillQuestion={prefillQuestion} cropDoctorHandoff={cropDoctorHandoff} toolHandoff={toolHandoff} onOpenCropDoctor={openCropDoctorFromAsk} />
      </div>
      {activeTool === "doctor" && <div className={styles.toolPane}><CropDoctor prefillCrop={doctorPrefillCrop} onAskFarmMateAboutThis={askFarmMateFromDoctor} /></div>}
      {activeTool === "storage" && <div className={styles.toolPane}><HarvestStorageGuide onAsk={openAskFarmMateWithQuestion} /></div>}
      {activeTool === "tools" && <div className={styles.toolPane}>
        <div className={styles.toolGrid}>{tools.map(({ key, icon: Icon, title: label, description }) =>
          <button type="button" key={key} onClick={() => openTool(key)}><Icon aria-hidden="true" /><span><strong>{label}</strong>{description}</span><ChevronRight size={18} aria-hidden="true" /></button>)}</div>
      </div>}
      {activeTool === "calendar" && <div className={styles.toolPane}><CropCalendarExperience knownCrop={knownCrop} knownRegion={knownRegion} onContextChange={rememberFarmContext} onAskFarmMateAboutThis={openAskFarmMateWithQuestion} /></div>}
      {activeTool === "planting" && <div className={styles.toolPane}><PlantingAdvisorExperience weather={weather.stale ? null : weather.forecast?.decisionSummary ?? null} knownCrop={knownCrop} knownRegion={knownRegion} initialChecks={plantingPrefillChecks} onContextChange={rememberFarmContext} onAskFarmMateAboutThis={openAskFarmMateWithQuestion} /></div>}
      {activeTool === "weather" && <div className={styles.toolPane}><FarmMateWeatherFoundation weather={weather} /><CanIFarmTodayExperience weatherState={weather} onAskFarmMateAboutThis={openAskFarmMateWithQuestion} onOpenPlantingAdvisor={(checks) => { const area = supportedFarmMateWeatherLocations.find(item => item.key === weather.selectedLocationKey);
        if (area) setKnownRegion(area.region);
        setPlantingPrefillChecks(checks);
        openTool("planting", true); }} /></div>}
    </div>

    <aside className={styles.support} aria-label="Adviser support">
      <FarmMateWeatherFoundation compact weather={weather} />
      <div><small>QUESTION AND PHOTO LIMITS</small><p>{ask.limit} Ask questions per {ask.windowHours} hours</p><p>{doctor.limit} crop checks per {doctor.windowHours} hours</p></div>
      <div><small>SAFE USE</small><p>For serious or spreading crop problems, seek a local extension officer.</p></div>
    </aside>
  </section>;
}
