"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";
import { productCategories } from "@/data/products";
import { formatMarketplaceMeasure, reviewedCustomUnitMessage } from "@/lib/marketplace/trade";

const fieldClass = "gg-field";
const packagedUnits = ["sack", "bag", "crate", "basket", "tray", "carton", "box", "bunch", "other"];
const weightUnits = ["kg", "tonnes"];
const countUnits = ["piece", "head", "bunch", "tuber", "plant", "seedling", "other"];
const volumeUnits = ["litres", "gallons", "container", "other"];

export function SubmitProduceListingForm() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellingMethod, setSellingMethod] = useState("packaged_unit");
  const [sellingUnit, setSellingUnit] = useState("");
  const [unitSizeValue, setUnitSizeValue] = useState("");
  const [unitSizeMeasure, setUnitSizeMeasure] = useState("kg");
  const [unitSizeApproximate, setUnitSizeApproximate] = useState(false);
  const [unitsAvailable, setUnitsAvailable] = useState("");

  const calculatedTotal = calculateTotal(sellingMethod, unitSizeValue, unitsAvailable, unitSizeMeasure, unitSizeApproximate);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/listing-submissions", {
      method: "POST",
      body: formData
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null;

    setIsSubmitting(false);

    if (!response?.ok || !result?.ok) {
      setError(result?.error ?? "Could not submit this listing. Please check the form and try again.");
      return;
    }

    event.currentTarget.reset();
    setSuccess(result.message ?? "Thank you. Your submission has been received and will be reviewed by Ghana Growers.");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Product Name" name="productName" required />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Category
          <select required name="category" className={fieldClass}>
            <option value="">Select category</option>
            {productCategories.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Selling Method
          <select
            required
            name="sellingMethod"
            value={sellingMethod}
            onChange={(event) => {
              setSellingMethod(event.target.value);
              setSellingUnit("");
            }}
            className={fieldClass}
          >
            <option value="packaged_unit">Sold by packaged unit</option>
            <option value="weight">Sold directly by weight</option>
            <option value="count">Sold by count or piece</option>
            <option value="livestock">Livestock sold per animal</option>
            <option value="volume">Sold by volume</option>
          </select>
        </label>

        {sellingMethod === "packaged_unit" ? (
          <>
            <SelectField label="Unit / Container Type" name="sellingUnit" options={packagedUnits} value={sellingUnit} onChange={setSellingUnit} required />
            <TextField label="Unit Net Weight or Capacity" name="unitSizeValue" type="number" min="0.001" step="any" value={unitSizeValue} onChange={setUnitSizeValue} required />
            <SelectField label="Unit Size Measure" name="unitSizeMeasure" options={["kg", "tonnes", "litres", "gallons"]} value={unitSizeMeasure} onChange={setUnitSizeMeasure} required />
            <ApproximateCheckbox checked={unitSizeApproximate} onChange={setUnitSizeApproximate} />
            <TextField label="Price Per Unit (GH₵)" name="priceAmount" type="number" min="0" step="any" />
            <TextField label="Units Available" name="unitsAvailable" type="number" min="1" step="1" value={unitsAvailable} onChange={setUnitsAvailable} required />
            <TextField label="Minimum Units Per Order" name="minimumOrderValue" type="number" min="1" step="1" required />
            <input type="hidden" name="priceCurrency" value="GHS" />
            <input type="hidden" name="priceBasis" value="unit" />
            <input type="hidden" name="minimumOrderUnit" value={sellingUnit} />
          </>
        ) : null}

        {sellingMethod === "weight" ? (
          <>
            <SelectField label="Weight Unit" name="sellingUnit" options={weightUnits} value={sellingUnit} onChange={setSellingUnit} required />
            <TextField label="Price Per Weight Unit (GH₵)" name="priceAmount" type="number" min="0" step="any" />
            <TextField label="Total Weight Available" name="totalQuantityValue" type="number" min="0.001" step="any" required />
            <SelectField label="Total Weight Measure" name="totalQuantityMeasure" options={weightUnits} required />
            <TextField label="Minimum Order Weight" name="minimumOrderValue" type="number" min="0.001" step="any" required />
            <SelectField label="Minimum Order Unit" name="minimumOrderUnit" options={weightUnits} required />
            <input type="hidden" name="priceCurrency" value="GHS" />
          </>
        ) : null}

        {sellingMethod === "count" ? (
          <>
            <SelectField label="Item Unit" name="sellingUnit" options={countUnits} value={sellingUnit} onChange={setSellingUnit} required />
            <TextField label="Price Per Item (GH₵)" name="priceAmount" type="number" min="0" step="any" />
            <TextField label="Number Available" name="unitsAvailable" type="number" min="1" step="1" value={unitsAvailable} onChange={setUnitsAvailable} required />
            <TextField label="Minimum Order Quantity" name="minimumOrderValue" type="number" min="1" step="1" required />
            <input type="hidden" name="minimumOrderUnit" value={sellingUnit} />
            <input type="hidden" name="priceCurrency" value="GHS" />
          </>
        ) : null}

        {sellingMethod === "livestock" ? (
          <>
            <TextField label="Animal Type" name="sellingUnit" value={sellingUnit} onChange={setSellingUnit} required />
            <TextField label="Price Per Animal (GH₵)" name="priceAmount" type="number" min="0" step="any" />
            <TextField label="Number Available" name="unitsAvailable" type="number" min="1" step="1" value={unitsAvailable} onChange={setUnitsAvailable} required />
            <TextField label="Approximate Weight Range" name="unitSizeValue" />
            <TextField label="Minimum Order" name="minimumOrderValue" type="number" min="1" step="1" required />
            <input type="hidden" name="minimumOrderUnit" value={sellingUnit} />
            <input type="hidden" name="priceCurrency" value="GHS" />
          </>
        ) : null}

        {sellingMethod === "volume" ? (
          <>
            <SelectField label="Volume Unit" name="sellingUnit" options={volumeUnits} value={sellingUnit} onChange={setSellingUnit} required />
            <TextField label="Unit Volume" name="unitSizeValue" type="number" min="0.001" step="any" value={unitSizeValue} onChange={setUnitSizeValue} required />
            <SelectField label="Unit Volume Measure" name="unitSizeMeasure" options={["litres", "gallons"]} value={unitSizeMeasure} onChange={setUnitSizeMeasure} required />
            <ApproximateCheckbox checked={unitSizeApproximate} onChange={setUnitSizeApproximate} />
            <TextField label="Price Per Unit (GH₵)" name="priceAmount" type="number" min="0" step="any" />
            <TextField label="Units Available" name="unitsAvailable" type="number" min="1" step="1" value={unitsAvailable} onChange={setUnitsAvailable} required />
            <TextField label="Minimum Order" name="minimumOrderValue" type="number" min="1" step="1" required />
            <input type="hidden" name="minimumOrderUnit" value={sellingUnit} />
            <input type="hidden" name="priceCurrency" value="GHS" />
          </>
        ) : null}

        <TextField label="Custom Unit Label" name="customUnitLabel" placeholder="Only complete this if you selected Other." />
        <input type="hidden" name="totalQuantityValue" value={calculatedTotal.value} />
        <input type="hidden" name="totalQuantityMeasure" value={calculatedTotal.measure} />
        {calculatedTotal.label ? (
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-3 text-sm font-bold text-ink/70">
            Calculated total: {calculatedTotal.label}
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Region
          <select required name="region" className={fieldClass}>
            <option value="">Select region</option>
            {ghanaRegions.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
        <TextField label="District" name="district" required />
        <TextField label="Seller Name" name="sellerName" required />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Seller Type
          <select required name="sellerType" className={fieldClass}>
            <option value="">Select seller type</option>
            <option value="Farmer">Farmer</option>
            <option value="Supplier">Supplier</option>
          </select>
        </label>
        <TextField label="WhatsApp Number" name="whatsappNumber" type="tel" required />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Availability Status
          <select required name="availability" className={fieldClass}>
            <option value="Available Now">Available now</option>
            <option value="Limited Stock">Limited stock</option>
            <option value="Harvesting Soon">Harvesting soon</option>
            <option value="Sold Out">Sold out</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Supply Frequency
          <select name="supplyFrequency" className={fieldClass}>
            <option value="">Select if applicable</option>
            <option value="One-time">One-time</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="On request">On request</option>
          </select>
        </label>
        <TextField label="Ready / Harvest Date" name="availableFromDate" type="date" />
        <TextField label="Grade or Quality Description" name="gradeDescription" />
        <label className="grid gap-2 text-sm font-bold text-ink/75">
          Image Upload
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={fieldClass} />
          <span className="text-xs font-semibold text-ink/50">JPG, PNG, or WEBP up to 5MB.</span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
          Description
          <textarea required name="description" className={`${fieldClass} min-h-28`} placeholder="Describe quality, availability, harvest timing, pickup, or delivery details." />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
          Pickup or Delivery Details
          <textarea name="deliveryDetails" className={`${fieldClass} min-h-20`} placeholder="Add pickup or delivery details only if they are confirmed." />
        </label>
      </div>

      <SubmitButton isSubmitting={isSubmitting} label="Submit Produce Listing" />
      <Messages success={success} error={error} />
    </form>
  );
}

function calculateTotal(sellingMethod: string, unitSizeValue: string, unitsAvailable: string, unitSizeMeasure: string, approximate: boolean) {
  if (!["packaged_unit", "volume"].includes(sellingMethod)) {
    return { value: "", measure: "", label: "" };
  }

  const unitSize = Number(unitSizeValue);
  const units = Number(unitsAvailable);

  if (!Number.isFinite(unitSize) || !Number.isFinite(units) || unitSize <= 0 || units <= 0 || !unitSizeMeasure) {
    return { value: "", measure: "", label: "" };
  }

  const total = unitSize * units;
  return {
    value: String(total),
    measure: unitSizeMeasure,
    label: `${approximate ? "approx. " : ""}${formatMarketplaceMeasure(String(total), unitSizeMeasure)}`
  };
}

function ApproximateCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-3 text-sm font-bold text-ink/75">
      <input
        type="checkbox"
        name="unitSizeApproximate"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-leaf-900/30 text-leaf-700 focus:ring-leaf-700"
      />
      Unit size is approximate
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
  value,
  onChange
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <select required={required} name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className={fieldClass}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option === "other" ? "Other (review required)" : option}</option>)}
      </select>
      {value === "other" ? <span className="text-xs font-semibold text-earth-700">{reviewedCustomUnitMessage}</span> : null}
    </label>
  );
}

function TextField({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
  placeholder,
  min,
  step
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <input
        required={required}
        name={name}
        type={type}
        min={type === "number" ? min ?? "0" : undefined}
        step={type === "number" ? step ?? "any" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={fieldClass}
      />
    </label>
  );
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={isSubmitting} className="gg-button-primary mt-6 gap-2">
      <Send size={17} aria-hidden="true" />
      {isSubmitting ? "Submitting..." : label}
    </button>
  );
}

function Messages({ success, error }: { success: string; error: string }) {
  return (
    <>
      {success ? <p className="mt-5 flex gap-2 rounded-md bg-leaf-50 p-4 text-sm font-bold text-leaf-700"><CheckCircle2 size={18} className="shrink-0" />{success}</p> : null}
      {error ? <p className="mt-5 rounded-md bg-red-50 p-4 text-sm font-bold text-tomato">{error}</p> : null}
    </>
  );
}
