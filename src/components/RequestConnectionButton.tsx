"use client";

import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import type { LeadRequestSource, LeadRequestSourceType } from "@/lib/leadRequests";

type ListingSummary = {
  product?: string;
  seller?: string;
  location?: string;
  pricePackage?: string;
  listedQuantity?: string;
  availability?: string;
};

type RequestConnectionButtonProps = {
  sourceType: LeadRequestSourceType;
  sourceId: string;
  sourceName: string;
  requestSource?: LeadRequestSource;
  productInterest?: string;
  productOptions?: string[];
  listingSummary?: ListingSummary;
  label?: string;
  ariaLabel?: string;
  className?: string;
  helperText?: string;
};

const successMessage = "Thank you. Ghana Growers has received your request and will review it before connecting anyone.";

export function RequestConnectionButton({
  sourceType,
  sourceId,
  sourceName,
  requestSource,
  productInterest = "",
  productOptions = [],
  listingSummary,
  label = "Request Connection",
  ariaLabel,
  className = "",
  helperText = ""
}: RequestConnectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [whatsappValue, setWhatsappValue] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const safeId = `${sourceType}-${sourceId}`.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  const isListingRequest = requestSource === "marketplace_listing" || sourceType === "Marketplace Listing" || sourceType === "Supplier Listing";
  const modalTitle = isListingRequest ? "Request This Listing" : "Request Connection";
  const selectedProduct = productInterest || listingSummary?.product || sourceName;
  const uniqueProductOptions = Array.from(new Set(productOptions.map((option) => option.trim()).filter(Boolean))).slice(0, 8);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");
    const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    focusable[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen]);

  function closeModal() {
    setIsOpen(false);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedProducts = formData.getAll("productInterest").map(String).map((value) => value.trim()).filter(Boolean);
    const requestedProduct = selectedProducts.length > 0 ? selectedProducts.join(", ") : selectedProduct;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/lead-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterName: formData.get("requesterName"),
        companyName: formData.get("companyName"),
        phone: formData.get("phone"),
        whatsapp: formData.get("whatsapp"),
        whatsappSameAsPhone: formData.get("whatsappSameAsPhone"),
        deliveryLocation: formData.get("deliveryLocation"),
        productInterest: requestedProduct,
        quantityNeeded: formData.get("quantityNeeded"),
        requiredBy: formData.get("requiredBy"),
        message: formData.get("message"),
        companyWebsite: formData.get("companyWebsite"),
        sourceType,
        sourceId,
        sourceName,
        requestSource,
        sourcePage: window.location.pathname
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string; message?: string } | null;
    setIsSubmitting(false);

    if (!response?.ok) {
      setError(result?.error ?? "Could not submit your request. Please try again.");
      return;
    }

    form.reset();
    setPhoneValue("");
    setWhatsappValue("");
    setSameAsPhone(false);
    setSuccess(result?.message ?? successMessage);
  }

  return (
    <>
      <div className={helperText ? "grid gap-2" : ""}>
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(true);
            setError("");
            setSuccess("");
          }}
          className={`gg-button-primary gap-2 ${className}`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
        {helperText ? <p className="text-xs font-semibold leading-5 text-ink/55">{helperText}</p> : null}
      </div>

      {isMounted && isOpen ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4 motion-reduce:transition-none"
          onClick={closeModal}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <section
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`request-title-${safeId}`}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-md bg-white shadow-soft sm:rounded-md"
            onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-leaf-900/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">{modalTitle}</p>
                <h2 id={`request-title-${safeId}`} className="mt-1 text-xl font-black text-ink">{sourceName}</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  Ghana Growers reviews your request before connecting anyone.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close connection request"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-leaf-900/10 text-ink/65 transition hover:bg-leaf-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitLead} className="grid gap-4 p-5">
              <input name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              {listingSummary ? <ListingSummaryPanel summary={listingSummary} /> : (
                <p className="rounded-md bg-leaf-50 px-4 py-3 text-sm font-bold leading-6 text-ink/68">
                  Selected: <span className="text-ink">{sourceName}</span>
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <LeadField label="Full Name" name="requesterName" required />
                <LeadField label="Company Name (optional)" name="companyName" />
                <label className="grid gap-2 text-sm font-black text-ink">
                  Phone Number
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={phoneValue}
                    onChange={(event) => setPhoneValue(event.target.value)}
                    className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  />
                </label>
                <label className="grid gap-2 text-sm font-black text-ink">
                  WhatsApp Number
                  <input
                    name="whatsapp"
                    type="tel"
                    required
                    readOnly={sameAsPhone}
                    value={sameAsPhone ? phoneValue : whatsappValue}
                    onChange={(event) => setWhatsappValue(event.target.value)}
                    className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20 read-only:bg-leaf-50"
                  />
                </label>
                <label className="flex items-start gap-2 rounded-md bg-leaf-50 px-3 py-3 text-sm font-bold leading-5 text-ink/68 sm:col-span-2">
                  <input
                    name="whatsappSameAsPhone"
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(event) => setSameAsPhone(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-leaf-900/20 text-leaf-700 focus:ring-leaf-600/30"
                  />
                  WhatsApp is the same as phone number
                </label>
                <LeadField label="Delivery Location" name="deliveryLocation" required />
                <LeadField label="Required by / Deadline (optional)" name="requiredBy" type="date" />
              </div>

              <ProductInterestField
                isListingRequest={isListingRequest}
                productInterest={selectedProduct}
                productOptions={uniqueProductOptions}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <LeadField label="Quantity Needed" name="quantityNeeded" helper="Example: 5 bags, 20 crates, or 100 kg." />
              </div>

              <label className="grid gap-2 text-sm font-black text-ink">
                Message
                <textarea
                  name="message"
                  rows={4}
                  className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  placeholder="Share timing, delivery details, quality requirements, or any other notes."
                />
              </label>

              {error ? <p className="rounded-md bg-tomato/10 px-4 py-3 text-sm font-black text-tomato">{error}</p> : null}
              {success ? <p className="rounded-md bg-leaf-50 px-4 py-3 text-sm font-black leading-6 text-leaf-700">{success}</p> : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gg-button-primary"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}

function ListingSummaryPanel({ summary }: { summary: ListingSummary }) {
  const rows = [
    ["Product", summary.product],
    ["Seller", summary.seller],
    ["Location", summary.location],
    ["Price / package", summary.pricePackage],
    ["Listed quantity", summary.listedQuantity],
    ["Availability", summary.availability]
  ].filter(([, value]) => Boolean(value));

  return (
    <dl className="grid gap-2 rounded-md bg-leaf-50 p-4 ring-1 ring-leaf-900/10 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[0.68rem] font-black uppercase tracking-wide text-ink/42">{label}</dt>
          <dd className="mt-1 text-sm font-bold leading-5 text-ink/72">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProductInterestField({
  isListingRequest,
  productInterest,
  productOptions
}: {
  isListingRequest: boolean;
  productInterest: string;
  productOptions: string[];
}) {
  if (isListingRequest) {
    return (
      <LeadField label="Product Interested In" name="productInterest" defaultValue={productInterest} required readOnly />
    );
  }

  if (productOptions.length > 0) {
    return (
      <fieldset className="grid gap-2">
        <legend className="text-sm font-black text-ink">Product Interested In</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {productOptions.map((option) => (
            <label key={option} className="flex items-start gap-2 rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-bold leading-5 text-ink/68 transition hover:border-leaf-700 hover:bg-leaf-50">
              <input
                name="productInterest"
                type="checkbox"
                value={option}
                className="mt-1 h-4 w-4 rounded border-leaf-900/20 text-leaf-700 focus:ring-leaf-600/30"
              />
              {option}
            </label>
          ))}
        </div>
        <p className="text-xs font-semibold leading-5 text-ink/50">Choose one or more relevant products, or describe the need in the message.</p>
      </fieldset>
    );
  }

  return <LeadField label="Product Interested In" name="productInterest" defaultValue={productInterest} required />;
}

function LeadField({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = "",
  helper = "",
  readOnly = false
}: {
  label: string;
  name: string;
  type?: "text" | "tel" | "date";
  required?: boolean;
  defaultValue?: string;
  helper?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-ink">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20 read-only:bg-leaf-50"
      />
      {helper ? <span className="text-xs font-semibold leading-5 text-ink/50">{helper}</span> : null}
    </label>
  );
}
