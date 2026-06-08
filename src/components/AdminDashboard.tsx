"use client";

import Link from "next/link";
import {
  Archive,
  BadgeCheck,
  BookOpen,
  ChartLine,
  CircleDashed,
  Eye,
  FilePenLine,
  LayoutDashboard,
  Lock,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  UsersRound
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { buyerRequests } from "@/data/buyerRequests";
import { farmerDirectory } from "@/data/farmers";
import learnArticles from "@/data/learnArticles.json";
import { marketPrices } from "@/data/marketPrices";
import { products } from "@/data/products";
import { supplierDirectory } from "@/data/suppliers";

type AdminStatus = "Pending" | "Verified" | "Active" | "Archived";
type AdminSectionId =
  | "farmers"
  | "buyers"
  | "suppliers"
  | "marketplace"
  | "buyer-requests"
  | "verifications"
  | "learn"
  | "market-prices";

type AdminRow = {
  id: string;
  name: string;
  type: string;
  region: string;
  status: AdminStatus;
  dateAdded: string;
  href?: string;
};

const storageKey = "ghana-growers-admin-access";

const statusStyles: Record<AdminStatus, string> = {
  Pending: "bg-earth-50 text-earth-700",
  Verified: "bg-leaf-50 text-leaf-700",
  Active: "bg-white text-leaf-700 ring-1 ring-leaf-900/10",
  Archived: "bg-ink/10 text-ink/55"
};

function statusFromTrust(status?: string): AdminStatus {
  if (status === "Verified" || status === "Premium Member") {
    return "Verified";
  }

  return "Pending";
}

function sectionRows(): Record<AdminSectionId, AdminRow[]> {
  const buyerMap = new Map<string, AdminRow>();

  buyerRequests.forEach((request) => {
    if (!buyerMap.has(request.buyerName)) {
      buyerMap.set(request.buyerName, {
        id: `buyer-${request.id}`,
        name: request.buyerName,
        type: request.buyerType,
        region: request.region,
        status: statusFromTrust(request.trust?.status),
        dateAdded: request.datePosted,
        href: "/buyer-requests"
      });
    }
  });

  const verificationRows: AdminRow[] = [
    ...farmerDirectory.map((farmer) => ({
      id: `verify-farmer-${farmer.slug}`,
      name: farmer.farmName,
      type: "Farmer",
      region: farmer.region,
      status: statusFromTrust(farmer.trust?.status),
      dateAdded: "2026-06-07",
      href: `/farmer-directory/${farmer.slug}`
    })),
    ...supplierDirectory.map((supplier) => ({
      id: `verify-supplier-${supplier.slug}`,
      name: supplier.companyName,
      type: "Supplier",
      region: supplier.region,
      status: statusFromTrust(supplier.trust?.status),
      dateAdded: "2026-06-07",
      href: `/supplier-directory/${supplier.slug}`
    })),
    ...buyerRequests.map((request) => ({
      id: `verify-buyer-${request.id}`,
      name: request.buyerName,
      type: "Buyer",
      region: request.region,
      status: statusFromTrust(request.trust?.status),
      dateAdded: request.datePosted,
      href: "/buyer-requests"
    }))
  ];

  return {
    farmers: farmerDirectory.map((farmer) => ({
      id: farmer.slug,
      name: farmer.farmName,
      type: farmer.farmType,
      region: farmer.region,
      status: statusFromTrust(farmer.trust?.status),
      dateAdded: "2026-06-07",
      href: `/farmer-directory/${farmer.slug}`
    })),
    buyers: Array.from(buyerMap.values()),
    suppliers: supplierDirectory.map((supplier) => ({
      id: supplier.slug,
      name: supplier.companyName,
      type: supplier.supplierCategory,
      region: supplier.region,
      status: statusFromTrust(supplier.trust?.status),
      dateAdded: "2026-06-07",
      href: `/supplier-directory/${supplier.slug}`
    })),
    marketplace: products.map((product) => ({
      id: product.id,
      name: product.name,
      type: product.category,
      region: product.region,
      status: product.available === "Sold Out" ? "Archived" : "Active",
      dateAdded: product.datePosted,
      href: "/marketplace#marketplace-listings"
    })),
    "buyer-requests": buyerRequests.map((request) => ({
      id: request.id,
      name: request.productName,
      type: request.buyerType,
      region: request.region,
      status: request.status === "Fulfilled" ? "Archived" : "Active",
      dateAdded: request.datePosted,
      href: "/buyer-requests"
    })),
    verifications: verificationRows,
    learn: learnArticles.map((article) => ({
      id: article.slug,
      name: article.title,
      type: article.category,
      region: "Ghana",
      status: "Active",
      dateAdded: article.date,
      href: "/learn"
    })),
    "market-prices": marketPrices.map((price) => ({
      id: `${price.crop}-${price.market}`,
      name: price.crop,
      type: price.trend,
      region: price.region,
      status: "Active",
      dateAdded: price.dateUpdated,
      href: "/market-intelligence"
    }))
  };
}

const sections: Array<{ id: AdminSectionId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "farmers", label: "Farmers", icon: Sprout },
  { id: "buyers", label: "Buyers", icon: UsersRound },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "marketplace", label: "Marketplace Listings", icon: Store },
  { id: "buyer-requests", label: "Buyer Requests", icon: PackageCheck },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "learn", label: "Learn Articles", icon: BookOpen },
  { id: "market-prices", label: "Market Prices", icon: ChartLine }
];

function summarize(rows: Record<AdminSectionId, AdminRow[]>) {
  const pendingVerifications = rows.verifications.filter((row) => row.status === "Pending").length;
  const whatsappLeads = farmerDirectory.length + supplierDirectory.length + products.length + buyerRequests.length;

  return [
    { label: "Farmers", value: rows.farmers.length, icon: Sprout },
    { label: "Buyers", value: rows.buyers.length, icon: UsersRound },
    { label: "Suppliers", value: rows.suppliers.length, icon: Truck },
    { label: "Marketplace Listings", value: rows.marketplace.length, icon: Store },
    { label: "Buyer Requests", value: rows["buyer-requests"].length, icon: PackageCheck },
    { label: "Pending Verifications", value: pendingVerifications, icon: CircleDashed },
    { label: "WhatsApp Leads", value: whatsappLeads, icon: MessageCircle }
  ];
}

export function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(storageKey) === "granted";
  });
  const [accessKey, setAccessKey] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSectionId>("farmers");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AdminStatus>("All");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AdminStatus>>({});
  const [notice, setNotice] = useState("Actions are mock controls for Phase 1 admin.");

  const rowsBySection = useMemo(() => sectionRows(), []);
  const summaryCards = useMemo(() => summarize(rowsBySection), [rowsBySection]);
  const currentRows = rowsBySection[activeSection].map((row) => ({
    ...row,
    status: statusOverrides[row.id] ?? row.status
  }));
  const filteredRows = currentRows.filter((row) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [row.name, row.type, row.region, row.status, row.dateAdded]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function submitAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccessError("");
    setIsChecking(true);

    const response = await fetch("/api/admin/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey })
    }).catch(() => null);

    setIsChecking(false);

    if (!response?.ok) {
      setAccessError("Admin access required");
      return;
    }

    window.sessionStorage.setItem(storageKey, "granted");
    setAccessGranted(true);
    setAccessKey("");
  }

  function mockAction(row: AdminRow, action: "Edit" | "Mark Verified" | "Archive") {
    if (action === "Mark Verified") {
      setStatusOverrides((current) => ({ ...current, [row.id]: "Verified" }));
    }

    if (action === "Archive") {
      setStatusOverrides((current) => ({ ...current, [row.id]: "Archived" }));
    }

    setNotice(`${action} action prepared for ${row.name}. Connect a database to persist this change.`);
  }

  if (!accessGranted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-leaf-50/70 to-white px-4 py-16">
        <section className="mx-auto max-w-md rounded-md border border-leaf-900/10 bg-white p-6 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf-50 text-leaf-700">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-ink">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Enter the internal Ghana Growers admin access key to open the Phase 1 dashboard.
          </p>
          <form className="mt-6 grid gap-4" onSubmit={submitAccess}>
            <label className="grid gap-2 text-sm font-black text-ink">
              Access key
              <input
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                placeholder="Enter admin access key"
              />
            </label>
            {accessError ? <p className="rounded-md bg-earth-50 px-3 py-2 text-sm font-black text-earth-700">{accessError}</p> : null}
            <button
              type="submit"
              disabled={isChecking}
              className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChecking ? "Checking..." : "Open Dashboard"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const activeSectionLabel = sections.find((section) => section.id === activeSection)?.label ?? "Admin";

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-leaf-900/10 bg-leaf-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Internal Admin</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black text-ink">Ghana Growers Admin Dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Phase 1 dashboard for reviewing platform records, content, buyer demand, verifications, and operational leads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.removeItem(storageKey);
                setAccessGranted(false);
              }}
              className="rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink/65 transition hover:border-leaf-700 hover:text-leaf-800"
            >
              Lock Dashboard
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Admin Sections
          </div>
          <nav className="mt-4 grid gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                  className={`flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-black transition ${
                    isActive ? "bg-leaf-700 text-white" : "bg-white text-ink/70 hover:text-leaf-800"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-ink/60">{card.label}</p>
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-leaf-50 text-leaf-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-ink">{card.value}</p>
                </div>
              );
            })}
          </div>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-white shadow-sm">
            <div className="border-b border-leaf-900/10 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Manage Records</p>
                  <h2 className="mt-2 text-3xl font-black text-ink">{activeSectionLabel}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{notice}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search admin records..."
                      className="w-full rounded-md border border-leaf-900/10 py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                    />
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "All" | AdminStatus)}
                    className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                <thead className="bg-leaf-50 text-xs font-black uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="px-5 py-4">Name/title</th>
                    <th className="px-5 py-4">Type/category</th>
                    <th className="px-5 py-4">Region</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date added</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-leaf-900/10">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-5 py-4 font-black text-ink">{row.name}</td>
                      <td className="px-5 py-4 text-ink/65">{row.type}</td>
                      <td className="px-5 py-4 text-ink/65">{row.region}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyles[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink/65">{row.dateAdded}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {row.href ? (
                            <Link href={row.href} className="inline-flex items-center gap-1 rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-700 transition hover:bg-leaf-100">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-700">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => mockAction(row, "Edit")}
                            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                          >
                            <FilePenLine className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => mockAction(row, "Mark Verified")}
                            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                          >
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Mark Verified
                          </button>
                          <button
                            type="button"
                            onClick={() => mockAction(row, "Archive")}
                            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRows.length === 0 ? (
              <p className="p-6 text-sm font-semibold text-ink/60">No records match this search or status filter.</p>
            ) : null}
          </section>

          <section className="mt-6 rounded-md border border-earth-500/30 bg-earth-50 p-5">
            <h2 className="text-lg font-black text-ink">Phase 1 Admin Security Note</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              This dashboard uses a lightweight access key gate and local data for internal review only. Add real authentication,
              roles, audit logs, and a database before managing sensitive user data or production operations.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
