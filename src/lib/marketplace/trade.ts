import type { Product } from "../../types";

export type MarketplaceTradeLine = {
  label: string;
  value: string;
};

export type MarketplaceNumericInput = string | number | null | undefined;

export type MarketplaceTradeValidationInput = Partial<Pick<
  Product,
  | "sellingMethod"
  | "sellingUnit"
  | "customUnitLabel"
  | "customUnitReviewed"
  | "unitSizeValue"
  | "unitSizeMeasure"
  | "unitSizeApproximate"
  | "priceAmount"
  | "priceCurrency"
  | "priceBasis"
  | "unitsAvailable"
  | "totalQuantityValue"
  | "totalQuantityMeasure"
  | "minimumOrderValue"
  | "minimumOrderUnit"
  | "supplyFrequency"
>>;

export type MarketplaceTradeDatabaseFields = {
  selling_method: Product["sellingMethod"] | null;
  selling_unit: string | null;
  custom_unit_label: string | null;
  custom_unit_reviewed: boolean;
  unit_size_value: number | null;
  unit_size_measure: string | null;
  unit_size_approximate: boolean;
  price_amount: number | null;
  price_currency: string | null;
  price_basis: string | null;
  units_available: number | null;
  total_quantity_value: number | null;
  total_quantity_measure: string | null;
  minimum_order_value: number | null;
  minimum_order_unit: string | null;
};

export const reviewedCustomUnitMessage = "Custom units must be reviewed before publication.";

const sellingMethods = ["packaged_unit", "weight", "count", "livestock", "volume"] as const;
const strictNumberPattern = /^-?(?:\d+|\d*\.\d+)$/;
const wholeNumberMethods = ["packaged_unit", "count", "livestock", "volume"];
const weightMeasures = ["kg", "tonnes"];
const volumeMeasures = ["litres", "gallons"];
const packagedUnitLabels = ["sack", "bag", "crate", "basket", "tray", "carton", "box", "bunch", "other"];
const countUnitLabels = ["piece", "head", "bunch", "tuber", "plant", "seedling", "other"];
const livestockBlockedPackageUnits = ["sack", "bag", "crate", "basket", "tray", "carton", "box"];
const supplyFrequencyValues = ["One-time", "Weekly", "Monthly", "On request"];

const pluralUnits: Record<string, string> = {
  bag: "bags",
  basket: "baskets",
  box: "boxes",
  bunch: "bunches",
  carton: "cartons",
  container: "containers",
  crate: "crates",
  gallon: "gallons",
  goat: "goats",
  head: "head",
  litre: "litres",
  liter: "litres",
  piece: "pieces",
  plant: "plants",
  sack: "sacks",
  seedling: "seedlings",
  tray: "trays",
  tuber: "tubers"
};

const measureAliases: Record<string, string> = {
  kilogram: "kg",
  kilograms: "kg",
  kilo: "kg",
  kilos: "kg",
  kg: "kg",
  gram: "g",
  grams: "g",
  g: "g",
  tonne: "tonnes",
  tonnes: "tonnes",
  ton: "tonnes",
  tons: "tonnes",
  litre: "litres",
  litres: "litres",
  liter: "litres",
  liters: "litres",
  gallon: "gallons",
  gallons: "gallons"
};

function cleanText(value?: MarketplaceNumericInput | string) {
  return typeof value === "string" ? value.trim() : "";
}

export function marketplaceNumericValue(value?: MarketplaceNumericInput) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const normalized = value.trim();

  if (!strictNumberPattern.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isInvalidNumericString(value?: MarketplaceNumericInput) {
  return typeof value === "string" && value.trim() !== "" && marketplaceNumericValue(value) === undefined;
}

function isWholeNumber(value: number | undefined) {
  return value !== undefined && Number.isInteger(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GH", { maximumFractionDigits: 3 }).format(value);
}

function cleanUnit(value?: string) {
  const lower = value?.trim().toLowerCase() ?? "";
  return measureAliases[lower] ?? lower;
}

function normalizeCurrency(value?: string) {
  const currency = value?.trim() || "GHS";
  return /^[A-Z]{3}$/.test(currency) ? currency : currency.toUpperCase();
}

export function formatMarketplaceMeasure(value?: MarketplaceNumericInput, measure?: string) {
  const number = marketplaceNumericValue(value);
  const unit = cleanUnit(measure);

  if (number === undefined || !unit) {
    return "";
  }

  return `${formatNumber(number)} ${unit}`;
}

function formatMarketplaceCount(value?: MarketplaceNumericInput, unit?: string) {
  const number = marketplaceNumericValue(value);
  const label = pluralizeMarketplaceUnit(unit, number);

  if (number === undefined || !label) {
    return "";
  }

  return `${formatNumber(number)} ${label}`;
}

export function pluralizeMarketplaceUnit(unit?: string, countValue?: MarketplaceNumericInput) {
  const clean = unit?.trim().toLowerCase() ?? "";

  if (!clean) {
    return "";
  }

  const count = marketplaceNumericValue(countValue);

  if (count === 1) {
    return clean;
  }

  return pluralUnits[clean] ?? `${clean}s`;
}

export function formatMarketplaceCurrency(value?: MarketplaceNumericInput, currency = "GHS") {
  const amount = marketplaceNumericValue(value);

  if (amount === undefined) {
    return "";
  }

  const prefix = currency.toUpperCase() === "GHS" ? "GH\u20b5" : `${currency.toUpperCase()} `;
  return `${prefix}${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 2, minimumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount)}`;
}

export function isSupportedSellingMethod(value?: string): value is NonNullable<Product["sellingMethod"]> {
  return sellingMethods.includes(value as NonNullable<Product["sellingMethod"]>);
}

type MarketplaceUnitInput = Pick<Product, "sellingUnit" | "customUnitLabel"> & { unit?: string };

export function effectiveMarketplaceUnit(product: MarketplaceUnitInput) {
  if (product.sellingUnit?.trim().toLowerCase() === "other") {
    return product.customUnitLabel?.trim() || "custom unit";
  }

  return product.sellingUnit || product.unit;
}

export function deriveMarketplacePriceBasis(input: Pick<Product, "sellingMethod" | "sellingUnit" | "customUnitLabel" | "unitSizeMeasure" | "totalQuantityMeasure"> & { unit?: string }) {
  const unit = effectiveMarketplaceUnit(input);

  if (input.sellingMethod === "weight") {
    return cleanUnit(input.totalQuantityMeasure || input.sellingUnit || input.unit);
  }

  if (input.sellingMethod === "volume") {
    return cleanUnit(input.unitSizeMeasure || input.totalQuantityMeasure || input.sellingUnit || input.unit);
  }

  if (input.sellingMethod === "packaged_unit" || input.sellingMethod === "count" || input.sellingMethod === "livestock") {
    return unit || "";
  }

  return "";
}

function storedMarketplaceTotal(product: Pick<Product, "totalQuantityValue" | "totalQuantityMeasure">) {
  return product.totalQuantityValue !== undefined && product.totalQuantityValue !== null && product.totalQuantityMeasure
    ? formatMarketplaceMeasure(product.totalQuantityValue, product.totalQuantityMeasure)
    : "";
}

export function calculatedMarketplaceTotal(input: Pick<Product, "sellingMethod" | "unitSizeValue" | "unitSizeMeasure" | "unitsAvailable">) {
  if (input.sellingMethod && !["packaged_unit", "volume"].includes(input.sellingMethod)) {
    return "";
  }

  const unitSize = marketplaceNumericValue(input.unitSizeValue);
  const units = marketplaceNumericValue(input.unitsAvailable);

  if (unitSize === undefined || units === undefined || unitSize <= 0 || units <= 0 || !input.unitSizeMeasure) {
    return "";
  }

  return formatMarketplaceMeasure(unitSize * units, input.unitSizeMeasure);
}

function approximatePrefix(product: Pick<Product, "unitSizeApproximate">) {
  return product.unitSizeApproximate ? "approx. " : "";
}

export function marketplacePriceLine(product: Product) {
  const price = formatMarketplaceCurrency(product.priceAmount, product.priceCurrency ?? "GHS");

  if (!price) {
    return "Ask for price";
  }

  const unit = effectiveMarketplaceUnit(product);
  const unitSize = formatMarketplaceMeasure(product.unitSizeValue, product.unitSizeMeasure);

  if (product.sellingMethod === "packaged_unit" && unit) {
    return unitSize
      ? `${price} per ${unitSize} ${pluralizeMarketplaceUnit(unit, 1)}`
      : `${price} per ${pluralizeMarketplaceUnit(unit, 1)}`;
  }

  if (product.sellingMethod === "weight" || product.sellingMethod === "volume") {
    const basis = deriveMarketplacePriceBasis(product);
    return basis ? `${price} per ${basis}` : `${price} per unit`;
  }

  if (product.sellingMethod === "livestock") {
    return `${price} per ${unit || "animal"}`;
  }

  if (product.sellingMethod === "count") {
    return `${price} per ${pluralizeMarketplaceUnit(unit || product.priceBasis, 1) || "item"}`;
  }

  return product.priceRange || "Ask for price";
}

export function marketplaceQuantityLine(product: Product) {
  const total = storedMarketplaceTotal(product);

  if ((product.sellingMethod === "packaged_unit" || product.sellingMethod === "volume") && product.unitsAvailable && effectiveMarketplaceUnit(product)) {
    const unitsCount = marketplaceNumericValue(product.unitsAvailable);
    const unitLabel = pluralizeMarketplaceUnit(effectiveMarketplaceUnit(product), unitsCount);
    const unitsLine = unitsCount !== undefined ? `${formatNumber(unitsCount)} ${unitLabel} available` : "Ask for quantity";
    return total ? `${unitsLine} \u00b7 ${approximatePrefix(product)}${total} total` : unitsLine;
  }

  if (product.sellingMethod === "weight" && product.totalQuantityValue && product.totalQuantityMeasure) {
    return `${formatMarketplaceMeasure(product.totalQuantityValue, product.totalQuantityMeasure)} available`;
  }

  if ((product.sellingMethod === "count" || product.sellingMethod === "livestock") && product.unitsAvailable) {
    const unitsCount = marketplaceNumericValue(product.unitsAvailable);
    const unitLabel = pluralizeMarketplaceUnit(effectiveMarketplaceUnit(product), unitsCount);
    return unitsCount !== undefined ? `${formatNumber(unitsCount)} ${unitLabel} available` : "Ask for quantity";
  }

  const legacy = formatMarketplaceMeasure(product.quantity, product.unit);
  return legacy || "Ask for quantity";
}

export function marketplaceTradeLines(product: Product): MarketplaceTradeLine[] {
  const unitSize = formatMarketplaceMeasure(product.unitSizeValue, product.unitSizeMeasure);
  const total = storedMarketplaceTotal(product);
  const packageUnit = effectiveMarketplaceUnit(product);
  const minimumOrderUnit = product.minimumOrderUnit || packageUnit || product.totalQuantityMeasure;
  const minimumOrder = measureAliases[minimumOrderUnit?.trim().toLowerCase() ?? ""]
    ? formatMarketplaceMeasure(product.minimumOrderValue, minimumOrderUnit)
    : formatMarketplaceCount(product.minimumOrderValue, minimumOrderUnit);

  return [
    { label: "Price", value: marketplacePriceLine(product) },
    { label: "Selling method", value: product.sellingMethod ? product.sellingMethod.replace(/_/g, " ") : "Confirmed during request" },
    { label: "Package / unit", value: packageUnit || "Confirmed during request" },
    { label: "Unit size", value: unitSize || "Ask for details" },
    { label: "Units available", value: product.unitsAvailable ? marketplaceQuantityLine({ ...product, totalQuantityValue: undefined, totalQuantityMeasure: undefined }) : "Confirmed during request" },
    { label: "Total available", value: total || "Ask for details" },
    { label: "Minimum order", value: minimumOrder || "Confirmed during request" },
    { label: "Availability", value: product.available || "Confirmed during request" },
    { label: "Supply frequency", value: product.supplyFrequency || "Confirmed during request" },
    { label: "Available from", value: product.availableFromDate || "Confirmed during request" },
    { label: "Grade / quality", value: product.gradeDescription || "Confirmed during request" },
    { label: "Pickup or delivery", value: product.deliveryDetails || "Confirmed during request" }
  ];
}

export function usesCustomMarketplaceUnit(product: Pick<Product, "sellingUnit">) {
  return product.sellingUnit?.trim().toLowerCase() === "other";
}

function sameUnit(left?: string, right?: string) {
  if (!left || !right) {
    return true;
  }

  return cleanUnit(left) === cleanUnit(right);
}

export function validateMarketplaceTradeInput(input: MarketplaceTradeValidationInput) {
  const errors: string[] = [];
  const method = input.sellingMethod;
  const price = marketplaceNumericValue(input.priceAmount);
  const unitSize = marketplaceNumericValue(input.unitSizeValue);
  const units = marketplaceNumericValue(input.unitsAvailable);
  const total = marketplaceNumericValue(input.totalQuantityValue);
  const minimum = marketplaceNumericValue(input.minimumOrderValue);

  for (const [label, value] of [
    ["Price", input.priceAmount],
    ["Unit size", input.unitSizeValue],
    ["Units available", input.unitsAvailable],
    ["Total quantity", input.totalQuantityValue],
    ["Minimum order", input.minimumOrderValue]
  ] as const) {
    if (isInvalidNumericString(value)) {
      errors.push(`${label} must be a valid number.`);
    }
  }

  if (method && !isSupportedSellingMethod(method)) {
    errors.push("Selling method is not supported.");
  }

  if (price !== undefined && price < 0) {
    errors.push("Price cannot be negative.");
  }

  if (unitSize !== undefined && unitSize <= 0) {
    errors.push("Unit size must be greater than zero.");
  }

  if (units !== undefined && units < 0) {
    errors.push("Units available cannot be negative.");
  }

  if (total !== undefined && total < 0) {
    errors.push("Total quantity cannot be negative.");
  }

  if (minimum !== undefined && minimum <= 0) {
    errors.push("Minimum order must be greater than zero.");
  }

  if ((method === "packaged_unit" || method === "count" || method === "livestock" || method === "volume") && input.unitsAvailable && units === 0) {
    errors.push("Units available must be greater than zero.");
  }

  if (wholeNumberMethods.includes(method ?? "") && units !== undefined && !isWholeNumber(units)) {
    errors.push("Units available must be a whole number for this selling method.");
  }

  if (wholeNumberMethods.includes(method ?? "") && minimum !== undefined && !isWholeNumber(minimum)) {
    errors.push("Minimum order must be a whole number for this selling method.");
  }

  if (minimum !== undefined) {
    if (units !== undefined && ["packaged_unit", "count", "livestock", "volume"].includes(method ?? "") && minimum > units && sameUnit(input.minimumOrderUnit, input.sellingUnit)) {
      errors.push("Minimum order cannot be greater than available units.");
    }

    if (total !== undefined && method === "weight" && minimum > total && sameUnit(input.minimumOrderUnit, input.totalQuantityMeasure)) {
      errors.push("Minimum order cannot be greater than total available quantity.");
    }

    if (
      ((units !== undefined && ["packaged_unit", "count", "livestock", "volume"].includes(method ?? "")) ||
        (total !== undefined && method === "weight")) &&
      input.minimumOrderUnit &&
      (method === "weight" ? input.totalQuantityMeasure : input.sellingUnit) &&
      !sameUnit(input.minimumOrderUnit, method === "weight" ? input.totalQuantityMeasure : input.sellingUnit)
    ) {
      errors.push("Minimum order unit must match the available stock unit.");
    }
  }

  if (method === "packaged_unit" && !input.sellingUnit) {
    errors.push("Packaged listings need a unit or container type.");
  }

  if (method === "packaged_unit" && input.sellingUnit && !packagedUnitLabels.includes(input.sellingUnit.trim().toLowerCase())) {
    errors.push("Packaged listings need a recognised package unit.");
  }

  if (method === "count" && input.sellingUnit && !countUnitLabels.includes(input.sellingUnit.trim().toLowerCase())) {
    errors.push("Count listings need a recognised item unit.");
  }

  if (method === "livestock" && input.sellingUnit && livestockBlockedPackageUnits.includes(input.sellingUnit.trim().toLowerCase())) {
    errors.push("Livestock listings need an animal type, not a package unit.");
  }

  if (input.sellingUnit?.trim().toLowerCase() === "other" && !input.customUnitLabel?.trim()) {
    errors.push("Custom units need a clear label.");
  }

  if (input.sellingUnit?.trim().toLowerCase() === "other" && !input.customUnitReviewed) {
    errors.push(reviewedCustomUnitMessage);
  }

  if (input.priceCurrency && !/^[A-Za-z]{3}$/.test(input.priceCurrency.trim())) {
    errors.push("Currency must be a three-letter uppercase code.");
  }

  if (input.supplyFrequency && !supplyFrequencyValues.includes(input.supplyFrequency)) {
    errors.push("Supply frequency is not supported.");
  }

  if (method === "weight") {
    const sellingUnit = cleanUnit(input.sellingUnit);
    const totalMeasure = cleanUnit(input.totalQuantityMeasure);
    const priceBasis = cleanUnit(input.priceBasis);

    if (input.sellingUnit && !weightMeasures.includes(sellingUnit)) {
      errors.push("Direct weight listings need kg or tonnes as the selling unit.");
    }

    if (input.totalQuantityMeasure && !weightMeasures.includes(totalMeasure)) {
      errors.push("Direct weight listings need kg or tonnes as the total quantity measure.");
    }

    if (input.priceBasis && !weightMeasures.includes(priceBasis)) {
      errors.push("Weight listings need a kg or tonnes price basis.");
    }
  }

  if (method === "volume") {
    const unitSizeMeasure = cleanUnit(input.unitSizeMeasure);
    const sellingUnit = cleanUnit(input.sellingUnit);
    const totalMeasure = cleanUnit(input.totalQuantityMeasure);
    const priceBasis = cleanUnit(input.priceBasis);

    if (input.unitSizeMeasure && !volumeMeasures.includes(unitSizeMeasure)) {
      errors.push("Volume listings need litres or gallons as the unit size measure.");
    }

    if (input.sellingUnit && weightMeasures.includes(sellingUnit)) {
      errors.push("Volume listings cannot use a weight measure as the selling unit.");
    }

    if (input.totalQuantityMeasure && !volumeMeasures.includes(totalMeasure)) {
      errors.push("Volume listings need litres or gallons as the total quantity measure.");
    }

    if (input.priceBasis && !volumeMeasures.includes(priceBasis)) {
      errors.push("Volume listings need a litres or gallons price basis.");
    }
  }

  return errors;
}

export function canonicalMarketplaceTradeFields(input: MarketplaceTradeValidationInput): MarketplaceTradeDatabaseFields {
  const method = isSupportedSellingMethod(input.sellingMethod) ? input.sellingMethod : null;
  const sellingUnit = cleanText(input.sellingUnit) || null;
  const customUnitLabel = sellingUnit?.toLowerCase() === "other" ? cleanText(input.customUnitLabel) || null : null;
  const unitSize = marketplaceNumericValue(input.unitSizeValue);
  const units = marketplaceNumericValue(input.unitsAvailable);
  const enteredTotal = marketplaceNumericValue(input.totalQuantityValue);
  const price = marketplaceNumericValue(input.priceAmount);
  const minimum = marketplaceNumericValue(input.minimumOrderValue);
  const unitSizeMeasure = cleanText(input.unitSizeMeasure) || null;
  let totalQuantityValue: number | null = null;
  let totalQuantityMeasure: string | null = null;

  if ((method === "packaged_unit" || method === "volume") && unitSize !== undefined && units !== undefined && unitSize > 0 && units > 0 && unitSizeMeasure) {
    totalQuantityValue = Number((unitSize * units).toFixed(3));
    totalQuantityMeasure = unitSizeMeasure;
  }

  if (method === "weight" && enteredTotal !== undefined) {
    totalQuantityValue = enteredTotal;
    totalQuantityMeasure = cleanText(input.totalQuantityMeasure) || cleanUnit(sellingUnit ?? undefined) || null;
  }

  return {
    selling_method: method,
    selling_unit: sellingUnit,
    custom_unit_label: customUnitLabel,
    custom_unit_reviewed: Boolean(input.customUnitReviewed),
    unit_size_value: unitSize ?? null,
    unit_size_measure: unitSizeMeasure,
    unit_size_approximate: Boolean(input.unitSizeApproximate),
    price_amount: price ?? null,
    price_currency: normalizeCurrency(input.priceCurrency),
    price_basis: deriveMarketplacePriceBasis({
      sellingMethod: method ?? undefined,
      sellingUnit: sellingUnit ?? undefined,
      customUnitLabel: customUnitLabel ?? undefined,
      unitSizeMeasure: unitSizeMeasure ?? undefined,
      totalQuantityMeasure: totalQuantityMeasure ?? (cleanText(input.totalQuantityMeasure) || undefined)
    }) || null,
    units_available: units ?? null,
    total_quantity_value: totalQuantityValue,
    total_quantity_measure: totalQuantityMeasure,
    minimum_order_value: minimum ?? null,
    minimum_order_unit: cleanText(input.minimumOrderUnit) || null
  };
}
