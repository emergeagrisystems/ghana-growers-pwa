"use client";

type FarmMateToolKey = "ask" | "doctor";

function openFarmMateTool(tool: FarmMateToolKey) {
  window.dispatchEvent(new CustomEvent("gg-farmmate-open-tool", { detail: tool }));
}

export function FarmMateHeroActions() {
  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={() => openFarmMateTool("ask")}
        className="gg-button-primary"
      >
        Ask FarmMate
      </button>
      <button
        type="button"
        onClick={() => openFarmMateTool("doctor")}
        className="gg-text-link"
      >
        Upload Crop Photo
      </button>
    </div>
  );
}
