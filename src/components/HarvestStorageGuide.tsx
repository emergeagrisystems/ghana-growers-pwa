"use client";

import { useState } from "react";
import { farmMateCropOptionsByGroup } from "@/lib/farmmate/crop-library";
import { harvestStorageDecision, type HarvestStorageInput } from "@/lib/farmmate/harvest-storage-guide";
import type { FarmMateToolHandoff } from "@/lib/farmmate/tool-handoff";
import { FarmMateDecisionStatus } from "@/components/FarmMateDecisionStatus";

const initial: HarvestStorageInput = { crop: "", state: "unknown", condition: "unknown", duration: "unknown", storage: "unknown" };

export function HarvestStorageGuide({ onAsk }: { onAsk: (handoff: FarmMateToolHandoff) => void }) {
  const [input, setInput] = useState<HarvestStorageInput>(initial);
  const result = harvestStorageDecision(input);
  function set<K extends keyof HarvestStorageInput>(key: K, value: HarvestStorageInput[K]) { setInput((current) => ({ ...current, [key]: value })); }

  return <details className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
    <summary className="cursor-pointer text-sm font-black text-leaf-700">Harvest and storage guide</summary>
    <p className="mt-2 text-sm leading-6 text-ink/65">Work from crop and harvest condition to a practical next action. This is general guidance, not a food-safety clearance.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold">Crop<select className="gg-field min-h-11" value={input.crop} onChange={(event) => set("crop", event.target.value)}><option value="">Choose crop</option>{farmMateCropOptionsByGroup().map((group) => <optgroup key={group.group} label={group.label}>{group.crops.map((crop) => <option key={crop.displayName} value={crop.displayName}>{crop.displayName}</option>)}</optgroup>)}</select></label>
      <label className="grid gap-1 text-sm font-bold">Harvest state<select className="gg-field min-h-11" value={input.state} onChange={(event) => set("state", event.target.value as HarvestStorageInput["state"])}><option value="unknown">Choose one</option><option value="standing">Not harvested yet</option><option value="harvested">Already harvested</option></select></label>
      {input.state === "harvested" ? <><label className="grid gap-1 text-sm font-bold">Known condition<select className="gg-field min-h-11" value={input.condition} onChange={(event) => set("condition", event.target.value as HarvestStorageInput["condition"])}><option value="unknown">Not sure</option><option value="sound">Looks sound</option><option value="wet">Wet or damp</option><option value="damaged">Rot, mould or damage visible</option></select></label>
      <label className="grid gap-1 text-sm font-bold">Intended holding time<select className="gg-field min-h-11" value={input.duration} onChange={(event) => set("duration", event.target.value as HarvestStorageInput["duration"])}><option value="unknown">Not sure</option><option value="today">Use or move today</option><option value="short">Short holding period</option><option value="longer">Longer storage</option></select></label>
      <label className="grid gap-1 text-sm font-bold">Available storage<select className="gg-field min-h-11" value={input.storage} onChange={(event) => set("storage", event.target.value as HarvestStorageInput["storage"])}><option value="unknown">Not sure</option><option value="shade">Shaded holding place</option><option value="ventilated">Clean ventilated place</option><option value="clean_drying">Clean protected drying place</option><option value="none">None yet</option></select></label></> : null}
    </div>
    <div className="mt-4 rounded-md bg-white p-4" aria-live="polite"><FarmMateDecisionStatus status={result.status} /><p className="mt-2 text-sm font-semibold leading-6 text-ink/75">{result.reason}</p>{result.actions.length ? <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-semibold leading-6 text-ink/70">{result.actions.map((action) => <li key={action}>{action}</li>)}</ol> : null}<p className="mt-2 text-sm font-bold text-ink">Next step: {result.next}</p></div>
    {input.crop && input.state !== "unknown" ? <button type="button" className="mt-3 min-h-11 rounded-md bg-leaf-600 px-4 text-sm font-black text-white" onClick={() => onAsk({ source: "harvest", question: `How should I handle and store ${input.crop}?`, chips: [input.crop, input.state === "standing" ? "Not harvested" : "Harvested", input.duration], crop: input.crop, status: result.status, fieldNotes: [`Harvest state: ${input.state}; condition: ${input.condition}.`, `Holding time: ${input.duration}; storage: ${input.storage}.`, `Guide status: ${result.reason}`] })}>Ask Mama G about this harvest</button> : null}
    <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">No exact moisture or temperature thresholds, chemical preservatives, stored-produce pesticides, fermentation, cassava processing or food/feed safety declarations are given here. These need qualified review.</p>
  </details>;
}
