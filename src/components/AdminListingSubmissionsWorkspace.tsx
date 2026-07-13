"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, Pause, Send, XCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { marketplacePriceLine, marketplaceQuantityLine, marketplaceTradeInformation } from "@/lib/marketplace/trade";
import type { AdminUser } from "@/lib/adminAuth";
import type { ListingSubmission, SubmissionStatus } from "@/lib/publicSubmissions";
import type { Product } from "@/types";

const statuses: SubmissionStatus[] = ["New", "Needs Information", "Under Review", "Approved", "Published", "Paused", "Rejected", "Expired"];

export function AdminListingSubmissionsWorkspace({
  currentAdmin,
  initialSubmissions = [],
  initialError = ""
}: {
  currentAdmin: AdminUser;
  initialSubmissions?: ListingSubmission[];
  initialError?: string;
}) {
  const [submissions, setSubmissions] = useState<ListingSubmission[]>(initialSubmissions);
  const [activeStatus, setActiveStatus] = useState<SubmissionStatus | "All">("New");
  const [selectedId, setSelectedId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [sellerMessage, setSellerMessage] = useState("");
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(!initialSubmissions.length && !initialError);

  const filtered = useMemo(
    () => activeStatus === "All" ? submissions : submissions.filter((submission) => submission.status === activeStatus),
    [activeStatus, submissions]
  );
  const selected = filtered.find((submission) => submission.id === selectedId) ?? filtered[0];

  useEffect(() => {
    void loadSubmissions();
  }, []);

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setAdminNotes(selected.admin_notes ?? "");
      setSellerMessage(selected.seller_message ?? "");
    }
  }, [selected]);

  async function loadSubmissions() {
    setLoading(true);
    const response = await fetch("/api/admin/submissions", { cache: "no-store" }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { listings?: ListingSubmission[]; error?: string } | null;

    setLoading(false);

    if (!response?.ok || result?.error) {
      setError(result?.error ?? "Could not load listing submissions.");
      return;
    }

    setSubmissions(result?.listings ?? []);
    setError("");
  }

  async function updateStatus(submission: ListingSubmission, status: SubmissionStatus, note?: string) {
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "listing",
        id: submission.id,
        status,
        entityName: submission.product_name,
        adminNotes,
        sellerMessage,
        currentHistory: submission.status_history,
        note
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok || result?.error) {
      setError(result?.error ?? "Could not update submission.");
      return;
    }

    setNotice(`Submission marked ${status}.`);
    await loadSubmissions();
  }

  async function publishSubmission(submission: ListingSubmission) {
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "listing", submission: { ...submission, admin_notes: adminNotes, seller_message: sellerMessage } })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok || result?.error) {
      setError(result?.error ?? "Could not publish submission.");
      return;
    }

    setNotice("Submission approved and published.");
    await loadSubmissions();
  }

  return (
    <main className="min-h-screen bg-earth-50">
      <section className="border-b border-leaf-900/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/admin" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-black text-leaf-700">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Admin Dashboard
          </Link>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="gg-eyebrow text-earth-700/75">Listing Submissions</p>
              <h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">Public listing review workspace</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink/62">
                Review farmer and supplier product submissions before they become public marketplace listings.
              </p>
            </div>
            <p className="rounded-md bg-leaf-50 px-3 py-2 text-sm font-bold text-ink/65">
              Reviewer: {currentAdmin.email}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-card">
          <div className="flex flex-wrap gap-2">
            {(["All", ...statuses] as Array<SubmissionStatus | "All">).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`focus-ring rounded-md px-3 py-2 text-xs font-black transition ${
                  activeStatus === status ? "bg-leaf-700 text-white" : "bg-leaf-50 text-ink/65 hover:bg-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {loading ? <p className="mt-5 text-sm font-semibold text-ink/60">Loading submissions...</p> : null}
          {error ? <p className="mt-5 rounded-md bg-red-50 p-4 text-sm font-bold text-tomato">{error}</p> : null}
          <div className="mt-5 grid gap-3">
            {filtered.map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => setSelectedId(submission.id)}
                className={`focus-ring rounded-md border p-4 text-left transition ${
                  selected?.id === submission.id ? "border-leaf-700/40 bg-leaf-50 shadow-sm" : "border-leaf-900/10 bg-white hover:border-leaf-700/20"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-xs font-black uppercase tracking-wide text-earth-700">{submission.submission_reference ?? shortReference(submission.id)}</span>
                    <span className="mt-1 block font-black text-ink">{submission.product_name}</span>
                    <span className="mt-1 block text-sm font-semibold text-ink/60">{submission.seller_name} - {submission.district}, {submission.region}</span>
                  </span>
                  <StatusPill status={submission.status} />
                </span>
                <span className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink/50">
                  <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                  {missingWarnings(submission).length ? <span className="text-tomato">Missing info</span> : null}
                </span>
              </button>
            ))}
            {!filtered.length && !loading ? <p className="rounded-md bg-leaf-50 p-4 text-sm font-semibold text-ink/60">No submissions in this status.</p> : null}
          </div>
        </div>

        {selected ? (
          <article className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">{selected.submission_reference ?? shortReference(selected.id)}</p>
                <h2 className="mt-1 text-2xl font-black text-ink">{selected.product_name}</h2>
                <p className="mt-1 text-sm font-semibold text-ink/60">{selected.seller_name} - {selected.district}, {selected.region}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>

            {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-tomato">{error}</p> : null}
            {notice ? <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm font-bold text-leaf-700">{notice}</p> : null}

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <ReviewPanel title="Seller details" rows={[
                ["Farm/business", selected.seller_name],
                ["Contact", selected.seller_contact_name ?? "Not supplied"],
                ["Phone", selected.phone_number ?? "Not supplied"],
                ["WhatsApp", selected.whatsapp_number],
                ["Member", selected.existing_member ?? "Not sure"],
                ["Match", selected.seller_match_status ?? "Pending review"]
              ]} />
              <ReviewPanel title="Product details" rows={[
                ["Pathway", selected.marketplace_pathway ?? selected.category],
                ["Subcategory", selected.subcategory ?? selected.category],
                ["Variety", selected.variety ?? "Not supplied"],
                ["Quality", selected.grade_description ?? "Not supplied"],
                ["Description", selected.description]
              ]} />
              <ReviewPanel title="Trade information" rows={tradeRows(selected)} />
              <ReviewPanel title="Availability and logistics" rows={[
                ["Availability", selected.availability ?? "Ask availability"],
                ["Frequency", selected.supply_frequency ?? "Not supplied"],
                ["Available from", selected.available_from_date ?? "Not supplied"],
                ["Pickup", selected.pickup_location ?? selected.district],
                ["Delivery", selected.delivery_available ?? "To be confirmed"],
                ["Delivery details", selected.delivery_details ?? "Not supplied"],
                ["Additional notes", selected.additional_notes ?? "Not supplied"]
              ]} />
            </div>

            <div className="mt-5 rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
              <h3 className="font-black text-ink">Uploaded photos</h3>
              <AdminSubmissionImages submission={selected} />
              <p className="mt-3 text-xs font-semibold text-ink/50">Pending images are private until an admin approves and publishes the listing.</p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div>
                <label className="grid gap-2 text-sm font-bold text-ink/75">
                  Internal notes
                  <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="gg-field min-h-24" placeholder="Record spelling fixes, commercial changes, duplicate checks or seller matching notes." />
                </label>
              </div>
              <div>
                <label className="grid gap-2 text-sm font-bold text-ink/75">
                  Seller-facing message
                  <textarea value={sellerMessage} onChange={(event) => setSellerMessage(event.target.value)} className="gg-field min-h-24" placeholder="Copy this manually to WhatsApp if more information is needed." />
                </label>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-md border border-leaf-900/10 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
              <ActionButton icon={ClipboardCheck} label="Mark Under Review" onClick={() => updateStatus(selected, "Under Review")} />
              <ActionButton icon={AlertTriangle} label="Request More Information" onClick={() => updateStatus(selected, "Needs Information", "More information requested")} />
              <ActionButton icon={ClipboardCheck} label="Save Draft" onClick={() => updateStatus(selected, selected.status, "Draft saved")} />
              <ActionButton icon={CheckCircle2} label="Approve" onClick={() => updateStatus(selected, "Approved")} />
              <ActionButton icon={Send} label="Approve and Publish" strong onClick={() => publishSubmission(selected)} />
              <ActionButton icon={Pause} label="Pause" onClick={() => updateStatus(selected, "Paused")} />
              <ActionButton icon={XCircle} label="Reject" onClick={() => updateStatus(selected, "Rejected")} />
              <ActionButton icon={AlertTriangle} label="Mark Sold Out" onClick={() => updateStatus(selected, "Paused", "Marked sold out for inventory V1")} />
              <ActionButton icon={XCircle} label="Expire" onClick={() => updateStatus(selected, "Expired")} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <PreviewCard submission={selected} kind="card" />
              <PreviewCard submission={selected} kind="detail" />
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}

function shortReference(id: string) {
  return `LS-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function StatusPill({ status }: { status: SubmissionStatus }) {
  return <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-800 ring-1 ring-leaf-700/15">{status}</span>;
}

function AdminSubmissionImages({ submission }: { submission: ListingSubmission }) {
  const images = submission.image_urls?.length ? submission.image_urls : submission.image_url ? [submission.image_url] : [];

  if (!images.length) {
    return <p className="mt-3 rounded-md bg-white p-3 text-sm font-semibold text-ink/60 ring-1 ring-leaf-900/10">No product photos were uploaded.</p>;
  }

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {images.map((image, index) => (
        <figure key={image} className="overflow-hidden rounded-md bg-white ring-1 ring-leaf-900/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- Private admin-only storage previews are served through a protected API route. */}
          <img
            src={`/api/admin/listing-submissions/images?path=${encodeURIComponent(image)}`}
            alt={`Submitted product photo ${index + 1}`}
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="break-all p-3 text-xs font-semibold text-ink/55">
            Private storage path: {image}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function ReviewPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
      <h3 className="font-black text-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
            <p className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/72">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function submissionAsProduct(submission: ListingSubmission): Product {
  return {
    id: submission.id,
    name: submission.product_name,
    category: submission.category,
    location: submission.district,
    region: submission.region,
    seller: submission.seller_name,
    description: submission.description,
    quantity: submission.quantity,
    unit: submission.unit,
    sellingMethod: submission.selling_method,
    sellingUnit: submission.selling_unit ?? undefined,
    customUnitLabel: submission.custom_unit_label ?? undefined,
    customUnitReviewed: submission.custom_unit_reviewed ?? false,
    unitSizeValue: submission.unit_size_value ?? undefined,
    unitSizeMeasure: submission.unit_size_measure ?? undefined,
    unitSizeApproximate: submission.unit_size_approximate ?? false,
    priceAmount: submission.price_amount ?? undefined,
    priceCurrency: submission.price_currency ?? "GHS",
    priceBasis: submission.price_basis ?? undefined,
    unitsAvailable: submission.units_available ?? undefined,
    totalQuantityValue: submission.total_quantity_value ?? undefined,
    totalQuantityMeasure: submission.total_quantity_measure ?? undefined,
    minimumOrderValue: submission.minimum_order_value ?? undefined,
    minimumOrderUnit: submission.minimum_order_unit ?? undefined,
    supplyFrequency: submission.supply_frequency ?? undefined,
    availableFromDate: submission.available_from_date ?? undefined,
    gradeDescription: submission.grade_description ?? undefined,
    deliveryDetails: submission.delivery_details ?? undefined,
    image: submission.image_url ?? "",
    images: submission.image_urls ?? undefined,
    available: submission.availability ?? "Ask availability",
    datePosted: submission.created_at,
    status: "Active"
  };
}

function tradeRows(submission: ListingSubmission): Array<[string, string]> {
  const product = submissionAsProduct(submission);
  const trade = marketplaceTradeInformation(product);

  return [
    ["Price", marketplacePriceLine(product)],
    ["Quantity", marketplaceQuantityLine(product)],
    ...trade.lines.map((line): [string, string] => [line.label, line.value])
  ];
}

function missingWarnings(submission: ListingSubmission) {
  return [
    !submission.phone_number ? "Phone missing" : "",
    !submission.image_url && !submission.image_urls?.length ? "Photo missing" : "",
    submission.selling_unit === "other" && !submission.custom_unit_reviewed ? "Custom unit needs review" : "",
    !submission.pickup_location ? "Pickup location missing" : ""
  ].filter(Boolean);
}

function ActionButton({ icon: Icon, label, onClick, strong = false }: { icon: LucideIcon; label: string; onClick: () => void; strong?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition ${
        strong ? "bg-leaf-700 text-white hover:bg-leaf-900" : "bg-leaf-50 text-ink/70 ring-1 ring-leaf-900/10 hover:bg-white"
      }`}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

function PreviewCard({ submission, kind }: { submission: ListingSubmission; kind: "card" | "detail" }) {
  const product = submissionAsProduct(submission);

  return (
    <section className="rounded-md border border-leaf-900/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-ink">Public {kind === "card" ? "card" : "detail"} preview</h3>
        <ExternalLink size={16} className="text-ink/35" aria-hidden="true" />
      </div>
      <p className="mt-3 text-lg font-black text-ink">{submission.product_name}</p>
      <p className="mt-1 text-sm font-semibold text-ink/60">{submission.seller_name} - {submission.district}, {submission.region}</p>
      <div className="mt-3 grid gap-2 text-sm">
        <p className="font-black text-leaf-700">{marketplacePriceLine(product)}</p>
        <p className="font-semibold text-ink/65">{marketplaceQuantityLine(product)}</p>
        <p className="font-semibold text-ink/65">{submission.availability ?? "Ask availability"}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/60">{submission.description}</p>
    </section>
  );
}
