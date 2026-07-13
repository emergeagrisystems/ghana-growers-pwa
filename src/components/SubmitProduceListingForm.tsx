"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Send, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";
import { freshProduceSubcategories } from "@/lib/marketplace/taxonomy";
import { formatMarketplaceMeasure, reviewedCustomUnitMessage } from "@/lib/marketplace/trade";

const fieldClass = "gg-field min-h-11";
const steps = ["Seller details", "Product details", "Price and quantity", "Availability", "Photos", "Review"] as const;
const marketplacePathways = ["Fresh Produce", "Farm Inputs", "Livestock", "Tools & Equipment"] as const;
const packagedUnits = ["sack", "bag", "crate", "tray", "carton", "basket", "box", "other"];
const countUnits = ["bunch", "piece", "tray", "plant", "seedling", "other"];
const volumeUnits = ["litres", "gallons", "container", "other"];
const availabilityOptions = ["Available now", "Seasonal", "Ask availability", "Unavailable"];
const frequencyOptions = ["One-time", "Weekly", "Monthly", "On request"];

type ListingFormState = {
  farmBusinessName: string;
  contactPerson: string;
  phoneNumber: string;
  whatsappNumber: string;
  whatsappSameAsPhone: boolean;
  region: string;
  district: string;
  existingMember: "" | "Yes" | "No" | "Not sure";
  sellerType: "" | "Farmer" | "Supplier";
  productName: string;
  marketplacePathway: string;
  subcategory: string;
  variety: string;
  description: string;
  gradeDescription: string;
  sellingMethod: "packaged_unit" | "weight" | "count" | "livestock" | "volume";
  sellingUnit: string;
  customUnitLabel: string;
  unitSizeValue: string;
  unitSizeMeasure: string;
  unitSizeApproximate: boolean;
  priceAmount: string;
  priceConfirmedLater: boolean;
  unitsAvailable: string;
  totalQuantityValue: string;
  totalQuantityMeasure: string;
  minimumOrderValue: string;
  minimumOrderUnit: string;
  quantityConfirmedLater: boolean;
  availability: string;
  supplyFrequency: string;
  availableFromDate: string;
  pickupLocation: string;
  deliveryAvailable: string;
  deliveryDetails: string;
  additionalNotes: string;
  confirmation: boolean;
  companyWebsite: string;
};

const initialState: ListingFormState = {
  farmBusinessName: "",
  contactPerson: "",
  phoneNumber: "",
  whatsappNumber: "",
  whatsappSameAsPhone: false,
  region: "",
  district: "",
  existingMember: "",
  sellerType: "",
  productName: "",
  marketplacePathway: "Fresh Produce",
  subcategory: "Vegetables",
  variety: "",
  description: "",
  gradeDescription: "",
  sellingMethod: "packaged_unit",
  sellingUnit: "sack",
  customUnitLabel: "",
  unitSizeValue: "",
  unitSizeMeasure: "kg",
  unitSizeApproximate: false,
  priceAmount: "",
  priceConfirmedLater: false,
  unitsAvailable: "",
  totalQuantityValue: "",
  totalQuantityMeasure: "kg",
  minimumOrderValue: "",
  minimumOrderUnit: "sack",
  quantityConfirmedLater: false,
  availability: "Available now",
  supplyFrequency: "On request",
  availableFromDate: "",
  pickupLocation: "",
  deliveryAvailable: "To be confirmed",
  deliveryDetails: "",
  additionalNotes: "",
  confirmation: false,
  companyWebsite: ""
};

export function SubmitProduceListingForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ListingFormState>(initialState);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [success, setSuccess] = useState<{ message: string; reference?: string } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedTotal = useMemo(
    () => calculateTotal(values.sellingMethod, values.unitSizeValue, values.unitsAvailable, values.unitSizeMeasure, values.unitSizeApproximate),
    [values.sellingMethod, values.unitSizeValue, values.unitsAvailable, values.unitSizeMeasure, values.unitSizeApproximate]
  );
  const currentStepValid = validateStep(step, values, mainImage);
  const photoFiles = [mainImage, ...additionalImages].filter((file): file is File => Boolean(file));

  function update<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "whatsappSameAsPhone" && value === true) {
        next.whatsappNumber = current.phoneNumber;
      }

      if (key === "phoneNumber" && current.whatsappSameAsPhone) {
        next.whatsappNumber = String(value);
      }

      if (key === "marketplacePathway") {
        next.subcategory = value === "Fresh Produce" ? "Vegetables" : String(value);
      }

      if (key === "sellingMethod") {
        const method = String(value);
        next.sellingUnit = method === "packaged_unit" ? "sack" : method === "weight" ? "kg" : method === "volume" ? "litres" : method === "livestock" ? "goat" : "piece";
        next.minimumOrderUnit = next.sellingUnit;
        next.unitSizeMeasure = method === "volume" ? "litres" : "kg";
        next.totalQuantityMeasure = method === "volume" ? "litres" : method === "weight" ? "kg" : "";
      }

      if (key === "sellingUnit") {
        next.minimumOrderUnit = String(value);
      }

      return next;
    });
  }

  function onAdditionalImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 4 - additionalImages.length));
    setAdditionalImages((current) => [...current, ...files].slice(0, 4));
    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError("");

    if (!values.confirmation || !mainImage) {
      setError("Please confirm the information and upload one clear product photo.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) {
          formData.append(key, "on");
        }
      } else {
        formData.append(key, value);
      }
    });
    formData.append("sellerName", values.farmBusinessName);
    formData.append("category", values.subcategory || values.marketplacePathway);
    formData.append("priceCurrency", "GHS");
    formData.append("priceBasis", values.sellingUnit);
    formData.append("totalQuantityValue", calculatedTotal.value || values.totalQuantityValue);
    formData.append("totalQuantityMeasure", calculatedTotal.measure || values.totalQuantityMeasure);
    formData.append("mainImage", mainImage);
    additionalImages.forEach((file) => formData.append("additionalImages", file));

    const response = await fetch("/api/listing-submissions", { method: "POST", body: formData }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string; reference?: string } | null;

    setIsSubmitting(false);

    if (!response?.ok || !result?.ok) {
      setError(result?.error ?? "Could not submit this listing. Please check the form and try again.");
      return;
    }

    setSuccess({
      reference: result.reference,
      message: result.message ?? "Your listing is not live yet. Ghana Growers will review the details and contact you if more information is needed."
    });
    setStep(5);
  }

  if (success) {
    return <SuccessMessage reference={success.reference} message={success.message} />;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
      <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" value={values.companyWebsite} onChange={(event) => update("companyWebsite", event.target.value)} className="hidden" aria-hidden="true" />

      <div className="rounded-md bg-leaf-50 p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-earth-700">
          Step {step + 1} of {steps.length}
        </p>
        <div className="mt-2 h-2 rounded-full bg-white ring-1 ring-leaf-900/10">
          <div className="h-full rounded-full bg-leaf-700 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm font-black text-ink">{steps[step]}</p>
      </div>

      <div className="mt-5">
        {step === 0 ? <SellerStep values={values} update={update} /> : null}
        {step === 1 ? <ProductStep values={values} update={update} /> : null}
        {step === 2 ? <TradeStep values={values} update={update} calculatedTotal={calculatedTotal.label} /> : null}
        {step === 3 ? <AvailabilityStep values={values} update={update} /> : null}
        {step === 4 ? (
          <PhotosStep
            mainImage={mainImage}
            additionalImages={additionalImages}
            setMainImage={setMainImage}
            onAdditionalImages={onAdditionalImages}
            removeAdditional={(index) => setAdditionalImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          />
        ) : null}
        {step === 5 ? <ReviewStep values={values} photos={photoFiles} calculatedTotal={calculatedTotal.label} update={update} /> : null}
      </div>

      {error ? <p className="mt-5 rounded-md bg-red-50 p-3 text-sm font-bold text-tomato">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          disabled={step === 0 || isSubmitting}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-leaf-900/10 bg-white px-4 py-2 text-sm font-black text-ink/70 transition hover:border-leaf-700/25 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!currentStepValid || isSubmitting}
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
            className="gg-button-primary justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" disabled={isSubmitting || !currentStepValid} className="gg-button-primary justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-55">
            <Send size={17} aria-hidden="true" />
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </button>
        )}
      </div>
    </form>
  );
}

function SellerStep({ values, update }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Farm or business name" value={values.farmBusinessName} onChange={(value) => update("farmBusinessName", value)} required />
      <TextField label="Contact person" value={values.contactPerson} onChange={(value) => update("contactPerson", value)} required />
      <TextField label="Phone number" type="tel" value={values.phoneNumber} onChange={(value) => update("phoneNumber", value)} required helper="Example: +233 24 000 0000" />
      <div className="grid gap-2">
        <TextField label="WhatsApp number" type="tel" value={values.whatsappNumber} onChange={(value) => update("whatsappNumber", value)} required={!values.whatsappSameAsPhone} disabled={values.whatsappSameAsPhone} />
        <Checkbox label="Same as phone number" checked={values.whatsappSameAsPhone} onChange={(checked) => update("whatsappSameAsPhone", checked)} />
      </div>
      <SelectField label="Region" value={values.region} onChange={(value) => update("region", value)} options={ghanaRegions} required placeholder="Select region" />
      <TextField label="District or town" value={values.district} onChange={(value) => update("district", value)} required />
      <RadioGroup label="Are you already part of the Ghana Growers network?" value={values.existingMember} options={["Yes", "No", "Not sure"]} onChange={(value) => update("existingMember", value as ListingFormState["existingMember"])} required />
      <RadioGroup label="Seller type" value={values.sellerType} options={["Farmer", "Supplier"]} onChange={(value) => update("sellerType", value as ListingFormState["sellerType"])} required />
    </div>
  );
}

function ProductStep({ values, update }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Product/listing title" value={values.productName} onChange={(value) => update("productName", value)} placeholder="Example: Yellow maize, tomato crates, fertilizer" required />
      <SelectField label="Main marketplace pathway" value={values.marketplacePathway} onChange={(value) => update("marketplacePathway", value)} options={[...marketplacePathways]} required />
      <SelectField
        label="Subcategory"
        value={values.subcategory}
        onChange={(value) => update("subcategory", value)}
        options={values.marketplacePathway === "Fresh Produce" ? [...freshProduceSubcategories] : [values.marketplacePathway]}
        required
      />
      <TextField label="Variety or product type" value={values.variety} onChange={(value) => update("variety", value)} placeholder="Optional, e.g. Obaatanpa maize" />
      <TextField label="Grade or quality notes" value={values.gradeDescription} onChange={(value) => update("gradeDescription", value)} placeholder="Optional, e.g. dried, sorted, mature" />
      <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
        Short description
        <textarea required value={values.description} onChange={(event) => update("description", event.target.value)} className={`${fieldClass} min-h-28`} placeholder="Tell buyers what you are selling. Do not add private contact details here." />
      </label>
      <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold leading-6 text-ink/62 md:col-span-2">
        Examples: maize goes under Grains, groundnuts under Legumes, and yam or cassava under Roots & Tubers.
      </p>
    </div>
  );
}

function TradeStep({ values, update, calculatedTotal }: StepProps & { calculatedTotal: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField
        label="How is the product sold?"
        value={values.sellingMethod}
        onChange={(value) => update("sellingMethod", value as ListingFormState["sellingMethod"])}
        options={["packaged_unit", "weight", "count", "livestock", "volume"]}
        labels={{ packaged_unit: "Packaged unit", weight: "Direct weight", count: "Count or piece", livestock: "Livestock per animal", volume: "Volume" }}
        required
      />

      {values.sellingMethod === "packaged_unit" ? (
        <>
          <SelectField label="Package/container type" value={values.sellingUnit} onChange={(value) => update("sellingUnit", value)} options={packagedUnits} required />
          {values.sellingUnit === "other" ? <TextField label="Custom unit label" value={values.customUnitLabel} onChange={(value) => update("customUnitLabel", value)} required helper={reviewedCustomUnitMessage} /> : null}
          <TextField label="Unit size" type="number" value={values.unitSizeValue} onChange={(value) => update("unitSizeValue", value)} required />
          <SelectField label="Unit-size measure" value={values.unitSizeMeasure} onChange={(value) => update("unitSizeMeasure", value)} options={["kg", "tonnes", "litres", "gallons"]} required />
          <Checkbox label="Unit size is approximate" checked={values.unitSizeApproximate} onChange={(checked) => update("unitSizeApproximate", checked)} />
          <TextField label="Price per package (optional)" type="number" value={values.priceAmount} onChange={(value) => update("priceAmount", value)} disabled={values.priceConfirmedLater} />
          <Checkbox label="Price will be confirmed" checked={values.priceConfirmedLater} onChange={(checked) => update("priceConfirmedLater", checked)} />
          <TextField label="Number of packages available" type="number" value={values.unitsAvailable} onChange={(value) => update("unitsAvailable", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <TextField label="Minimum order in packages" type="number" value={values.minimumOrderValue} onChange={(value) => update("minimumOrderValue", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <Checkbox label="Ask Ghana Growers to help confirm quantity details" checked={values.quantityConfirmedLater} onChange={(checked) => update("quantityConfirmedLater", checked)} />
        </>
      ) : null}

      {values.sellingMethod === "weight" ? (
        <>
          <SelectField label="Weight measure" value={values.sellingUnit} onChange={(value) => { update("sellingUnit", value); update("totalQuantityMeasure", value); update("minimumOrderUnit", value); }} options={["kg", "tonnes"]} required />
          <TextField label="Total weight available" type="number" value={values.totalQuantityValue} onChange={(value) => update("totalQuantityValue", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <TextField label="Price per kg or tonne (optional)" type="number" value={values.priceAmount} onChange={(value) => update("priceAmount", value)} disabled={values.priceConfirmedLater} />
          <TextField label="Minimum order weight" type="number" value={values.minimumOrderValue} onChange={(value) => update("minimumOrderValue", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <Checkbox label="Price will be confirmed" checked={values.priceConfirmedLater} onChange={(checked) => update("priceConfirmedLater", checked)} />
          <Checkbox label="Quantity details will be confirmed" checked={values.quantityConfirmedLater} onChange={(checked) => update("quantityConfirmedLater", checked)} />
        </>
      ) : null}

      {values.sellingMethod === "count" ? (
        <>
          <SelectField label="Item unit" value={values.sellingUnit} onChange={(value) => update("sellingUnit", value)} options={countUnits} required />
          {values.sellingUnit === "other" ? <TextField label="Custom unit label" value={values.customUnitLabel} onChange={(value) => update("customUnitLabel", value)} required helper={reviewedCustomUnitMessage} /> : null}
          <TextField label="Price per item (optional)" type="number" value={values.priceAmount} onChange={(value) => update("priceAmount", value)} disabled={values.priceConfirmedLater} />
          <TextField label="Number available" type="number" value={values.unitsAvailable} onChange={(value) => update("unitsAvailable", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <TextField label="Minimum order" type="number" value={values.minimumOrderValue} onChange={(value) => update("minimumOrderValue", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <Checkbox label="Price will be confirmed" checked={values.priceConfirmedLater} onChange={(checked) => update("priceConfirmedLater", checked)} />
          <Checkbox label="Quantity details will be confirmed" checked={values.quantityConfirmedLater} onChange={(checked) => update("quantityConfirmedLater", checked)} />
        </>
      ) : null}

      {values.sellingMethod === "livestock" ? (
        <>
          <TextField label="Animal type" value={values.sellingUnit} onChange={(value) => update("sellingUnit", value)} placeholder="Goat, sheep, cattle, poultry" required />
          <TextField label="Price per animal/head (optional)" type="number" value={values.priceAmount} onChange={(value) => update("priceAmount", value)} disabled={values.priceConfirmedLater} />
          <TextField label="Number available" type="number" value={values.unitsAvailable} onChange={(value) => update("unitsAvailable", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <TextField label="Minimum number" type="number" value={values.minimumOrderValue} onChange={(value) => update("minimumOrderValue", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <TextField label="Approximate weight range" value={values.unitSizeValue} onChange={(value) => update("unitSizeValue", value)} placeholder="Optional, e.g. 18-25 kg" />
          <TextField label="Health/condition note" value={values.gradeDescription} onChange={(value) => update("gradeDescription", value)} placeholder="Optional" />
          <Checkbox label="Price will be confirmed" checked={values.priceConfirmedLater} onChange={(checked) => update("priceConfirmedLater", checked)} />
        </>
      ) : null}

      {values.sellingMethod === "volume" ? (
        <>
          <SelectField label="Unit/container" value={values.sellingUnit} onChange={(value) => update("sellingUnit", value)} options={volumeUnits} required />
          {values.sellingUnit === "other" ? <TextField label="Custom unit label" value={values.customUnitLabel} onChange={(value) => update("customUnitLabel", value)} required helper={reviewedCustomUnitMessage} /> : null}
          <TextField label="Unit volume" type="number" value={values.unitSizeValue} onChange={(value) => update("unitSizeValue", value)} required />
          <SelectField label="Volume measure" value={values.unitSizeMeasure} onChange={(value) => update("unitSizeMeasure", value)} options={["litres", "gallons"]} required />
          <TextField label="Price per unit (optional)" type="number" value={values.priceAmount} onChange={(value) => update("priceAmount", value)} disabled={values.priceConfirmedLater} />
          <TextField label="Units available" type="number" value={values.unitsAvailable} onChange={(value) => update("unitsAvailable", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <TextField label="Minimum order" type="number" value={values.minimumOrderValue} onChange={(value) => update("minimumOrderValue", value)} required={!values.quantityConfirmedLater} disabled={values.quantityConfirmedLater} />
          <Checkbox label="Price will be confirmed" checked={values.priceConfirmedLater} onChange={(checked) => update("priceConfirmedLater", checked)} />
        </>
      ) : null}

      {calculatedTotal ? (
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-3 text-sm font-bold text-ink/70 md:col-span-2">
          Calculated by Ghana Growers: {values.unitSizeValue || "Unit size"} {values.unitSizeMeasure} x {values.unitsAvailable || "units"} = {calculatedTotal} total
        </div>
      ) : null}
    </div>
  );
}

function AvailabilityStep({ values, update }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField label="Availability status" value={values.availability} onChange={(value) => update("availability", value)} options={availabilityOptions} required />
      <SelectField label="Supply frequency" value={values.supplyFrequency} onChange={(value) => update("supplyFrequency", value)} options={frequencyOptions} required />
      <TextField label="Available-from or harvest date" type="date" value={values.availableFromDate} onChange={(value) => update("availableFromDate", value)} />
      <TextField label="Pickup location" value={values.pickupLocation} onChange={(value) => update("pickupLocation", value)} placeholder="Town or collection point" required />
      <RadioGroup label="Delivery available" value={values.deliveryAvailable} options={["Yes", "No", "To be confirmed"]} onChange={(value) => update("deliveryAvailable", value)} />
      <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
        Delivery details
        <textarea value={values.deliveryDetails} onChange={(event) => update("deliveryDetails", event.target.value)} className={`${fieldClass} min-h-20`} placeholder="Optional. Add delivery area, pickup notes, or write 'Delivery details will be confirmed'." />
      </label>
      <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
        Additional notes
        <textarea value={values.additionalNotes} onChange={(event) => update("additionalNotes", event.target.value)} className={`${fieldClass} min-h-20`} placeholder="Anything Ghana Growers should review before contacting buyers." />
      </label>
    </div>
  );
}

function PhotosStep({ mainImage, additionalImages, setMainImage, onAdditionalImages, removeAdditional }: {
  mainImage: File | null;
  additionalImages: File[];
  setMainImage: (file: File | null) => void;
  onAdditionalImages: (event: ChangeEvent<HTMLInputElement>) => void;
  removeAdditional: (index: number) => void;
}) {
  return (
    <div className="grid gap-4">
      <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold leading-6 text-ink/62">
        Upload clear photos of the actual product you are selling. Pending photos stay private until Ghana Growers reviews the listing.
      </p>
      <label className="grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed border-leaf-700/30 bg-white p-4 text-center transition hover:bg-leaf-50">
        <ImagePlus size={28} className="text-leaf-700" aria-hidden="true" />
        <span className="mt-2 text-sm font-black text-ink">{mainImage ? mainImage.name : "Upload main product photo"}</span>
        <span className="mt-1 text-xs font-semibold text-ink/50">JPG, PNG or WEBP. Max 5MB.</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setMainImage(event.target.files?.[0] ?? null)} />
      </label>
      {mainImage ? <ImagePreview file={mainImage} onRemove={() => setMainImage(null)} label="Main photo" /> : null}
      <label className="grid gap-2 text-sm font-bold text-ink/75">
        Additional photos
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className={fieldClass} onChange={onAdditionalImages} />
        <span className="text-xs font-semibold text-ink/50">Optional. Add up to four extra photos.</span>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {additionalImages.map((file, index) => <ImagePreview key={`${file.name}-${index}`} file={file} onRemove={() => removeAdditional(index)} label={`Photo ${index + 2}`} />)}
      </div>
    </div>
  );
}

function ReviewStep({ values, photos, calculatedTotal, update }: StepProps & { photos: File[]; calculatedTotal: string }) {
  const rows = [
    ["Seller", values.farmBusinessName],
    ["Contact", values.contactPerson],
    ["Product", values.productName],
    ["Category", `${values.marketplacePathway} / ${values.subcategory}`],
    ["Selling method", values.sellingMethod.replace(/_/g, " ")],
    ["Package/unit", values.sellingUnit === "other" ? values.customUnitLabel : values.sellingUnit],
    ["Price", values.priceConfirmedLater || !values.priceAmount ? "Price will be confirmed" : `GHS ${values.priceAmount}`],
    ["Quantity", values.quantityConfirmedLater ? "Quantity details will be confirmed" : values.unitsAvailable || values.totalQuantityValue],
    ["Calculated total", calculatedTotal || "Not applicable"],
    ["Minimum order", values.minimumOrderValue || "To be confirmed"],
    ["Availability", values.availability],
    ["Frequency", values.supplyFrequency],
    ["Location", `${values.district}, ${values.region}`],
    ["Photos", `${photos.length} photo${photos.length === 1 ? "" : "s"}`]
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-md bg-leaf-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</span>
            <span className="text-sm font-bold text-ink/75 sm:text-right">{value || "Not supplied"}</span>
          </div>
        ))}
      </div>
      <Checkbox
        label="I confirm that the information and photos are accurate to the best of my knowledge."
        checked={values.confirmation}
        onChange={(checked) => update("confirmation", checked)}
      />
    </div>
  );
}

type StepProps = {
  values: ListingFormState;
  update: <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => void;
};

function validateStep(step: number, values: ListingFormState, mainImage: File | null) {
  if (step === 0) {
    return Boolean(values.farmBusinessName && values.contactPerson && values.phoneNumber && (values.whatsappSameAsPhone || values.whatsappNumber) && values.region && values.district && values.existingMember && values.sellerType);
  }

  if (step === 1) {
    return Boolean(values.productName && values.marketplacePathway && values.subcategory && values.description);
  }

  if (step === 2) {
    const hasUnit = values.sellingUnit !== "other" || values.customUnitLabel;
    const hasQuantity = values.quantityConfirmedLater || values.unitsAvailable || values.totalQuantityValue;
    const hasMinimum = values.quantityConfirmedLater || values.minimumOrderValue;

    return Boolean(values.sellingMethod && hasUnit && hasQuantity && hasMinimum);
  }

  if (step === 3) {
    return Boolean(values.availability && values.supplyFrequency && values.pickupLocation);
  }

  if (step === 4) {
    return Boolean(mainImage);
  }

  return values.confirmation;
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

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  placeholder,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <input
        required={required}
        disabled={disabled}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
      {helper ? <span className="text-xs font-semibold text-earth-700">{helper}</span> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options, labels, required = false, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((option) => <option key={option} value={option}>{labels?.[option] ?? (option === "other" ? "Other (review required)" : option)}</option>)}
      </select>
    </label>
  );
}

function RadioGroup({ label, value, options, onChange, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <fieldset className="grid gap-2 text-sm font-bold text-ink/75" aria-required={required}>
      <legend>{label}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex min-h-11 items-center gap-2 rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-sm font-bold text-ink/70">
            <input type="radio" checked={value === option} onChange={() => onChange(option)} className="h-4 w-4 text-leaf-700 focus:ring-leaf-700" />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-start gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-3 text-sm font-bold text-ink/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-leaf-900/30 text-leaf-700 focus:ring-leaf-700"
      />
      {label}
    </label>
  );
}

function ImagePreview({ file, label, onRemove }: { file: File; label: string; onRemove: () => void }) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  return (
    <div className="flex items-center gap-3 rounded-md border border-leaf-900/10 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- Object URL previews are local files selected before upload. */}
      <img src={previewUrl} alt={`${label} preview`} className="h-16 w-16 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-ink">{label}</p>
        <p className="truncate text-xs font-semibold text-ink/55">{file.name}</p>
      </div>
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="focus-ring grid h-9 w-9 place-items-center rounded-md bg-leaf-50 text-ink/65">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function SuccessMessage({ reference, message }: { reference?: string; message: string }) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <CheckCircle2 size={34} className="text-leaf-700" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-black text-ink">Submission received</h2>
      {reference ? <p className="mt-2 text-sm font-black uppercase tracking-wide text-earth-700">Reference: {reference}</p> : null}
      <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">{message}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a href="/marketplace" className="gg-button-secondary justify-center">Return to Marketplace</a>
        <a href="/sell" className="gg-button-primary justify-center">Back to Sell page</a>
      </div>
    </div>
  );
}
