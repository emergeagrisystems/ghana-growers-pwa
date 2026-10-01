import { findFarmMateCropLibraryEntry } from "./crop-library";

export type HarvestStorageInput = {
  crop: string;
  state: "unknown" | "standing" | "harvested";
  condition: "unknown" | "sound" | "wet" | "damaged";
  duration: "unknown" | "today" | "short" | "longer";
  storage: "unknown" | "shade" | "ventilated" | "clean_drying" | "none";
};

export function harvestStorageDecision(input: HarvestStorageInput) {
  const entry = findFarmMateCropLibraryEntry(input.crop);
  if (!entry || entry.cropGroup === "unknown_other" || input.state === "unknown") {
    return { status: "NOT ENOUGH INFORMATION" as const, reason: "Choose the crop and say whether it has been harvested before planning storage.", actions: [] as string[], next: "Choose the crop and harvest state." };
  }

  const crop = entry.displayName;
  const group = /root|tuber/i.test(entry.cropFamily ?? "") ? "root" : /cereal|legume/i.test(entry.cropFamily ?? "") ? "dry_crop" : entry.cropGroup === "cash_perennial" ? "perennial" : "fresh";
  if (input.state === "standing") {
    return { status: "CHECK FIRST" as const, reason: `${crop} is not harvested yet. Confirm maturity and prepare a handling or storage plan before lifting it.`, actions: ["Check the crop's visible harvest-readiness signs.", "Prepare clean containers, shade or a suitable drying place before harvest."], next: group === "root" && crop === "Cassava" ? "Harvest only what you can use, process or move soon." : "Confirm maturity, then plan where the harvest will go." };
  }
  if (input.condition === "unknown" || input.duration === "unknown" || input.storage === "unknown") {
    return { status: "NOT ENOUGH INFORMATION" as const, reason: "The crop is harvested, but its condition, intended holding time or available storage is still unknown.", actions: ["Inspect for wet, bruised, rotten or mouldy pieces.", "Keep produce off bare ground while checking."], next: "Confirm condition, intended holding time and available storage." };
  }
  if (input.condition === "damaged") {
    return { status: "WAIT" as const, reason: "Damaged, rotten or mouldy produce should not be mixed with the sound harvest.", actions: ["Separate affected produce from sound produce.", "Keep the sound lot clean and shaded while you seek qualified local advice about any food or feed safety concern."], next: "Ask an extension officer or qualified food-safety adviser before using seriously affected produce." };
  }
  if (input.condition === "wet" && (group === "dry_crop" || input.duration === "longer")) {
    return { status: "WAIT" as const, reason: "Wet produce is not ready for a longer storage plan; mould and loss risk may increase.", actions: ["Keep the lot off wet ground and separate visibly damaged pieces.", "Use a clean, protected drying area and check the crop-specific drying method with a qualified local adviser."], next: "Check that the crop is suitably dry before storing; do not guess a moisture threshold." };
  }
  if (input.storage === "none" && input.duration === "longer") {
    return { status: "CHECK FIRST" as const, reason: "A longer holding plan needs suitable storage that is not available yet.", actions: ["Keep the harvest shaded and handle it gently for now.", "Arrange a suitable clean and ventilated storage or drying place, or plan prompt use or sale of surplus."], next: "Choose a realistic storage or movement plan before holding the crop longer." };
  }
  const actions = group === "dry_crop"
    ? ["Sort visibly damaged material away from sound produce.", "Keep it off bare ground and protect it from rain.", "Use clean, dry, ventilated storage after appropriate drying."]
    : group === "root"
      ? ["Lift and handle roots or tubers gently to avoid cuts.", "Keep the sound harvest shaded and separate any rot.", "Plan prompt use or movement rather than assuming a long shelf life."]
      : ["Keep produce shaded and handle it gently.", "Separate bruised or rotten pieces early.", "Use clean ventilated containers and avoid tight wet packing."];
  return { status: "CHECK FIRST" as const, reason: `A practical ${crop} handling plan depends on the actual crop condition and local storage conditions.`, actions, next: input.duration === "longer" ? "Confirm a crop-specific longer-storage method with a qualified local adviser." : "Inspect the lot again before use, transport or sale." };
}
