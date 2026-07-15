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
const submitListingDraftStorageKey = "ghana-growers-submit-listing-draft-v1";
type SellerTypeOption = "Farmer" | "Supplier";
const sellerTypeCards: Record<SellerTypeOption, { title: string; description: string }> = {
  Farmer: {
    title: "Farmer / Producer",
    description: "Produce or livestock"
  },
  Supplier: {
    title: "Supplier",
    description: "Farm inputs or equipment"
  }
};
const sellerCategoryOptions: Record<SellerTypeOption, readonly string[]> = {
  Farmer: ["Fresh Produce", "Livestock"],
  Supplier: ["Farm Inputs", "Tools & Equipment"]
};
const farmInputSubcategories = [
  "Seeds & Seedlings",
  "Fertilizers & Soil Inputs",
  "Crop Protection",
  "Animal Feed",
  "Irrigation Supplies",
  "Packaging & Storage",
  "Other Farm Inputs"
] as const;
const marketplaceSubcategories: Partial<Record<typeof marketplacePathways[number], readonly string[]>> = {
  "Fresh Produce": freshProduceSubcategories,
  "Farm Inputs": farmInputSubcategories,
  "Tools & Equipment": [
    "Hand Tools",
    "Sprayers",
    "Irrigation Equipment",
    "Farm Machinery",
    "Spare Parts & Accessories",
    "Post-Harvest Equipment",
    "Other Tools & Equipment"
  ]
};
const categoryHelpText: Partial<Record<typeof marketplacePathways[number], string>> = {
  "Fresh Produce": "Not sure? Maize \u2192 Grains \u00b7 Groundnuts \u2192 Legumes \u00b7 Yam/Cassava \u2192 Roots & Tubers",
  "Farm Inputs": "Tomato seeds \u2192 Seeds & Seedlings \u00b7 NPK \u2192 Fertilizers & Soil Inputs \u00b7 Pesticide \u2192 Crop Protection",
  "Tools & Equipment": "Knapsack sprayer \u2192 Sprayers \u00b7 Water pump \u2192 Irrigation Equipment"
};
const availabilityOptions = ["Available now", "Seasonal", "Ask availability", "Unavailable"];
const frequencyOptions = ["One-time", "Weekly", "Monthly", "On request"];
const sizeMeasureOptions = ["kg", "g", "tonnes", "litres", "gallons", "pieces", "eggs", "bottles", "bunches", "heads", "other"];
const sizeMeasureOptionsByUnit: Record<string, string[]> = {
  bag: ["kg", "g", "tonnes", "pieces", "other"],
  basket: ["kg", "pieces", "bunches", "heads", "other"],
  box: ["pieces", "bottles", "kg", "other"],
  bunch: ["pieces", "heads", "kg", "other"],
  carton: ["pieces", "bottles", "kg", "other"],
  crate: ["bottles", "pieces", "kg", "litres", "other"],
  sack: ["kg", "g", "tonnes", "pieces", "other"],
  tray: ["eggs", "pieces", "other"],
  other: [...sizeMeasureOptions]
};

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
  marketplacePathway: "",
  subcategory: "",
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
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [success, setSuccess] = useState<{ message: string; reference?: string } | null>(null);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedTotal = useMemo(
    () => calculateTotal(values.sellingMethod, values.unitSizeValue, values.unitsAvailable, values.unitSizeMeasure, values.unitSizeApproximate),
    [values.sellingMethod, values.unitSizeValue, values.unitsAvailable, values.unitSizeMeasure, values.unitSizeApproximate]
  );
  const currentStepValid = validateStep(step, values, mainImage);
  const photoFiles = [mainImage, ...additionalImages].filter((file): file is File => Boolean(file));

  useEffect(() => {
    const draft = restoreListingFormDraft();

    if (draft) {
      setValues(draft);
    }

    setIsDraftReady(true);
  }, []);

  useEffect(() => {
    if (!isDraftReady || success) {
      return;
    }

    saveListingFormDraft(values);
  }, [isDraftReady, success, values]);

  function update<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setError("");
    setInvalidFields((currentInvalidFields) => {
      if (!currentInvalidFields.size) {
        return currentInvalidFields;
      }

      const nextInvalidFields = new Set(currentInvalidFields);
      nextInvalidFields.delete(String(key));

      if (key === "sellerType" || key === "marketplacePathway") {
        nextInvalidFields.delete("marketplacePathway");
        nextInvalidFields.delete("subcategory");
      }

      return nextInvalidFields;
    });

    setValues((current) => applyListingFormUpdate(current, key, value));
  }

  function handleContinue() {
    const nextValues = valuesForStepValidation(step, values);
    const validation = validateStepDetails(step, nextValues, mainImage);

    if (!validation.valid) {
      setError(validation.message ?? "Please complete the required fields to continue.");
      setInvalidFields(new Set(validation.field ? [validation.field] : []));
      focusField(validation.field);
      return;
    }

    setError("");
    setInvalidFields(new Set());
    if (nextValues !== values) {
      setValues(nextValues);
    }
    setStep((current) => Math.min(steps.length - 1, current + 1));
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
    clearListingFormDraft();
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
        {step === 1 ? <ProductStep values={values} update={update} invalidFields={invalidFields} /> : null}
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
            disabled={isSubmitting}
            onClick={handleContinue}
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
      <RadioGroup fieldName="existingMember" label="Are you already part of the Ghana Growers network?" value={values.existingMember} options={["Yes", "No", "Not sure"]} onChange={(value) => update("existingMember", value as ListingFormState["existingMember"])} required />
      <SellerTypeCardGroup value={values.sellerType} onChange={(value) => update("sellerType", value)} />
    </div>
  );
}

function ProductStep({ values, update, invalidFields }: StepProps & { invalidFields: Set<string> }) {
  const categoryOptions = categoryOptionsForSellerType(values.sellerType);
  const subcategoryOptions = subcategoryOptionsFor(values.marketplacePathway);
  const categoryHelp = categoryHelpFor(values.marketplacePathway);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField fieldName="productName" invalid={invalidFields.has("productName")} label="Product/listing title" value={values.productName} onChange={(value) => update("productName", value)} placeholder="Example: Yellow maize, tomato crates, fertilizer" required />
      <SelectField
        fieldName="marketplacePathway"
        invalid={invalidFields.has("marketplacePathway")}
        label="Category"
        value={values.marketplacePathway}
        onChange={(value) => update("marketplacePathway", value)}
        options={categoryOptions}
        required
        placeholder={values.sellerType ? "Select category" : "Select seller type first"}
      />
      {subcategoryOptions.length ? (
        <SelectField
          fieldName="subcategory"
          invalid={invalidFields.has("subcategory")}
          label="Subcategory"
          value={values.subcategory}
          onChange={(value) => update("subcategory", value)}
          options={subcategoryOptions}
          required
          placeholder="Select subcategory"
        />
      ) : null}
      <TextField label="Variety or product type" value={values.variety} onChange={(value) => update("variety", value)} placeholder="Optional, e.g. Obaatanpa maize" />
      <TextField label="Grade or quality notes" value={values.gradeDescription} onChange={(value) => update("gradeDescription", value)} placeholder="Optional, e.g. dried, sorted, mature" />
      <label className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2">
        Short description
        <textarea
          required
          data-field="description"
          aria-invalid={invalidFields.has("description") ? true : undefined}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          className={`${fieldClass} min-h-28 ${invalidFields.has("description") ? "border-red-400 ring-2 ring-red-100" : ""}`}
          placeholder="Tell buyers what you are selling. Do not add private contact details here."
        />
      </label>
      {categoryHelp ? <p className="text-xs font-semibold leading-5 text-ink/55 md:col-span-2">{categoryHelp}</p> : null}
    </div>
  );
}

function TradeStep({ values, update, calculatedTotal, onSellingChoice }: StepProps & { calculatedTotal: string; onSellingChoice: (choiceValue: string) => void }) {
  const selectedChoice = selectedSellingChoice(values);
  const unitLabel = displayUnitLabel(values);
  const unitInsideOptions = sizeMeasureOptionsForChoice(selectedChoice);
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
            label={`Approximately how much or how many are in one ${unitLabel}?`}
            type="number"
            value={values.unitSizeValue}
            onChange={(value) => update("unitSizeValue", value)}
            placeholder={selectedChoice.sizeExample}
          />
          <SelectField
            label="Unit inside one"
            value={values.unitSizeMeasure}
            onChange={(value) => {
              update("unitSizeMeasure", value);
              update("totalQuantityMeasure", value);
            }}
            options={unitInsideOptions}
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
  const categoryLabel = values.subcategory ? `${values.marketplacePathway} / ${values.subcategory}` : values.marketplacePathway;
  const rows = [
    ["Seller", values.farmBusinessName],
    ["Contact", values.contactPerson],
    ["Product", values.productName],
    ["Category", categoryLabel],
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
  return validateStepDetails(step, values, mainImage).valid;
}

function isSellerTypeOption(value: string): value is SellerTypeOption {
  return value === "Farmer" || value === "Supplier";
}

function normalizeListingFormSellerCategory(values: ListingFormState): ListingFormState {
  const sellerType = isSellerTypeOption(values.sellerType) ? values.sellerType : "";
  const allowedCategories = categoryOptionsForSellerType(sellerType);
  const marketplacePathway = allowedCategories.includes(values.marketplacePathway) ? values.marketplacePathway : "";
  const subcategoryOptions = subcategoryOptionsFor(marketplacePathway);
  const subcategory = subcategoryOptions.length && subcategoryOptions.includes(values.subcategory) ? values.subcategory : "";

  return {
    ...values,
    sellerType,
    marketplacePathway,
    subcategory
  };
}

function applyListingFormUpdate<K extends keyof ListingFormState>(current: ListingFormState, key: K, value: ListingFormState[K]): ListingFormState {
  const next = { ...current, [key]: value };

  if (key === "whatsappSameAsPhone" && value === true) {
    next.whatsappNumber = current.phoneNumber;
  }

  if (key === "phoneNumber" && current.whatsappSameAsPhone) {
    next.whatsappNumber = String(value);
  }

  if (key === "marketplacePathway") {
    next.subcategory = "";
  }

  if (key === "sellerType") {
    return normalizeListingFormSellerCategory(next);
  }

  if (key === "sellingUnit") {
    next.minimumOrderUnit = String(value);
  }

  return next;
}

function checkedSellerTypeFromDom(fallback: ListingFormState["sellerType"]) {
  if (typeof document === "undefined") {
    return fallback;
  }

  const selected = document.querySelector<HTMLInputElement>('input[name="sellerType"]:checked')?.value ?? fallback;
  return isSellerTypeOption(selected) ? selected : fallback;
}

function valuesForStepValidation(step: number, values: ListingFormState) {
  if (step !== 0) {
    return values;
  }

  const sellerType = checkedSellerTypeFromDom(values.sellerType);

  if (sellerType === values.sellerType) {
    return values;
  }

  return applyListingFormUpdate(values, "sellerType", sellerType);
}

function normalizeListingFormDraft(input: unknown): ListingFormState | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const draft = input as Partial<ListingFormState>;
  const next = { ...initialState } as Record<keyof ListingFormState, string | boolean>;

  (Object.keys(initialState) as Array<keyof ListingFormState>).forEach((key) => {
    const value = draft[key];

    if (typeof initialState[key] === "boolean") {
      next[key] = value === true;
      return;
    }

    if (typeof value === "string") {
      next[key] = value;
    }
  });

  return normalizeListingFormSellerCategory(next as ListingFormState);
}

function restoreListingFormDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(submitListingDraftStorageKey);
    return stored ? normalizeListingFormDraft(JSON.parse(stored)) : null;
  } catch {
    window.sessionStorage.removeItem(submitListingDraftStorageKey);
    return null;
  }
}

function saveListingFormDraft(values: ListingFormState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(submitListingDraftStorageKey, JSON.stringify(values));
  } catch {
    // Draft recovery is helpful but non-critical.
  }
}

function clearListingFormDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(submitListingDraftStorageKey);
}

function validateStepDetails(step: number, values: ListingFormState, mainImage: File | null): { valid: boolean; message?: string; field?: string } {
  if (step === 0) {
    if (!values.farmBusinessName) return { valid: false, message: "Please enter your farm or business name to continue.", field: "farmBusinessName" };
    if (!values.contactPerson) return { valid: false, message: "Please enter a contact person to continue.", field: "contactPerson" };
    if (!values.phoneNumber) return { valid: false, message: "Please enter a phone number to continue.", field: "phoneNumber" };
    if (!values.whatsappSameAsPhone && !values.whatsappNumber) return { valid: false, message: "Please enter a WhatsApp number or mark it as same as phone.", field: "whatsappNumber" };
    if (!values.region) return { valid: false, message: "Please select a region to continue.", field: "region" };
    if (!values.district) return { valid: false, message: "Please enter your district or town to continue.", field: "district" };
    if (!values.existingMember) return { valid: false, message: "Please answer whether you are already part of the Ghana Growers network.", field: "existingMember" };
    if (!values.sellerType) return { valid: false, message: "Please select a seller type to continue.", field: "sellerType" };
    return { valid: true };
  }

  if (step === 1) {
    const categoryOptions = categoryOptionsForSellerType(values.sellerType);
    const subcategoryOptions = subcategoryOptionsFor(values.marketplacePathway);
    if (!values.productName) return { valid: false, message: "Please enter a product or listing title to continue.", field: "productName" };
    if (!values.marketplacePathway || !categoryOptions.includes(values.marketplacePathway)) {
      return { valid: false, message: "Please select a category to continue.", field: "marketplacePathway" };
    }
    if (subcategoryOptions.length && !values.subcategory) {
      return { valid: false, message: "Please select a subcategory to continue.", field: "subcategory" };
    }
    if (!values.description) return { valid: false, message: "Please add a short description to continue.", field: "description" };
    return { valid: true };
  }

  if (step === 2) {
    const hasUnit = values.sellingUnit !== "other" || values.customUnitLabel;
    const hasQuantity = values.quantityConfirmedLater || (isDirectQuantityValues(values) ? values.totalQuantityValue : values.unitsAvailable);

    if (!values.sellingMethod) return { valid: false, message: "Please select how you sell this product.", field: "sellingMethod" };
    if (!hasUnit) return { valid: false, message: "Please enter the unit name to continue.", field: "customUnitLabel" };
    if (!hasQuantity) return { valid: false, message: "Please enter how many you have available, or ask Ghana Growers to confirm quantity.", field: "unitsAvailable" };
    return { valid: true };
  }

  if (step === 3) {
    if (!values.availability) return { valid: false, message: "Please select availability status to continue.", field: "availability" };
    if (!values.supplyFrequency) return { valid: false, message: "Please select supply frequency to continue.", field: "supplyFrequency" };
    if (!values.pickupLocation) return { valid: false, message: "Please enter a pickup location to continue.", field: "pickupLocation" };
    return { valid: true };
  }

  if (step === 4) {
    if (!mainImage) return { valid: false, message: "Please upload one clear product photo to continue.", field: "mainImage" };
    return { valid: true };
  }

  return { valid: Boolean(values.confirmation), message: values.confirmation ? undefined : "Please confirm the information before submitting.", field: "confirmation" };
}

function selectedSellingChoice(values: ListingFormState) {
  return sellingChoices.find((choice) => choice.method === values.sellingMethod && choice.unit === values.sellingUnit) ?? sellingChoices[0];
}

function categoryOptionsForSellerType(sellerType: string) {
  return [...(sellerCategoryOptions[sellerType as SellerTypeOption] ?? [])];
}

function subcategoryOptionsFor(pathway: string) {
  return [...(marketplaceSubcategories[pathway as typeof marketplacePathways[number]] ?? [])];
}

function categoryHelpFor(pathway: string) {
  return categoryHelpText[pathway as typeof marketplacePathways[number]] ?? "";
}

function sizeMeasureOptionsForChoice(choice: Pick<SellingChoice, "unit">) {
  return sizeMeasureOptionsByUnit[choice.unit] ?? [...sizeMeasureOptions];
}

function focusField(field?: string) {
  if (!field || typeof window === "undefined") {
    return;
  }

  window.setTimeout(() => {
    const target = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus();
  }, 0);
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
  helper,
  fieldName,
  invalid = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helper?: string;
  fieldName?: string;
  invalid?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <input
        data-field={fieldName}
        aria-invalid={invalid ? true : undefined}
        required={required}
        disabled={disabled}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} ${invalid ? "border-red-400 ring-2 ring-red-100" : ""}`}
      />
      {helper ? <span className="text-xs font-semibold text-earth-700">{helper}</span> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options, labels, required = false, placeholder, fieldName, invalid = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
  required?: boolean;
  placeholder?: string;
  fieldName?: string;
  invalid?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink/75">
      {label}
      <select
        data-field={fieldName}
        aria-invalid={invalid ? true : undefined}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} ${invalid ? "border-red-400 ring-2 ring-red-100" : ""}`}
      >
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((option) => <option key={option} value={option}>{labels?.[option] ?? (option === "other" ? "Other (review required)" : option)}</option>)}
      </select>
    </label>
  );
}

function SellerTypeCardGroup({ value, onChange }: { value: ListingFormState["sellerType"]; onChange: (value: SellerTypeOption) => void }) {
  return (
    <fieldset data-field="sellerType" tabIndex={-1} className="grid gap-2 text-sm font-bold text-ink/75 md:col-span-2" aria-required="true">
      <legend>Seller type</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["Farmer", "Supplier"] as SellerTypeOption[]).map((option) => {
          const card = sellerTypeCards[option];
          const isSelected = value === option;

          return (
            <label
              key={option}
              className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-md border bg-white p-4 text-left transition ${
                isSelected
                  ? "border-leaf-700 shadow-sm ring-2 ring-leaf-600/20"
                  : "border-leaf-900/10 hover:border-leaf-700/35 hover:bg-leaf-50"
              }`}
            >
              <input
                type="radio"
                name="sellerType"
                value={option}
                checked={isSelected}
                onChange={() => onChange(option)}
                className="mt-1 h-4 w-4 shrink-0 text-leaf-700 focus:ring-leaf-700"
              />
              <span className="grid gap-1">
                <span className="text-base font-black leading-5 text-ink">{card.title}</span>
                <span className="text-sm font-semibold leading-5 text-ink/58">{card.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function RadioGroup({ label, value, options, labels, onChange, required = false, fieldName }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void; required?: boolean; fieldName?: string }) {
  return (
    <fieldset data-field={fieldName} tabIndex={-1} className="grid gap-2 text-sm font-bold text-ink/75" aria-required={required}>
      <legend>{label}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex min-h-11 items-center gap-2 rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-sm font-bold text-ink/70">
            <input type="radio" name={fieldName} value={option} checked={value === option} onChange={() => onChange(option)} className="h-4 w-4 text-leaf-700 focus:ring-leaf-700" />
            {labels?.[option] ?? option}
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
