"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Send, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { ghanaRegions } from "@/data/ghanaRegions";
import { freshProduceSubcategories } from "@/lib/marketplace/taxonomy";
import { formatMarketplaceMeasure, marketplacePriceLine, marketplaceQuantityLine, marketplaceTradeLines, reviewedCustomUnitMessage } from "@/lib/marketplace/trade";
import type { Product } from "@/types";

const fieldClass = "gg-field min-h-11";
const steps = ["Seller details", "Product details", "Price and quantity", "Availability", "Photos", "Review"] as const;
const marketplacePathways = ["Fresh Produce", "Farm Inputs", "Livestock", "Tools & Equipment"] as const;
const availabilityOptions = ["Available now", "Seasonal", "Ask availability", "Unavailable"];
const frequencyOptions = ["One-time", "Weekly", "Monthly", "On request"];
const sizeMeasureOptions = ["kg", "g", "tonnes", "litres", "gallons", "pieces", "eggs", "bottles", "bunches", "heads", "other"];

type SellingChoice = {
  value: string;
  label: string;
  method: ListingFormState["sellingMethod"];
  unit: string;
  unitSizeMeasure: string;
  totalQuantityMeasure: string;
  needsSize: boolean;
  priceExample: string;
  sizeExample?: string;
  quantityExample: string;
};

const sellingChoices: SellingChoice[] = [
  { value: "sack", label: "Sack", method: "packaged_unit", unit: "sack", unitSizeMeasure: "kg", totalQuantityMeasure: "kg", needsSize: true, priceExample: "Example: GH\u20b5700 per sack", sizeExample: "Example: 50 kg in one sack", quantityExample: "Example: 10 sacks" },
  { value: "bag", label: "Bag", method: "packaged_unit", unit: "bag", unitSizeMeasure: "kg", totalQuantityMeasure: "kg", needsSize: true, priceExample: "Example: GH\u20b5250 per bag", sizeExample: "Example: 25 kg in one bag", quantityExample: "Example: 20 bags" },
  { value: "crate", label: "Crate", method: "packaged_unit", unit: "crate", unitSizeMeasure: "bottles", totalQuantityMeasure: "bottles", needsSize: true, priceExample: "Example: GH\u20b5120 per crate", sizeExample: "Example: 12 bottles in one crate", quantityExample: "Example: 15 crates" },
  { value: "basket", label: "Basket", method: "packaged_unit", unit: "basket", unitSizeMeasure: "kg", totalQuantityMeasure: "kg", needsSize: true, priceExample: "Example: GH\u20b580 per basket", sizeExample: "Example: 12 kg in one basket", quantityExample: "Example: 8 baskets" },
  { value: "carton", label: "Carton", method: "packaged_unit", unit: "carton", unitSizeMeasure: "pieces", totalQuantityMeasure: "pieces", needsSize: true, priceExample: "Example: GH\u20b5150 per carton", sizeExample: "Example: 24 pieces in one carton", quantityExample: "Example: 10 cartons" },
  { value: "box", label: "Box", method: "packaged_unit", unit: "box", unitSizeMeasure: "pieces", totalQuantityMeasure: "pieces", needsSize: true, priceExample: "Example: GH\u20b5100 per box", sizeExample: "Example: 20 pieces in one box", quantityExample: "Example: 12 boxes" },
  { value: "tray", label: "Tray", method: "packaged_unit", unit: "tray", unitSizeMeasure: "eggs", totalQuantityMeasure: "eggs", needsSize: true, priceExample: "Example: GH\u20b560 per tray", sizeExample: "Example: 30 eggs in one tray", quantityExample: "Example: 20 trays" },
  { value: "bunch", label: "Bunch", method: "packaged_unit", unit: "bunch", unitSizeMeasure: "pieces", totalQuantityMeasure: "pieces", needsSize: true, priceExample: "Example: GH\u20b535 per bunch", sizeExample: "Example: 8 plantains in one bunch", quantityExample: "Example: 50 bunches" },
  { value: "piece", label: "Piece", method: "count", unit: "piece", unitSizeMeasure: "", totalQuantityMeasure: "", needsSize: false, priceExample: "Example: GH\u20b55 per piece", quantityExample: "Example: 100 pieces" },
  { value: "kg", label: "Kilogram", method: "weight", unit: "kg", unitSizeMeasure: "", totalQuantityMeasure: "kg", needsSize: false, priceExample: "Example: GH\u20b514 per kg", quantityExample: "Example: 500 kg" },
  { value: "tonnes", label: "Tonne", method: "weight", unit: "tonnes", unitSizeMeasure: "", totalQuantityMeasure: "tonnes", needsSize: false, priceExample: "Example: GH\u20b54,000 per tonne", quantityExample: "Example: 2 tonnes" },
  { value: "litres", label: "Litre", method: "volume", unit: "litres", unitSizeMeasure: "", totalQuantityMeasure: "litres", needsSize: false, priceExample: "Example: GH\u20b530 per litre", quantityExample: "Example: 200 litres" },
  { value: "head", label: "Head", method: "livestock", unit: "head", unitSizeMeasure: "", totalQuantityMeasure: "", needsSize: false, priceExample: "Example: GH\u20b5900 per head", quantityExample: "Example: 12 head" },
  { value: "other", label: "Other", method: "packaged_unit", unit: "other", unitSizeMeasure: "kg", totalQuantityMeasure: "kg", needsSize: true, priceExample: "Example: GH\u20b570 per unit", sizeExample: "Example: 10 kg in one local basket", quantityExample: "Example: 10 units" }
];

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
  unitSizeApproximate: true,
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

      if (key === "sellingUnit") {
        next.minimumOrderUnit = String(value);
      }

      return next;
    });
  }

  function applySellingChoice(choiceValue: string) {
    const choice = sellingChoices.find((item) => item.value === choiceValue) ?? sellingChoices[0];

    setValues((current) => ({
      ...current,
      sellingMethod: choice.method,
      sellingUnit: choice.unit,
      customUnitLabel: choice.unit === "other" ? current.customUnitLabel : "",
      unitSizeValue: choice.needsSize ? current.unitSizeValue : "",
      unitSizeMeasure: choice.unitSizeMeasure,
      unitSizeApproximate: choice.needsSize ? true : false,
      totalQuantityValue: isDirectQuantityChoice(choice) ? current.totalQuantityValue : "",
      totalQuantityMeasure: choice.totalQuantityMeasure,
      unitsAvailable: isDirectQuantityChoice(choice) ? "" : current.unitsAvailable,
      minimumOrderUnit: choice.unit,
      priceBasis: choice.unit
    }));
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
        {step === 2 ? <TradeStep values={values} update={update} calculatedTotal={calculatedTotal.label} onSellingChoice={applySellingChoice} /> : null}
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

function TradeStep({ values, update, calculatedTotal, onSellingChoice }: StepProps & { calculatedTotal: string; onSellingChoice: (choiceValue: string) => void }) {
  const selectedChoice = selectedSellingChoice(values);
  const unitLabel = displayUnitLabel(values);
  const usesDirectQuantity = isDirectQuantityValues(values);
  const quantityValue = usesDirectQuantity ? values.totalQuantityValue : values.unitsAvailable;
  const quantityChange = (value: string) => {
    if (usesDirectQuantity) {
      update("totalQuantityValue", value);
      return;
    }

    update("unitsAvailable", value);
  };
  const minimumHelper = values.minimumOrderValue ? `Minimum ${values.minimumOrderValue} ${unitLabel}` : "Leave blank if there is no minimum order.";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField
        label="How do you sell this product?"
        value={selectedChoice.value}
        onChange={onSellingChoice}
        options={sellingChoices.map((choice) => choice.value)}
        labels={Object.fromEntries(sellingChoices.map((choice) => [choice.value, choice.label]))}
        required
      />

      {values.sellingUnit === "other" ? (
        <TextField
          label="What do you call this unit?"
          value={values.customUnitLabel}
          onChange={(value) => update("customUnitLabel", value)}
          required
          placeholder="Example: olonka, paint rubber, maxi bag"
          helper={reviewedCustomUnitMessage}
        />
      ) : null}

      <TextField
        label="What is the price for one?"
        type="number"
        value={values.priceAmount}
        onChange={(value) => update("priceAmount", value)}
        disabled={values.priceConfirmedLater}
        placeholder={selectedChoice.priceExample}
      />
      <Checkbox label="Ask for price" checked={values.priceConfirmedLater} onChange={(checked) => update("priceConfirmedLater", checked)} />

      {selectedChoice.needsSize ? (
        <>
          <TextField
            label="Approximately how much or how many are in one?"
            type="number"
            value={values.unitSizeValue}
            onChange={(value) => update("unitSizeValue", value)}
            placeholder={selectedChoice.sizeExample}
          />
          <SelectField
            label="Measure inside one"
            value={values.unitSizeMeasure}
            onChange={(value) => {
              update("unitSizeMeasure", value);
              update("totalQuantityMeasure", value);
            }}
            options={sizeMeasureOptions}
          />
          <Checkbox label="This amount is approximate" checked={values.unitSizeApproximate} onChange={(checked) => update("unitSizeApproximate", checked)} />
        </>
      ) : null}

      <TextField
        label="How many do you have available?"
        type="number"
        value={quantityValue}
        onChange={quantityChange}
        disabled={values.quantityConfirmedLater}
        placeholder={selectedChoice.quantityExample}
      />
      <Checkbox label="Ask Ghana Growers to help confirm quantity details" checked={values.quantityConfirmedLater} onChange={(checked) => update("quantityConfirmedLater", checked)} />

      <TextField
        label="Do buyers need to order at least a certain amount?"
        type="number"
        value={values.minimumOrderValue}
        onChange={(value) => update("minimumOrderValue", value)}
        disabled={values.quantityConfirmedLater}
        placeholder={`Optional, e.g. 2 ${unitLabel}`}
        helper={minimumHelper}
      />

      {calculatedTotal ? (
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-3 text-sm font-bold text-ink/70 md:col-span-2">
          Calculated by Ghana Growers: {values.unitsAvailable || "0"} {unitLabel} x {values.unitSizeValue || "0"} {values.unitSizeMeasure} = {calculatedTotal} total
        </div>
      ) : null}
      <CommercialSummary values={values} />
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
  const product = listingPreviewProduct(values);
  const tradeLines = marketplaceTradeLines(product);
  const sizeLine = tradeLines.find((line) => line.label === "Approximate size" || line.label === "Size per unit")?.value;
  const totalLine = tradeLines.find((line) => line.label === "Calculated total")?.value;
  const minimumOrder = tradeLines.find((line) => line.label === "Minimum order")?.value;
  const rows = [
    ["Seller", values.farmBusinessName],
    ["Contact", values.contactPerson],
    ["Product", values.productName],
    ["Category", `${values.marketplacePathway} / ${values.subcategory}`],
    ["Selling format", displayUnitLabel(values)],
    ["Price", marketplacePriceLine(product)],
    ["Approximate size", sizeLine ?? "Not supplied"],
    ["Available", values.quantityConfirmedLater ? "Quantity details will be confirmed" : marketplaceQuantityLine(product)],
    ["Calculated total", totalLine ?? (calculatedTotal || "Not applicable")],
    ["Minimum order", minimumOrder ? `Minimum ${minimumOrder}` : "No minimum order"],
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
    const hasQuantity = values.quantityConfirmedLater || (isDirectQuantityValues(values) ? values.totalQuantityValue : values.unitsAvailable);

    return Boolean(values.sellingMethod && hasUnit && hasQuantity);
  }

  if (step === 3) {
    return Boolean(values.availability && values.supplyFrequency && values.pickupLocation);
  }

  if (step === 4) {
    return Boolean(mainImage);
  }

  return values.confirmation;
}

function selectedSellingChoice(values: ListingFormState) {
  return sellingChoices.find((choice) => choice.method === values.sellingMethod && choice.unit === values.sellingUnit) ?? sellingChoices[0];
}

function isDirectQuantityChoice(choice: Pick<SellingChoice, "method" | "unit">) {
  return choice.method === "weight" || (choice.method === "volume" && ["litres", "gallons"].includes(choice.unit));
}

function isDirectQuantityValues(values: Pick<ListingFormState, "sellingMethod" | "sellingUnit">) {
  return values.sellingMethod === "weight" || (values.sellingMethod === "volume" && ["litres", "gallons"].includes(values.sellingUnit));
}

function displayUnitLabel(values: Pick<ListingFormState, "sellingUnit" | "customUnitLabel">) {
  if (values.sellingUnit === "other") {
    return values.customUnitLabel || "custom unit";
  }

  return values.sellingUnit;
}

function listingPreviewProduct(values: ListingFormState): Product {
  const calculated = calculateTotal(values.sellingMethod, values.unitSizeValue, values.unitsAvailable, values.unitSizeMeasure, values.unitSizeApproximate);
  const directQuantity = isDirectQuantityValues(values);

  return {
    id: "preview",
    name: values.productName || "Your product",
    category: values.subcategory || values.marketplacePathway,
    location: values.district,
    region: values.region,
    seller: values.farmBusinessName,
    description: values.description,
    quantity: "",
    unit: "",
    sellingMethod: values.sellingMethod,
    sellingUnit: values.sellingUnit,
    customUnitLabel: values.customUnitLabel || undefined,
    customUnitReviewed: values.sellingUnit !== "other",
    unitSizeValue: values.unitSizeValue || undefined,
    unitSizeMeasure: values.unitSizeMeasure || undefined,
    unitSizeApproximate: values.unitSizeApproximate,
    priceAmount: values.priceConfirmedLater ? undefined : values.priceAmount || undefined,
    priceCurrency: "GHS",
    priceBasis: values.sellingUnit,
    unitsAvailable: directQuantity || values.quantityConfirmedLater ? undefined : values.unitsAvailable || undefined,
    totalQuantityValue: values.quantityConfirmedLater ? undefined : calculated.value || (directQuantity ? values.totalQuantityValue : undefined),
    totalQuantityMeasure: values.quantityConfirmedLater ? undefined : calculated.measure || (directQuantity ? values.totalQuantityMeasure : undefined),
    minimumOrderValue: values.minimumOrderValue || undefined,
    minimumOrderUnit: values.minimumOrderUnit || values.sellingUnit,
    supplyFrequency: values.supplyFrequency,
    availableFromDate: values.availableFromDate,
    gradeDescription: values.gradeDescription,
    deliveryDetails: values.deliveryDetails,
    image: "",
    available: values.availability,
    datePosted: ""
  };
}

function CommercialSummary({ values }: { values: ListingFormState }) {
  const product = listingPreviewProduct(values);
  const minimumOrder = marketplaceTradeLines(product).find((line) => line.label === "Minimum order")?.value;

  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-4 text-sm shadow-sm md:col-span-2">
      <p className="text-xs font-black uppercase tracking-wide text-earth-700">Your listing will show</p>
      <div className="mt-3 grid gap-1.5">
        <p className="font-black text-ink">{marketplacePriceLine(product)}</p>
        <p className="font-semibold text-ink/70">{values.quantityConfirmedLater ? "Ask for quantity" : marketplaceQuantityLine(product)}</p>
        {minimumOrder ? <p className="font-semibold text-ink/70">Minimum {minimumOrder}</p> : <p className="font-semibold text-ink/50">No minimum order</p>}
      </div>
    </div>
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
    label: `${approximate ? "approximately " : ""}${formatMarketplaceMeasure(String(total), unitSizeMeasure)}`
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
