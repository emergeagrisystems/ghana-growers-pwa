"use client";

import { Building2, Mail, MessageSquareText, Phone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminContactEnquiryRecord, ContactEnquiryType } from "@/lib/contactEnquiryContracts";

type QueueState = "loading" | "loaded" | "error";
type TypeFilter = "All" | ContactEnquiryType;

export function AdminContactEnquiriesWorkspace() {
  const [enquiries, setEnquiries] = useState<AdminContactEnquiryRecord[]>([]);
  const [selectedReference, setSelectedReference] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [queueState, setQueueState] = useState<QueueState>("loading");
  const [error, setError] = useState("");

  const loadEnquiries = useCallback(async () => {
    setQueueState("loading");
    setError("");
    const response = await fetch("/api/admin/contact-enquiries", { cache: "no-store" }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { enquiries?: AdminContactEnquiryRecord[]; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      setQueueState("error");
      setError(result?.error ?? "Could not load contact and partnership enquiries. Please retry.");
      return;
    }

    const records = result?.enquiries ?? [];
    setEnquiries(records);
    setSelectedReference((current) => records.some((record) => record.reference === current) ? current : records[0]?.reference ?? "");
    setQueueState("loaded");
  }, []);

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  const visibleEnquiries = useMemo(
    () => typeFilter === "All" ? enquiries : enquiries.filter((enquiry) => enquiry.enquiryType === typeFilter),
    [enquiries, typeFilter]
  );
  const selected = visibleEnquiries.find((enquiry) => enquiry.reference === selectedReference) ?? visibleEnquiries[0] ?? null;

  useEffect(() => {
    if (!selected && visibleEnquiries[0]) setSelectedReference(visibleEnquiries[0].reference);
    if (selected && selected.reference !== selectedReference) setSelectedReference(selected.reference);
  }, [selected, selectedReference, visibleEnquiries]);

  if (queueState === "loading") {
    return <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58" role="status">Loading contact and partnership enquiries...</p>;
  }
  if (queueState === "error") {
    return (
      <div className="flex flex-col gap-3 rounded-md bg-tomato/10 p-5 text-sm font-semibold text-tomato sm:flex-row sm:items-center sm:justify-between" role="alert">
        <span>{error}</span>
        <button type="button" onClick={() => void loadEnquiries()} className="min-h-11 rounded-md bg-white px-4 py-2.5 font-black text-leaf-800 ring-1 ring-leaf-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-700">Retry</button>
      </div>
    );
  }

  return (
    <section className="grid min-w-0 gap-5">
      <div className="flex flex-col gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Private queue</p>
          <p className="mt-1 text-sm font-semibold text-ink/58">Opening an enquiry is read-only and creates no workflow action.</p>
        </div>
        <label className="grid gap-2 text-xs font-black uppercase tracking-wide text-ink/45 sm:min-w-56">
          Filter by type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="min-h-11 rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-sm font-black normal-case tracking-normal text-ink outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20">
            <option value="All">All enquiries</option>
            <option value="Contact">Contact</option>
            <option value="Partnership">Partnership</option>
          </select>
        </label>
      </div>

      {enquiries.length === 0 ? (
        <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No contact or partnership enquiries yet.</p>
      ) : visibleEnquiries.length === 0 ? (
        <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No {typeFilter.toLowerCase()} enquiries match this filter.</p>
      ) : (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(230px,0.7fr)_minmax(0,1.3fr)]">
          <div className="grid content-start gap-2" aria-label="Contact and partnership enquiry queue">
            {visibleEnquiries.map((enquiry) => {
              const active = selected?.reference === enquiry.reference;
              return (
                <button key={enquiry.reference} type="button" onClick={() => setSelectedReference(enquiry.reference)} className={`min-h-11 rounded-md p-4 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-700 ${active ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-ink ring-leaf-900/10 hover:bg-leaf-50"}`}>
                  <p className={`text-xs font-black uppercase tracking-wide ${active ? "text-earth-100" : "text-earth-700"}`}>{enquiry.reference}</p>
                  <p className="mt-1 font-black">{enquiry.organisation || enquiry.name}</p>
                  <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold ${active ? "text-white/75" : "text-ink/50"}`}>
                    <span>{enquiry.enquiryType}</span>
                    <span>{new Date(enquiry.createdAt).toLocaleDateString()}</span>
                    <span>{enquiry.status}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selected ? (
            <article className="min-w-0 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 border-b border-leaf-900/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">{selected.reference}</p>
                  <h3 className="mt-2 text-xl font-black text-ink">{selected.organisation || selected.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink/55">{selected.enquiryType} enquiry</p>
                </div>
                <span className="self-start rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-700/10">{selected.status}</span>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail icon={MessageSquareText} label="Name" value={selected.name} />
                <Detail icon={Building2} label="Organisation" value={selected.organisation || "Not supplied"} />
                <Detail icon={Mail} label="Email" value={selected.email} />
                <Detail icon={Phone} label="Phone or WhatsApp" value={selected.phone || "Not supplied"} />
                <Detail icon={MessageSquareText} label={selected.enquiryType === "Partnership" ? "Partnership interest" : "Subject"} value={selected.subject || "Not supplied"} />
                <Detail icon={Building2} label="Website" value={selected.website || "Not supplied"} />
              </dl>

              <section className="mt-5 rounded-md bg-leaf-50 p-4">
                <h4 className="text-sm font-black text-ink">Message</h4>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-ink/66">{selected.message}</p>
              </section>
              <p className="mt-4 text-xs font-semibold text-ink/45">Received {new Date(selected.createdAt).toLocaleString()} from {selected.sourcePath}.</p>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-earth-50 p-4">
      <dt className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-earth-700"><Icon className="h-4 w-4" aria-hidden="true" />{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-ink/68">{value}</dd>
    </div>
  );
}
