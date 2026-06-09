"use client";

import Link from "next/link";
import {
  Archive,
  BadgeCheck,
  BookOpen,
  ChartLine,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Eye,
  FilePenLine,
  LayoutDashboard,
  Lock,
  MessageCircle,
  PackageCheck,
  PlusCircle,
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

type AdminStatus = "Pending" | "Under Review" | "Verified" | "Rejected" | "Active" | "Archived";
type VerificationSubject = "farmer" | "supplier" | "buyer";
type VerificationStatus = "Pending" | "Under Review" | "Verified" | "Rejected";
type AdminSectionId =
  | "farmers"
  | "buyers"
  | "suppliers"
  | "marketplace"
  | "buyer-requests"
  | "verifications"
  | "learn"
  | "market-prices";
type AdminFormId = "farmers" | "suppliers" | "marketplace" | "buyer-requests" | "market-prices" | "learn";

type AdminRow = {
  id: string;
  name: string;
  type: string;
  region: string;
  status: AdminStatus;
  dateAdded: string;
  href?: string;
  verificationTarget?: {
    subject: VerificationSubject;
    recordId: string;
  };
};
type FormField = {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "url" | "textarea" | "select";
  required?: boolean;
  helper?: string;
  options?: string[];
};
type ActiveForm = {
  id: AdminFormId;
  mode: "add" | "edit";
  title: string;
  recordName?: string;
};

const storageKey = "ghana-growers-admin-access";
const adminSessionTokenKey = "ghana-growers-admin-session-token";

const statusStyles: Record<AdminStatus, string> = {
  Pending: "bg-earth-50 text-earth-700",
  "Under Review": "bg-leaf-50 text-leaf-700",
  Verified: "bg-leaf-50 text-leaf-700",
  Rejected: "bg-tomato/10 text-tomato",
  Active: "bg-white text-leaf-700 ring-1 ring-leaf-900/10",
  Archived: "bg-ink/10 text-ink/55"
};

function statusFromTrust(status?: string): AdminStatus {
  if (status === "Verified" || status === "Premium Member" || status?.includes("Verified")) {
    return "Verified";
  }

  if (status === "Under Review" || status === "Rejected" || status === "Pending") {
    return status;
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
      href: `/farmer-directory/${farmer.slug}`,
      verificationTarget: { subject: "farmer" as const, recordId: farmer.slug }
    })),
    ...supplierDirectory.map((supplier) => ({
      id: `verify-supplier-${supplier.slug}`,
      name: supplier.companyName,
      type: "Supplier",
      region: supplier.region,
      status: statusFromTrust(supplier.trust?.status),
      dateAdded: "2026-06-07",
      href: `/supplier-directory/${supplier.slug}`,
      verificationTarget: { subject: "supplier" as const, recordId: supplier.slug }
    })),
    ...buyerRequests.map((request) => ({
      id: `verify-buyer-${request.id}`,
      name: request.buyerName,
      type: "Buyer",
      region: request.region,
      status: statusFromTrust(request.trust?.status),
      dateAdded: request.datePosted,
      href: "/buyer-requests",
      verificationTarget: { subject: "buyer" as const, recordId: request.id }
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
  { id: "verifications", label: "Verification Queue", icon: ShieldCheck },
  { id: "learn", label: "Learn Articles", icon: BookOpen },
  { id: "market-prices", label: "Market Prices", icon: ChartLine }
];

const quickActions: Array<{
  label: string;
  section: AdminSectionId;
  intent: string;
  icon: typeof LayoutDashboard;
  form?: AdminFormId;
}> = [
  { label: "Add Farmer", section: "farmers", intent: "New farmer record form ready for database connection.", icon: Sprout, form: "farmers" },
  { label: "Add Supplier", section: "suppliers", intent: "New supplier record form ready for database connection.", icon: Truck, form: "suppliers" },
  { label: "Add Marketplace Listing", section: "marketplace", intent: "New marketplace listing form ready for database connection.", icon: Store, form: "marketplace" },
  { label: "Add Buyer Request", section: "buyer-requests", intent: "New buyer request form ready for database connection.", icon: PackageCheck, form: "buyer-requests" },
  { label: "Add Market Price", section: "market-prices", intent: "New market price entry form ready for database connection.", icon: ChartLine, form: "market-prices" },
  { label: "Review Verifications", section: "verifications", intent: "Verification queue opened for review.", icon: ShieldCheck }
];

const formTitles: Record<AdminFormId, string> = {
  farmers: "Farmer",
  suppliers: "Supplier",
  marketplace: "Marketplace Listing",
  "buyer-requests": "Buyer Request",
  "market-prices": "Market Price",
  learn: "Learn Article"
};

const createEndpoints: Partial<Record<AdminFormId, string>> = {
  farmers: "/api/admin/farmers",
  suppliers: "/api/admin/suppliers",
  marketplace: "/api/admin/marketplace-listings",
  "buyer-requests": "/api/admin/buyer-requests",
  "market-prices": "/api/admin/market-prices",
  learn: "/api/admin/learn-articles"
};

const formConfigs: Record<AdminFormId, FormField[]> = {
  farmers: [
    { name: "farmerName", label: "Farmer Name", required: true },
    { name: "farmName", label: "Farm Name", required: true },
    { name: "region", label: "Region", required: true },
    { name: "district", label: "District", required: true },
    { name: "farmType", label: "Farm Type", type: "select", required: true, options: ["Crop", "Livestock", "Mixed"] },
    { name: "products", label: "Products", required: true, helper: "Separate multiple products with commas." },
    { name: "farmSize", label: "Farm Size", required: true },
    { name: "whatsappNumber", label: "WhatsApp Number", required: true },
    { name: "verificationStatus", label: "Verification Status", type: "select", required: true, options: ["Pending", "Under Review", "Verified", "Rejected"] },
    { name: "profileImageUrl", label: "Profile Image URL", type: "url", helper: "Use a local /images path or approved image URL." }
  ],
  suppliers: [
    { name: "companyName", label: "Company Name", required: true },
    { name: "contactPerson", label: "Contact Person", required: true },
    { name: "region", label: "Region", required: true },
    { name: "district", label: "District", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: ["Seeds", "Fertilizers", "Agrochemicals", "Farm Equipment", "Irrigation Systems", "Packaging", "Logistics", "Storage", "Financial Services", "Agricultural Consulting"] },
    { name: "productsServices", label: "Products/Services", required: true, helper: "Separate multiple services with commas." },
    { name: "whatsappNumber", label: "WhatsApp Number", required: true },
    { name: "verificationStatus", label: "Verification Status", type: "select", required: true, options: ["Pending", "Under Review", "Verified", "Rejected"] },
    { name: "website", label: "Website", type: "url" }
  ],
  marketplace: [
    { name: "productName", label: "Product Name", required: true },
    { name: "category", label: "Category", required: true },
    { name: "region", label: "Region", required: true },
    { name: "district", label: "District", required: true },
    { name: "sellerFarmer", label: "Seller/Farmer", required: true },
    { name: "quantity", label: "Quantity", required: true },
    { name: "unit", label: "Unit", required: true },
    { name: "availability", label: "Availability", required: true },
    { name: "whatsappNumber", label: "WhatsApp Number", required: true },
    { name: "imageUrl", label: "Image URL", type: "url" }
  ],
  "buyer-requests": [
    { name: "productNeeded", label: "Product Needed", required: true },
    { name: "quantity", label: "Quantity", required: true },
    { name: "region", label: "Region", required: true },
    { name: "district", label: "District", required: true },
    { name: "buyerType", label: "Buyer Type", required: true },
    { name: "deadline", label: "Deadline", type: "date", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: ["Open", "Urgent", "Fulfilled"] },
    { name: "whatsappNumber", label: "WhatsApp Number", required: true },
    { name: "notes", label: "Notes", type: "textarea" }
  ],
  "market-prices": [
    { name: "product", label: "Product", required: true },
    { name: "region", label: "Region", required: true },
    { name: "market", label: "Market", required: true },
    { name: "wholesalePrice", label: "Wholesale Price", required: true },
    { name: "retailPrice", label: "Retail Price", required: true },
    { name: "dateUpdated", label: "Date Updated", type: "date", required: true },
    { name: "trend", label: "Trend", type: "select", required: true, options: ["Rising", "Stable", "Falling"] }
  ],
  learn: [
    { name: "title", label: "Title", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: ["Crop Production", "Livestock", "Agribusiness", "Market Prices", "Success Stories"] },
    { name: "summary", label: "Summary", type: "textarea", required: true },
    { name: "author", label: "Author", required: true },
    { name: "publishDate", label: "Publish Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: ["Draft", "Active", "Archived"] }
  ]
};

const recentActivity: Array<{
  action: string;
  detail: string;
  time: string;
  section: AdminSectionId;
  icon: typeof LayoutDashboard;
}> = [
  {
    action: "Farmer verified",
    detail: "Techiman Maize and Beans Farm marked as Verified Farmer",
    time: "Today, 9:20 AM",
    section: "verifications",
    icon: BadgeCheck
  },
  {
    action: "New farmer added",
    detail: "Nsawam Fruit Farmers joined the farmer directory",
    time: "Today, 8:45 AM",
    section: "farmers",
    icon: Sprout
  },
  {
    action: "New supplier added",
    detail: "FreshChain Logistics Tema added to supplier records",
    time: "Yesterday, 4:10 PM",
    section: "suppliers",
    icon: Truck
  },
  {
    action: "Buyer request created",
    detail: "500 crates of tomatoes requested in Greater Accra",
    time: "Yesterday, 2:35 PM",
    section: "buyer-requests",
    icon: PackageCheck
  },
  {
    action: "Listing approved",
    detail: "Bulk onions listing approved for marketplace visibility",
    time: "Jun 7, 11:15 AM",
    section: "marketplace",
    icon: Store
  }
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

function pendingWork(rows: Record<AdminSectionId, AdminRow[]>) {
  return [
    {
      label: "Pending Verifications",
      value: rows.verifications.filter((row) => row.status === "Pending").length,
      note: "Profiles waiting for Ghana Growers review",
      section: "verifications" as AdminSectionId
    },
    {
      label: "Pending Buyer Requests",
      value: buyerRequests.filter((request) => request.status !== "Fulfilled").length,
      note: "Open demand records to monitor",
      section: "buyer-requests" as AdminSectionId
    },
    {
      label: "Pending Listings",
      value: products.filter((product) => !product.verified && product.available !== "Sold Out").length,
      note: "Marketplace listings needing verification",
      section: "marketplace" as AdminSectionId
    }
  ];
}

function pendingTasks(rows: Record<AdminSectionId, AdminRow[]>) {
  return [
    {
      label: "Pending Verifications",
      value: rows.verifications.filter((row) => row.status === "Pending").length,
      section: "verifications" as AdminSectionId,
      icon: ShieldCheck
    },
    {
      label: "Pending Listings",
      value: products.filter((product) => !product.verified && product.available !== "Sold Out").length,
      section: "marketplace" as AdminSectionId,
      icon: Store
    },
    {
      label: "Pending Buyer Requests",
      value: buyerRequests.filter((request) => request.status !== "Fulfilled").length,
      section: "buyer-requests" as AdminSectionId,
      icon: PackageCheck
    },
    {
      label: "New WhatsApp Leads",
      value: farmerDirectory.length + supplierDirectory.length + products.filter((product) => product.available !== "Sold Out").length,
      section: "buyers" as AdminSectionId,
      icon: MessageCircle
    }
  ];
}

function emptyFormValues(formId: AdminFormId) {
  return Object.fromEntries(formConfigs[formId].map((field) => [field.name, ""]));
}

function districtFromLocation(location?: string) {
  return location?.split(",")[0]?.trim() ?? "";
}

function formValuesForRow(formId: AdminFormId, row?: AdminRow) {
  const values = emptyFormValues(formId);

  if (!row) {
    if (formId === "learn") {
      values.author = "Ghana Growers Team";
      values.status = "Draft";
    }

    if (formId === "buyer-requests") {
      values.status = "Open";
    }

    if (formId === "market-prices") {
      values.trend = "Stable";
    }

    return values;
  }

  if (formId === "farmers") {
    const farmer = farmerDirectory.find((record) => record.slug === row.id);
    return {
      ...values,
      farmerName: farmer?.contactName ?? "",
      farmName: farmer?.farmName ?? row.name,
      region: farmer?.region ?? row.region,
      district: farmer?.district ?? "",
      farmType: farmer?.farmType ?? row.type,
      products: farmer?.products.join(", ") ?? "",
      farmSize: farmer?.farmSize ?? "",
      whatsappNumber: "",
      verificationStatus: farmer?.verificationStatus ?? row.status,
      profileImageUrl: farmer?.photos[0] ?? ""
    };
  }

  if (formId === "suppliers") {
    const supplier = supplierDirectory.find((record) => record.slug === row.id);
    return {
      ...values,
      companyName: supplier?.companyName ?? row.name,
      contactPerson: supplier?.contactPerson ?? "",
      region: supplier?.region ?? row.region,
      district: supplier?.district ?? "",
      category: supplier?.supplierCategory ?? row.type,
      productsServices: supplier?.productsServices.join(", ") ?? "",
      whatsappNumber: supplier?.phone ?? "",
      verificationStatus: supplier?.verificationStatus ?? row.status,
      website: supplier?.website ?? ""
    };
  }

  if (formId === "marketplace") {
    const product = products.find((record) => record.id === row.id);
    return {
      ...values,
      productName: product?.name ?? row.name,
      category: product?.category ?? row.type,
      region: product?.region ?? row.region,
      district: districtFromLocation(product?.location),
      sellerFarmer: product?.seller ?? "",
      quantity: product?.quantity ?? "",
      unit: product?.unit ?? "",
      availability: product?.available ?? "",
      whatsappNumber: product?.whatsappNumber ?? "",
      imageUrl: product?.image ?? ""
    };
  }

  if (formId === "buyer-requests") {
    const request = buyerRequests.find((record) => record.id === row.id);
    return {
      ...values,
      productNeeded: request?.productName ?? row.name,
      quantity: request?.quantityNeeded ?? "",
      region: request?.region ?? row.region,
      district: request?.district ?? "",
      buyerType: request?.buyerType ?? row.type,
      deadline: request?.deadline ?? "",
      status: request?.status ?? "Open",
      whatsappNumber: request?.whatsappNumber ?? "",
      notes: request?.notes ?? ""
    };
  }

  if (formId === "market-prices") {
    const price = marketPrices.find((record) => `${record.crop}-${record.market}` === row.id);
    return {
      ...values,
      product: price?.crop ?? row.name,
      region: price?.region ?? row.region,
      market: price?.market ?? "",
      wholesalePrice: price?.wholesalePrice ?? "",
      retailPrice: price?.retailPrice ?? "",
      dateUpdated: price?.dateUpdated ?? "",
      trend: price?.trend ?? "Stable"
    };
  }

  const article = learnArticles.find((record) => record.slug === row.id);
  return {
    ...values,
    title: article?.title ?? row.name,
    category: article?.category ?? row.type,
    summary: article?.excerpt ?? "",
    author: "Ghana Growers Team",
    publishDate: article?.date ?? "",
    status: row.status
  };
}

function formIdForSection(section: AdminSectionId): AdminFormId | null {
  if (
    section === "farmers" ||
    section === "suppliers" ||
    section === "marketplace" ||
    section === "buyer-requests" ||
    section === "market-prices" ||
    section === "learn"
  ) {
    return section;
  }

  return null;
}

export function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(storageKey) === "granted" && Boolean(window.sessionStorage.getItem(adminSessionTokenKey));
  });
  const [accessKey, setAccessKey] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSectionId>("farmers");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AdminStatus>("All");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AdminStatus>>({});
  const [notice, setNotice] = useState("Actions are mock controls for Phase 1 admin.");
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const rowsBySection = useMemo(() => sectionRows(), []);
  const summaryCards = useMemo(() => summarize(rowsBySection), [rowsBySection]);
  const pendingItems = useMemo(() => pendingWork(rowsBySection), [rowsBySection]);
  const pendingTaskItems = useMemo(() => pendingTasks(rowsBySection), [rowsBySection]);
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

    const result = (await response.json().catch(() => null)) as { adminSessionToken?: string } | null;

    if (!result?.adminSessionToken) {
      setAccessError("Admin access required");
      return;
    }

    window.sessionStorage.setItem(storageKey, "granted");
    window.sessionStorage.setItem(adminSessionTokenKey, result.adminSessionToken);
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

  async function updateVerificationStatus(row: AdminRow, status: VerificationStatus) {
    if (!row.verificationTarget) {
      setNotice(`Verification target is missing for ${row.name}.`);
      return;
    }

    const adminSessionToken = window.sessionStorage.getItem(adminSessionTokenKey);

    if (!adminSessionToken) {
      setNotice("Admin access required. Please lock the dashboard and sign in again.");
      return;
    }

    setStatusOverrides((current) => ({ ...current, [row.id]: status }));

    const response = await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-ghana-growers-admin-session": adminSessionToken
      },
      body: JSON.stringify({
        ...row.verificationTarget,
        status,
        verifiedBy: "Ghana Growers Admin"
      })
    }).catch(() => null);

    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      setNotice(result?.error ?? `Could not update verification status for ${row.name}.`);
      return;
    }

    setNotice(`${row.name} verification status updated to ${status}.`);
  }

  function runQuickAction(section: AdminSectionId, intent: string) {
    setActiveSection(section);
    setSearchTerm("");
    setStatusFilter(section === "verifications" ? "Pending" : "All");
    setNotice(`${intent} Phase 1 actions are mock controls until a database is connected.`);
  }

  function openAdminForm(formId: AdminFormId, mode: "add" | "edit", row?: AdminRow) {
    setActiveSection(formId);
    setSearchTerm("");
    setStatusFilter("All");
    setFormValues(formValuesForRow(formId, row));
    setFormError("");
    setFormSuccess("");
    setActiveForm({
      id: formId,
      mode,
      title: `${mode === "add" ? "Add" : "Edit"} ${formTitles[formId]}`,
      recordName: row?.name
    });
  }

  function closeAdminForm() {
    setActiveForm(null);
    setFormValues({});
    setFormError("");
    setFormSuccess("");
  }

  async function submitAdminForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeForm) {
      return;
    }

    const missingField = formConfigs[activeForm.id].find((field) => field.required && !formValues[field.name]?.trim());

    if (missingField) {
      setFormError(`${missingField.label} is required.`);
      setFormSuccess("");
      return;
    }

    const recordLabel = formTitles[activeForm.id];
    const endpoint = activeForm.mode === "add" ? createEndpoints[activeForm.id] : undefined;

    if (endpoint) {
      const adminSessionToken = window.sessionStorage.getItem(adminSessionTokenKey);

      if (!adminSessionToken) {
        setFormError("Admin access required. Please lock the dashboard and sign in again.");
        setFormSuccess("");
        return;
      }

      setIsSubmittingForm(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ghana-growers-admin-session": adminSessionToken
        },
        body: JSON.stringify(formValues)
      }).catch(() => null);
      setIsSubmittingForm(false);

      const result = (await response?.json().catch(() => null)) as { error?: string } | null;

      if (!response?.ok) {
        if (response?.status === 401) {
          window.sessionStorage.removeItem(storageKey);
          window.sessionStorage.removeItem(adminSessionTokenKey);
          setAccessGranted(false);
        }

        setFormError(result?.error ?? "Supabase insert failed. Check the admin session, environment variables, and table schema.");
        setFormSuccess("");
        return;
      }

      setFormError("");
      setFormSuccess(`${recordLabel} saved to Supabase successfully. Public pages still use JSON fallback until the read migration is enabled.`);
      setNotice(`${recordLabel} created in Supabase. JSON-backed public pages continue working during Phase 1 migration.`);
      return;
    }

    setFormError("");
    setFormSuccess(
      `${activeForm.mode === "add" ? "New" : "Updated"} ${recordLabel.toLowerCase()} workflow previewed successfully. This Phase 1 admin form previews the workflow. Database persistence will be added in a later phase.`
    );
    setNotice(`${activeForm.title} completed as a Phase 1 workflow preview. Connect a database to persist this record.`);
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
  const activeSectionFormId = formIdForSection(activeSection);

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
                window.sessionStorage.removeItem(adminSessionTokenKey);
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
          <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Quick Actions</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Manage common admin tasks</h2>
                </div>
                <span className="hidden h-10 w-10 place-items-center rounded-md bg-leaf-50 text-leaf-700 sm:grid">
                  <PlusCircle className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => {
                        if (action.form) {
                          openAdminForm(action.form, "add");
                          setNotice(`${action.intent} This Phase 1 form previews the workflow until database persistence is added.`);
                          return;
                        }

                        runQuickAction(action.section, action.intent);
                      }}
                      className="flex items-center gap-3 rounded-md border border-leaf-900/10 bg-leaf-50/70 px-4 py-3 text-left text-sm font-black text-ink transition hover:border-leaf-700 hover:bg-white hover:text-leaf-800"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-md border border-earth-500/25 bg-earth-50 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-white text-earth-700 ring-1 ring-earth-500/20">
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Pending Work</p>
                  <h2 className="text-xl font-black text-ink">Needs attention</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {pendingItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => runQuickAction(item.section, `${item.label} opened for review.`)}
                    className="rounded-md bg-white p-3 text-left ring-1 ring-earth-500/20 transition hover:ring-earth-600/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-ink">{item.label}</p>
                      <span className="rounded-full bg-earth-50 px-2.5 py-1 text-xs font-black text-earth-700">{item.value}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">{item.note}</p>
                  </button>
                ))}
              </div>
            </aside>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Recent Activity</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Latest platform updates</h2>
                </div>
                <span className="hidden h-10 w-10 place-items-center rounded-md bg-leaf-50 text-leaf-700 sm:grid">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 divide-y divide-leaf-900/10">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <button
                      key={`${activity.action}-${activity.time}`}
                      type="button"
                      onClick={() => runQuickAction(activity.section, `${activity.action} activity opened.`)}
                      className="flex w-full items-start gap-3 py-3 text-left transition first:pt-0 last:pb-0 hover:text-leaf-800"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-ink">{activity.action}</span>
                        <span className="mt-1 block text-sm leading-5 text-ink/60">{activity.detail}</span>
                      </span>
                      <span className="hidden shrink-0 text-xs font-black text-ink/45 sm:block">{activity.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-white text-leaf-700 ring-1 ring-leaf-900/10">
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Pending Tasks</p>
                  <h2 className="text-2xl font-black text-ink">Admin queue</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {pendingTaskItems.map((task) => {
                  const Icon = task.icon;

                  return (
                    <button
                      key={task.label}
                      type="button"
                      onClick={() => runQuickAction(task.section, `${task.label} opened from pending tasks.`)}
                      className="flex items-center justify-between gap-4 rounded-md bg-white p-4 text-left ring-1 ring-leaf-900/10 transition hover:ring-leaf-700/30"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="truncate text-sm font-black text-ink">{task.label}</span>
                      </span>
                      <span className="rounded-full bg-earth-50 px-2.5 py-1 text-xs font-black text-earth-700">{task.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-md border border-leaf-900/10 bg-white shadow-sm">
            <div className="border-b border-leaf-900/10 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Manage Records</p>
                  <h2 className="mt-2 text-3xl font-black text-ink">{activeSectionLabel}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{notice}</p>
                </div>
                <div className={`grid gap-3 ${activeSectionFormId ? "sm:grid-cols-[auto_1fr_auto]" : "sm:grid-cols-[1fr_auto]"}`}>
                  {activeSectionFormId ? (
                    <button
                      type="button"
                      onClick={() => openAdminForm(activeSectionFormId, "add")}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800"
                    >
                      <PlusCircle className="h-4 w-4" aria-hidden="true" />
                      Add {formTitles[activeSectionFormId]}
                    </button>
                  ) : null}
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
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
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
                              {activeSection === "verifications" ? "Review" : "View"}
                            </Link>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-700">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          )}
                          {activeSection === "verifications" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateVerificationStatus(row, "Under Review")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <FilePenLine className="h-3.5 w-3.5" />
                                Mark Under Review
                              </button>
                              <button
                                type="button"
                                onClick={() => updateVerificationStatus(row, "Verified")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => updateVerificationStatus(row, "Rejected")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-tomato"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const formId = formIdForSection(activeSection);

                                  if (formId) {
                                    openAdminForm(formId, "edit", row);
                                    return;
                                  }

                                  mockAction(row, "Edit");
                                }}
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
                            </>
                          )}
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

          {activeForm ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-6">
              <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-soft">
                <div className="border-b border-leaf-900/10 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Admin Form</p>
                      <h2 className="mt-2 text-3xl font-black text-ink">{activeForm.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-ink/60">
                        {activeForm.recordName ? `Editing ${activeForm.recordName}. ` : ""}
                        {activeForm.mode === "add" && createEndpoints[activeForm.id]
                          ? "This Phase 1 admin form saves new records to Supabase when the table schema and server environment variables are configured."
                          : "This Phase 1 admin form previews the workflow. Database persistence for this action will be added in a later phase."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeAdminForm}
                      className="rounded-md border border-leaf-900/10 px-4 py-2 text-sm font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <form className="p-5" onSubmit={submitAdminForm}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {formConfigs[activeForm.id].map((field) => {
                      const fieldId = `admin-${activeForm.id}-${field.name}`;
                      const value = formValues[field.name] ?? "";

                      if (field.type === "textarea") {
                        return (
                          <label key={field.name} htmlFor={fieldId} className="grid gap-2 text-sm font-black text-ink md:col-span-2">
                            {field.label}
                            <textarea
                              id={fieldId}
                              value={value}
                              required={field.required}
                              onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                              rows={4}
                              className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                            />
                            {field.helper ? <span className="text-xs font-semibold leading-5 text-ink/50">{field.helper}</span> : null}
                          </label>
                        );
                      }

                      if (field.type === "select") {
                        return (
                          <label key={field.name} htmlFor={fieldId} className="grid gap-2 text-sm font-black text-ink">
                            {field.label}
                            <select
                              id={fieldId}
                              value={value}
                              required={field.required}
                              onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                              className="rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                            >
                              <option value="">Select {field.label.toLowerCase()}</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            {field.helper ? <span className="text-xs font-semibold leading-5 text-ink/50">{field.helper}</span> : null}
                          </label>
                        );
                      }

                      return (
                        <label key={field.name} htmlFor={fieldId} className="grid gap-2 text-sm font-black text-ink">
                          {field.label}
                          <input
                            id={fieldId}
                            type={field.type === "date" || field.type === "number" ? field.type : "text"}
                            inputMode={field.type === "url" ? "url" : undefined}
                            value={value}
                            required={field.required}
                            onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                            className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                          />
                          {field.helper ? <span className="text-xs font-semibold leading-5 text-ink/50">{field.helper}</span> : null}
                        </label>
                      );
                    })}
                  </div>

                  {formError ? <p className="mt-5 rounded-md bg-earth-50 px-4 py-3 text-sm font-black text-earth-700">{formError}</p> : null}
                  {formSuccess ? <p className="mt-5 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black leading-6 text-leaf-700">{formSuccess}</p> : null}

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeAdminForm}
                      className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForm}
                      className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800"
                    >
                      {isSubmittingForm
                        ? "Saving..."
                        : activeForm.mode === "add" && createEndpoints[activeForm.id]
                          ? "Save to Supabase"
                          : activeForm.mode === "add"
                            ? "Preview Add Workflow"
                            : "Preview Edit Workflow"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : null}

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
