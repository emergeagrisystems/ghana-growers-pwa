"use client";

import Link from "next/link";
import {
  Archive,
  BadgeCheck,
  BookOpen,
  ChartLine,
  ChevronDown,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Eye,
  FilePenLine,
  ListChecks,
  LayoutDashboard,
  MessageCircle,
  PackageCheck,
  PlusCircle,
  Search,
  ShieldCheck,
  Sprout,
  Star,
  Store,
  Trash2,
  Truck,
  UploadCloud,
  UsersRound,
  X
} from "lucide-react";
import { ChangeEvent, FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { buyerRequests } from "@/data/buyerRequests";
import { farmerDirectory } from "@/data/farmers";
import learnArticles from "@/data/learnArticles.json";
import { marketPrices } from "@/data/marketPrices";
import { products } from "@/data/products";
import { WHATSAPP_NUMBER } from "@/data/site";
import successStories from "@/data/successStories.json";
import { supplierDirectory } from "@/data/suppliers";
import type { AdminUser } from "@/lib/adminAuth";
import { matchTokens, normalizeMatchText, productMatchScore } from "@/lib/matching";

type AdminStatus = "Pending" | "Under Review" | "Verified" | "Rejected" | "Active" | "Archived" | "Needs Follow-up" | "Published";
type ImportAdminStatus = AdminStatus | "Pending Review";
type VerificationSubject = "farmer" | "supplier" | "buyer";
type VerificationStatus = "Pending" | "Under Review" | "Verified" | "Rejected";
type AdminSectionId =
  | "analytics"
  | "launch-checklist"
  | "lead-queue"
  | "featured-enquiries"
  | "farmer-import"
  | "farmers"
  | "buyers"
  | "suppliers"
  | "marketplace"
  | "buyer-requests"
  | "verifications"
  | "applications"
  | "submissions"
  | "whatsapp-leads"
  | "match-opportunities"
  | "learn"
  | "success-stories"
  | "market-prices";
type AdminFormId = "farmers" | "suppliers" | "marketplace" | "buyer-requests" | "market-prices" | "learn" | "success-stories";

type AdminRow = {
  id: string;
  name: string;
  type: string;
  region: string;
  status: ImportAdminStatus;
  verificationStatus?: string;
  dateAdded: string;
  source?: string | null;
  phone?: string;
  whatsapp?: string;
  farmSize?: string;
  products?: string;
  completenessPercent?: number;
  completenessStatus?: string;
  completenessTone?: string;
  ownerType?: "Farmer" | "Supplier" | "Admin" | string;
  ownerId?: string;
  ownerName?: string;
  isFeatured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
  href?: string;
  verificationTarget?: {
    subject: VerificationSubject;
    recordId: string;
  };
};
type AdminActivityRecord = {
  id: string;
  admin_email: string;
  action_type:
    | "Create"
    | "Edit"
    | "Verify"
    | "Archive"
    | "Review"
    | "Approve"
    | "Reject"
    | "Convert"
    | "View"
    | "Contact"
    | "Complete"
    | "Close"
    | "Submit"
    | "Marked Featured"
    | "Removed Featured"
    | "Featured Expired"
    | "Featured Note Updated"
    | "Publish";
  entity_type:
    | "Farmer"
    | "Supplier"
    | "Marketplace Listing"
    | "Buyer Request"
    | "Success Story"
    | "Farmer Application"
    | "Buyer Application"
    | "Supplier Application"
    | "Listing Submission"
    | "Buyer Request Submission"
    | "Buyer Request Application"
    | "Match Opportunity"
    | "Lead Request"
    | "Featured Enquiry";
  entity_id: string | null;
  entity_name: string;
  created_at: string;
};
type WhatsAppLeadRecord = {
  id: string;
  source_type: "Farmer" | "Supplier" | "Marketplace Listing" | "Buyer Request" | "Floating WhatsApp" | "Platform";
  source_id: string;
  source_name: string;
  phone_number: string;
  page_path: string;
  user_agent: string | null;
  created_at: string;
};
type LeadRequestStatus = "New" | "Contacted" | "Negotiating" | "Completed" | "Lost";
type FeaturedEnquiryStatus = "New" | "Contacted" | "Approved" | "Rejected" | "Closed";
type LeadRequestRecord = {
  id: string;
  created_at: string;
  requester_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  product_interest: string;
  quantity_needed: string | null;
  message: string | null;
  source_type: "Farmer" | "Supplier" | "Marketplace Listing" | "Supplier Listing";
  source_id: string;
  source_name: string;
  source_page: string | null;
  status: LeadRequestStatus | "Closed";
};
type FeaturedEnquiryRecord = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  role: "Farmer" | "Supplier" | "Listing Owner";
  profile_or_listing_name: string;
  feature_request: string;
  message: string | null;
  status: FeaturedEnquiryStatus;
};
type AnalyticsRecord = Record<string, unknown>;
type AnalyticsData = {
  farmers: AnalyticsRecord[];
  suppliers: AnalyticsRecord[];
  marketplaceListings: AnalyticsRecord[];
  buyerRequests: AnalyticsRecord[];
  whatsappLeads: AnalyticsRecord[];
  leadRequests: AnalyticsRecord[];
  cropHealthReports: AnalyticsRecord[];
  marketPrices: AnalyticsRecord[];
};
type AdminFarmerDiagnostics = {
  totalSupabaseFarmers: number;
  tallyImportFarmers: number;
  foundingFarmers?: number;
  manualTestFarmers: number;
  activeFarmers: number;
  pendingReviewFarmers: number;
  archivedFarmers: number;
  sourceValues: string[];
  fallbackUsed?: boolean;
  error?: string;
  migrationWarning?: string;
};
type AdminMatchOpportunity = {
  id: string;
  request: AnalyticsRecord;
  farmers: AnalyticsRecord[];
  listings: AnalyticsRecord[];
};
type ApplicationKind = "farmer" | "buyer" | "supplier";
type ApplicationStatus = "New" | "Under Review" | "Approved" | "Rejected" | "Converted";
type SubmissionKind = "listing" | "buyer-request";
type SubmissionStatus = "New" | "Under Review" | "Approved" | "Rejected" | "Converted" | "Published";
type LaunchStatus = "Incomplete" | "Complete";
type FarmerBulkAction = "active" | "pending-review" | "under-review" | "verified" | "founding" | "archive";
type FarmerSourceFilter = "All" | "Tally Import" | "Founding Farmer" | "Manual/Test";
type ProfileCompletenessFilter = "All" | "Ready to Publish" | "Needs Follow-up" | "Incomplete";
type MarketplaceOwnerFilter = "All" | "Farmer" | "Supplier" | "Admin";
type FeaturedFilter = "All" | "Featured" | "Not Featured" | "Expired Featured";
type ApplicationRecord = {
  id: string;
  name: string;
  business_or_farm_name: string | null;
  phone: string;
  whatsapp_number: string;
  email: string;
  region: string | null;
  district: string | null;
  user_type: "Farmer" | "Buyer" | "Supplier";
  products_or_services: string | null;
  notes: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};
type ListingSubmissionRecord = {
  id: string;
  product_name: string;
  category: string;
  quantity: string;
  unit: string;
  region: string;
  district: string;
  seller_name: string;
  seller_type: "Farmer" | "Supplier";
  whatsapp_number: string;
  description: string;
  image_url: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};
type BuyerRequestSubmissionRecord = {
  id: string;
  product_needed: string;
  quantity: string;
  company_name: string | null;
  phone_number: string;
  region: string;
  district: string;
  buyer_name: string;
  buyer_type: string;
  whatsapp_number: string;
  preferred_delivery: string | null;
  deadline: string;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};
type ImportedFarmerRecord = {
  id: string;
  slug: string;
  farmer_name: string;
  farm_name: string;
  region: string;
  district: string;
  farm_type: string;
  products: string[];
  farm_size: string;
  phone_number?: string;
  whatsapp_number: string;
  email?: string;
  farm_location?: string;
  farming_experience?: string;
  currently_harvesting?: string;
  supply_frequency?: string;
  delivery_preference?: string;
  payment_preference?: string;
  workshop_interest?: string;
  referral_source?: string;
  tally_photo_url?: string;
  imported_photo_url?: string;
  original_tally_data?: Record<string, unknown>;
  status: ImportAdminStatus;
  verification_status: string;
  verification_date?: string | null;
  verified_by?: string | null;
  verification_notes?: string | null;
  profile_image_url?: string | null;
  description?: string | null;
  created_at?: string | null;
  source: string;
};
type FarmerImportReport = {
  imported: number;
  duplicates: number;
  errors: number;
  duplicateRows: Array<{ row: number; phone: string; reason: string }>;
  errorRows: Array<{ row: number; message: string }>;
};
type FarmerImportPreview = {
  detectedHeaders: string[];
  normalizedHeaders: string[];
  fieldMappings: Record<string, { label: string; detectedHeader: string; normalizedHeader: string; index: number } | null>;
  missingRequiredFields: string[];
  previewRows: Array<{
    farmerName: string;
    farmName: string;
    phone: string;
    location: string;
    products: string;
  }>;
  totalRows?: number;
};
type FormField = {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "url" | "textarea" | "select" | "image";
  required?: boolean;
  helper?: string;
  options?: string[];
  bucket?: "farmers" | "suppliers" | "marketplace";
};
type ActiveForm = {
  id: AdminFormId;
  mode: "add" | "edit";
  title: string;
  recordId?: string;
  recordName?: string;
};

const manualLaunchChecklistItems = [
  "Homepage reviewed",
  "Mobile reviewed",
  "Legal/disclaimer reviewed",
  "Contact flow tested"
] as const;
type ManualLaunchChecklistItem = (typeof manualLaunchChecklistItems)[number];

const farmerBulkActionLabels: Record<FarmerBulkAction, string> = {
  active: "Mark Active",
  "pending-review": "Mark Pending Review",
  "under-review": "Mark Under Review",
  verified: "Mark Verified",
  founding: "Assign Founding Farmer",
  archive: "Archive"
};

const statusStyles: Record<AdminStatus, string> = {
  Pending: "bg-earth-50 text-earth-700",
  "Under Review": "bg-leaf-50 text-leaf-700",
  "Needs Follow-up": "bg-earth-50 text-earth-700",
  Verified: "bg-leaf-50 text-leaf-700",
  Rejected: "bg-tomato/10 text-tomato",
  Active: "bg-white text-leaf-700 ring-1 ring-leaf-900/10",
  Published: "bg-leaf-50 text-leaf-700",
  Archived: "bg-ink/10 text-ink/55"
};
const importStatusStyles: Record<ImportAdminStatus, string> = {
  ...statusStyles,
  "Pending Review": "bg-earth-50 text-earth-700"
};

function statusFromTrust(status?: string): AdminStatus {
  if (status === "Verified" || status === "Premium Member" || status?.includes("Verified")) {
    return "Verified";
  }

  if (status === "Under Review" || status === "Rejected" || status === "Pending" || status === "Needs Follow-up") {
    return status;
  }

  return "Pending";
}

function applicationStatusClass(status: ApplicationStatus | SubmissionStatus) {
  if (status === "New") {
    return statusStyles.Pending;
  }

  if (status === "Under Review") {
    return statusStyles["Under Review"];
  }

  if (status === "Approved" || status === "Converted") {
    return statusStyles.Active;
  }

  if (status === "Published") {
    return statusStyles.Verified;
  }

  return statusStyles.Rejected;
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
      source: null,
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
    analytics: [],
    "launch-checklist": [],
    "lead-queue": [],
    "featured-enquiries": [],
    "farmer-import": [],
    farmers: farmerDirectory.map((farmer) => ({
      id: farmer.slug,
      name: farmer.farmName,
      type: farmer.farmType,
      region: farmer.region,
      status: statusFromTrust(farmer.trust?.status),
      dateAdded: "2026-06-07",
      products: farmer.products.slice(0, 3).join(", "),
      farmSize: farmer.farmSize,
      isFeatured: farmer.isFeatured,
      featuredUntil: farmer.featuredUntil,
      featuredNote: farmer.featuredNote,
      href: `/farmer-directory/${farmer.slug}`,
      verificationTarget: { subject: "farmer" as const, recordId: farmer.slug }
    })),
    buyers: Array.from(buyerMap.values()),
    suppliers: supplierDirectory.map((supplier) => ({
      id: supplier.slug,
      name: supplier.companyName,
      type: supplier.supplierCategory,
      region: supplier.region,
      status: statusFromTrust(supplier.trust?.status),
      dateAdded: "2026-06-07",
      isFeatured: supplier.isFeatured,
      featuredUntil: supplier.featuredUntil,
      featuredNote: supplier.featuredNote,
      href: `/supplier-directory/${supplier.slug}`,
      verificationTarget: { subject: "supplier" as const, recordId: supplier.slug }
    })),
    marketplace: products.map((product) => ({
      id: product.id,
      name: product.name,
      type: product.category,
      region: product.region,
      status: product.available === "Sold Out" ? "Archived" : "Active",
      dateAdded: product.datePosted,
      ownerType: product.ownerType ?? (product.farmerSlug ? "Farmer" : "Admin"),
      ownerId: product.ownerId,
      ownerName: product.ownerName ?? product.seller,
      isFeatured: product.featured,
      featuredUntil: product.featuredUntil,
      featuredNote: product.featuredNote,
      href: "/marketplace#marketplace-listings"
    })),
    "buyer-requests": buyerRequests.map((request) => ({
      id: request.id,
      name: request.productName,
      type: request.buyerType,
      region: request.region,
      status: statusFromTrust(request.trust?.status),
      dateAdded: request.datePosted,
      href: "/buyer-requests",
      verificationTarget: { subject: "buyer" as const, recordId: request.id }
    })),
    "whatsapp-leads": [],
    "match-opportunities": [],
    applications: [],
    submissions: [],
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
    "success-stories": (successStories as Array<{
      slug: string;
      title: string;
      category: string;
      personBusinessName: string;
      region: string;
      date: string;
      status: AdminStatus;
    }>).map((story) => ({
      id: story.slug,
      name: story.title,
      type: story.category,
      region: story.region,
      status: story.status,
      dateAdded: story.date,
      href: "/success-stories"
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
  { id: "analytics", label: "Analytics", icon: ChartLine },
  { id: "launch-checklist", label: "Launch Checklist", icon: ListChecks },
  { id: "lead-queue", label: "Leads", icon: MessageCircle },
  { id: "featured-enquiries", label: "Featured Enquiries", icon: Star },
  { id: "farmer-import", label: "Farmer Import", icon: UploadCloud },
  { id: "farmers", label: "Farmers", icon: Sprout },
  { id: "buyers", label: "Buyers", icon: UsersRound },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "marketplace", label: "Marketplace Listings", icon: Store },
  { id: "buyer-requests", label: "Buyer Requests", icon: PackageCheck },
  { id: "verifications", label: "Verification Queue", icon: ShieldCheck },
  { id: "applications", label: "Applications", icon: ClipboardCheck },
  { id: "submissions", label: "Submissions", icon: ClipboardCheck },
  { id: "whatsapp-leads", label: "WhatsApp Leads", icon: MessageCircle },
  { id: "match-opportunities", label: "Match Opportunities", icon: PackageCheck },
  { id: "learn", label: "Learn Articles", icon: BookOpen },
  { id: "success-stories", label: "Success Stories", icon: Star },
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
  { label: "Add Success Story", section: "success-stories", intent: "New success story form ready for review and publishing.", icon: Star, form: "success-stories" },
  { label: "Review Verifications", section: "verifications", intent: "Verification queue opened for review.", icon: ShieldCheck }
];

const formTitles: Record<AdminFormId, string> = {
  farmers: "Farmer",
  suppliers: "Supplier",
  marketplace: "Marketplace Listing",
  "buyer-requests": "Buyer Request",
  "market-prices": "Market Price",
  learn: "Learn Article",
  "success-stories": "Success Story"
};

const createEndpoints: Partial<Record<AdminFormId, string>> = {
  farmers: "/api/admin/farmers",
  suppliers: "/api/admin/suppliers",
  marketplace: "/api/admin/marketplace-listings",
  "buyer-requests": "/api/admin/buyer-requests",
  "market-prices": "/api/admin/market-prices",
  learn: "/api/admin/learn-articles",
  "success-stories": "/api/admin/success-stories"
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
    { name: "profileImageUrl", label: "Farmer Profile Image", type: "image", bucket: "farmers", helper: "Upload a JPG, PNG, or WEBP image up to 5MB." }
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
    { name: "logoUrl", label: "Supplier Image or Logo", type: "image", bucket: "suppliers", helper: "Upload a JPG, PNG, or WEBP image up to 5MB." },
    { name: "website", label: "Website", type: "url" }
  ],
  marketplace: [
    { name: "productName", label: "Product Name", required: true },
    { name: "category", label: "Category", required: true },
    { name: "region", label: "Region", required: true },
    { name: "district", label: "District", required: true },
    { name: "sellerFarmer", label: "Seller/Farmer", required: true },
    { name: "ownerType", label: "Owner Type", type: "select", required: true, options: ["Farmer", "Supplier", "Admin"] },
    { name: "ownerId", label: "Owner ID", helper: "For farmer-owned listings, paste the farmer Supabase id. Leave blank for Admin-owned records." },
    { name: "ownerName", label: "Owner Name", required: true, helper: "Use the farmer, supplier, or Ghana Growers owner name shown publicly." },
    { name: "quantity", label: "Quantity", required: true },
    { name: "unit", label: "Unit", required: true },
    { name: "availability", label: "Availability", required: true },
    { name: "whatsappNumber", label: "WhatsApp Number", required: true },
    { name: "imageUrl", label: "Listing Image", type: "image", bucket: "marketplace", helper: "Upload a JPG, PNG, or WEBP image up to 5MB." }
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
    { name: "category", label: "Category", type: "select", required: true, options: ["Crop Production", "Livestock", "Market Access", "Farm Business", "Supplier Guides", "Buyer Guides", "Ghana Growers Guides"] },
    { name: "summary", label: "Summary", type: "textarea", required: true },
    { name: "author", label: "Author", required: true },
    { name: "publishDate", label: "Publish Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: ["Draft", "Active", "Archived"] }
  ],
  "success-stories": [
    { name: "title", label: "Title", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: ["Farmers", "Buyers", "Suppliers"] },
    { name: "personBusinessName", label: "Person/Business Name", required: true },
    { name: "region", label: "Region", required: true },
    { name: "summary", label: "Summary", type: "textarea", required: true },
    { name: "outcome", label: "Outcome", type: "textarea", required: true },
    { name: "date", label: "Story Date", type: "date", required: true },
    { name: "imageUrl", label: "Image URL", helper: "Optional. Use a public image URL or leave blank." },
    { name: "status", label: "Status", type: "select", required: true, options: ["Draft", "Published", "Archived"] }
  ]
};

function summarize(
  rows: Record<AdminSectionId, AdminRow[]>,
  whatsappLeadCount: number,
  leadRequestCount: number,
  applicationCounts: { farmers: number; buyers: number; suppliers: number },
  submissionCounts: { listings: number; buyerRequests: number }
) {
  const pendingVerifications = rows.verifications.filter((row) => row.status === "Pending").length;

  return [
    { label: "Farmers", value: rows.farmers.length, icon: Sprout },
    { label: "Buyers", value: rows.buyers.length, icon: UsersRound },
    { label: "Suppliers", value: rows.suppliers.length, icon: Truck },
    { label: "Marketplace Listings", value: rows.marketplace.length, icon: Store },
    { label: "Buyer Requests", value: rows["buyer-requests"].length, icon: PackageCheck },
    { label: "Pending Verifications", value: pendingVerifications, icon: CircleDashed },
    { label: "Total Leads", value: leadRequestCount, icon: MessageCircle },
    { label: "WhatsApp Leads", value: whatsappLeadCount, icon: MessageCircle },
    { label: "New Farmer Applications", value: applicationCounts.farmers, icon: Sprout },
    { label: "New Buyer Applications", value: applicationCounts.buyers, icon: UsersRound },
    { label: "New Supplier Applications", value: applicationCounts.suppliers, icon: Truck },
    { label: "New Listing Submissions", value: submissionCounts.listings, icon: Store },
    { label: "New Buyer Request Submissions", value: submissionCounts.buyerRequests, icon: PackageCheck }
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
      value: rows["buyer-requests"].filter((request) => request.status !== "Archived").length,
      note: "Open demand records to monitor",
      section: "buyer-requests" as AdminSectionId
    },
    {
      label: "Pending Listings",
      value: rows.marketplace.filter((product) => product.status !== "Archived").length,
      note: "Marketplace listings needing verification",
      section: "marketplace" as AdminSectionId
    }
  ];
}

function pendingTasks(rows: Record<AdminSectionId, AdminRow[]>, whatsappLeadCount: number) {
  return [
    {
      label: "Pending Verifications",
      value: rows.verifications.filter((row) => row.status === "Pending").length,
      section: "verifications" as AdminSectionId,
      icon: ShieldCheck
    },
    {
      label: "Pending Listings",
      value: rows.marketplace.filter((product) => product.status !== "Archived").length,
      section: "marketplace" as AdminSectionId,
      icon: Store
    },
    {
      label: "Pending Buyer Requests",
      value: rows["buyer-requests"].filter((request) => request.status !== "Archived").length,
      section: "buyer-requests" as AdminSectionId,
      icon: PackageCheck
    },
    {
      label: "New WhatsApp Leads",
      value: whatsappLeadCount,
      section: "whatsapp-leads" as AdminSectionId,
      icon: MessageCircle
    }
  ];
}

function launchStatusFromCount(count: number, target: number): LaunchStatus {
  return count >= target ? "Complete" : "Incomplete";
}

function launchStatusClass(status: LaunchStatus) {
  if (status === "Complete") {
    return "bg-leaf-50 text-leaf-700";
  }

  return "bg-earth-50 text-earth-700";
}

function statusProgress(status: LaunchStatus) {
  return status === "Complete" ? 1 : 0;
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

    if (formId === "success-stories") {
      values.status = "Draft";
    }

    if (formId === "buyer-requests") {
      values.status = "Open";
    }

    if (formId === "market-prices") {
      values.trend = "Stable";
    }

    if (formId === "marketplace") {
      values.ownerType = "Admin";
      values.ownerName = "Ghana Growers";
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
      logoUrl: supplier?.photos[0] ?? "",
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
      sellerFarmer: product?.seller ?? row.ownerName ?? "",
      ownerType: product?.ownerType ?? row.ownerType ?? (product?.farmerSlug ? "Farmer" : "Admin"),
      ownerId: product?.ownerId ?? row.ownerId ?? "",
      ownerName: product?.ownerName ?? row.ownerName ?? product?.seller ?? "",
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

  if (formId === "success-stories") {
    const story = (successStories as Array<{
      slug: string;
      title: string;
      category: string;
      personBusinessName: string;
      region: string;
      summary: string;
      outcome: string;
      date: string;
      image?: string;
      status: AdminStatus;
    }>).find((record) => record.slug === row.id);

    return {
      ...values,
      title: story?.title ?? row.name,
      category: story?.category ?? row.type,
      personBusinessName: story?.personBusinessName ?? "",
      region: story?.region ?? row.region,
      summary: story?.summary ?? "",
      outcome: story?.outcome ?? "",
      date: story?.date ?? row.dateAdded,
      imageUrl: story?.image ?? "",
      status: row.status
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
    section === "learn" ||
    section === "success-stories"
  ) {
    return section;
  }

  return null;
}

function sectionForForm(formId: AdminFormId): AdminSectionId {
  return formId;
}

function localAdminId(prefix: string, value: string) {
  const clean = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || `${prefix}-${Date.now()}`;
}

function recordString(record: unknown, key: string) {
  if (!record || typeof record !== "object") {
    return "";
  }

  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function recordBoolean(record: unknown, key: string) {
  if (!record || typeof record !== "object") {
    return false;
  }

  const value = (record as Record<string, unknown>)[key];
  return value === true;
}

function isAdminFeaturedActive(row: Pick<AdminRow, "isFeatured" | "featuredUntil">) {
  if (!row.isFeatured) {
    return false;
  }

  if (!row.featuredUntil) {
    return true;
  }

  const expiresAt = new Date(`${row.featuredUntil}T23:59:59`);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() >= Date.now();
}

function isAdminFeaturedExpired(row: Pick<AdminRow, "isFeatured" | "featuredUntil">) {
  if (!row.isFeatured || !row.featuredUntil) {
    return false;
  }

  const expiresAt = new Date(`${row.featuredUntil}T23:59:59`);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
}

function rowIdFromRecord(record: unknown, fallback: string) {
  return recordString(record, "slug") || recordString(record, "id") || fallback;
}

function statusFromForm(formId: AdminFormId, values: Record<string, string>): AdminStatus {
  if (formId === "farmers" || formId === "suppliers") {
    return statusFromTrust(values.verificationStatus);
  }

  if (formId === "buyer-requests") {
    return values.status === "Fulfilled" ? "Archived" : "Active";
  }

  if (formId === "learn") {
    return values.status === "Archived" ? "Archived" : values.status === "Active" ? "Active" : "Pending";
  }

  if (formId === "success-stories") {
    return values.status === "Published" ? "Published" : values.status === "Archived" ? "Archived" : "Pending";
  }

  return "Active";
}

function rowFromForm(formId: AdminFormId, values: Record<string, string>, record: unknown, existingId?: string): AdminRow {
  const today = new Date().toISOString().slice(0, 10);

  if (formId === "farmers") {
    const fallbackId = localAdminId("farmer", values.farmerName || values.farmName);
    const id = existingId ?? rowIdFromRecord(record, fallbackId);
    return {
      id,
      name: values.farmName || values.farmerName,
      type: values.farmType || "Farmer",
      region: values.region || "Ghana",
      status: statusFromForm(formId, values),
      dateAdded: today,
      href: `/farmer-directory/${id}`,
      verificationTarget: { subject: "farmer", recordId: id }
    };
  }

  if (formId === "suppliers") {
    const fallbackId = localAdminId("supplier", values.companyName);
    const id = existingId ?? rowIdFromRecord(record, fallbackId);
    return {
      id,
      name: values.companyName,
      type: values.category || "Supplier",
      region: values.region || "Ghana",
      status: statusFromForm(formId, values),
      dateAdded: today,
      href: `/supplier-directory/${id}`,
      verificationTarget: { subject: "supplier", recordId: id }
    };
  }

  if (formId === "marketplace") {
    const fallbackId = localAdminId("listing", `${values.productName}-${values.sellerFarmer}`);
    const id = existingId ?? rowIdFromRecord(record, fallbackId);
    return {
      id,
      name: values.productName,
      type: values.category || "Marketplace Listing",
      region: values.region || "Ghana",
      status: "Active",
      dateAdded: today,
      ownerType: values.ownerType || "Admin",
      ownerId: values.ownerId,
      ownerName: values.ownerName || values.sellerFarmer || "Ghana Growers",
      href: "/marketplace#marketplace-listings"
    };
  }

  if (formId === "buyer-requests") {
    const fallbackId = localAdminId("buyer-request", `${values.productNeeded}-${values.region}`);
    const id = existingId ?? rowIdFromRecord(record, fallbackId);
    return {
      id,
      name: values.productNeeded,
      type: values.buyerType || "Buyer Request",
      region: values.region || "Ghana",
      status: statusFromForm(formId, values),
      dateAdded: today,
      href: "/buyer-requests",
      verificationTarget: { subject: "buyer", recordId: id }
    };
  }

  if (formId === "market-prices") {
    const fallbackId = localAdminId("market-price", `${values.product}-${values.market}`);
    const id = existingId ?? rowIdFromRecord(record, fallbackId);
    return {
      id,
      name: values.product,
      type: values.trend || "Market Price",
      region: values.region || "Ghana",
      status: "Active",
      dateAdded: values.dateUpdated || today,
      href: "/market-intelligence"
    };
  }

  if (formId === "success-stories") {
    const fallbackId = localAdminId("success-story", values.title);
    const id = existingId ?? rowIdFromRecord(record, fallbackId);
    return {
      id,
      name: values.title,
      type: values.category || "Success Story",
      region: values.region || "Ghana",
      status: statusFromForm(formId, values),
      dateAdded: values.date || today,
      href: "/success-stories"
    };
  }

  const fallbackId = localAdminId("learn", values.title);
  const id = existingId ?? rowIdFromRecord(record, fallbackId);
  return {
    id,
    name: values.title,
    type: values.category || "Learn Article",
    region: "Ghana",
    status: statusFromForm(formId, values),
    dateAdded: values.publishDate || today,
    href: "/learn"
  };
}

function rowFromImportedFarmer(farmer: ImportedFarmerRecord): AdminRow {
  const completeness = farmerCompleteness(farmer);

  return {
    id: farmer.slug || farmer.id,
    name: farmer.farm_name || farmer.farmer_name,
    type: farmer.farm_type,
    region: farmer.region,
    status: farmer.status,
    verificationStatus: farmer.verification_status,
    dateAdded: new Date().toISOString().slice(0, 10),
    source: normalizedFarmerSource(farmer.source),
    phone: farmer.phone_number || farmer.whatsapp_number,
    whatsapp: farmer.whatsapp_number,
    farmSize: farmer.farm_size,
    products: farmer.products.slice(0, 3).join(", "),
    isFeatured: false,
    completenessPercent: completeness.percent,
    completenessStatus: completeness.status,
    completenessTone: completeness.tone,
    href: farmer.status === "Active" ? `/farmer-directory/${farmer.slug || farmer.id}` : undefined,
    verificationTarget: { subject: "farmer", recordId: farmer.slug || farmer.id }
  };
}

function importedFarmerPlaceholderFromRow(row: AdminRow): ImportedFarmerRecord {
  return {
    id: row.id,
    slug: row.id,
    farmer_name: row.name,
    farm_name: row.name,
    region: row.region,
    district: "",
    farm_type: row.type,
    products: row.products?.split(",").map((product) => product.trim()).filter(Boolean) ?? [],
    farm_size: row.farmSize ?? "",
    phone_number: row.phone ?? "",
    whatsapp_number: row.whatsapp ?? row.phone ?? "",
    status: row.status,
    verification_status: row.verificationStatus ?? "Pending",
    verification_notes: null,
    source: normalizedFarmerSource(row.source)
  };
}

function reviewDebugFields(farmer: ImportedFarmerRecord) {
  const diagnostics = farmerPhotoDiagnostics(farmer);

  return {
    id: farmer.id,
    slug: farmer.slug,
    phone_number: farmer.phone_number ?? null,
    whatsapp_number: farmer.whatsapp_number ?? null,
    email: farmer.email ?? null,
    farm_size: farmer.farm_size ?? null,
    farm_type: farmer.farm_type ?? null,
    products: farmer.products ?? [],
    farming_experience: farmer.farming_experience ?? null,
    supply_frequency: farmer.supply_frequency ?? null,
    delivery_preference: farmer.delivery_preference ?? null,
    payment_preference: farmer.payment_preference ?? null,
    workshop_interest: farmer.workshop_interest ?? null,
    referral_source: farmer.referral_source ?? null,
    profile_image_url: farmer.profile_image_url ?? null,
    imported_photo_url: farmer.imported_photo_url ?? null,
    tally_photo_url: farmer.tally_photo_url ?? null,
    original_tally_data_keys: Object.keys(farmer.original_tally_data ?? {}),
    photo_diagnostics: diagnostics
  };
}

const photoKeyPattern = /(photo|image|picture|upload|file)/i;

function urlsFromText(value?: string | null) {
  return Array.from(value?.matchAll(/https?:\/\/[^\s"',\])}]+/gi) ?? [])
    .map((match) => match[0]?.trim())
    .filter(Boolean);
}

function firstUrlFromText(value?: string | null) {
  return urlsFromText(value)[0] ?? "";
}

function urlsFromUnknown(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    const directUrls = urlsFromText(value);

    if (directUrls.length > 0) {
      return directUrls;
    }

    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return urlsFromUnknown(JSON.parse(trimmed) as unknown);
      } catch {
        return [];
      }
    }

    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(urlsFromUnknown);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(urlsFromUnknown);
  }

  return [];
}

function filenameFromUnknown(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.match(/[\w .()_-]+\.(?:jpe?g|png|webp)/i)?.[0]?.trim() ?? "";
  }

  if (Array.isArray(value)) {
    return value.map(filenameFromUnknown).find(Boolean) ?? "";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const directName = ["name", "filename", "fileName", "title"].map((key) => record[key]).find((entry) => typeof entry === "string") as string | undefined;
    return directName || Object.values(record).map(filenameFromUnknown).find(Boolean) || "";
  }

  return "";
}

function originalTallyPhotoCandidate(originalData?: Record<string, unknown> | null) {
  const entries = Object.entries(originalData ?? {});
  const photoEntry = entries.find(([label, value]) => photoKeyPattern.test(label) && urlsFromUnknown(value).length > 0);
  const fallbackEntry = entries.find(([, value]) => urlsFromUnknown(value).length > 0);
  const entry = photoEntry ?? fallbackEntry;

  return {
    key: entry?.[0] ?? "",
    url: entry ? urlsFromUnknown(entry[1])[0] ?? "" : "",
    filename: entry ? filenameFromUnknown(entry[1]) : ""
  };
}

function isPublicReviewPhotoUrl(url?: string | null) {
  if (!url?.trim()) {
    return false;
  }

  if (url.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return !(parsed.hostname.toLowerCase() === "storage.tally.so" && parsed.pathname.toLowerCase().includes("/private/"));
  } catch {
    return false;
  }
}

function publicReviewPhotoUrl(farmer: ImportedFarmerRecord) {
  const originalPhoto = originalTallyPhotoCandidate(farmer.original_tally_data);
  const candidates = [farmer.profile_image_url, farmer.imported_photo_url, firstUrlFromText(farmer.tally_photo_url), originalPhoto.url];

  return candidates.find(isPublicReviewPhotoUrl);
}

function farmerSubmittedPhotoCandidate(farmer: ImportedFarmerRecord) {
  const originalPhoto = originalTallyPhotoCandidate(farmer.original_tally_data);
  const tallyPhotoUrl = firstUrlFromText(farmer.tally_photo_url);
  const url = tallyPhotoUrl || originalPhoto.url;

  return {
    url,
    key: tallyPhotoUrl ? "tally_photo_url" : originalPhoto.key,
    filename: originalPhoto.filename
  };
}

function photoSubmittedButNotImported(farmer: ImportedFarmerRecord) {
  return Boolean(farmerSubmittedPhotoCandidate(farmer).url && !farmer.profile_image_url && !farmer.imported_photo_url);
}

function farmerPhotoDiagnostics(farmer: ImportedFarmerRecord) {
  const originalPhoto = originalTallyPhotoCandidate(farmer.original_tally_data);
  const tallyPhotoUrl = firstUrlFromText(farmer.tally_photo_url);
  const submitted = farmerSubmittedPhotoCandidate(farmer);
  const publicPhoto = publicReviewPhotoUrl(farmer);
  const submittedUrlIsPublic = isPublicReviewPhotoUrl(submitted.url);
  const status = farmer.profile_image_url
    ? "Public profile photo exists"
    : farmer.imported_photo_url
      ? "Imported photo exists"
      : submitted.url && submittedUrlIsPublic
        ? "Tally submitted photo found but not imported"
      : submitted.url
        ? "Tally photo URL found but private/expired"
        : "No submitted photo found";

  return {
    status,
    profileImage: Boolean(farmer.profile_image_url),
    importedPhoto: Boolean(farmer.imported_photo_url),
    tallyPhoto: Boolean(tallyPhotoUrl),
    originalPhotoKeyFound: Boolean(originalPhoto.key),
    originalPhotoKey: originalPhoto.key,
    extractedPhotoUrl: submitted.url,
    extractedPhotoUrlPreview: submitted.url ? `${submitted.url.slice(0, 60)}${submitted.url.length > 60 ? "..." : ""}` : "",
    filename: submitted.filename,
    publicDisplayable: Boolean(publicPhoto),
    submittedUrlIsPublic
  };
}

function displayTallyValue(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "Not provided";
  }

  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function farmerReviewReadiness(farmer: ImportedFarmerRecord) {
  return [
    { label: "Photo", complete: Boolean(publicReviewPhotoUrl(farmer)), note: farmerPhotoDiagnostics(farmer).status },
    { label: "Products", complete: farmer.products.length > 0, note: "No products listed" },
    { label: "Location", complete: hasReviewValue(farmer.region) && hasReviewValue(farmer.district), note: "Location incomplete" },
    { label: "Contact", complete: hasReviewValue(farmer.phone_number) || hasReviewValue(farmer.whatsapp_number), note: "No phone or WhatsApp" }
  ];
}

function hasReviewValue(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(normalized && !["not provided", "n/a", "na", "none", "ghana"].includes(normalized));
}

function farmerCompleteness(farmer: ImportedFarmerRecord) {
  const checks = [
    { label: "Farmer name", complete: hasReviewValue(farmer.farmer_name) },
    { label: "Phone number", complete: hasReviewValue(farmer.phone_number) },
    { label: "WhatsApp number", complete: hasReviewValue(farmer.whatsapp_number) },
    { label: "Products/crops/livestock", complete: farmer.products.length > 0 },
    { label: "Region", complete: hasReviewValue(farmer.region) },
    { label: "District", complete: hasReviewValue(farmer.district) },
    { label: "Farm size", complete: hasReviewValue(farmer.farm_size) },
    { label: "Farm type", complete: hasReviewValue(farmer.farm_type) },
    { label: "Farming experience", complete: hasReviewValue(farmer.farming_experience) },
    { label: "Supply frequency", complete: hasReviewValue(farmer.supply_frequency) },
    { label: "Delivery preference", complete: hasReviewValue(farmer.delivery_preference) },
    { label: "Payment preference", complete: hasReviewValue(farmer.payment_preference) },
    { label: "Farm photo", complete: Boolean(publicReviewPhotoUrl(farmer) || farmerSubmittedPhotoCandidate(farmer).url) }
  ];
  const completeCount = checks.filter((check) => check.complete).length;
  const percent = Math.round((completeCount / checks.length) * 100);
  const status = percent >= 80 ? "Ready to Publish" : percent >= 50 ? "Needs Follow-up" : "Incomplete";
  const tone = percent >= 80 ? "ready" : percent >= 50 ? "follow-up" : "incomplete";

  return {
    percent,
    status,
    tone,
    missing: checks.filter((check) => !check.complete).map((check) => check.label)
  };
}

function followUpMessageForFarmer(farmer: ImportedFarmerRecord) {
  const completeness = farmerCompleteness(farmer);
  const missingList = completeness.missing.length
    ? completeness.missing.map((item) => `- ${item}`).join("\n")
    : "- Any updated farm profile details";
  const name = farmer.farmer_name || farmer.farm_name || "Farmer";

  return `Hello ${name}, thank you for registering with Ghana Growers. We are reviewing your farmer profile and need a few details before publishing it.\n\nPlease send:\n${missingList}\n\nThank you.`;
}

function completenessBadgeClasses(tone: string) {
  if (tone === "ready") {
    return "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-700/15";
  }

  if (tone === "follow-up") {
    return "bg-earth-50 text-earth-700 ring-1 ring-earth-500/20";
  }

  return "bg-tomato/10 text-tomato ring-1 ring-tomato/20";
}

function verificationRowFromAdminRow(formId: AdminFormId, row: AdminRow): AdminRow | null {
  if (formId !== "farmers" && formId !== "suppliers" && formId !== "buyer-requests") {
    return null;
  }

  const subject = formId === "farmers" ? "farmer" : formId === "suppliers" ? "supplier" : "buyer";
  return {
    ...row,
    id: `verify-${subject}-${row.id}`,
    type: subject === "buyer" ? "Buyer" : subject === "farmer" ? "Farmer" : "Supplier",
    verificationTarget: { subject, recordId: row.id }
  };
}

function canPersistAdminForm(formId: AdminFormId, mode: "add" | "edit") {
  return Boolean(createEndpoints[formId] && (mode === "add" || formId !== "learn"));
}

function activitySection(entityType: AdminActivityRecord["entity_type"]): AdminSectionId {
  if (entityType.includes("Submission")) {
    return "submissions";
  }

  if (entityType.includes("Application")) {
    return "applications";
  }

  if (entityType === "Match Opportunity") {
    return "match-opportunities";
  }

  if (entityType === "Lead Request") {
    return "lead-queue";
  }

  if (entityType === "Featured Enquiry") {
    return "featured-enquiries";
  }

  if (entityType === "Success Story") {
    return "success-stories";
  }

  if (entityType === "Farmer") {
    return "farmers";
  }

  if (entityType === "Supplier") {
    return "suppliers";
  }

  if (entityType === "Marketplace Listing") {
    return "marketplace";
  }

  return "buyer-requests";
}

function activityIcon(entityType: AdminActivityRecord["entity_type"]) {
  if (entityType.includes("Submission")) {
    return ClipboardCheck;
  }

  if (entityType.includes("Application")) {
    return ClipboardCheck;
  }

  if (entityType === "Match Opportunity") {
    return PackageCheck;
  }

  if (entityType === "Lead Request") {
    return MessageCircle;
  }

  if (entityType === "Featured Enquiry") {
    return Star;
  }

  if (entityType === "Success Story") {
    return Star;
  }

  if (entityType === "Farmer") {
    return Sprout;
  }

  if (entityType === "Supplier") {
    return Truck;
  }

  if (entityType === "Marketplace Listing") {
    return Store;
  }

  return PackageCheck;
}

function displayAdminName(email: string) {
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!name) {
    return "Admin";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function activitySentence(activity: AdminActivityRecord) {
  const verbs: Record<AdminActivityRecord["action_type"], string> = {
    Create: "created",
    Edit: "edited",
    Verify: "verified",
    Archive: "archived",
    Review: "reviewed",
    Approve: "approved",
    Reject: "rejected",
    Convert: "converted",
    View: "viewed",
    Contact: "contacted",
    Complete: "completed",
    Close: "closed",
    Submit: "submitted",
    Publish: "published",
    "Marked Featured": "marked featured",
    "Removed Featured": "removed featured from",
    "Featured Expired": "marked featured expired for",
    "Featured Note Updated": "updated featured note for"
  };
  const verb = verbs[activity.action_type];
  const entity = activity.entity_type.toLowerCase();

  return `${displayAdminName(activity.admin_email)} ${verb} ${entity} ${activity.entity_name}`;
}

function relativeActivityTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function sourceLabel(sourceType: WhatsAppLeadRecord["source_type"]) {
  return sourceType === "Floating WhatsApp" ? "Floating Button" : sourceType;
}

const leadPipelineStatuses: LeadRequestStatus[] = ["New", "Contacted", "Negotiating", "Completed", "Lost"];
const leadFunnelStatuses: LeadRequestStatus[] = ["New", "Contacted", "Negotiating", "Completed"];

function normalizeLeadStatus(status: LeadRequestRecord["status"]): LeadRequestStatus {
  return status === "Closed" ? "Completed" : status;
}

function leadStatusClass(status: LeadRequestStatus) {
  if (status === "New") {
    return "bg-earth-50 text-earth-700";
  }

  if (status === "Contacted") {
    return "bg-leaf-50 text-leaf-800";
  }

  if (status === "Negotiating") {
    return "bg-white text-leaf-700 ring-1 ring-leaf-900/10";
  }

  if (status === "Completed") {
    return "bg-leaf-700 text-white";
  }

  return "bg-ink/10 text-ink/60";
}

function featuredEnquiryStatusClass(status: FeaturedEnquiryStatus) {
  if (status === "New") {
    return "bg-earth-50 text-earth-700";
  }

  if (status === "Contacted") {
    return "bg-leaf-50 text-leaf-800";
  }

  if (status === "Approved") {
    return "bg-leaf-700 text-white";
  }

  if (status === "Rejected") {
    return "bg-tomato/10 text-tomato";
  }

  return "bg-ink/10 text-ink/60";
}

function featuredFollowUpMessage(enquiry: FeaturedEnquiryRecord) {
  return `Hello ${enquiry.name}, thank you for your interest in featured placement on Ghana Growers. We will review your profile/listing (${enquiry.profile_or_listing_name}) and follow up with next steps.`;
}

function leadStatusCount(leads: LeadRequestRecord[], status: LeadRequestStatus) {
  return leads.filter((lead) => normalizeLeadStatus(lead.status) === status).length;
}

function topLeadSourcesByKind(leads: LeadRequestRecord[], sourceTypes: LeadRequestRecord["source_type"][]) {
  const allowed = new Set(sourceTypes);
  const counts = new Map<string, { label: string; value: number }>();

  leads.forEach((lead) => {
    if (!allowed.has(lead.source_type)) {
      return;
    }

    const key = `${lead.source_type}:${lead.source_id}`;
    const current = counts.get(key);
    counts.set(key, {
      label: lead.source_name,
      value: (current?.value ?? 0) + 1
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function mostRequestedLeadProducts(leads: LeadRequestRecord[]) {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    counts.set(lead.product_interest, (counts.get(lead.product_interest) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function sourceTypeTotals(leads: WhatsAppLeadRecord[]) {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    counts.set(lead.source_type, (counts.get(lead.source_type) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function topClickedSources(leads: WhatsAppLeadRecord[]) {
  const counts = new Map<string, { name: string; type: string; value: number }>();

  leads.forEach((lead) => {
    const key = `${lead.source_type}:${lead.source_id}`;
    const current = counts.get(key);

    counts.set(key, {
      name: lead.source_name,
      type: lead.source_type,
      value: (current?.value ?? 0) + 1
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function textValue(record: AnalyticsRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function arrayValue(record: AnalyticsRecord, key: string) {
  const value = record[key];

  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function recordName(record: AnalyticsRecord, ...keys: string[]) {
  return keys.map((key) => textValue(record, key)).find(Boolean) ?? "Record";
}

function adminLocationScore(request: AnalyticsRecord, candidate: AnalyticsRecord) {
  let score = 0;
  const requestRegion = normalizeMatchText(textValue(request, "region"));
  const requestDistrict = normalizeMatchText(textValue(request, "district"));
  const candidateRegion = normalizeMatchText(textValue(candidate, "region"));
  const candidateDistrict = normalizeMatchText(textValue(candidate, "district"));

  if (requestRegion && candidateRegion && requestRegion === candidateRegion) {
    score += 3;
  }

  if (requestDistrict && candidateDistrict && (requestDistrict === candidateDistrict || candidateDistrict.includes(requestDistrict) || requestDistrict.includes(candidateDistrict))) {
    score += 2;
  }

  return score;
}

function farmerMatchScore(request: AnalyticsRecord, farmer: AnalyticsRecord) {
  const requestProduct = textValue(request, "product_needed");
  const farmerProducts = arrayValue(farmer, "products");
  const productScore = Math.max(...farmerProducts.map((product) => productMatchScore(requestProduct, product)), 0);

  return productScore + adminLocationScore(request, farmer);
}

function listingMatchScore(request: AnalyticsRecord, listing: AnalyticsRecord) {
  const requestProduct = textValue(request, "product_needed");
  const productScore = Math.max(
    productMatchScore(requestProduct, textValue(listing, "product_name")),
    productMatchScore(requestProduct, textValue(listing, "category"))
  );

  return productScore + adminLocationScore(request, listing);
}

function supplierMatchScore(request: AnalyticsRecord, supplier: AnalyticsRecord) {
  const requestProduct = textValue(request, "product_needed");
  const serviceProducts = arrayValue(supplier, "products_services");
  const productScore = Math.max(
    productMatchScore(requestProduct, textValue(supplier, "category")),
    ...serviceProducts.map((service) => productMatchScore(requestProduct, service)),
    0
  );

  return productScore + adminLocationScore(request, supplier);
}

function buyerApplicationMatchSummary(application: BuyerRequestSubmissionRecord, analytics: AnalyticsData) {
  const request = {
    id: application.id,
    product_needed: application.product_needed,
    region: application.region,
    district: application.district
  };
  const farmers = analytics.farmers
    .map((farmer) => ({ farmer, score: farmerMatchScore(request, farmer) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match) => match.farmer);
  const listings = analytics.marketplaceListings
    .map((listing) => ({ listing, score: listingMatchScore(request, listing) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match) => match.listing);
  const suppliers = analytics.suppliers
    .map((supplier) => ({ supplier, score: supplierMatchScore(request, supplier) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match) => match.supplier);

  return { farmers, listings, suppliers };
}

function buildAdminMatchOpportunities(analytics: AnalyticsData): AdminMatchOpportunity[] {
  return analytics.buyerRequests
    .map((request) => {
      const farmers = analytics.farmers
        .map((farmer) => ({ farmer, score: farmerMatchScore(request, farmer) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((match) => match.farmer);
      const listings = analytics.marketplaceListings
        .map((listing) => ({ listing, score: listingMatchScore(request, listing) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((match) => match.listing);

      return {
        id: textValue(request, "id") || `match-${matchTokens(textValue(request, "product_needed")).join("-")}`,
        request,
        farmers,
        listings
      };
    })
    .filter((opportunity) => opportunity.farmers.length > 0 || opportunity.listings.length > 0);
}

function whatsappUrl(phoneNumber: string, message: string) {
  const digits = phoneNumber.replace(/[^\d]/g, "") || WHATSAPP_NUMBER;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function countBy(records: AnalyticsRecord[], key: string, fallback = "Unspecified") {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    const label = textValue(record, key) || fallback;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function verifiedCount(records: AnalyticsRecord[]) {
  return records.filter((record) => textValue(record, "verification_status") === "Verified").length;
}

function activeBuyerRequestCount(records: AnalyticsRecord[]) {
  return records.filter((record) => {
    const status = textValue(record, "status");
    return status !== "Fulfilled" && status !== "Archived";
  }).length;
}

function activeRecordCount(records: AnalyticsRecord[]) {
  return records.filter((record) => textValue(record, "status") === "Active").length;
}

function importAdminStatusFromRecord(record: AnalyticsRecord): ImportAdminStatus {
  const status = textValue(record, "status");

  if (status === "Pending Review") {
    return "Pending Review";
  }

  if (status === "Archived") {
    return "Archived";
  }

  if (status === "Active") {
    return "Active";
  }

  return statusFromTrust(textValue(record, "verification_status") || status);
}

function normalizedFarmerSource(value?: string | null) {
  const source = value?.trim();

  if (!source) {
    return "Manual/Test";
  }

  if (/tally/i.test(source)) {
    return "Tally Import";
  }

  if (/founding/i.test(source)) {
    return "Founding Farmer";
  }

  return source;
}

function adminFarmerRowFromAnalytics(record: AnalyticsRecord): AdminRow {
  const id = textValue(record, "slug") || textValue(record, "id");
  const status = importAdminStatusFromRecord(record);

  return {
    id,
    name: textValue(record, "farm_name") || textValue(record, "farmer_name") || "Farmer record",
    type: textValue(record, "farm_type") || "Farmer",
    region: textValue(record, "region") || "Ghana",
    status,
    dateAdded: textValue(record, "created_at")?.slice(0, 10) || "2026-06-07",
    source: normalizedFarmerSource(textValue(record, "source")),
    phone: textValue(record, "phone_number") || textValue(record, "whatsapp_number"),
    whatsapp: textValue(record, "whatsapp_number"),
    farmSize: textValue(record, "farm_size"),
    products: arrayValue(record, "products").slice(0, 3).join(", "),
    isFeatured: recordBoolean(record, "is_featured"),
    featuredUntil: textValue(record, "featured_until"),
    featuredNote: textValue(record, "featured_note"),
    href: status === "Active" ? `/farmer-directory/${id}` : undefined,
    verificationTarget: { subject: "farmer", recordId: id }
  };
}

function adminSupplierRowFromAnalytics(record: AnalyticsRecord): AdminRow {
  const id = textValue(record, "slug") || textValue(record, "id");

  return {
    id,
    name: textValue(record, "company_name") || "Supplier record",
    type: textValue(record, "category") || "Supplier",
    region: textValue(record, "region") || "Ghana",
    status: textValue(record, "status") === "Archived" ? "Archived" : statusFromTrust(textValue(record, "verification_status")),
    dateAdded: textValue(record, "created_at")?.slice(0, 10) || "2026-06-07",
    isFeatured: recordBoolean(record, "is_featured"),
    featuredUntil: textValue(record, "featured_until"),
    featuredNote: textValue(record, "featured_note"),
    href: `/supplier-directory/${id}`,
    verificationTarget: { subject: "supplier", recordId: id }
  };
}

function adminMarketplaceRowFromAnalytics(record: AnalyticsRecord): AdminRow {
  const id = textValue(record, "slug") || textValue(record, "id");
  const ownerType = textValue(record, "owner_type") || (textValue(record, "seller_type") === "Supplier" ? "Supplier" : "Admin");
  const ownerName = textValue(record, "owner_name") || textValue(record, "seller_name") || "Ghana Growers";

  return {
    id,
    name: textValue(record, "product_name") || "Marketplace listing",
    type: textValue(record, "category") || "Marketplace Listing",
    region: textValue(record, "region") || "Ghana",
    status: textValue(record, "status") === "Archived" ? "Archived" : "Active",
    dateAdded: textValue(record, "created_at")?.slice(0, 10) || "2026-06-07",
    ownerType,
    ownerId: textValue(record, "owner_id"),
    ownerName,
    isFeatured: recordBoolean(record, "is_featured"),
    featuredUntil: textValue(record, "featured_until"),
    featuredNote: textValue(record, "featured_note"),
    href: "/marketplace#marketplace-listings"
  };
}

function localAnalyticsFallback(whatsappLeadRows: WhatsAppLeadRecord[], leadRequestRows: LeadRequestRecord[]): AnalyticsData {
  return {
    farmers: farmerDirectory.map((farmer) => ({
      id: farmer.slug,
      farm_name: farmer.farmName,
      farm_type: farmer.farmType,
      region: farmer.region,
      district: farmer.district,
      products: farmer.products,
      whatsapp_number: WHATSAPP_NUMBER,
      verification_status: farmer.verificationStatus,
      status: farmer.availabilityStatus,
      source: null,
      is_featured: Boolean(farmer.isFeatured),
      featured_until: farmer.featuredUntil ?? null,
      featured_note: farmer.featuredNote ?? null,
      created_at: "2026-06-07"
    })),
    suppliers: supplierDirectory.map((supplier) => ({
      id: supplier.slug,
      company_name: supplier.companyName,
      category: supplier.supplierCategory,
      verification_status: supplier.verificationStatus,
      status: "Active",
      is_featured: Boolean(supplier.isFeatured),
      featured_until: supplier.featuredUntil ?? null,
      featured_note: supplier.featuredNote ?? null
    })),
    marketplaceListings: products.map((product) => ({
      id: product.id,
      product_name: product.name,
      category: product.category,
      region: product.region,
      district: product.location,
      seller_name: product.seller,
      owner_type: product.ownerType ?? (product.farmerSlug ? "Farmer" : "Admin"),
      owner_id: product.ownerId ?? null,
      owner_name: product.ownerName ?? product.seller,
      whatsapp_number: product.whatsappNumber ?? WHATSAPP_NUMBER,
      status: product.available === "Sold Out" ? "Archived" : "Active",
      availability: product.available,
      is_featured: Boolean(product.featured),
      featured_until: product.featuredUntil ?? null,
      featured_note: product.featuredNote ?? null
    })),
    buyerRequests: buyerRequests.map((request) => ({
      id: request.id,
      product_needed: request.productName,
      region: request.region,
      district: request.district,
      buyer_name: request.buyerName,
      buyer_type: request.buyerType,
      whatsapp_number: request.whatsappNumber,
      status: request.status,
      verification_status: request.verificationStatus
    })),
    whatsappLeads: whatsappLeadRows,
    leadRequests: leadRequestRows,
    cropHealthReports: [],
    marketPrices: marketPrices.map((price) => ({
      id: `${price.crop}-${price.market}`,
      product: price.crop,
      region: price.region,
      market: price.market,
      trend: price.trend
    }))
  };
}

function mergeAnalyticsWithFallback(data: AnalyticsData | null, fallback: AnalyticsData): AnalyticsData {
  if (!data) {
    return fallback;
  }

  return {
    farmers: data.farmers.length > 0 ? data.farmers : fallback.farmers,
    suppliers: data.suppliers.length > 0 ? data.suppliers : fallback.suppliers,
    marketplaceListings: data.marketplaceListings.length > 0 ? data.marketplaceListings : fallback.marketplaceListings,
    buyerRequests: data.buyerRequests.length > 0 ? data.buyerRequests : fallback.buyerRequests,
    whatsappLeads: data.whatsappLeads.length > 0 ? data.whatsappLeads : fallback.whatsappLeads,
    leadRequests: data.leadRequests.length > 0 ? data.leadRequests : fallback.leadRequests,
    cropHealthReports: data.cropHealthReports,
    marketPrices: data.marketPrices.length > 0 ? data.marketPrices : fallback.marketPrices
  };
}

function SimpleBarList({ items, emptyLabel }: { items: Array<{ label: string; value: number }>; emptyLabel: string }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="rounded-md bg-leaf-50 p-4 text-sm font-semibold text-ink/58">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.slice(0, 8).map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-black text-ink">{item.label}</span>
            <span className="font-black text-leaf-700">{item.value}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf-50">
            <div className="h-full rounded-full bg-leaf-600" style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
      <dt className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-ink/72">{value}</dd>
    </div>
  );
}

function MatchPreview({ title, records, nameKeys }: { title: string; records: AnalyticsRecord[]; nameKeys: string[] }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-ink">{title}</p>
        <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-black text-leaf-700">{records.length}</span>
      </div>
      <div className="mt-3 grid gap-2">
        {records.map((record) => (
          <div key={textValue(record, "id") || recordName(record, ...nameKeys)} className="rounded bg-leaf-50 px-3 py-2 text-xs font-bold text-ink/65">
            {recordName(record, ...nameKeys)}
          </div>
        ))}
        {records.length === 0 ? <p className="text-xs font-semibold text-ink/45">No close match yet.</p> : null}
      </div>
    </div>
  );
}

export function AdminDashboard({
  currentAdmin,
  initialSection = "analytics",
  sitePrelaunchActive = false
}: {
  currentAdmin: AdminUser;
  initialSection?: AdminSectionId;
  sitePrelaunchActive?: boolean;
}) {
  const [activeSection, setActiveSection] = useState<AdminSectionId>(initialSection);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ImportAdminStatus>("All");
  const [farmerSourceFilter, setFarmerSourceFilter] = useState<FarmerSourceFilter>("All");
  const [profileCompletenessFilter, setProfileCompletenessFilter] = useState<ProfileCompletenessFilter>("All");
  const [marketplaceOwnerFilter, setMarketplaceOwnerFilter] = useState<MarketplaceOwnerFilter>("All");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("All");
  const [selectedFarmerRowIds, setSelectedFarmerRowIds] = useState<string[]>([]);
  const [expandedFarmerRowIds, setExpandedFarmerRowIds] = useState<string[]>([]);
  const [pendingFarmerBulkAction, setPendingFarmerBulkAction] = useState<FarmerBulkAction | null>(null);
  const [isUpdatingFarmersBulk, setIsUpdatingFarmersBulk] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ImportAdminStatus>>({});
  const [notice, setNotice] = useState("Actions are mock controls for Phase 1 admin.");
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});
  const [rowsBySection, setRowsBySection] = useState<Record<AdminSectionId, AdminRow[]>>(() => sectionRows());
  const [farmerDiagnostics, setFarmerDiagnostics] = useState<AdminFarmerDiagnostics | null>(null);
  const [farmerLoadError, setFarmerLoadError] = useState("");
  const [activityRows, setActivityRows] = useState<AdminActivityRecord[]>([]);
  const [activityError, setActivityError] = useState("");
  const [whatsappLeads, setWhatsappLeads] = useState<WhatsAppLeadRecord[]>([]);
  const [whatsappLeadError, setWhatsappLeadError] = useState("");
  const [leadRequests, setLeadRequests] = useState<LeadRequestRecord[]>([]);
  const [leadRequestError, setLeadRequestError] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [featuredEnquiries, setFeaturedEnquiries] = useState<FeaturedEnquiryRecord[]>([]);
  const [featuredEnquiryError, setFeaturedEnquiryError] = useState("");
  const [selectedFeaturedEnquiryId, setSelectedFeaturedEnquiryId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [closedMatchIds, setClosedMatchIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<Record<ApplicationKind, ApplicationRecord[]>>({
    farmer: [],
    buyer: [],
    supplier: []
  });
  const [applicationTab, setApplicationTab] = useState<ApplicationKind>("farmer");
  const [applicationError, setApplicationError] = useState("");
  const [submissions, setSubmissions] = useState<{
    listings: ListingSubmissionRecord[];
    buyerRequests: BuyerRequestSubmissionRecord[];
  }>({
    listings: [],
    buyerRequests: []
  });
  const [submissionTab, setSubmissionTab] = useState<SubmissionKind>("listing");
  const [submissionError, setSubmissionError] = useState("");
  const [importedFarmers, setImportedFarmers] = useState<ImportedFarmerRecord[]>([]);
  const [selectedImportedFarmerIds, setSelectedImportedFarmerIds] = useState<string[]>([]);
  const [farmerImportReport, setFarmerImportReport] = useState<FarmerImportReport | null>(null);
  const [farmerImportPreview, setFarmerImportPreview] = useState<FarmerImportPreview | null>(null);
  const [farmerImportError, setFarmerImportError] = useState("");
  const [isImportingFarmers, setIsImportingFarmers] = useState(false);
  const [isUpdatingImportedFarmers, setIsUpdatingImportedFarmers] = useState(false);
  const [reviewingImportedFarmerId, setReviewingImportedFarmerId] = useState<string | null>(null);
  const [verificationReviewNotes, setVerificationReviewNotes] = useState("");
  const [isUpdatingFarmerReview, setIsUpdatingFarmerReview] = useState(false);
  const [pendingFarmerReviewAction, setPendingFarmerReviewAction] = useState<"under-review" | "needs-follow-up" | "verify" | "verify-only" | "reject" | "archive" | "notes" | "import-photo" | null>(null);
  const [farmerReviewMessage, setFarmerReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoadingFarmerReview, setIsLoadingFarmerReview] = useState(false);
  const [farmerReviewDebug, setFarmerReviewDebug] = useState<Record<string, unknown> | null>(null);
  const [manualLaunchStatuses, setManualLaunchStatuses] = useState<Record<ManualLaunchChecklistItem, LaunchStatus>>(() =>
    Object.fromEntries(manualLaunchChecklistItems.map((item) => [item, "Incomplete"])) as Record<ManualLaunchChecklistItem, LaunchStatus>
  );

  useEffect(() => {
    const saved = window.localStorage.getItem("ghana-growers-launch-checklist");

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Partial<Record<ManualLaunchChecklistItem, LaunchStatus | "Not Started" | "In Progress">>;
      setManualLaunchStatuses((current) => ({
        ...current,
        ...Object.fromEntries(
          manualLaunchChecklistItems
            .filter((item) => Boolean(parsed[item]))
            .map((item) => [item, parsed[item] === "Complete" ? "Complete" : "Incomplete"])
        )
      }));
    } catch {
      window.localStorage.removeItem("ghana-growers-launch-checklist");
    }
  }, []);

  const loadActivity = useCallback(async () => {
    const response = await fetch("/api/admin/activity").catch(() => null);
    const result = (await response?.json().catch(() => null)) as { activity?: AdminActivityRecord[]; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setActivityError(result?.error ?? "Admin activity is unavailable.");
      return;
    }

    setActivityRows(result?.activity ?? []);
    setActivityError("");
  }, []);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const loadWhatsAppLeads = useCallback(async () => {
    const response = await fetch("/api/admin/whatsapp-leads").catch(() => null);
    const result = (await response?.json().catch(() => null)) as { leads?: WhatsAppLeadRecord[]; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setWhatsappLeadError(result?.error ?? "WhatsApp leads are unavailable.");
      return;
    }

    setWhatsappLeads(result?.leads ?? []);
    setWhatsappLeadError("");
  }, []);

  useEffect(() => {
    void loadWhatsAppLeads();
  }, [loadWhatsAppLeads]);

  const loadLeadRequests = useCallback(async () => {
    const response = await fetch("/api/admin/lead-requests").catch(() => null);
    const result = (await response?.json().catch(() => null)) as { leads?: LeadRequestRecord[]; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setLeadRequestError(result?.error ?? "Lead requests are unavailable.");
      return;
    }

    const leads = (result?.leads ?? []).map((lead) => ({
      ...lead,
      status: normalizeLeadStatus(lead.status)
    }));

    setLeadRequests(leads);
    setSelectedLeadId((current) => current ?? leads[0]?.id ?? null);
    setLeadRequestError("");
  }, []);

  useEffect(() => {
    void loadLeadRequests();
  }, [loadLeadRequests]);

  const loadFeaturedEnquiries = useCallback(async () => {
    const response = await fetch("/api/admin/featured-enquiries").catch(() => null);
    const result = (await response?.json().catch(() => null)) as { enquiries?: FeaturedEnquiryRecord[]; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFeaturedEnquiryError(result?.error ?? "Featured enquiries are unavailable.");
      return;
    }

    const enquiries = result?.enquiries ?? [];
    setFeaturedEnquiries(enquiries);
    setSelectedFeaturedEnquiryId((current) => current ?? enquiries[0]?.id ?? null);
    setFeaturedEnquiryError("");
  }, []);

  useEffect(() => {
    void loadFeaturedEnquiries();
  }, [loadFeaturedEnquiries]);

  const loadAnalytics = useCallback(async () => {
    const response = await fetch("/api/admin/analytics").catch(() => null);
    const result = (await response?.json().catch(() => null)) as (AnalyticsData & { error?: string }) | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setAnalyticsError(result?.error ?? "Analytics data is unavailable. Local fallback values are shown.");
      return;
    }

    setAnalyticsData({
      farmers: result?.farmers ?? [],
      suppliers: result?.suppliers ?? [],
      marketplaceListings: result?.marketplaceListings ?? [],
      buyerRequests: result?.buyerRequests ?? [],
      whatsappLeads: result?.whatsappLeads ?? [],
      leadRequests: result?.leadRequests ?? [],
      cropHealthReports: result?.cropHealthReports ?? [],
      marketPrices: result?.marketPrices ?? []
    });
    setAnalyticsError("");
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const loadAdminFarmers = useCallback(async () => {
    const response = await fetch("/api/admin/farmers").catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      farmers?: AnalyticsRecord[];
      diagnostics?: AdminFarmerDiagnostics;
      error?: string;
    } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const error = result?.error ?? "Supabase farmers could not be loaded.";
      const useDevelopmentFallback = process.env.NODE_ENV !== "production" && error.includes("Supabase is not configured");

      setRowsBySection((current) => ({
        ...current,
        farmers: useDevelopmentFallback ? sectionRows().farmers : []
      }));
      setFarmerDiagnostics({
        totalSupabaseFarmers: 0,
        tallyImportFarmers: 0,
        foundingFarmers: 0,
        manualTestFarmers: useDevelopmentFallback ? sectionRows().farmers.length : 0,
        activeFarmers: 0,
        pendingReviewFarmers: 0,
        archivedFarmers: 0,
        sourceValues: [],
        fallbackUsed: useDevelopmentFallback,
        error
      });
      setFarmerLoadError(useDevelopmentFallback ? "Supabase is not configured locally. Development fallback farmers are shown." : error);
      return;
    }

    const farmers = result?.farmers ?? [];
    setRowsBySection((current) => ({
      ...current,
      farmers: farmers.map(adminFarmerRowFromAnalytics)
    }));
    setFarmerDiagnostics(result?.diagnostics ?? null);
    setFarmerLoadError("");
  }, []);

  useEffect(() => {
    void loadAdminFarmers();
  }, [loadAdminFarmers]);

  const loadApplications = useCallback(async () => {
    const response = await fetch("/api/admin/applications").catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      farmers?: ApplicationRecord[];
      buyers?: ApplicationRecord[];
      suppliers?: ApplicationRecord[];
      error?: string;
    } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setApplicationError(result?.error ?? "Applications are unavailable.");
      return;
    }

    setApplications({
      farmer: result?.farmers ?? [],
      buyer: result?.buyers ?? [],
      supplier: result?.suppliers ?? []
    });
    setApplicationError("");
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const loadSubmissions = useCallback(async () => {
    const response = await fetch("/api/admin/submissions").catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      listings?: ListingSubmissionRecord[];
      buyerRequests?: BuyerRequestSubmissionRecord[];
      error?: string;
    } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setSubmissionError(result?.error ?? "Public submissions are unavailable.");
      return;
    }

    setSubmissions({
      listings: result?.listings ?? [],
      buyerRequests: result?.buyerRequests ?? []
    });
    setSubmissionError("");
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const loadImportedFarmers = useCallback(async () => {
    const response = await fetch("/api/admin/farmer-import").catch(() => null);
    const result = (await response?.json().catch(() => null)) as { farmers?: ImportedFarmerRecord[]; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFarmerImportError(result?.error ?? "Imported farmers could not be loaded.");
      return;
    }

    const farmers = result?.farmers ?? [];
    setImportedFarmers(farmers);
    setRowsBySection((current) => {
      const importedIds = new Set(farmers.flatMap((farmer) => [farmer.id, farmer.slug].filter(Boolean)));
      const nonImportedRows = current.farmers.filter((row) => !importedIds.has(row.id));

      return {
        ...current,
        farmers: [...farmers.map(rowFromImportedFarmer), ...nonImportedRows]
      };
    });
  }, []);

  useEffect(() => {
    if (activeSection === "farmer-import") {
      void loadImportedFarmers();
    }
  }, [activeSection, loadImportedFarmers]);

  const newApplicationCounts = useMemo(() => ({
    farmers: applications.farmer.filter((application) => application.status === "New").length,
    buyers: applications.buyer.filter((application) => application.status === "New").length,
    suppliers: applications.supplier.filter((application) => application.status === "New").length
  }), [applications]);
  const newSubmissionCounts = useMemo(() => ({
    listings: submissions.listings.filter((submission) => submission.status === "New").length,
    buyerRequests: submissions.buyerRequests.filter((submission) => submission.status === "New").length
  }), [submissions]);
  const summaryCards = useMemo(
    () => summarize(rowsBySection, whatsappLeads.length, leadRequests.length, newApplicationCounts, newSubmissionCounts),
    [rowsBySection, whatsappLeads.length, leadRequests.length, newApplicationCounts, newSubmissionCounts]
  );
  const pendingItems = useMemo(() => pendingWork(rowsBySection), [rowsBySection]);
  const pendingTaskItems = useMemo(() => pendingTasks(rowsBySection, whatsappLeads.length), [rowsBySection, whatsappLeads.length]);
  const leadSourceTotals = useMemo(() => sourceTypeTotals(whatsappLeads), [whatsappLeads]);
  const topLeadSources = useMemo(() => topClickedSources(whatsappLeads), [whatsappLeads]);
  const analyticsFallback = useMemo(() => localAnalyticsFallback(whatsappLeads, leadRequests), [whatsappLeads, leadRequests]);
  const analytics = useMemo(() => mergeAnalyticsWithFallback(analyticsData, analyticsFallback), [analyticsData, analyticsFallback]);
  useEffect(() => {
    if (!analyticsData?.farmers.length && !analyticsData?.suppliers.length && !analyticsData?.marketplaceListings.length) {
      return;
    }

    setRowsBySection((current) => ({
      ...current,
      suppliers: analyticsData.suppliers.length ? analyticsData.suppliers.map(adminSupplierRowFromAnalytics) : current.suppliers,
      marketplace: analyticsData.marketplaceListings.length
        ? analyticsData.marketplaceListings.map(adminMarketplaceRowFromAnalytics)
        : current.marketplace
    }));
  }, [analyticsData?.farmers, analyticsData?.marketplaceListings, analyticsData?.suppliers]);
  const buyerApplicationProducts = useMemo(
    () =>
      countBy(
        submissions.buyerRequests.map((request) => ({ product_needed: request.product_needed })),
        "product_needed"
      ),
    [submissions.buyerRequests]
  );
  const analyticsCards = useMemo(() => {
    const mostRequestedProduct = buyerApplicationProducts[0]?.label || countBy(analytics.buyerRequests, "product_needed")[0]?.label || "No requests yet";

    return [
      { label: "Total farmers", value: analytics.farmers.length, icon: Sprout },
      { label: "Verified farmers", value: verifiedCount(analytics.farmers), icon: BadgeCheck },
      { label: "Total suppliers", value: analytics.suppliers.length, icon: Truck },
      { label: "Verified suppliers", value: verifiedCount(analytics.suppliers), icon: ShieldCheck },
      { label: "Marketplace listings", value: analytics.marketplaceListings.length, icon: Store },
      { label: "Active buyer requests", value: activeBuyerRequestCount(analytics.buyerRequests), icon: PackageCheck },
      { label: "New Buyer Requests", value: submissions.buyerRequests.filter((request) => request.status === "New").length, icon: CircleDashed },
      { label: "Published Buyer Requests", value: submissions.buyerRequests.filter((request) => request.status === "Published").length, icon: PackageCheck },
      { label: "Most Requested Products", value: mostRequestedProduct, icon: ChartLine },
      { label: "WhatsApp leads", value: analytics.whatsappLeads.length, icon: MessageCircle },
      { label: "Total leads", value: analytics.leadRequests.length, icon: MessageCircle },
      { label: "Crop health checks", value: analytics.cropHealthReports.length, icon: ClipboardCheck },
      { label: "Market price records", value: analytics.marketPrices.length, icon: ChartLine }
    ];
  }, [analytics, buyerApplicationProducts, submissions.buyerRequests]);
  const analyticsLeadSources = useMemo(() => countBy(analytics.whatsappLeads, "source_type"), [analytics.whatsappLeads]);
  const analyticsTopSources = useMemo(() => topClickedSources(analytics.whatsappLeads as WhatsAppLeadRecord[]), [analytics.whatsappLeads]);
  const selectedLead = useMemo(() => leadRequests.find((lead) => lead.id === selectedLeadId) ?? leadRequests[0] ?? null, [leadRequests, selectedLeadId]);
  const selectedFeaturedEnquiry = useMemo(
    () => featuredEnquiries.find((enquiry) => enquiry.id === selectedFeaturedEnquiryId) ?? featuredEnquiries[0] ?? null,
    [featuredEnquiries, selectedFeaturedEnquiryId]
  );
  const leadMetricCards = useMemo(
    () => [
      { label: "Total Leads", value: leadRequests.length, icon: MessageCircle },
      { label: "New Leads", value: leadStatusCount(leadRequests, "New"), icon: CircleDashed },
      { label: "Negotiating", value: leadStatusCount(leadRequests, "Negotiating"), icon: MessageCircle },
      { label: "Completed", value: leadStatusCount(leadRequests, "Completed"), icon: BadgeCheck },
      { label: "Lost", value: leadStatusCount(leadRequests, "Lost"), icon: X }
    ],
    [leadRequests]
  );
  const topFarmersByLeads = useMemo(() => topLeadSourcesByKind(leadRequests, ["Farmer"]), [leadRequests]);
  const topSuppliersByLeads = useMemo(() => topLeadSourcesByKind(leadRequests, ["Supplier", "Supplier Listing"]), [leadRequests]);
  const mostRequestedListings = useMemo(() => topLeadSourcesByKind(leadRequests, ["Marketplace Listing", "Supplier Listing"]), [leadRequests]);
  const mostRequestedProducts = useMemo(() => mostRequestedLeadProducts(leadRequests), [leadRequests]);
  const listingsByCategory = useMemo(() => countBy(analytics.marketplaceListings, "category"), [analytics.marketplaceListings]);
  const buyerRequestsByProduct = useMemo(() => countBy(analytics.buyerRequests, "product_needed"), [analytics.buyerRequests]);
  const farmersByRegion = useMemo(() => countBy(analytics.farmers, "region"), [analytics.farmers]);
  const suppliersByCategory = useMemo(() => countBy(analytics.suppliers, "category"), [analytics.suppliers]);
  const matchOpportunities = useMemo(() => buildAdminMatchOpportunities(analytics), [analytics]);
  const totalMatches = useMemo(
    () => matchOpportunities.reduce((total, opportunity) => total + opportunity.farmers.length + opportunity.listings.length, 0),
    [matchOpportunities]
  );
  const closedMatchIdSet = useMemo(
    () =>
      new Set([
        ...closedMatchIds,
        ...activityRows
          .filter((activity) => activity.entity_type === "Match Opportunity" && activity.action_type === "Close" && activity.entity_id)
          .map((activity) => activity.entity_id as string)
      ]),
    [activityRows, closedMatchIds]
  );
  const closedMatches = useMemo(() => matchOpportunities.filter((opportunity) => closedMatchIdSet.has(opportunity.id)).length, [closedMatchIdSet, matchOpportunities]);
  const openMatches = Math.max(totalMatches - closedMatches, 0);
  const launchChecklistItems = useMemo(() => {
    const activeFarmers = activeRecordCount(analytics.farmers);
    const verifiedFarmers = verifiedCount(analytics.farmers);
    const activeSuppliers = activeRecordCount(analytics.suppliers);
    const marketplaceListingCount = analytics.marketplaceListings.length;
    const buyerRequestCount = activeBuyerRequestCount(analytics.buyerRequests);
    const dataItems = [
      {
        id: "active-farmers",
        label: "At least 30 active farmers",
        status: launchStatusFromCount(activeFarmers, 30),
        detail: `${activeFarmers} of 30 active farmers`,
        section: "farmers" as AdminSectionId
      },
      {
        id: "verified-farmers",
        label: "At least 10 verified farmers",
        status: launchStatusFromCount(verifiedFarmers, 10),
        detail: `${verifiedFarmers} of 10 verified farmers`,
        section: "farmers" as AdminSectionId
      },
      {
        id: "active-suppliers",
        label: "At least 5 active suppliers",
        status: launchStatusFromCount(activeSuppliers, 5),
        detail: `${activeSuppliers} of 5 active suppliers`,
        section: "suppliers" as AdminSectionId
      },
      {
        id: "marketplace",
        label: "At least 10 marketplace listings",
        status: launchStatusFromCount(marketplaceListingCount, 10),
        detail: `${marketplaceListingCount} of 10 marketplace listings`,
        section: "marketplace" as AdminSectionId
      },
      {
        id: "buyer-requests",
        label: "At least 5 buyer requests",
        status: launchStatusFromCount(buyerRequestCount, 5),
        detail: `${buyerRequestCount} of 5 active buyer requests`,
        section: "buyer-requests" as AdminSectionId
      }
    ];
    const manualItems = manualLaunchChecklistItems.map((label) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      status: manualLaunchStatuses[label],
      detail: "Manual launch check",
      section: null
    }));

    return [...dataItems, ...manualItems];
  }, [analytics, manualLaunchStatuses]);
  const launchProgress = useMemo(() => {
    const total = launchChecklistItems.length || 1;
    const score = launchChecklistItems.reduce((sum, item) => sum + statusProgress(item.status), 0);

    return Math.round((score / total) * 100);
  }, [launchChecklistItems]);
  const missingLaunchItems = useMemo(() => launchChecklistItems.filter((item) => item.status !== "Complete"), [launchChecklistItems]);
  const isLaunchReady = missingLaunchItems.length === 0;
  const currentRows = rowsBySection[activeSection].map((row) => ({
    ...row,
    status: statusOverrides[row.id] ?? row.status
  }));
  const filteredRows = currentRows.filter((row) => {
    const query = searchTerm.trim().toLowerCase();
    const rowSource = normalizedFarmerSource(row.source);
    const matchesSearch =
      !query ||
      [row.name, row.type, row.region, row.status, row.verificationStatus ?? "", rowSource, row.ownerType ?? "", row.ownerName ?? "", row.dateAdded]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter || row.verificationStatus === statusFilter;
    const matchesFarmerSource =
      activeSection !== "farmers" ||
      farmerSourceFilter === "All" ||
      (farmerSourceFilter === "Tally Import" && rowSource === "Tally Import") ||
      (farmerSourceFilter === "Founding Farmer" && rowSource === "Founding Farmer") ||
      (farmerSourceFilter === "Manual/Test" && rowSource !== "Tally Import" && rowSource !== "Founding Farmer");
    const matchesCompleteness =
      activeSection !== "farmers" ||
      profileCompletenessFilter === "All" ||
      row.completenessStatus === profileCompletenessFilter;
    const matchesMarketplaceOwner =
      activeSection !== "marketplace" ||
      marketplaceOwnerFilter === "All" ||
      row.ownerType === marketplaceOwnerFilter;
    const supportsFeaturedFilter = activeSection === "farmers" || activeSection === "suppliers" || activeSection === "marketplace";
    const matchesFeatured =
      !supportsFeaturedFilter ||
      featuredFilter === "All" ||
      (featuredFilter === "Featured" && isAdminFeaturedActive(row)) ||
      (featuredFilter === "Not Featured" && !row.isFeatured) ||
      (featuredFilter === "Expired Featured" && isAdminFeaturedExpired(row));

    return matchesSearch && matchesStatus && matchesFarmerSource && matchesCompleteness && matchesMarketplaceOwner && matchesFeatured;
  });
  const visibleFarmerRowIds = activeSection === "farmers" ? filteredRows.map((row) => row.id) : [];
  const selectedVisibleFarmerCount = visibleFarmerRowIds.filter((id) => selectedFarmerRowIds.includes(id)).length;
  const allVisibleFarmersSelected = visibleFarmerRowIds.length > 0 && selectedVisibleFarmerCount === visibleFarmerRowIds.length;
  const reviewingImportedFarmerIndex = importedFarmers.findIndex((farmer) => farmer.id === reviewingImportedFarmerId);
  const reviewingImportedFarmer = reviewingImportedFarmerIndex === -1 ? null : importedFarmers[reviewingImportedFarmerIndex];
  const previousImportedFarmer = reviewingImportedFarmerIndex > 0 ? importedFarmers[reviewingImportedFarmerIndex - 1] : null;
  const nextImportedFarmer =
    reviewingImportedFarmerIndex !== -1 && reviewingImportedFarmerIndex < importedFarmers.length - 1
      ? importedFarmers[reviewingImportedFarmerIndex + 1]
      : null;
  const reviewingCompleteness = reviewingImportedFarmer ? farmerCompleteness(reviewingImportedFarmer) : null;
  const reviewingReadiness = reviewingImportedFarmer ? farmerReviewReadiness(reviewingImportedFarmer) : [];
  const reviewingFollowUpMessage = reviewingImportedFarmer ? followUpMessageForFarmer(reviewingImportedFarmer) : "";
  const reviewingWhatsappUrl =
    reviewingImportedFarmer?.whatsapp_number
      ? `https://wa.me/${reviewingImportedFarmer.whatsapp_number.replace(/\D+/g, "")}?text=${encodeURIComponent(reviewingFollowUpMessage)}`
      : "";

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

    setStatusOverrides((current) => ({ ...current, [row.id]: status }));

    const response = await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...row.verificationTarget,
        status,
        verifiedBy: "Ghana Growers Admin",
        verificationNotes: verificationNotes[row.id] ?? "",
        entityName: row.name
      })
    }).catch(() => null);

    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? `Could not update verification status for ${row.name}.`);
      return;
    }

    setNotice(`${row.name} verification status updated to ${status}.`);
    setVerificationNotes((current) => ({ ...current, [row.id]: "" }));
    void loadActivity();
  }

  async function archiveAdminRow(row: AdminRow) {
    const formId = formIdForSection(activeSection);

    if (!formId) {
      mockAction(row, "Archive");
      return;
    }

    setStatusOverrides((current) => ({ ...current, [row.id]: "Archived" }));

    const response = await fetch("/api/admin/archive", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        section: formId,
        recordId: row.id,
        entityName: row.name
      })
    }).catch(() => null);

    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? `Could not archive ${row.name}.`);
      return;
    }

    setRowsBySection((current) => ({
      ...current,
      [activeSection]: current[activeSection].map((record) => (record.id === row.id ? { ...record, status: "Archived" } : record))
    }));
    setNotice(`${row.name} archived successfully.`);
    void loadActivity();
  }

  async function publishSuccessStory(row: AdminRow) {
    setStatusOverrides((current) => ({ ...current, [row.id]: "Published" }));

    const response = await fetch("/api/admin/success-stories/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId: row.id,
        entityName: row.name,
        status: "Published"
      })
    }).catch(() => null);

    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? `Could not publish ${row.name}.`);
      return;
    }

    setRowsBySection((current) => ({
      ...current,
      "success-stories": current["success-stories"].map((record) => (record.id === row.id ? { ...record, status: "Published" } : record))
    }));
    setNotice(`${row.name} published successfully.`);
    void loadActivity();
  }

  async function updateFeaturedRow(row: AdminRow, action: "mark" | "remove" | "note") {
    if (activeSection !== "farmers" && activeSection !== "suppliers" && activeSection !== "marketplace") {
      return;
    }

    const featuredUntil =
      action === "remove"
        ? ""
        : window.prompt("Set featured until date (YYYY-MM-DD). Leave blank for no expiry.", row.featuredUntil ?? "") ?? row.featuredUntil ?? "";

    if (action !== "remove" && featuredUntil === null) {
      return;
    }

    const featuredNote =
      action === "remove"
        ? row.featuredNote ?? ""
        : window.prompt("Internal featured note. Leave blank if not needed.", row.featuredNote ?? "") ?? row.featuredNote ?? "";

    const response = await fetch("/api/admin/featured", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: activeSection,
        recordId: row.id,
        entityName: row.name,
        action,
        featuredUntil,
        featuredNote
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? `Could not update featured settings for ${row.name}.`);
      return;
    }

    setRowsBySection((current) => ({
      ...current,
      [activeSection]: current[activeSection].map((record) =>
        record.id === row.id
          ? {
              ...record,
              isFeatured: action !== "remove",
              featuredUntil: action === "remove" ? undefined : featuredUntil || undefined,
              featuredNote: featuredNote || undefined
            }
          : record
      )
    }));
    setNotice(
      action === "remove"
        ? `${row.name} removed from featured visibility.`
        : `${row.name} marked featured${featuredUntil ? ` until ${featuredUntil}` : ""}.`
    );
    void loadActivity();
    void loadAnalytics();
  }

  async function archiveNonTallyFarmers() {
    const confirmed = window.confirm(
      "Archive all farmers that are not Tally Import or Founding Farmers? This will hide demo, manual, and test farmers from public launch views without deleting records."
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch("/api/admin/farmers/cleanup", {
      method: "PATCH"
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { archived?: number; error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? "Could not archive manual/test farmers.");
      return;
    }

    setRowsBySection((current) => ({
      ...current,
      farmers: current.farmers.map((row) =>
        normalizedFarmerSource(row.source) === "Tally Import" || normalizedFarmerSource(row.source) === "Founding Farmer"
          ? row
          : { ...row, status: "Archived", href: undefined }
      )
    }));
    setStatusFilter("Archived");
    setFarmerSourceFilter("Manual/Test");
    setNotice(`${result?.archived ?? 0} manual/test farmer${result?.archived === 1 ? "" : "s"} archived. Tally-imported farmers were left unchanged.`);
    void loadActivity();
    void loadAnalytics();
    void loadAdminFarmers();
  }

  function toggleFarmerSelection(rowId: string, checked: boolean) {
    setSelectedFarmerRowIds((current) =>
      checked ? Array.from(new Set([...current, rowId])) : current.filter((id) => id !== rowId)
    );
  }

  function toggleExpandedFarmerRow(rowId: string) {
    setExpandedFarmerRowIds((current) =>
      current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]
    );
  }

  function toggleVisibleFarmerSelection(checked: boolean) {
    setSelectedFarmerRowIds((current) => {
      const visible = new Set(visibleFarmerRowIds);

      if (checked) {
        return Array.from(new Set([...current, ...visibleFarmerRowIds]));
      }

      return current.filter((id) => !visible.has(id));
    });
  }

  async function applyFarmerBulkAction() {
    if (!pendingFarmerBulkAction || selectedFarmerRowIds.length === 0) {
      return;
    }

    setIsUpdatingFarmersBulk(true);
    const response = await fetch("/api/admin/farmers/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: pendingFarmerBulkAction,
        recordIds: selectedFarmerRowIds
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string; updated?: number; status?: string } | null;
    setIsUpdatingFarmersBulk(false);

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? "Could not update selected farmers.");
      return;
    }

    setPendingFarmerBulkAction(null);
    setSelectedFarmerRowIds([]);
    setRowsBySection((current) => ({
      ...current,
      farmers: current.farmers.map((row) => {
        if (!selectedFarmerRowIds.includes(row.id)) {
          return row;
        }

        if (pendingFarmerBulkAction === "founding") {
          return { ...row, status: "Active", source: "Founding Farmer", href: `/farmer-directory/${row.id}` };
        }

        if (pendingFarmerBulkAction === "active") {
          return { ...row, status: "Active", href: `/farmer-directory/${row.id}` };
        }

        if (pendingFarmerBulkAction === "pending-review") {
          return { ...row, status: "Pending Review", href: undefined };
        }

        if (pendingFarmerBulkAction === "archive") {
          return { ...row, status: "Archived", href: undefined };
        }

        return row;
      })
    }));
    setNotice(`${result?.updated ?? 0} farmer${result?.updated === 1 ? "" : "s"} updated to ${result?.status ?? farmerBulkActionLabels[pendingFarmerBulkAction]}.`);
    void loadActivity();
    void loadAnalytics();
    void loadAdminFarmers();
  }

  async function importTallyFarmers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const mode = submitter?.value === "import" ? "import" : "preview";
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("csv") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setFarmerImportError("Upload a Tally CSV file.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
      setFarmerImportError("Upload a CSV file exported from Tally.");
      return;
    }

    setIsImportingFarmers(true);
    setFarmerImportError("");
    if (mode === "import") {
      setFarmerImportReport(null);
    }
    const formData = new FormData();
    formData.append("csv", file);
    formData.append("mode", mode);

    const response = await fetch("/api/admin/farmer-import", {
      method: "POST",
      body: formData
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      report?: FarmerImportReport;
      farmers?: ImportedFarmerRecord[];
      detectedHeaders?: string[];
      normalizedHeaders?: string[];
      fieldMappings?: FarmerImportPreview["fieldMappings"];
      missingRequiredFields?: string[];
      previewRows?: FarmerImportPreview["previewRows"];
      totalRows?: number;
      error?: string;
    } | null;
    setIsImportingFarmers(false);

    const preview = {
      detectedHeaders: result?.detectedHeaders ?? [],
      normalizedHeaders: result?.normalizedHeaders ?? [],
      fieldMappings: result?.fieldMappings ?? {},
      missingRequiredFields: result?.missingRequiredFields ?? [],
      previewRows: result?.previewRows ?? [],
      totalRows: result?.totalRows
    };
    setFarmerImportPreview(preview);

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFarmerImportError(result?.error ?? "Could not import farmers from this CSV.");
      return;
    }

    if (mode === "preview") {
      setFarmerImportReport(null);
      setImportedFarmers([]);
      setSelectedImportedFarmerIds([]);
      setNotice(`CSV preview ready: ${result?.totalRows ?? preview.previewRows.length} rows detected.`);
      return;
    }

    if (!result?.report) {
      setFarmerImportError("Import did not return a report.");
      return;
    }

    const farmers = result.farmers ?? [];
    setFarmerImportReport(result.report);
    setImportedFarmers(farmers);
    setSelectedImportedFarmerIds(farmers.map((farmer) => farmer.id));
    setRowsBySection((current) => ({
      ...current,
      farmers: [...farmers.map(rowFromImportedFarmer), ...current.farmers]
    }));
    setNotice(`Tally import complete: ${result.report.imported} imported, ${result.report.duplicates} duplicates, ${result.report.errors} errors.`);
    form.reset();
    void loadActivity();
    void loadAnalytics();
    void loadAdminFarmers();
  }

  async function bulkUpdateImportedFarmers(action: "approve" | "founding" | "archive") {
    if (selectedImportedFarmerIds.length === 0) {
      setFarmerImportError("Select at least one imported farmer.");
      return;
    }

    setIsUpdatingImportedFarmers(true);
    setFarmerImportError("");
    const response = await fetch("/api/admin/farmer-import", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ids: selectedImportedFarmerIds
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string; updated?: number } | null;
    setIsUpdatingImportedFarmers(false);

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFarmerImportError(result?.error ?? "Could not update imported farmers.");
      return;
    }

    const nextStatus: ImportAdminStatus = action === "archive" ? "Archived" : "Active";
    const nextVerification = action === "founding" ? undefined : "Pending";
    const nextSource = action === "founding" ? "Founding Farmer" : undefined;
    setImportedFarmers((current) =>
      current.map((farmer) =>
        selectedImportedFarmerIds.includes(farmer.id)
          ? { ...farmer, status: nextStatus, verification_status: nextVerification ?? farmer.verification_status, source: nextSource ?? farmer.source }
          : farmer
      )
    );
    setRowsBySection((current) => ({
      ...current,
      farmers: current.farmers.map((row) => {
        const matched = importedFarmers.find((farmer) => selectedImportedFarmerIds.includes(farmer.id) && (farmer.slug === row.id || farmer.id === row.id));

        if (!matched) {
          return row;
        }

        return {
          ...row,
          status: nextStatus,
          source: nextSource ?? row.source,
          href: nextStatus === "Active" ? `/farmer-directory/${matched.slug || matched.id}` : undefined
        };
      })
    }));
    setNotice(`${result?.updated ?? selectedImportedFarmerIds.length} imported farmer${selectedImportedFarmerIds.length === 1 ? "" : "s"} updated.`);
    void loadActivity();
    void loadAnalytics();
    void loadAdminFarmers();
  }

  async function openImportedFarmerReview(farmer: ImportedFarmerRecord) {
    setReviewingImportedFarmerId(farmer.id);
    setVerificationReviewNotes(farmer.verification_notes ?? "");
    setIsLoadingFarmerReview(true);
    setFarmerReviewMessage(null);
    setFarmerReviewDebug(null);

    const response = await fetch("/api/admin/farmer-import", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "view",
        ids: [farmer.id]
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { farmer?: ImportedFarmerRecord; error?: string } | null;
    setIsLoadingFarmerReview(false);

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFarmerImportError(result?.error ?? "Could not open farmer review.");
      return;
    }

    if (result?.farmer) {
      setImportedFarmers((current) => {
        const exists = current.some((item) => item.id === result.farmer?.id);
        return exists
          ? current.map((item) => (item.id === result.farmer?.id ? result.farmer : item))
          : [result.farmer as ImportedFarmerRecord, ...current];
      });
      setReviewingImportedFarmerId(result.farmer.id);
      setVerificationReviewNotes(result.farmer.verification_notes ?? "");
      setFarmerReviewDebug(reviewDebugFields(result.farmer));
    }

    void loadActivity();
  }

  async function openImportedFarmerReviewById(recordId: string, row?: AdminRow) {
    if (row) {
      const placeholder = importedFarmerPlaceholderFromRow(row);
      setImportedFarmers((current) => {
        const exists = current.some((farmer) => farmer.id === placeholder.id || farmer.slug === placeholder.slug);
        return exists
          ? current.map((farmer) => (farmer.id === placeholder.id || farmer.slug === placeholder.slug ? { ...placeholder, ...farmer } : farmer))
          : [placeholder, ...current];
      });
      setReviewingImportedFarmerId(placeholder.id);
    }

    setIsLoadingFarmerReview(true);
    setFarmerReviewMessage(null);
    setFarmerReviewDebug(null);
    setFarmerImportError("");
    const response = await fetch("/api/admin/farmer-import", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "view",
        ids: [recordId]
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { farmer?: ImportedFarmerRecord; error?: string } | null;
    setIsLoadingFarmerReview(false);

    if (!response?.ok || !result?.farmer) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setNotice(result?.error ?? "Could not open the full farmer application.");
      setFarmerReviewMessage({ type: "error", text: result?.error ?? "Could not open the full farmer application." });
      return;
    }

    setImportedFarmers((current) => {
      const exists = current.some((farmer) => farmer.id === result.farmer?.id || farmer.slug === result.farmer?.slug || farmer.id === recordId || farmer.slug === recordId);
      return exists
        ? current.map((farmer) =>
            farmer.id === result.farmer?.id || farmer.slug === result.farmer?.slug || farmer.id === recordId || farmer.slug === recordId
              ? result.farmer as ImportedFarmerRecord
              : farmer
          )
        : [result.farmer as ImportedFarmerRecord, ...current];
    });
    setReviewingImportedFarmerId(result.farmer.id);
    setVerificationReviewNotes(result.farmer.verification_notes ?? "");
    setFarmerReviewDebug(reviewDebugFields(result.farmer));
    void loadActivity();
  }

  function closeImportedFarmerReview() {
    setReviewingImportedFarmerId(null);
    setVerificationReviewNotes("");
    setIsUpdatingFarmerReview(false);
    setPendingFarmerReviewAction(null);
    setFarmerReviewMessage(null);
    setIsLoadingFarmerReview(false);
    setFarmerReviewDebug(null);
  }

  async function copyFollowUpMessage() {
    if (!reviewingFollowUpMessage) {
      return;
    }

    await navigator.clipboard.writeText(reviewingFollowUpMessage).then(
      () => setFarmerReviewMessage({ type: "success", text: "Follow-up message copied." }),
      () => setFarmerReviewMessage({ type: "error", text: "Could not copy the follow-up message." })
    );
  }

  async function applyImportedFarmerReviewAction(action: "under-review" | "needs-follow-up" | "verify" | "verify-only" | "reject" | "archive" | "notes" | "import-photo") {
    if (!reviewingImportedFarmer) {
      return;
    }

    setIsUpdatingFarmerReview(true);
    setPendingFarmerReviewAction(action);
    setFarmerReviewMessage(null);
    setFarmerImportError("");
    const response = await fetch("/api/admin/farmer-import", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ids: [reviewingImportedFarmer.id],
        notes: verificationReviewNotes
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { farmer?: ImportedFarmerRecord; error?: string; message?: string } | null;
    setIsUpdatingFarmerReview(false);
    setPendingFarmerReviewAction(null);

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const errorMessage = result?.error ?? "Could not update this farmer review.";
      setFarmerImportError(errorMessage);
      setFarmerReviewMessage({ type: "error", text: errorMessage });
      return;
    }

    const updatedFarmer = result?.farmer ?? reviewingImportedFarmer;
    const successMessage =
      action === "verify"
        ? "Farmer verified and published successfully."
      : action === "verify-only"
        ? "Farmer verified successfully. Public visibility was not changed."
      : action === "import-photo"
        ? "Farmer photo imported successfully."
      : action === "under-review"
        ? "Farmer marked under review."
          : action === "needs-follow-up"
            ? "Farmer marked as needs follow-up."
          : action === "reject"
            ? "Farmer rejected."
            : action === "archive"
              ? "Farmer archived."
              : "Verification notes saved.";

    setImportedFarmers((current) => current.map((farmer) => (farmer.id === updatedFarmer.id ? updatedFarmer : farmer)));
    setReviewingImportedFarmerId(updatedFarmer.id);
    setVerificationReviewNotes(updatedFarmer.verification_notes ?? "");
    setFarmerReviewDebug(reviewDebugFields(updatedFarmer));
    setRowsBySection((current) => ({
      ...current,
      farmers: current.farmers.map((row) =>
        row.id === updatedFarmer.slug || row.id === updatedFarmer.id
          ? (() => {
              const completeness = farmerCompleteness(updatedFarmer);

              return {
                ...row,
                status: updatedFarmer.status,
                verificationStatus: updatedFarmer.verification_status,
                phone: updatedFarmer.phone_number || updatedFarmer.whatsapp_number,
                whatsapp: updatedFarmer.whatsapp_number,
                farmSize: updatedFarmer.farm_size,
                products: updatedFarmer.products.slice(0, 3).join(", "),
                source: updatedFarmer.source,
                completenessPercent: completeness.percent,
                completenessStatus: completeness.status,
                completenessTone: completeness.tone,
                href: updatedFarmer.status === "Active" ? `/farmer-directory/${updatedFarmer.slug || updatedFarmer.id}` : undefined
              };
            })()
          : row
      )
    }));
    setFarmerReviewMessage({ type: "success", text: successMessage });
    setNotice(successMessage);
    void loadActivity();
    void loadAnalytics();
    void loadAdminFarmers();
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
    const nextValues = formValuesForRow(formId, row);
    setFormValues(nextValues);
    setImagePreviews(
      Object.fromEntries(
        formConfigs[formId]
          .filter((field) => field.type === "image" && nextValues[field.name])
          .map((field) => [field.name, nextValues[field.name]])
      )
    );
    setFormError("");
    setFormSuccess("");
    setUploadingField(null);
    setActiveForm({
      id: formId,
      mode,
      title: `${mode === "add" ? "Add" : "Edit"} ${formTitles[formId]}`,
      recordId: row?.id,
      recordName: row?.name
    });
  }

  function closeAdminForm() {
    setActiveForm(null);
    setFormValues({});
    setImagePreviews({});
    setFormError("");
    setFormSuccess("");
    setUploadingField(null);
  }

  async function uploadImage(field: FormField, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !field.bucket) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setFormError("Upload a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreviews((current) => ({ ...current, [field.name]: localPreview }));
    setUploadingField(field.name);
    setFormError("");
    setFormSuccess("");

    const formData = new FormData();
    formData.append("bucket", field.bucket);
    formData.append("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData
    }).catch(() => null);
    setUploadingField(null);
    event.target.value = "";

    const result = (await response?.json().catch(() => null)) as { publicUrl?: string; error?: string } | null;

    if (!response?.ok || !result?.publicUrl) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFormError(result?.error ?? "Image upload failed. Check Supabase Storage configuration.");
      return;
    }

    setFormValues((current) => ({ ...current, [field.name]: result.publicUrl ?? "" }));
    setImagePreviews((current) => ({ ...current, [field.name]: result.publicUrl ?? localPreview }));
    setFormSuccess("Image uploaded. Save the form to attach it to this record.");
  }

  function removeImage(fieldName: string) {
    setFormValues((current) => ({ ...current, [fieldName]: "" }));
    setImagePreviews((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setFormError("");
    setFormSuccess("Image removed from this form. Save the form to update the record.");
  }

  function refreshAdminRows(formId: AdminFormId, mode: "add" | "edit", row: AdminRow) {
    const section = sectionForForm(formId);
    const verificationRow = verificationRowFromAdminRow(formId, row);

    setRowsBySection((current) => {
      const upsert = (rows: AdminRow[], item: AdminRow) => {
        const existingIndex = rows.findIndex((record) => record.id === item.id);

        if (existingIndex === -1) {
          return mode === "add" ? [item, ...rows] : rows;
        }

        return rows.map((record) => (record.id === item.id ? { ...record, ...item } : record));
      };

      const next = {
        ...current,
        [section]: upsert(current[section], row)
      };

      if (verificationRow) {
        next.verifications = upsert(current.verifications, verificationRow);
      }

      return next;
    });
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
    const endpoint = createEndpoints[activeForm.id];
    const canPersist = canPersistAdminForm(activeForm.id, activeForm.mode);

    if (endpoint && canPersist) {
      setIsSubmittingForm(true);
      const response = await fetch(endpoint, {
        method: activeForm.mode === "add" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formValues,
          recordId: activeForm.recordId
        })
      }).catch(() => null);
      setIsSubmittingForm(false);

      const result = (await response?.json().catch(() => null)) as { error?: string; message?: string; record?: unknown } | null;

      if (!response?.ok) {
        if (response?.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        setFormError(result?.error ?? "Supabase insert failed. Check the admin session, environment variables, and table schema.");
        setFormSuccess("");
        return;
      }

      const savedRow = rowFromForm(activeForm.id, formValues, result?.record, activeForm.mode === "edit" ? activeForm.recordId : undefined);
      refreshAdminRows(activeForm.id, activeForm.mode, savedRow);
      void loadActivity();
      setFormError("");
      setFormSuccess("Saved successfully.");
      setNotice(
        `Saved successfully. ${result?.message ? `${result.message} ` : ""}${recordLabel} table and dashboard counts have been refreshed.`
      );
      window.setTimeout(() => {
        closeAdminForm();
      }, 650);
      return;
    }

    setFormError("");
    const previewRow = rowFromForm(activeForm.id, formValues, null, activeForm.mode === "edit" ? activeForm.recordId : undefined);
    refreshAdminRows(activeForm.id, activeForm.mode, previewRow);
    setFormSuccess("Saved successfully.");
    setNotice(`Saved successfully. ${recordLabel} table and dashboard counts have been refreshed.`);
    window.setTimeout(() => {
      closeAdminForm();
    }, 650);
  }

  const activeSectionLabel = sections.find((section) => section.id === activeSection)?.label ?? "Admin";
  const activeSectionFormId = formIdForSection(activeSection);
  const isAnalyticsSection = activeSection === "analytics";
  const isLaunchChecklistSection = activeSection === "launch-checklist";
  const isFarmerImportSection = activeSection === "farmer-import";
  const isApplicationsSection = activeSection === "applications";
  const isSubmissionsSection = activeSection === "submissions";
  const isWhatsAppLeadsSection = activeSection === "whatsapp-leads";
  const isLeadQueueSection = activeSection === "lead-queue";
  const isFeaturedEnquiriesSection = activeSection === "featured-enquiries";
  const isMatchOpportunitiesSection = activeSection === "match-opportunities";

  async function updateLeadRequestStatus(lead: LeadRequestRecord, status: LeadRequestStatus) {
    const response = await fetch("/api/admin/lead-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setLeadRequestError(result?.error ?? "Could not update this lead request.");
      return;
    }

    setLeadRequests((current) => current.map((item) => (item.id === lead.id ? { ...item, status } : item)));
    setLeadRequestError("");
    setNotice(`${lead.requester_name} lead marked ${status}.`);
    void loadActivity();
    void loadAnalytics();
  }

  async function updateFeaturedEnquiryStatus(enquiry: FeaturedEnquiryRecord, status: FeaturedEnquiryStatus) {
    const response = await fetch("/api/admin/featured-enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: enquiry.id, status })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFeaturedEnquiryError(result?.error ?? "Could not update this featured enquiry.");
      return;
    }

    setFeaturedEnquiries((current) => current.map((item) => (item.id === enquiry.id ? { ...item, status } : item)));
    setFeaturedEnquiryError("");
    setNotice(`${enquiry.name} featured enquiry marked ${status}.`);
    void loadActivity();
  }

  async function updateApplication(application: ApplicationRecord, status: ApplicationStatus) {
    const response = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: applicationTab,
        id: application.id,
        status,
        entityName: application.business_or_farm_name || application.name
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setApplicationError(result?.error ?? "Could not update application.");
      return;
    }

    setApplications((current) => ({
      ...current,
      [applicationTab]: current[applicationTab].map((item) => (item.id === application.id ? { ...item, status, updated_at: new Date().toISOString() } : item))
    }));
    setApplicationError("");
    setNotice(`${application.name} application marked ${status}.`);
    void loadActivity();
  }

  async function updateSubmissionStatus(
    submission: ListingSubmissionRecord | BuyerRequestSubmissionRecord,
    status: Exclude<SubmissionStatus, "New" | "Converted">
  ) {
    const entityName = submissionTab === "listing"
      ? (submission as ListingSubmissionRecord).product_name
      : (submission as BuyerRequestSubmissionRecord).product_needed;
    const response = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: submissionTab,
        id: submission.id,
        status,
        entityName
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setSubmissionError(result?.error ?? "Could not update submission.");
      return;
    }

    if (submissionTab === "listing") {
      setSubmissions((current) => ({
        ...current,
        listings: current.listings.map((item) => (item.id === submission.id ? { ...item, status, updated_at: new Date().toISOString() } : item))
      }));
    } else {
      setSubmissions((current) => ({
        ...current,
        buyerRequests: current.buyerRequests.map((item) => (item.id === submission.id ? { ...item, status, updated_at: new Date().toISOString() } : item))
      }));
    }

    setSubmissionError("");
    setNotice(`${entityName} submission marked ${status}.`);
    void loadActivity();
  }

  async function convertSubmission(submission: ListingSubmissionRecord | BuyerRequestSubmissionRecord) {
    const entityName = submissionTab === "listing"
      ? (submission as ListingSubmissionRecord).product_name
      : (submission as BuyerRequestSubmissionRecord).product_needed;
    const response = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: submissionTab,
        submission
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setSubmissionError(result?.error ?? "Could not convert submission.");
      return;
    }

    if (submissionTab === "listing") {
      setSubmissions((current) => ({
        ...current,
        listings: current.listings.map((item) => (item.id === submission.id ? { ...item, status: "Converted", updated_at: new Date().toISOString() } : item))
      }));
      setRowsBySection((current) => ({
        ...current,
        marketplace: [
          {
            id: submission.id,
            name: entityName,
            type: (submission as ListingSubmissionRecord).category,
            region: (submission as ListingSubmissionRecord).region,
            status: "Active",
            dateAdded: new Date().toISOString().slice(0, 10),
            href: "/marketplace#marketplace-listings"
          },
          ...current.marketplace
        ]
      }));
    } else {
      setSubmissions((current) => ({
        ...current,
        buyerRequests: current.buyerRequests.map((item) => (item.id === submission.id ? { ...item, status: "Published", updated_at: new Date().toISOString() } : item))
      }));
      setRowsBySection((current) => ({
        ...current,
        "buyer-requests": [
          {
            id: submission.id,
            name: entityName,
            type: (submission as BuyerRequestSubmissionRecord).buyer_type,
            region: (submission as BuyerRequestSubmissionRecord).region,
            status: "Active",
            dateAdded: new Date().toISOString().slice(0, 10),
            href: "/buyer-requests"
          },
          ...current["buyer-requests"]
        ]
      }));
    }

    setSubmissionError("");
    setNotice(`${entityName} ${submissionTab === "listing" ? "converted to a live marketplace listing" : "published as a live buyer request"}.`);
    void loadActivity();
  }

  function updateManualLaunchStatus(label: ManualLaunchChecklistItem, status: LaunchStatus) {
    setManualLaunchStatuses((current) => {
      const next = { ...current, [label]: status };
      window.localStorage.setItem("ghana-growers-launch-checklist", JSON.stringify(next));
      return next;
    });
    setNotice(`${label} marked ${status}.`);
  }

  async function recordMatchActivity(action: "View" | "Contact" | "Close", opportunity: AdminMatchOpportunity) {
    const requestName = recordName(opportunity.request, "product_needed");

    await fetch("/api/admin/matches/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        matchId: opportunity.id,
        entityName: requestName
      })
    }).catch(() => null);

    if (action === "Close") {
      setClosedMatchIds((current) => Array.from(new Set([...current, opportunity.id])));
      setNotice(`${requestName} match opportunity marked closed.`);
    } else {
      setNotice(`${requestName} match opportunity ${action === "View" ? "viewed" : "contact recorded"}.`);
    }

    void loadActivity();
  }

  async function logoutAdmin() {
    await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-leaf-900/10 bg-leaf-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Internal Admin</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-ink sm:text-4xl">Ghana Growers Admin Dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Phase 1 dashboard for reviewing platform records, content, buyer demand, verifications, and operational leads.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-sm font-bold text-ink/60">Signed in as {currentAdmin.email}</p>
              <button
                type="button"
                onClick={logoutAdmin}
                className="rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink/65 transition hover:border-leaf-700 hover:text-leaf-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-8 lg:px-8 lg:py-8">
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
                {activityError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{activityError}</div>
                ) : null}
                {!activityError && activityRows.length === 0 ? (
                  <div className="rounded-md bg-leaf-50 p-4 text-sm font-semibold leading-6 text-ink/60">
                    No admin activity has been recorded yet.
                  </div>
                ) : null}
                {activityRows.map((activity) => {
                  const Icon = activityIcon(activity.entity_type);
                  const section = activitySection(activity.entity_type);

                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => runQuickAction(section, `${activity.action_type} activity opened.`)}
                      className="flex w-full items-start gap-3 py-3 text-left transition first:pt-0 last:pb-0 hover:text-leaf-800"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-ink">{activitySentence(activity)}</span>
                        <span className="mt-1 block text-sm leading-5 text-ink/60">
                          {activity.action_type} - {activity.entity_type} - {activity.admin_email} - {relativeActivityTime(activity.created_at)}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-xs font-black text-ink/45 sm:block">{relativeActivityTime(activity.created_at)}</span>
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
                  <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">{activeSectionLabel}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{notice}</p>
                </div>
                {!isAnalyticsSection && !isLaunchChecklistSection && !isFarmerImportSection && !isLeadQueueSection && !isFeaturedEnquiriesSection && !isApplicationsSection && !isSubmissionsSection && !isWhatsAppLeadsSection && !isMatchOpportunitiesSection ? (
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
                    onChange={(event) => setStatusFilter(event.target.value as "All" | ImportAdminStatus)}
                    className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Needs Follow-up">Needs Follow-up</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                  {activeSection === "farmers" ? (
                    <>
                      <select
                        value={farmerSourceFilter}
                        onChange={(event) => setFarmerSourceFilter(event.target.value as FarmerSourceFilter)}
                        className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                      >
                        <option value="All">All sources</option>
                        <option value="Tally Import">Tally Import</option>
                        <option value="Founding Farmer">Founding Farmers</option>
                        <option value="Manual/Test">Manual/Test</option>
                      </select>
                      <select
                        value={profileCompletenessFilter}
                        onChange={(event) => setProfileCompletenessFilter(event.target.value as ProfileCompletenessFilter)}
                        className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                      >
                        <option value="All">All completeness</option>
                        <option value="Ready to Publish">Ready to Publish</option>
                        <option value="Needs Follow-up">Needs Follow-up</option>
                        <option value="Incomplete">Incomplete</option>
                      </select>
                      <button
                        type="button"
                        onClick={archiveNonTallyFarmers}
                        className="rounded-md bg-white px-4 py-3 text-sm font-black text-tomato ring-1 ring-leaf-900/10 transition hover:ring-tomato/30"
                      >
                        Archive Manual/Test
                      </button>
                    </>
                  ) : null}
                  {activeSection === "marketplace" ? (
                    <select
                      value={marketplaceOwnerFilter}
                      onChange={(event) => setMarketplaceOwnerFilter(event.target.value as MarketplaceOwnerFilter)}
                      className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                    >
                      <option value="All">All owners</option>
                      <option value="Farmer">Farmer-owned</option>
                      <option value="Supplier">Supplier-owned</option>
                      <option value="Admin">Admin-owned</option>
                    </select>
                  ) : null}
                  {activeSection === "farmers" || activeSection === "suppliers" || activeSection === "marketplace" ? (
                    <select
                      value={featuredFilter}
                      onChange={(event) => setFeaturedFilter(event.target.value as FeaturedFilter)}
                      className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                    >
                      <option value="All">All featured states</option>
                      <option value="Featured">Featured</option>
                      <option value="Not Featured">Not Featured</option>
                      <option value="Expired Featured">Expired Featured</option>
                    </select>
                  ) : null}
                </div>
                ) : null}
              </div>
            </div>

            {isAnalyticsSection ? (
              <div className="grid gap-6 p-5">
                {analyticsError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{analyticsError}</div>
                ) : null}

                <section>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Platform Overview</p>
                      <h3 className="mt-2 text-2xl font-black text-ink">Growth, activity, and demand</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void loadAnalytics();
                        void loadWhatsAppLeads();
                      }}
                      className="rounded-md border border-leaf-900/10 bg-white px-4 py-2.5 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50"
                    >
                      Refresh Analytics
                    </button>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {analyticsCards.map((card) => {
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
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace Activity</p>
                    <h3 className="mt-2 text-xl font-black text-ink">Listings by category</h3>
                    <div className="mt-5">
                      <SimpleBarList items={listingsByCategory} emptyLabel="No marketplace listing data yet." />
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer Demand</p>
                    <h3 className="mt-2 text-xl font-black text-ink">Buyer requests by product</h3>
                    <div className="mt-5">
                      <SimpleBarList items={buyerRequestsByProduct} emptyLabel="No buyer request data yet." />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">WhatsApp Interest</p>
                    <h3 className="mt-2 text-xl font-black text-ink">Leads by source type</h3>
                    <div className="mt-5">
                      <SimpleBarList items={analyticsLeadSources} emptyLabel="No WhatsApp lead data yet." />
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Top Clicked Sources</p>
                    <div className="mt-5 grid gap-3">
                      {analyticsTopSources.map((item) => (
                        <div key={`${item.type}-${item.name}`} className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-ink">{item.name}</p>
                            <span className="rounded-full bg-earth-50 px-2.5 py-1 text-xs font-black text-earth-700">{item.value}</span>
                          </div>
                          <p className="mt-1 text-xs font-black uppercase tracking-wide text-ink/40">{sourceLabel(item.type as WhatsAppLeadRecord["source_type"])}</p>
                        </div>
                      ))}
                      {analyticsTopSources.length === 0 ? (
                        <p className="rounded-md bg-white p-4 text-sm font-semibold text-ink/58">Top clicked farmers, listings, and suppliers will appear after WhatsApp clicks are recorded.</p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Farmers by Region</p>
                    <div className="mt-5">
                      <SimpleBarList items={farmersByRegion} emptyLabel="No farmer region data yet." />
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Suppliers by Category</p>
                    <div className="mt-5">
                      <SimpleBarList items={suppliersByCategory} emptyLabel="No supplier category data yet." />
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Verification Status</p>
                    <div className="mt-5 grid gap-3">
                      <div className="rounded-md bg-leaf-50 p-4">
                        <p className="text-sm font-black text-ink">Farmers verified</p>
                        <p className="mt-2 text-2xl font-black text-leaf-700">{verifiedCount(analytics.farmers)} / {analytics.farmers.length}</p>
                      </div>
                      <div className="rounded-md bg-leaf-50 p-4">
                        <p className="text-sm font-black text-ink">Suppliers verified</p>
                        <p className="mt-2 text-2xl font-black text-leaf-700">{verifiedCount(analytics.suppliers)} / {analytics.suppliers.length}</p>
                      </div>
                      <div className="rounded-md bg-leaf-50 p-4">
                        <p className="text-sm font-black text-ink">Buyer requests active</p>
                        <p className="mt-2 text-2xl font-black text-leaf-700">{activeBuyerRequestCount(analytics.buyerRequests)} / {analytics.buyerRequests.length}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : isLaunchChecklistSection ? (
              <div className="grid gap-6 p-5">
                <section className="rounded-md border border-leaf-900/10 bg-white p-5">
                  <div className="grid gap-5 xl:grid-cols-[1fr_220px_320px] xl:items-stretch">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Launch Readiness</p>
                      <h3 className="mt-2 text-2xl font-black text-ink">Prepare Ghana Growers for onboarding</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                        Track the core content, operations, and platform checks needed before real farmers, buyers, and suppliers are invited onto the platform.
                      </p>
                    </div>
                    <div className="rounded-md bg-white p-4 text-center shadow-sm ring-1 ring-leaf-900/10">
                      <p className="text-sm font-black uppercase tracking-wide text-ink/45">Progress</p>
                      <p className="mt-2 text-4xl font-black text-leaf-700 sm:text-5xl">{launchProgress}%</p>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-leaf-900/10">
                        <div className="h-full rounded-full bg-leaf-700 transition-all" style={{ width: `${launchProgress}%` }} />
                      </div>
                    </div>
                    <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-leaf-900/10">
                      <p className="text-sm font-black uppercase tracking-wide text-ink/45">Launch Status</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${sitePrelaunchActive ? "bg-earth-50 text-earth-700" : "bg-leaf-50 text-leaf-700"}`}>
                          Pre-launch {sitePrelaunchActive ? "active" : "off"}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${isLaunchReady ? "bg-leaf-50 text-leaf-700" : "bg-tomato/10 text-tomato"}`}>
                          {isLaunchReady ? "Ready for launch" : "Not ready"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">
                        {isLaunchReady
                          ? "All checklist items are complete. Confirm Vercel configuration before going public."
                          : `${missingLaunchItems.length} item${missingLaunchItems.length === 1 ? "" : "s"} still need attention before launch.`}
                      </p>
                      {missingLaunchItems.length ? (
                        <ul className="mt-3 grid gap-1.5 text-sm font-semibold text-ink/62">
                          {missingLaunchItems.slice(0, 4).map((item) => (
                            <li key={item.id}>- {item.label}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm lg:grid-cols-[1fr_320px] lg:items-center">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Public Launch Control</p>
                    <h3 className="mt-2 text-xl font-black text-ink">Pre-launch Mode</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">
                      This dashboard cannot safely change Vercel environment variables. Use the status below to confirm the current build setting,
                      then update Vercel when the team is ready.
                    </p>
                    <p className="mt-3 rounded-md bg-leaf-50 p-3 text-sm font-bold leading-6 text-leaf-900">
                      Set <span className="font-black">SITE_PRELAUNCH=false</span> in Vercel to make the site public.
                    </p>
                  </div>
                  <div className="rounded-md bg-leaf-50 p-4 ring-1 ring-leaf-900/10">
                    <p className="text-xs font-black uppercase tracking-wide text-ink/45">Current setting</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-white p-1 ring-1 ring-leaf-900/10">
                      <span className={`rounded px-3 py-2 text-center text-sm font-black ${sitePrelaunchActive ? "bg-earth-600 text-white" : "text-ink/45"}`}>
                        ON
                      </span>
                      <span className={`rounded px-3 py-2 text-center text-sm font-black ${!sitePrelaunchActive ? "bg-leaf-700 text-white" : "text-ink/45"}`}>
                        OFF
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
                      {sitePrelaunchActive ? "Visitors see the Launching Soon page." : "The public website is accessible."}
                    </p>
                  </div>
                </section>

                <div className="grid gap-4">
                  {launchChecklistItems.map((item) => {
                    const isManual = manualLaunchChecklistItems.includes(item.label as ManualLaunchChecklistItem);

                    return (
                      <article key={item.id} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-lg font-black text-ink">{item.label}</h3>
                            <p className="mt-1 text-sm font-semibold text-ink/58">{item.detail}</p>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${launchStatusClass(item.status)}`}>
                              {item.status}
                            </span>
                            {isManual ? (
                              <select
                                value={item.status}
                                onChange={(event) => updateManualLaunchStatus(item.label as ManualLaunchChecklistItem, event.target.value as LaunchStatus)}
                                className="rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-sm font-black text-ink/70 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                              >
                                <option value="Incomplete">Incomplete</option>
                                <option value="Complete">Complete</option>
                              </select>
                            ) : item.section ? (
                              <button
                                type="button"
                                onClick={() => runQuickAction(item.section, `${item.label} opened from launch checklist.`)}
                                className="rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                              >
                                View Records
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <section className="rounded-md border border-earth-500/30 bg-earth-50 p-5">
                  <h3 className="text-lg font-black text-ink">Launch Notes</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    Record-count items update from platform data. Manual checks are saved in this admin browser for quick internal readiness tracking.
                    Before launch, review these checks with the Ghana Growers operations team and confirm the production domain, SSL, and Vercel pre-launch setting directly.
                  </p>
                </section>
              </div>
            ) : isFarmerImportSection ? (
              <div className="grid gap-6 p-5">
                <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                  <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Tally CSV Import</p>
                      <h3 className="mt-2 text-2xl font-black text-ink">Import farmer submissions for review</h3>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        Upload the Tally export CSV. Farmers are saved as Pending Review with verification Pending and source Tally Import.
                        They are not published publicly until approved or verified.
                      </p>
                    </div>
                    <form onSubmit={importTallyFarmers} className="rounded-md bg-white p-4 shadow-sm ring-1 ring-leaf-900/10">
                      <label className="grid gap-2 text-sm font-black text-ink">
                        Tally CSV file
                        <input
                          name="csv"
                          type="file"
                          accept=".csv,text/csv"
                          className="rounded-md border border-leaf-900/10 bg-white px-3 py-3 text-sm font-semibold text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-leaf-50 file:px-3 file:py-2 file:text-sm file:font-black file:text-leaf-800"
                        />
                      </label>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="submit"
                          name="mode"
                          value="preview"
                          disabled={isImportingFarmers}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          {isImportingFarmers ? "Reading..." : "Preview CSV"}
                        </button>
                        <button
                          type="submit"
                          name="mode"
                          value="import"
                          disabled={isImportingFarmers}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:bg-ink/25"
                        >
                          <UploadCloud className="h-4 w-4" aria-hidden="true" />
                          {isImportingFarmers ? "Importing..." : "Import Farmers"}
                        </button>
                      </div>
                    </form>
                  </div>
                </section>

                {farmerImportError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{farmerImportError}</div>
                ) : null}

                {farmerImportPreview ? (
                  <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Detected Headers</p>
                          <h3 className="mt-2 text-xl font-black text-ink">CSV columns found</h3>
                        </div>
                        {farmerImportPreview.totalRows ? (
                          <span className="w-fit rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                            {farmerImportPreview.totalRows} rows
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {farmerImportPreview.detectedHeaders.map((header, index) => (
                          <span key={`${header}-${index}`} className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-ink/60">
                            {header}
                          </span>
                        ))}
                      </div>
                      {farmerImportPreview.missingRequiredFields.length > 0 ? (
                        <p className="mt-4 rounded-md bg-tomato/10 p-3 text-sm font-black text-tomato">
                          Missing required mapping: {farmerImportPreview.missingRequiredFields.join(", ")}
                        </p>
                      ) : (
                        <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm font-black text-leaf-700">
                          Required columns were detected.
                        </p>
                      )}
                    </div>

                    <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Field Mapping</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {Object.entries(farmerImportPreview.fieldMappings).map(([field, mapping]) => (
                          <div key={field} className="rounded-md bg-leaf-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-ink/45">{mapping?.label ?? field}</p>
                            <p className={`mt-1 text-sm font-black ${mapping ? "text-ink" : "text-tomato"}`}>
                              {mapping?.detectedHeader ?? "No matching column"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-leaf-900/10 bg-white shadow-sm xl:col-span-2">
                      <div className="border-b border-leaf-900/10 p-5">
                        <p className="text-sm font-black uppercase tracking-wide text-earth-700">CSV Preview</p>
                        <h3 className="mt-2 text-xl font-black text-ink">First mapped rows before import</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                          <thead className="bg-leaf-50 text-xs font-black uppercase tracking-wide text-ink/50">
                            <tr>
                              <th className="px-5 py-4">Farmer Name</th>
                              <th className="px-5 py-4">Farm Name</th>
                              <th className="px-5 py-4">Phone</th>
                              <th className="px-5 py-4">Location</th>
                              <th className="px-5 py-4">Products</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-leaf-900/10">
                            {farmerImportPreview.previewRows.map((row, index) => (
                              <tr key={`${row.phone}-${index}`}>
                                <td className="px-5 py-4 font-black text-ink">{row.farmerName || "Not detected"}</td>
                                <td className="px-5 py-4 text-ink/65">{row.farmName || "Not detected"}</td>
                                <td className="px-5 py-4 text-ink/65">{row.phone || "Not detected"}</td>
                                <td className="px-5 py-4 text-ink/65">{row.location || "Not detected"}</td>
                                <td className="px-5 py-4 text-ink/65">{row.products || "Not detected"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                ) : null}

                {farmerImportReport ? (
                  <section className="grid gap-4 md:grid-cols-3">
                    {([
                      ["Imported", farmerImportReport.imported, "bg-leaf-50 text-leaf-700"],
                      ["Duplicates", farmerImportReport.duplicates, "bg-earth-50 text-earth-700"],
                      ["Errors", farmerImportReport.errors, "bg-tomato/10 text-tomato"]
                    ] as Array<[string, number, string]>).map(([label, value, className]) => (
                      <div key={label} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                        <p className="text-sm font-black uppercase tracking-wide text-ink/45">{label}</p>
                        <p className={`mt-3 w-fit rounded-md px-3 py-2 text-3xl font-black ${className}`}>{value}</p>
                      </div>
                    ))}
                  </section>
                ) : null}

                {farmerImportReport?.duplicateRows.length || farmerImportReport?.errorRows.length ? (
                  <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-black text-ink">Duplicate Phone Numbers</h3>
                      <div className="mt-4 grid gap-2">
                        {farmerImportReport.duplicateRows.slice(0, 10).map((item) => (
                          <p key={`${item.row}-${item.phone}`} className="rounded-md bg-earth-50 px-3 py-2 text-sm font-semibold text-earth-700">
                            Row {item.row}: {item.phone} - {item.reason}
                          </p>
                        ))}
                        {farmerImportReport.duplicateRows.length === 0 ? (
                          <p className="text-sm font-semibold text-ink/58">No duplicate phone numbers detected.</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-black text-ink">Import Errors</h3>
                      <div className="mt-4 grid gap-2">
                        {farmerImportReport.errorRows.slice(0, 10).map((item) => (
                          <p key={`${item.row}-${item.message}`} className="rounded-md bg-tomato/10 px-3 py-2 text-sm font-semibold text-tomato">
                            Row {item.row}: {item.message}
                          </p>
                        ))}
                        {farmerImportReport.errorRows.length === 0 ? (
                          <p className="text-sm font-semibold text-ink/58">No import errors found.</p>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="rounded-md border border-leaf-900/10 bg-white shadow-sm">
                  <div className="border-b border-leaf-900/10 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-ink">Imported Farmers</h3>
                        <p className="mt-1 text-sm font-semibold text-ink/58">{selectedImportedFarmerIds.length} selected for bulk action.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedImportedFarmerIds(importedFarmers.map((farmer) => farmer.id))}
                          className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedImportedFarmerIds([])}
                          className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => bulkUpdateImportedFarmers("approve")}
                          disabled={isUpdatingImportedFarmers || selectedImportedFarmerIds.length === 0}
                          className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => bulkUpdateImportedFarmers("founding")}
                          disabled={isUpdatingImportedFarmers || selectedImportedFarmerIds.length === 0}
                          className="rounded-md bg-earth-500 px-3 py-2 text-xs font-black text-ink transition hover:bg-earth-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Founding Farmer
                        </button>
                        <button
                          type="button"
                          onClick={() => bulkUpdateImportedFarmers("archive")}
                          disabled={isUpdatingImportedFarmers || selectedImportedFarmerIds.length === 0}
                          className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-tomato disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                      <thead className="bg-leaf-50 text-xs font-black uppercase tracking-wide text-ink/50">
                        <tr>
                          <th className="px-5 py-4">Select</th>
                          <th className="px-5 py-4">Farmer/Farm</th>
                          <th className="px-5 py-4">Phone</th>
                          <th className="px-5 py-4">Location</th>
                          <th className="px-5 py-4">Products</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Source</th>
                          <th className="px-5 py-4">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-leaf-900/10">
                        {importedFarmers.map((farmer) => {
                          const completeness = farmerCompleteness(farmer);

                          return (
                          <tr key={farmer.id} className="align-top">
                            <td className="px-5 py-4">
                              <input
                                type="checkbox"
                                checked={selectedImportedFarmerIds.includes(farmer.id)}
                                onChange={(event) => {
                                  setSelectedImportedFarmerIds((current) =>
                                    event.target.checked ? [...current, farmer.id] : current.filter((id) => id !== farmer.id)
                                  );
                                }}
                                className="h-4 w-4 rounded border-leaf-900/20 text-leaf-700"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-black text-ink">{farmer.farm_name}</p>
                              <p className="mt-1 text-xs font-semibold text-ink/50">{farmer.farmer_name}</p>
                              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${completenessBadgeClasses(completeness.tone)}`}>
                                {completeness.percent}% {completeness.status === "Ready to Publish" ? "Ready" : completeness.status === "Needs Follow-up" ? "Follow-up" : "Incomplete"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-ink/65">{farmer.whatsapp_number}</td>
                            <td className="px-5 py-4 text-ink/65">{farmer.district}, {farmer.region}</td>
                            <td className="px-5 py-4 text-ink/65">{farmer.products.join(", ") || "Not provided"}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${importStatusStyles[farmer.status]}`}>
                                {farmer.status}
                              </span>
                              <p className="mt-2 text-xs font-semibold text-ink/45">Verification: {farmer.verification_status}</p>
                            </td>
                            <td className="px-5 py-4 text-ink/65">{farmer.source}</td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => void openImportedFarmerReview(farmer)}
                                className="inline-flex items-center gap-2 rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800"
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                View
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {importedFarmers.length === 0 ? (
                    <p className="p-6 text-sm font-semibold text-ink/60">Upload a Tally CSV to preview imported farmers here.</p>
                  ) : null}
                </section>
              </div>
            ) : isApplicationsSection ? (
              <div className="grid gap-5 p-5">
                {applicationError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{applicationError}</div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {([
                    ["farmer", "Farmer Applications"],
                    ["buyer", "Buyer Applications"],
                    ["supplier", "Supplier Applications"]
                  ] as Array<[ApplicationKind, string]>).map(([kind, label]) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setApplicationTab(kind)}
                      className={`rounded-md px-4 py-2.5 text-sm font-black transition ${
                        applicationTab === kind ? "bg-leaf-700 text-white" : "bg-leaf-50 text-leaf-800 hover:bg-white"
                      }`}
                    >
                      {label} ({applications[kind].filter((application) => application.status === "New").length})
                    </button>
                  ))}
                </div>
                <div className="grid gap-4">
                  {applications[applicationTab].map((application) => (
                    <article key={application.id} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">{application.user_type} Application</p>
                          <h3 className="mt-1 text-2xl font-black text-ink">{application.business_or_farm_name || application.name}</h3>
                          <p className="mt-2 text-sm font-semibold text-ink/60">{application.name} - {application.email} - {application.whatsapp_number}</p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${applicationStatusClass(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-md bg-leaf-50 p-3">
                          <dt className="font-black text-ink">Phone</dt>
                          <dd className="mt-1 text-ink/65">{application.phone}</dd>
                        </div>
                        <div className="rounded-md bg-leaf-50 p-3">
                          <dt className="font-black text-ink">Location</dt>
                          <dd className="mt-1 text-ink/65">{[application.district, application.region].filter(Boolean).join(", ") || "Not provided"}</dd>
                        </div>
                        <div className="rounded-md bg-leaf-50 p-3 md:col-span-2">
                          <dt className="font-black text-ink">Products / Services</dt>
                          <dd className="mt-1 text-ink/65">{application.products_or_services || "Not provided"}</dd>
                        </div>
                      </dl>
                      {application.notes ? (
                        <p className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-ink/65 ring-1 ring-leaf-900/10">{application.notes}</p>
                      ) : null}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => updateApplication(application, "Under Review")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800">
                          Mark Under Review
                        </button>
                        <button type="button" onClick={() => updateApplication(application, "Approved")} className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white">
                          Approve
                        </button>
                        <button type="button" onClick={() => updateApplication(application, "Rejected")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-tomato">
                          Reject
                        </button>
                        <button type="button" onClick={() => updateApplication(application, "Converted")} className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800">
                          Convert
                        </button>
                      </div>
                    </article>
                  ))}
                  {applications[applicationTab].length === 0 ? (
                    <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No applications in this queue yet.</p>
                  ) : null}
                </div>
              </div>
            ) : isSubmissionsSection ? (
              <div className="grid gap-5 p-5">
                {submissionError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{submissionError}</div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {([
                    ["listing", "Listing Submissions", submissions.listings.filter((submission) => submission.status === "New").length],
                    ["buyer-request", "Buyer Request Applications", submissions.buyerRequests.filter((submission) => submission.status === "New").length]
                  ] as Array<[SubmissionKind, string, number]>).map(([kind, label, count]) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setSubmissionTab(kind)}
                      className={`rounded-md px-4 py-2.5 text-sm font-black transition ${
                        submissionTab === kind ? "bg-leaf-700 text-white" : "bg-leaf-50 text-leaf-800 hover:bg-white"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>

                {submissionTab === "listing" ? (
                  <div className="grid gap-4">
                    {submissions.listings.map((submission) => (
                      <article key={submission.id} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                        <div className="grid gap-5 lg:grid-cols-[160px_1fr]">
                          <div className="aspect-[4/3] overflow-hidden rounded-md bg-leaf-50 ring-1 ring-leaf-900/10">
                            {submission.image_url ? (
                              <div
                                role="img"
                                aria-label={`${submission.product_name} submitted listing`}
                                className="h-full w-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${submission.image_url})` }}
                              />
                            ) : (
                              <div className="grid h-full place-items-center px-4 text-center text-xs font-black uppercase tracking-wide text-ink/35">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-xs font-black uppercase tracking-wide text-earth-700">Listing Submission</p>
                                <h3 className="mt-1 text-2xl font-black text-ink">{submission.product_name}</h3>
                                <p className="mt-2 text-sm font-semibold text-ink/60">
                                  {submission.quantity} {submission.unit} - {submission.category} - {submission.district}, {submission.region}
                                </p>
                              </div>
                              <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${applicationStatusClass(submission.status)}`}>
                                {submission.status}
                              </span>
                            </div>
                            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-md bg-leaf-50 p-3">
                                <dt className="font-black text-ink">Seller</dt>
                                <dd className="mt-1 text-ink/65">{submission.seller_name}</dd>
                              </div>
                              <div className="rounded-md bg-leaf-50 p-3">
                                <dt className="font-black text-ink">Seller Type</dt>
                                <dd className="mt-1 text-ink/65">{submission.seller_type}</dd>
                              </div>
                              <div className="rounded-md bg-leaf-50 p-3">
                                <dt className="font-black text-ink">WhatsApp</dt>
                                <dd className="mt-1 text-ink/65">{submission.whatsapp_number}</dd>
                              </div>
                              <div className="rounded-md bg-leaf-50 p-3">
                                <dt className="font-black text-ink">Submitted</dt>
                                <dd className="mt-1 text-ink/65">{new Date(submission.created_at).toLocaleDateString()}</dd>
                              </div>
                            </dl>
                            <p className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-ink/65 ring-1 ring-leaf-900/10">{submission.description}</p>
                            <div className="mt-5 flex flex-wrap gap-2">
                              <button type="button" onClick={() => setNotice(`Viewing listing submission: ${submission.product_name}.`)} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800">
                                View
                              </button>
                              <button type="button" onClick={() => updateSubmissionStatus(submission, "Under Review")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800">
                                Mark Under Review
                              </button>
                              <button type="button" onClick={() => updateSubmissionStatus(submission, "Approved")} className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white">
                                Approve
                              </button>
                              <button type="button" onClick={() => updateSubmissionStatus(submission, "Rejected")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-tomato">
                                Reject
                              </button>
                              <button type="button" onClick={() => convertSubmission(submission)} className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800">
                                Convert to Live Listing
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                    {submissions.listings.length === 0 ? (
                      <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No listing submissions in this queue yet.</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {submissions.buyerRequests.map((submission) => {
                      const matches = buyerApplicationMatchSummary(submission, analytics);

                      return (
                        <article key={submission.id} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Buyer Request Application</p>
                              <h3 className="mt-1 text-2xl font-black text-ink">{submission.product_needed}</h3>
                              <p className="mt-2 text-sm font-semibold text-ink/60">
                                {submission.quantity} - {submission.district}, {submission.region} - Deadline {submission.deadline}
                              </p>
                            </div>
                            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${applicationStatusClass(submission.status)}`}>
                              {submission.status}
                            </span>
                          </div>
                          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-md bg-leaf-50 p-3">
                              <dt className="font-black text-ink">Buyer</dt>
                              <dd className="mt-1 text-ink/65">{submission.buyer_name}</dd>
                            </div>
                            <div className="rounded-md bg-leaf-50 p-3">
                              <dt className="font-black text-ink">Company</dt>
                              <dd className="mt-1 text-ink/65">{submission.company_name || "Not provided"}</dd>
                            </div>
                            <div className="rounded-md bg-leaf-50 p-3">
                              <dt className="font-black text-ink">Phone / WhatsApp</dt>
                              <dd className="mt-1 text-ink/65">{submission.phone_number} / {submission.whatsapp_number}</dd>
                            </div>
                            <div className="rounded-md bg-leaf-50 p-3">
                              <dt className="font-black text-ink">Preferred Delivery</dt>
                              <dd className="mt-1 text-ink/65">{submission.preferred_delivery || "To be confirmed"}</dd>
                            </div>
                            <div className="rounded-md bg-leaf-50 p-3">
                              <dt className="font-black text-ink">Submitted</dt>
                              <dd className="mt-1 text-ink/65">{new Date(submission.created_at).toLocaleDateString()}</dd>
                            </div>
                          </dl>
                          {submission.notes ? (
                            <p className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-ink/65 ring-1 ring-leaf-900/10">{submission.notes}</p>
                          ) : null}
                          {(submission.status === "Approved" || submission.status === "Published") ? (
                            <div className="mt-4 rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Potential Matches</p>
                              <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <MatchPreview title="Farmers" records={matches.farmers} nameKeys={["farm_name", "farmer_name"]} />
                                <MatchPreview title="Listings" records={matches.listings} nameKeys={["product_name"]} />
                                <MatchPreview title="Suppliers" records={matches.suppliers} nameKeys={["company_name", "category"]} />
                              </div>
                            </div>
                          ) : null}
                          <div className="mt-5 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setNotice(`Viewing buyer request application: ${submission.product_needed}.`)} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800">
                              View
                            </button>
                            <button type="button" onClick={() => updateSubmissionStatus(submission, "Under Review")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800">
                              Mark Under Review
                            </button>
                            <button type="button" onClick={() => updateSubmissionStatus(submission, "Approved")} className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white">
                              Approve
                            </button>
                            <button type="button" onClick={() => updateSubmissionStatus(submission, "Rejected")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-tomato">
                              Reject
                            </button>
                            <button type="button" onClick={() => convertSubmission(submission)} className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800">
                              Publish Buyer Request
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    {submissions.buyerRequests.length === 0 ? (
                      <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No buyer request applications in this queue yet.</p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : isLeadQueueSection ? (
              <div className="grid gap-6 p-5">
                {leadRequestError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{leadRequestError}</div>
                ) : null}

                <section className="rounded-md border border-leaf-900/10 bg-white p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Lead Pipeline</p>
                      <h2 className="mt-2 text-2xl font-black text-ink">Manage buyer connection requests</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                        Track each request from new lead through contact, negotiation, completion, or loss.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void loadLeadRequests();
                        void loadAnalytics();
                      }}
                      className="rounded-md border border-leaf-900/10 bg-white px-4 py-2.5 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50"
                    >
                      Refresh Leads
                    </button>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {leadMetricCards.map((card) => {
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
                </section>

                <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Conversion Funnel</p>
                    <div className="mt-5 grid gap-3">
                      {leadFunnelStatuses.map((status, index) => {
                        const value = leadStatusCount(leadRequests, status);
                        const maxValue = Math.max(...leadFunnelStatuses.map((item) => leadStatusCount(leadRequests, item)), 1);

                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-black text-ink">{index + 1}. {status}</span>
                              <span className="font-black text-leaf-700">{value}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf-50">
                              <div className="h-full rounded-full bg-leaf-600" style={{ width: `${Math.max(8, (value / maxValue) * 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Most Requested Products</p>
                    <div className="mt-5">
                      <SimpleBarList items={mostRequestedProducts} emptyLabel="No product requests have been captured yet." />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Top Farmers by Leads</p>
                    <div className="mt-5">
                      <SimpleBarList items={topFarmersByLeads} emptyLabel="No farmer lead data yet." />
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Top Suppliers by Leads</p>
                    <div className="mt-5">
                      <SimpleBarList items={topSuppliersByLeads} emptyLabel="No supplier lead data yet." />
                    </div>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Most Requested Listings</p>
                    <div className="mt-5">
                      <SimpleBarList items={mostRequestedListings} emptyLabel="No listing lead data yet." />
                    </div>
                  </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Leads</p>
                        <h3 className="mt-2 text-xl font-black text-ink">Connection pipeline</h3>
                      </div>
                      <p className="rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-leaf-800">{leadRequests.length} total</p>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {leadRequests.slice(0, 100).map((lead) => {
                        const status = normalizeLeadStatus(lead.status);
                        const isSelected = selectedLead?.id === lead.id;

                        return (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setNotice(`Viewing lead from ${lead.requester_name}.`);
                            }}
                            className={`rounded-md border p-4 text-left transition ${
                              isSelected ? "border-leaf-700 bg-leaf-50" : "border-leaf-900/10 bg-white hover:border-leaf-700 hover:bg-leaf-50"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="font-black text-ink">{lead.requester_name}</h4>
                                <p className="mt-1 text-sm font-semibold text-ink/60">{lead.product_interest}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${leadStatusClass(status)}`}>{status}</span>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <p className="font-semibold text-ink/58">Source: {lead.source_name}</p>
                              <p className="font-semibold text-ink/58">Date: {relativeActivityTime(lead.created_at)}</p>
                            </div>
                          </button>
                        );
                      })}
                      {leadRequests.length === 0 && !leadRequestError ? (
                        <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No connection requests have been submitted yet.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    {selectedLead ? (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Lead Detail</p>
                            <h3 className="mt-2 text-2xl font-black text-ink">{selectedLead.requester_name}</h3>
                            <p className="mt-1 text-sm font-semibold text-ink/58">{relativeActivityTime(selectedLead.created_at)}</p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${leadStatusClass(normalizeLeadStatus(selectedLead.status))}`}>
                            {normalizeLeadStatus(selectedLead.status)}
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                          <LeadDetailItem label="Phone" value={selectedLead.phone} />
                          <LeadDetailItem label="WhatsApp" value={selectedLead.whatsapp} />
                          <LeadDetailItem label="Location" value={selectedLead.location} />
                          <LeadDetailItem label="Quantity" value={selectedLead.quantity_needed ?? "Not specified"} />
                          <LeadDetailItem label="Product / Service" value={selectedLead.product_interest} />
                          <LeadDetailItem label="Source Type" value={selectedLead.source_type} />
                          <LeadDetailItem label="Assigned Farmer / Supplier" value={selectedLead.source_name} />
                          <LeadDetailItem label="Source Page" value={selectedLead.source_page ?? "Not captured"} />
                        </dl>

                        <div className="mt-5 rounded-md bg-leaf-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Message</p>
                          <p className="mt-2 text-sm leading-6 text-ink/68">{selectedLead.message || "No message was provided with this lead."}</p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Contacted")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-700 hover:text-white">
                            Mark Contacted
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Negotiating")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-earth-700 ring-1 ring-earth-500/20 transition hover:bg-earth-50">
                            Mark Negotiating
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Completed")} className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800">
                            Mark Completed
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Lost")} className="rounded-md bg-ink/10 px-3 py-2 text-xs font-black text-ink/65 transition hover:bg-ink hover:text-white">
                            Mark Lost
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">Select a lead to view buyer details and pipeline actions.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : isFeaturedEnquiriesSection ? (
              <div className="grid gap-6 p-5">
                {featuredEnquiryError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{featuredEnquiryError}</div>
                ) : null}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {(["New", "Contacted", "Approved", "Rejected", "Closed"] as FeaturedEnquiryStatus[]).map((status) => (
                    <div key={status} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
                      <p className="text-sm font-black text-ink/60">{status}</p>
                      <p className="mt-3 text-3xl font-black text-ink">{featuredEnquiries.filter((enquiry) => enquiry.status === status).length}</p>
                    </div>
                  ))}
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Featured Enquiries</p>
                        <h3 className="mt-2 text-xl font-black text-ink">Visibility interest queue</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadFeaturedEnquiries()}
                        className="rounded-md border border-leaf-900/10 bg-white px-4 py-2.5 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {featuredEnquiries.map((enquiry) => {
                        const isSelected = selectedFeaturedEnquiry?.id === enquiry.id;

                        return (
                          <button
                            key={enquiry.id}
                            type="button"
                            onClick={() => {
                              setSelectedFeaturedEnquiryId(enquiry.id);
                              setNotice(`Viewing featured enquiry from ${enquiry.name}.`);
                            }}
                            className={`rounded-md border p-4 text-left transition ${
                              isSelected ? "border-leaf-700 bg-leaf-50" : "border-leaf-900/10 bg-white hover:border-leaf-700 hover:bg-leaf-50"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="font-black text-ink">{enquiry.name}</h4>
                                <p className="mt-1 text-sm font-semibold text-ink/60">{enquiry.feature_request}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${featuredEnquiryStatusClass(enquiry.status)}`}>{enquiry.status}</span>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <p className="font-semibold text-ink/58">Role: {enquiry.role}</p>
                              <p className="font-semibold text-ink/58">Date: {relativeActivityTime(enquiry.created_at)}</p>
                            </div>
                          </button>
                        );
                      })}
                      {featuredEnquiries.length === 0 && !featuredEnquiryError ? (
                        <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">No featured placement enquiries have been submitted yet.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
                    {selectedFeaturedEnquiry ? (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Enquiry Detail</p>
                            <h3 className="mt-2 text-2xl font-black text-ink">{selectedFeaturedEnquiry.name}</h3>
                            <p className="mt-1 text-sm font-semibold text-ink/58">{relativeActivityTime(selectedFeaturedEnquiry.created_at)}</p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${featuredEnquiryStatusClass(selectedFeaturedEnquiry.status)}`}>
                            {selectedFeaturedEnquiry.status}
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                          <LeadDetailItem label="Phone" value={selectedFeaturedEnquiry.phone} />
                          <LeadDetailItem label="WhatsApp" value={selectedFeaturedEnquiry.whatsapp} />
                          <LeadDetailItem label="Email" value={selectedFeaturedEnquiry.email ?? "Not provided"} />
                          <LeadDetailItem label="Role" value={selectedFeaturedEnquiry.role} />
                          <LeadDetailItem label="Profile / Listing" value={selectedFeaturedEnquiry.profile_or_listing_name} />
                          <LeadDetailItem label="Request" value={selectedFeaturedEnquiry.feature_request} />
                        </dl>

                        <div className="mt-5 rounded-md bg-leaf-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Message</p>
                          <p className="mt-2 text-sm leading-6 text-ink/68">{selectedFeaturedEnquiry.message || "No additional message was provided."}</p>
                        </div>

                        <div className="mt-5 rounded-md border border-leaf-900/10 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">WhatsApp follow-up</p>
                          <p className="mt-2 text-sm leading-6 text-ink/68">{featuredFollowUpMessage(selectedFeaturedEnquiry)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(featuredFollowUpMessage(selectedFeaturedEnquiry));
                                setNotice("Featured placement follow-up message copied.");
                              }}
                              className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                            >
                              Copy Message
                            </button>
                            <a
                              href={whatsappUrl(selectedFeaturedEnquiry.whatsapp, featuredFollowUpMessage(selectedFeaturedEnquiry))}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800"
                            >
                              Open WhatsApp
                            </a>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Contacted")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-700 hover:text-white">
                            Mark Contacted
                          </button>
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Approved")} className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800">
                            Approve
                          </button>
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Rejected")} className="rounded-md bg-white px-3 py-2 text-xs font-black text-tomato ring-1 ring-tomato/20 transition hover:bg-tomato/10">
                            Reject
                          </button>
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Closed")} className="rounded-md bg-ink/10 px-3 py-2 text-xs font-black text-ink/65 transition hover:bg-ink hover:text-white">
                            Close
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">Select an enquiry to view details and follow-up actions.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : isWhatsAppLeadsSection ? (
              <div className="grid gap-6 p-5">
                {whatsappLeadError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{whatsappLeadError}</div>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Total Clicks</p>
                    <p className="mt-3 text-4xl font-black text-ink">{whatsappLeads.length}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/58">Recent tracked WhatsApp contact clicks.</p>
                  </div>
                  <div className="rounded-md border border-leaf-900/10 bg-white p-4 lg:col-span-2">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Leads by Source Type</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {leadSourceTotals.length > 0 ? leadSourceTotals.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-leaf-50 px-3 py-2">
                          <span className="text-sm font-black text-ink">{sourceLabel(item.label as WhatsAppLeadRecord["source_type"])}</span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-leaf-700">{item.value}</span>
                        </div>
                      )) : (
                        <p className="text-sm font-semibold text-ink/58">No lead source data yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <section className="rounded-md border border-leaf-900/10 bg-white p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Latest Leads</p>
                    <div className="mt-4 divide-y divide-leaf-900/10">
                      {whatsappLeads.slice(0, 25).map((lead) => (
                        <div key={lead.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-start">
                          <div>
                            <p className="text-sm font-black text-ink">{lead.source_name}</p>
                            <p className="mt-1 text-sm leading-5 text-ink/60">
                              {sourceLabel(lead.source_type)} - {lead.phone_number} - {lead.page_path}
                            </p>
                          </div>
                          <p className="text-xs font-black text-ink/45">{relativeActivityTime(lead.created_at)}</p>
                        </div>
                      ))}
                      {whatsappLeads.length === 0 && !whatsappLeadError ? (
                        <p className="rounded-md bg-leaf-50 p-4 text-sm font-semibold text-ink/58">No WhatsApp leads have been recorded yet.</p>
                      ) : null}
                    </div>
                  </section>

                  <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Top Clicked Sources</p>
                    <div className="mt-4 grid gap-3">
                      {topLeadSources.map((item) => (
                        <div key={`${item.type}-${item.name}`} className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-ink">{item.name}</p>
                            <span className="rounded-full bg-earth-50 px-2.5 py-1 text-xs font-black text-earth-700">{item.value}</span>
                          </div>
                          <p className="mt-1 text-xs font-black uppercase tracking-wide text-ink/40">{sourceLabel(item.type as WhatsAppLeadRecord["source_type"])}</p>
                        </div>
                      ))}
                      {topLeadSources.length === 0 ? (
                        <p className="rounded-md bg-white p-4 text-sm font-semibold text-ink/58">Top clicked sources will appear after users contact farmers, suppliers, listings, or buyers on WhatsApp.</p>
                      ) : null}
                    </div>
                  </section>
                </div>
              </div>
            ) : isMatchOpportunitiesSection ? (
              <div className="grid gap-6 p-5">
                <section className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Total Matches", value: totalMatches },
                    { label: "Open Matches", value: openMatches },
                    { label: "Closed Matches", value: closedMatches }
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">{metric.label}</p>
                      <p className="mt-3 text-4xl font-black text-ink">{metric.value}</p>
                    </div>
                  ))}
                </section>

                <section className="rounded-md border border-leaf-900/10 bg-white p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Match Opportunities</p>
                      <h3 className="mt-2 text-2xl font-black text-ink">Buyer requests with likely supply matches</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadAnalytics()}
                      className="rounded-md border border-leaf-900/10 bg-white px-4 py-2.5 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50"
                    >
                      Refresh Matches
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {matchOpportunities.map((opportunity) => {
                      const requestName = recordName(opportunity.request, "product_needed");
                      const requestRegion = textValue(opportunity.request, "region") || "Ghana";
                      const requestDistrict = textValue(opportunity.request, "district");
                      const buyerPhone = textValue(opportunity.request, "whatsapp_number");
                      const isClosed = closedMatchIdSet.has(opportunity.id);

                      return (
                        <article key={opportunity.id} className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-xl font-black text-ink">{requestName}</h4>
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${isClosed ? "bg-ink/10 text-ink/55" : "bg-leaf-100 text-leaf-700"}`}>
                                  {isClosed ? "Closed" : "Open"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-ink/60">
                                {requestDistrict ? `${requestDistrict}, ` : ""}{requestRegion} - {recordName(opportunity.request, "buyer_name", "buyer_type")}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void recordMatchActivity("View", opportunity)}
                                className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                View
                              </button>
                              <a
                                href={whatsappUrl(buyerPhone, `Hello, I am following up on your Ghana Growers buyer request for ${requestName}.`)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => void recordMatchActivity("Contact", opportunity)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Contact Buyer
                              </a>
                              <button
                                type="button"
                                onClick={() => void recordMatchActivity("Close", opportunity)}
                                disabled={isClosed}
                                className="rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:bg-ink/25"
                              >
                                Close Match
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Matching Farmers ({opportunity.farmers.length})</p>
                              <div className="mt-3 grid gap-3">
                                {opportunity.farmers.map((farmer) => {
                                  const farmerName = recordName(farmer, "farm_name", "farmer_name");
                                  const farmerPhone = textValue(farmer, "whatsapp_number");

                                  return (
                                    <div key={textValue(farmer, "id") || farmerName} className="flex flex-col gap-3 rounded-md bg-leaf-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="font-black text-ink">{farmerName}</p>
                                        <p className="mt-1 text-sm text-ink/58">{textValue(farmer, "district")}, {textValue(farmer, "region")}</p>
                                      </div>
                                      <a
                                        href={whatsappUrl(farmerPhone, `Hello, Ghana Growers has a buyer request for ${requestName} that may match your farm products.`)}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => void recordMatchActivity("Contact", opportunity)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        Contact Farmer
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Matching Listings ({opportunity.listings.length})</p>
                              <div className="mt-3 grid gap-3">
                                {opportunity.listings.map((listing) => (
                                  <div key={textValue(listing, "id") || recordName(listing, "product_name")} className="rounded-md bg-leaf-50 p-3">
                                    <p className="font-black text-ink">{recordName(listing, "product_name")}</p>
                                    <p className="mt-1 text-sm text-ink/58">{recordName(listing, "seller_name")} - {textValue(listing, "district")}, {textValue(listing, "region")}</p>
                                    <p className="mt-1 text-xs font-black uppercase tracking-wide text-leaf-700">{recordName(listing, "category")}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                    {matchOpportunities.length === 0 ? (
                      <p className="rounded-md bg-leaf-50 p-5 text-sm font-semibold text-ink/58">
                        No match opportunities found yet. Add buyer requests, farmers, and listings with matching products or regions.
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : (
            <>
            {activeSection === "farmers" && selectedFarmerRowIds.length > 0 ? (
              <div className="border-b border-leaf-900/10 bg-leaf-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm font-black text-ink">
                    {selectedFarmerRowIds.length} farmer{selectedFarmerRowIds.length === 1 ? "" : "s"} selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["active", "pending-review", "under-review", "founding", "archive"] as FarmerBulkAction[]).map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => setPendingFarmerBulkAction(action)}
                        className={`rounded-md px-3 py-2 text-xs font-black ring-1 ring-leaf-900/10 transition ${
                          action === "archive"
                            ? "bg-white text-tomato hover:ring-tomato/30"
                            : action === "verified" || action === "founding"
                              ? "bg-leaf-700 text-white hover:bg-leaf-800"
                              : "bg-white text-ink/65 hover:text-leaf-800"
                        }`}
                      >
                        {farmerBulkActionLabels[action]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedFarmerRowIds([])}
                      className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {activeSection === "farmers" ? (
              <div className="border-b border-leaf-900/10 bg-white px-5 py-4">
                <p className="text-xs font-bold text-ink/55">
                  Use Review beside the farmer name to open the full Tally application. Scroll sideways only for secondary actions.
                </p>
                <div className="mt-4 rounded-md border border-leaf-900/10 bg-leaf-50/70 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-leaf-700">Supabase Farmer Diagnostics</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
                        Admin Farmers now loads from Supabase first. Demo rows are hidden in production when Supabase is unavailable.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadAdminFarmers()}
                      className="rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-100"
                    >
                      Refresh Farmers
                    </button>
                  </div>
                  {farmerLoadError ? (
                    <p className="mt-3 rounded-md bg-earth-50 px-3 py-2 text-xs font-black text-earth-700">{farmerLoadError}</p>
                  ) : null}
                  {farmerDiagnostics?.migrationWarning ? (
                    <p className="mt-3 rounded-md bg-earth-50 px-3 py-2 text-xs font-black text-earth-700">{farmerDiagnostics.migrationWarning}</p>
                  ) : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {[
                      ["Total Supabase farmers", farmerDiagnostics?.totalSupabaseFarmers ?? rowsBySection.farmers.length],
                      ["Tally Import farmers", farmerDiagnostics?.tallyImportFarmers ?? 0],
                      ["Manual/Test farmers", farmerDiagnostics?.manualTestFarmers ?? 0],
                      ["Active farmers", farmerDiagnostics?.activeFarmers ?? rowsBySection.farmers.filter((row) => row.status === "Active").length],
                      ["Pending Review", farmerDiagnostics?.pendingReviewFarmers ?? rowsBySection.farmers.filter((row) => row.status === "Pending Review").length],
                      ["Archived farmers", farmerDiagnostics?.archivedFarmers ?? rowsBySection.farmers.filter((row) => row.status === "Archived").length]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                        <p className="text-[11px] font-black uppercase tracking-wide text-ink/45">{label}</p>
                        <p className="mt-2 text-2xl font-black text-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                  {farmerDiagnostics?.sourceValues.length ? (
                    <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
                      Source values found: {farmerDiagnostics.sourceValues.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                <thead className="bg-leaf-50 text-xs font-black uppercase tracking-wide text-ink/50">
                  <tr>
                    {activeSection === "farmers" ? (
                      <th className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={allVisibleFarmersSelected}
                          disabled={visibleFarmerRowIds.length === 0}
                          onChange={(event) => toggleVisibleFarmerSelection(event.target.checked)}
                          aria-label="Select all visible farmers"
                          className="h-4 w-4 rounded border-leaf-900/20 text-leaf-700"
                        />
                      </th>
                    ) : null}
                    {activeSection === "farmers" ? <th className="px-5 py-4">Review</th> : null}
                    <th className="px-5 py-4">Name/title</th>
                    <th className="px-5 py-4">Type/category</th>
                    {activeSection === "farmers" ? <th className="px-5 py-4">Phone</th> : null}
                    {activeSection === "farmers" ? <th className="px-5 py-4">Products</th> : null}
                    <th className="px-5 py-4">Region</th>
                    {activeSection === "marketplace" ? <th className="px-5 py-4">Owner Type</th> : null}
                    {activeSection === "marketplace" ? <th className="px-5 py-4">Owner Name</th> : null}
                    {activeSection === "farmers" ? <th className="px-5 py-4">Source</th> : null}
                    {activeSection === "farmers" || activeSection === "suppliers" || activeSection === "marketplace" ? <th className="px-5 py-4">Featured</th> : null}
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date added</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-leaf-900/10">
                  {filteredRows.map((row) => {
                    const isExpandedFarmerRow = expandedFarmerRowIds.includes(row.id);
                    const normalizedRowSource = normalizedFarmerSource(row.source);
                    const isTallyFarmerRow = activeSection === "farmers" && normalizedRowSource === "Tally Import";
                    const farmerRowSource = normalizedRowSource === "Tally Import" || normalizedRowSource === "Founding Farmer" ? normalizedRowSource : "Manual/Test";

                    return (
                    <Fragment key={row.id}>
                    <tr className="align-top">
                      {activeSection === "farmers" ? (
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedFarmerRowIds.includes(row.id)}
                            onChange={(event) => toggleFarmerSelection(row.id, event.target.checked)}
                            aria-label={`Select ${row.name}`}
                            className="h-4 w-4 rounded border-leaf-900/20 text-leaf-700"
                          />
                        </td>
                      ) : null}
                      {activeSection === "farmers" ? (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpandedFarmerRow(row.id)}
                              aria-label={`${isExpandedFarmerRow ? "Collapse" : "Expand"} ${row.name}`}
                              aria-expanded={isExpandedFarmerRow}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-ink/60 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                            >
                              <ChevronDown className={`h-4 w-4 transition ${isExpandedFarmerRow ? "rotate-180" : ""}`} />
                            </button>
                            {isTallyFarmerRow ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  void openImportedFarmerReviewById(row.id, row);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-leaf-800"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Review
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-ink/35">-</span>
                            )}
                          </div>
                        </td>
                      ) : null}
                      <td className="px-5 py-4">
                        <p className="font-black text-ink">{row.name}</p>
                        {activeSection === "farmers" && typeof row.completenessPercent === "number" ? (
                          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${completenessBadgeClasses(row.completenessTone ?? "incomplete")}`}>
                            {row.completenessPercent}% {row.completenessStatus === "Ready to Publish" ? "Ready" : row.completenessStatus === "Needs Follow-up" ? "Follow-up" : "Incomplete"}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-ink/65">{row.type}</td>
                      {activeSection === "farmers" ? <td className="px-5 py-4 text-ink/65">{row.phone || "Not provided"}</td> : null}
                      {activeSection === "farmers" ? <td className="px-5 py-4 text-ink/65">{row.products || "Not provided"}</td> : null}
                      <td className="px-5 py-4 text-ink/65">{row.region}</td>
                      {activeSection === "marketplace" ? <td className="px-5 py-4 text-ink/65">{row.ownerType || "Admin"}</td> : null}
                      {activeSection === "marketplace" ? <td className="px-5 py-4 text-ink/65">{row.ownerName || "Ghana Growers"}</td> : null}
                      {activeSection === "farmers" ? (
                        <td className="px-5 py-4 text-ink/65">
                          {farmerRowSource}
                        </td>
                      ) : null}
                      {activeSection === "farmers" || activeSection === "suppliers" || activeSection === "marketplace" ? (
                        <td className="px-5 py-4">
                          {isAdminFeaturedActive(row) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-earth-50 px-3 py-1 text-xs font-black text-earth-700">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              Featured
                            </span>
                          ) : isAdminFeaturedExpired(row) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-3 py-1 text-xs font-black text-ink/55">
                              Expired
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-ink/35">Not featured</span>
                          )}
                          {row.featuredUntil ? <p className="mt-1 text-xs font-semibold text-ink/45">Until {row.featuredUntil}</p> : null}
                        </td>
                      ) : null}
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${importStatusStyles[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink/65">{row.dateAdded}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {activeSection === "farmers" || activeSection === "suppliers" || activeSection === "marketplace" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void updateFeaturedRow(row, isAdminFeaturedActive(row) ? "note" : "mark")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-earth-700"
                              >
                                <Star className="h-3.5 w-3.5" />
                                {row.isFeatured ? "Update Featured" : "Mark Featured"}
                              </button>
                              {row.isFeatured ? (
                                <button
                                  type="button"
                                  onClick={() => void updateFeaturedRow(row, "remove")}
                                  className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-tomato"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Remove Featured
                                </button>
                              ) : null}
                            </>
                          ) : null}
                          {activeSection === "success-stories" && row.status !== "Published" ? (
                            <button
                              type="button"
                              onClick={() => void publishSuccessStory(row)}
                              className="inline-flex items-center gap-1 rounded-md bg-leaf-700 px-3 py-2 text-xs font-black text-white transition hover:bg-leaf-800"
                            >
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Publish Story
                            </button>
                          ) : null}
                          {activeSection === "farmers" && normalizedRowSource === "Tally Import" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void openImportedFarmerReviewById(row.id, row);
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-700 transition hover:bg-leaf-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          ) : row.href ? (
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
                          {row.verificationTarget && !(activeSection === "farmers" && normalizedRowSource === "Tally Import") ? (
                            <>
                              <label className="grid min-w-[220px] flex-1 gap-1 text-xs font-black text-ink/60">
                                Verification notes
                                <input
                                  value={verificationNotes[row.id] ?? ""}
                                  onChange={(event) => setVerificationNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                                  placeholder="Add note..."
                                  className="rounded-md border border-leaf-900/10 px-3 py-2 text-xs font-semibold text-ink/75 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => updateVerificationStatus(row, "Under Review")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <FilePenLine className="h-3.5 w-3.5" />
                                Under Review
                              </button>
                              <button
                                type="button"
                                onClick={() => updateVerificationStatus(row, "Verified")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Mark Verified
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
                          ) : activeSection === "farmers" && normalizedRowSource === "Tally Import" ? (
                            <>
                              <span className="inline-flex items-center rounded-md bg-earth-50 px-3 py-2 text-xs font-black text-earth-700">
                                Verify in review
                              </span>
                              <button
                                type="button"
                                onClick={() => archiveAdminRow(row)}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                Archive
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
                                onClick={() => archiveAdminRow(row)}
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
                    {activeSection === "farmers" && isExpandedFarmerRow ? (
                      <tr className="bg-leaf-50/55">
                        <td colSpan={12} className="px-5 py-4">
                          <div className="grid gap-3 rounded-md border border-leaf-900/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                              ["Phone", row.phone || "Not provided"],
                              ["WhatsApp", row.whatsapp || row.phone || "Not provided"],
                              ["Products", row.products || "Not provided"],
                              ["Region", row.region || "Not provided"],
                              ["Farm size", row.farmSize || "Not provided"],
                              ["Source", farmerRowSource],
                              ["Status", row.status]
                            ].map(([label, value]) => (
                              <div key={label}>
                                <p className="text-[11px] font-black uppercase tracking-wide text-ink/40">{label}</p>
                                <p className="mt-1 text-sm font-bold text-ink/75">{value}</p>
                              </div>
                            ))}
                            <div className="sm:col-span-2 lg:col-span-1">
                              <p className="text-[11px] font-black uppercase tracking-wide text-ink/40">Full application</p>
                              {isTallyFarmerRow ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void openImportedFarmerReviewById(row.id, row);
                                  }}
                                  className="mt-2 inline-flex items-center gap-2 rounded-md bg-leaf-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-leaf-800"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Open Full Review
                                </button>
                              ) : (
                                <p className="mt-1 text-sm font-semibold text-ink/55">Full Tally review is available for Tally Import rows.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRows.length === 0 ? (
              <p className="p-6 text-sm font-semibold text-ink/60">No records match this search or status filter.</p>
            ) : null}
            </>
            )}
          </section>

          {pendingFarmerBulkAction ? (
            <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-4 py-6">
              <section className="w-full max-w-lg rounded-md bg-white p-5 shadow-soft sm:p-6">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Confirm Bulk Update</p>
                <h2 className="mt-2 text-2xl font-black text-ink">
                  Are you sure you want to update {selectedFarmerRowIds.length} farmer{selectedFarmerRowIds.length === 1 ? "" : "s"}?
                </h2>
                <p className="mt-3 text-sm leading-6 text-ink/65">
                  This will apply <span className="font-black text-ink">{farmerBulkActionLabels[pendingFarmerBulkAction]}</span> to the selected farmer records in Supabase.
                  No farmer records will be deleted.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setPendingFarmerBulkAction(null)}
                    disabled={isUpdatingFarmersBulk}
                    className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyFarmerBulkAction}
                    disabled={isUpdatingFarmersBulk}
                    className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:bg-ink/25"
                  >
                    {isUpdatingFarmersBulk ? "Updating..." : "Confirm Update"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {reviewingImportedFarmer ? (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 px-4 py-6 backdrop-blur-sm">
              <section className="mx-auto max-w-5xl rounded-md bg-white shadow-2xl">
                <div className="flex flex-col gap-4 border-b border-leaf-900/10 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-leaf-700">Farmer Verification Review</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">{reviewingImportedFarmer.farm_name}</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/58">
                      {reviewingImportedFarmer.farmer_name || "Name not provided"} - {reviewingImportedFarmer.source || "Tally Import"}
                    </p>
                    {isLoadingFarmerReview ? (
                      <p className="mt-2 rounded-md bg-earth-50 px-3 py-2 text-xs font-black text-earth-700">
                        Loading full application details from Supabase...
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => previousImportedFarmer && void openImportedFarmerReview(previousImportedFarmer)}
                      disabled={!previousImportedFarmer || isUpdatingFarmerReview}
                      className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => nextImportedFarmer && void openImportedFarmerReview(nextImportedFarmer)}
                      disabled={!nextImportedFarmer || isUpdatingFarmerReview}
                      className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={closeImportedFarmerReview}
                      className="rounded-md border border-leaf-900/10 px-3 py-2 text-xs font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {farmerReviewMessage ? (
                  <div
                    className={`mx-5 mt-5 rounded-md px-4 py-3 text-sm font-black ${
                      farmerReviewMessage.type === "success"
                        ? "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-700/15"
                        : "bg-tomato/10 text-tomato ring-1 ring-tomato/20"
                    }`}
                    role={farmerReviewMessage.type === "error" ? "alert" : "status"}
                  >
                    {farmerReviewMessage.text}
                  </div>
                ) : null}

                <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr]">
                  <div>
                    <div className="aspect-[4/3] overflow-hidden rounded-md bg-leaf-50 ring-1 ring-leaf-900/10">
                      {publicReviewPhotoUrl(reviewingImportedFarmer) ? (
                        <div
                          role="img"
                          aria-label={`${reviewingImportedFarmer.farm_name} photo`}
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${publicReviewPhotoUrl(reviewingImportedFarmer)})` }}
                        />
                      ) : (
                        <div className="grid h-full place-items-center px-6 text-center text-sm font-black uppercase tracking-wide text-ink/35">
                          {photoSubmittedButNotImported(reviewingImportedFarmer) ? "Photo submitted but not imported." : "No photo submitted."}
                        </div>
                      )}
                    </div>
                    {photoSubmittedButNotImported(reviewingImportedFarmer) ? (
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("import-photo")}
                        disabled={isUpdatingFarmerReview}
                        className="mt-3 w-full rounded-md bg-leaf-700 px-3 py-2.5 text-xs font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:bg-ink/25"
                      >
                        {pendingFarmerReviewAction === "import-photo" ? "Importing photo..." : "Import Submitted Photo"}
                      </button>
                    ) : null}
                    <div className="mt-4 rounded-md bg-earth-50 p-4 ring-1 ring-earth-500/20">
                      <p className="text-xs font-black uppercase tracking-wide text-earth-700">Photo Status</p>
                      <p className="mt-2 text-sm font-black text-ink">{farmerPhotoDiagnostics(reviewingImportedFarmer).status}</p>
                      {farmerPhotoDiagnostics(reviewingImportedFarmer).filename ? (
                        <p className="mt-1 text-xs font-semibold text-ink/55">File: {farmerPhotoDiagnostics(reviewingImportedFarmer).filename}</p>
                      ) : null}
                    </div>
                    <details className="mt-4 rounded-md border border-leaf-900/10 bg-white p-4">
                      <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-earth-700">
                        Photo diagnostics
                      </summary>
                      <div className="mt-3 grid gap-2 text-xs font-semibold text-ink/65">
                        {[
                          ["profile_image_url", farmerPhotoDiagnostics(reviewingImportedFarmer).profileImage ? "yes" : "no"],
                          ["imported_photo_url", farmerPhotoDiagnostics(reviewingImportedFarmer).importedPhoto ? "yes" : "no"],
                          ["tally_photo_url", farmerPhotoDiagnostics(reviewingImportedFarmer).tallyPhoto ? "yes" : "no"],
                          ["original_tally_data photo key found", farmerPhotoDiagnostics(reviewingImportedFarmer).originalPhotoKeyFound ? "yes" : "no"],
                          ["photo key", farmerPhotoDiagnostics(reviewingImportedFarmer).originalPhotoKey || "none"],
                          ["extracted photo url", farmerPhotoDiagnostics(reviewingImportedFarmer).extractedPhotoUrlPreview || "none"],
                          ["public/displayable", farmerPhotoDiagnostics(reviewingImportedFarmer).publicDisplayable ? "yes" : "no"]
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-start justify-between gap-3 rounded-md bg-leaf-50 px-3 py-2">
                            <span className="font-black text-ink">{label}</span>
                            <span className="break-all text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                    <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                      <p className="text-xs font-black uppercase tracking-wide text-ink/45">Review Visibility</p>
                      <div className="mt-3 grid gap-2">
                        {reviewingReadiness.map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-leaf-50 px-3 py-2">
                            <span className="text-sm font-black text-ink">{item.label}</span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${item.complete ? "bg-leaf-100 text-leaf-800" : "bg-earth-50 text-earth-700"}`}>
                              {item.complete ? "Available" : item.note}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 rounded-md bg-leaf-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-ink/45">Current Status</p>
                      <div className="mt-3 grid gap-3">
                        <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                          <p className="text-[11px] font-black uppercase tracking-wide text-ink/45">Public visibility</p>
                          <p className="mt-1 text-sm font-black text-ink">
                            {reviewingImportedFarmer.status === "Active" ? "Active" : "Not Public"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-ink/50">
                            Only Active farmers appear in the public Farmer Directory.
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                          <p className="text-[11px] font-black uppercase tracking-wide text-ink/45">Verification</p>
                          <p className="mt-1 text-sm font-black text-ink">{reviewingImportedFarmer.verification_status}</p>
                          <p className="mt-1 text-xs font-semibold text-ink/50">
                            Verification controls the public trust badge only.
                          </p>
                        </div>
                      </div>
                      {reviewingImportedFarmer.verification_date ? (
                        <p className="mt-1 text-xs font-semibold text-ink/50">Verified on {reviewingImportedFarmer.verification_date}</p>
                      ) : null}
                    </div>
                    {reviewingCompleteness ? (
                      <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                        <p className="text-xs font-black uppercase tracking-wide text-ink/45">Profile Completeness</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-3xl font-black text-ink">{reviewingCompleteness.percent}%</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${completenessBadgeClasses(reviewingCompleteness.tone)}`}>
                            {reviewingCompleteness.status}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-leaf-50">
                          <div
                            className={`h-full rounded-full ${reviewingCompleteness.tone === "ready" ? "bg-leaf-700" : reviewingCompleteness.tone === "follow-up" ? "bg-earth-500" : "bg-tomato"}`}
                            style={{ width: `${reviewingCompleteness.percent}%` }}
                          />
                        </div>
                        {reviewingCompleteness.missing.length > 0 ? (
                          <div className="mt-4">
                            <p className="text-xs font-black uppercase tracking-wide text-ink/45">Missing</p>
                            <ul className="mt-2 grid gap-1 text-sm font-semibold text-ink/65">
                              {reviewingCompleteness.missing.map((item) => (
                                <li key={item}>- {item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm font-semibold text-leaf-800">No major profile gaps found.</p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-5">
                    <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <h3 className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Identity</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {[
                          ["Farmer Name", reviewingImportedFarmer.farmer_name],
                          ["Farm Name", reviewingImportedFarmer.farm_name],
                          ["Phone Number", reviewingImportedFarmer.phone_number || reviewingImportedFarmer.whatsapp_number],
                          ["WhatsApp Number", reviewingImportedFarmer.whatsapp_number],
                          ["Email", reviewingImportedFarmer.email],
                          ["Source", reviewingImportedFarmer.source || "Tally Import"],
                          ["Submission Date", reviewingImportedFarmer.created_at ? new Date(reviewingImportedFarmer.created_at).toLocaleDateString() : ""]
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-leaf-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</p>
                            <p className="mt-2 break-words text-sm font-black text-ink">{value || "Not provided"}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <h3 className="text-sm font-black uppercase tracking-wide text-earth-700">Farm Details</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {[
                          ["Farm Location", reviewingImportedFarmer.farm_location || `${reviewingImportedFarmer.district}, ${reviewingImportedFarmer.region}`],
                          ["Region", reviewingImportedFarmer.region],
                          ["District", reviewingImportedFarmer.district],
                          ["Farm Size", reviewingImportedFarmer.farm_size],
                          ["Farm Type", reviewingImportedFarmer.farm_type],
                          ["Crops Grown / Livestock", reviewingImportedFarmer.products.join(", ")],
                          ["Farming Experience", reviewingImportedFarmer.farming_experience],
                          ["Currently Harvesting", reviewingImportedFarmer.currently_harvesting],
                          ["Supply Frequency", reviewingImportedFarmer.supply_frequency]
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-leaf-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</p>
                            <p className="mt-2 break-words text-sm font-black text-ink">{value || "Not provided"}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <h3 className="text-sm font-black uppercase tracking-wide text-earth-700">Logistics & Preferences</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          ["Collection Point / Delivery Preference", reviewingImportedFarmer.delivery_preference],
                          ["Preferred Payment Method", reviewingImportedFarmer.payment_preference],
                          ["Workshop/Event Interest", reviewingImportedFarmer.workshop_interest],
                          ["How They Heard About Ghana Growers", reviewingImportedFarmer.referral_source]
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-leaf-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</p>
                            <p className="mt-2 break-words text-sm font-black text-ink">{value || "Not provided"}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {reviewingImportedFarmer.description ? (
                      <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-ink/45">Application Notes</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-ink/70">{reviewingImportedFarmer.description}</p>
                      </div>
                    ) : null}

                    <label htmlFor="farmer-verification-notes" className="grid gap-2 text-sm font-black text-ink">
                      Verification Notes
                      <textarea
                        id="farmer-verification-notes"
                        value={verificationReviewNotes}
                        onChange={(event) => setVerificationReviewNotes(event.target.value)}
                        rows={4}
                        className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                        placeholder="Add notes from the review before changing verification status."
                      />
                    </label>

                    {reviewingCompleteness && reviewingCompleteness.missing.length > 0 ? (
                      <section className="rounded-md border border-earth-500/20 bg-earth-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-wide text-earth-700">Follow-up Message</h3>
                            <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
                              Use this when a profile needs missing details before publishing.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => void copyFollowUpMessage()}
                              className="rounded-md bg-white px-3 py-2 text-xs font-black text-ink/70 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                            >
                              Copy Follow-up Message
                            </button>
                            {reviewingWhatsappUrl ? (
                              <a
                                href={reviewingWhatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md bg-leaf-700 px-3 py-2 text-center text-xs font-black text-white transition hover:bg-leaf-800"
                              >
                                Open WhatsApp
                              </a>
                            ) : null}
                          </div>
                        </div>
                        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/70 ring-1 ring-earth-500/20">
                          {reviewingFollowUpMessage}
                        </pre>
                      </section>
                    ) : null}

                    {reviewingImportedFarmer.original_tally_data && Object.keys(reviewingImportedFarmer.original_tally_data).length > 0 ? (
                      <details className="rounded-md border border-leaf-900/10 bg-white p-4">
                        <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-earth-700">
                          Original Tally Submission Data
                        </summary>
                        <div className="mt-4 grid gap-2">
                          {Object.entries(reviewingImportedFarmer.original_tally_data).map(([label, value]) => (
                            <div key={label} className="rounded-md bg-leaf-50 px-3 py-2 text-sm">
                              <p className="font-black text-ink">{label}</p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-ink/65">{displayTallyValue(value)}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}

                    {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ADMIN_DEBUG === "true" ? (
                      <details className="rounded-md border border-earth-500/30 bg-earth-50 p-4">
                        <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-earth-700">
                          Debug: Supabase Fields Returned
                        </summary>
                        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-white p-4 text-xs font-semibold leading-5 text-ink/70 ring-1 ring-earth-500/20">
                          {JSON.stringify(farmerReviewDebug ?? reviewDebugFields(reviewingImportedFarmer), null, 2)}
                        </pre>
                      </details>
                    ) : null}

                    <div className="flex flex-col gap-3 rounded-md bg-leaf-50 p-4 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("notes")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-white px-4 py-3 text-sm font-black text-ink/70 ring-1 ring-leaf-900/10 transition hover:bg-leaf-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "notes" ? "Saving..." : "Save Notes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("under-review")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "under-review" ? "Updating..." : "Mark Under Review"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("needs-follow-up")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-white px-4 py-3 text-sm font-black text-earth-700 ring-1 ring-earth-500/20 transition hover:bg-earth-500 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "needs-follow-up" ? "Updating..." : "Needs Follow-up"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("verify-only")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "verify-only" ? "Verifying..." : "Verify Only"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("verify")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "verify" ? "Publishing..." : "Verify & Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("reject")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-white px-4 py-3 text-sm font-black text-tomato ring-1 ring-tomato/20 transition hover:bg-tomato hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "reject" ? "Rejecting..." : "Reject Farmer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyImportedFarmerReviewAction("archive")}
                        disabled={isUpdatingFarmerReview}
                        className="rounded-md bg-ink px-4 py-3 text-sm font-black text-white transition hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFarmerReviewAction === "archive" ? "Archiving..." : "Archive"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeForm ? (
            <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-3 py-4 sm:px-4 sm:py-6">
              <section className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-md bg-white shadow-soft">
                <div className="border-b border-leaf-900/10 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Admin Form</p>
                      <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">{activeForm.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-ink/60">
                        {activeForm.recordName ? `Editing ${activeForm.recordName}. ` : ""}
                        {canPersistAdminForm(activeForm.id, activeForm.mode)
                          ? "This Phase 1 admin form saves records to Supabase when the table schema and server environment variables are configured."
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

                <form className="p-4 sm:p-5" onSubmit={submitAdminForm}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {formConfigs[activeForm.id].map((field) => {
                      const fieldId = `admin-${activeForm.id}-${field.name}`;
                      const value = formValues[field.name] ?? "";

                      if (field.type === "image") {
                        const preview = imagePreviews[field.name] || value;
                        const isUploading = uploadingField === field.name;

                        return (
                          <div key={field.name} className="grid gap-3 text-sm font-black text-ink md:col-span-2">
                            <span>{field.label}</span>
                            <div className="grid gap-4 rounded-md border border-leaf-900/10 bg-leaf-50 p-4 sm:grid-cols-[180px_1fr] sm:items-center">
                              <div className="aspect-[4/3] overflow-hidden rounded-md bg-white ring-1 ring-leaf-900/10">
                                {preview ? (
                                  <div
                                    role="img"
                                    aria-label={`${field.label} preview`}
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${preview})` }}
                                  />
                                ) : (
                                  <div className="grid h-full place-items-center px-4 text-center text-xs font-black uppercase tracking-wide text-ink/35">
                                    Image preview
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex flex-wrap gap-2">
                                  <label
                                    htmlFor={fieldId}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800"
                                  >
                                    <UploadCloud className="h-4 w-4" aria-hidden="true" />
                                    {isUploading ? "Uploading..." : value || preview ? "Replace Image" : "Upload Image"}
                                  </label>
                                  <input
                                    id={fieldId}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    disabled={isUploading}
                                    onChange={(event) => uploadImage(field, event)}
                                    className="sr-only"
                                  />
                                  {value || preview ? (
                                    <button
                                      type="button"
                                      onClick={() => removeImage(field.name)}
                                      disabled={isUploading}
                                      className="inline-flex items-center gap-2 rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink/65 transition hover:border-tomato hover:text-tomato disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                                      Remove Image
                                    </button>
                                  ) : null}
                                </div>
                                {value ? (
                                  <p className="mt-3 break-all text-xs font-semibold leading-5 text-ink/55">
                                    Uploaded URL: {value}
                                  </p>
                                ) : null}
                                <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
                                  {field.helper ?? "Upload a JPG, PNG, or WEBP image up to 5MB."}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }

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
                        : canPersistAdminForm(activeForm.id, activeForm.mode)
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
            <h2 className="text-lg font-black text-ink">Admin Security Note</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              This dashboard is protected with Supabase Auth and an admin role check. Keep admin accounts limited to trusted users,
              review access regularly, and add detailed audit logs before managing sensitive production operations.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
