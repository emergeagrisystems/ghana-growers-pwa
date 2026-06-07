"use client";

import { ImagePlus, ScanSearch } from "lucide-react";
import { useState } from "react";

export function CropHealthCheck() {
  const [fileName, setFileName] = useState("");
  const [checked, setChecked] = useState(false);

  return (
    <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-black uppercase text-earth-700">Crop Health Check</p>
      <h2 className="mt-2 text-2xl font-black text-ink">Upload a crop or leaf photo</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Frontend mockup prepared for future connection to Plant.id, Crop.health, Plantix, or another crop disease API.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <label className="focus-ring flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-leaf-600 bg-leaf-50 p-6 text-center">
          <ImagePlus className="text-leaf-600" size={42} aria-hidden="true" />
          <span className="mt-4 text-sm font-black text-ink">{fileName || "Choose crop/leaf photo"}</span>
          <span className="mt-2 text-xs leading-5 text-ink/60">JPG, PNG, or WEBP image. No file is uploaded in this demo.</span>
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? "");
              setChecked(false);
            }}
          />
        </label>

        <div className="rounded-md bg-earth-50 p-5">
          <button
            type="button"
            disabled={!fileName}
            onClick={() => setChecked(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-ink/25"
          >
            <ScanSearch size={17} aria-hidden="true" />
            Run Mock Check
          </button>

          {checked ? (
            <div className="mt-5 grid gap-3 text-sm">
              <p><span className="font-black text-ink">Possible issue:</span> Early leaf spot or nutrient stress signs</p>
              <p><span className="font-black text-ink">Confidence level:</span> 72%</p>
              <p><span className="font-black text-ink">Recommended action:</span> Isolate affected leaves, avoid overhead watering, document spread, and consult an extension officer before applying treatment.</p>
              <p className="rounded-md bg-white p-3 font-bold text-tomato">
                This is advisory only. Please confirm with an agricultural extension officer.
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-ink/65">
              Select a photo and run the mock check to see how future crop disease results will appear.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
