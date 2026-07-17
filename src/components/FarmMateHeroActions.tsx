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
        className="gg-button-primary min-h-[4.25rem] w-full px-7 py-4 text-base sm:min-h-12 sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
      >
        Ask FarmMate
      </button>
      <button
        type="button"
        onClick={() => openFarmMateTool("doctor")}
        className="gg-text-link min-h-[4.25rem] w-full px-7 py-4 text-base sm:min-h-12 sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
      >
        Upload Crop Photo
      </button>
    </div>
  );
}
