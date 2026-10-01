export type FarmMateToolHandoff = {
  source: "calendar" | "planting" | "weather" | "harvest";
  question: string;
  chips: string[];
  crop?: string;
  region?: string;
  stage?: string;
  task?: string;
  status?: string;
  fieldNotes?: string[];
};

const sources = new Set<FarmMateToolHandoff["source"]>(["calendar", "planting", "weather", "harvest"]);

function shortText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function isFarmMateToolHandoff(value: unknown): value is FarmMateToolHandoff {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<FarmMateToolHandoff>;
  return sources.has(item.source as FarmMateToolHandoff["source"]) &&
    shortText(item.question, 200) &&
    Array.isArray(item.chips) && item.chips.length <= 4 && item.chips.every((chip) => shortText(chip, 60)) &&
    ([item.crop, item.region, item.stage, item.task, item.status].every((field) => field === undefined || shortText(field, 120))) &&
    (item.fieldNotes === undefined || (Array.isArray(item.fieldNotes) && item.fieldNotes.length <= 6 && item.fieldNotes.every((note) => shortText(note, 160))));
}

export function canonicalFarmMateToolHandoff(value: unknown): FarmMateToolHandoff | undefined {
  if (!isFarmMateToolHandoff(value)) return undefined;
  return {
    source: value.source,
    question: value.question.trim(),
    chips: value.chips.map((chip) => chip.trim()),
    crop: value.crop?.trim(),
    region: value.region?.trim(),
    stage: value.stage?.trim(),
    task: value.task?.trim(),
    status: value.status?.trim(),
    fieldNotes: value.fieldNotes?.map((note) => note.trim())
  };
}
