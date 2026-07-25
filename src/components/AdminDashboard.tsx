"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
import { ChangeEvent, FormEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buyerRequests } from "@/data/buyerRequests";
import { farmerDirectory } from "@/data/farmers";
import { learnLessons as learnArticles } from "@/data/learnLessons";
import { marketPrices } from "@/data/marketPrices";
import { products } from "@/data/products";
import { WHATSAPP_NUMBER } from "@/data/site";
import successStories from "@/data/successStories.json";
import { supplierDirectory } from "@/data/suppliers";
import type { AdminUser } from "@/lib/adminAuth";
import {
  adminCountPillClass,
  adminMetricSeverityClass,
  adminPriorityActionClasses,
  adminPrioritySeverity
} from "@/lib/adminPriorityState";
import { matchTokens, normalizeMatchText, productMatchScore } from "@/lib/matching";

type AdminStatus = "Pending" | "Under Review" | "Verified" | "Rejected" | "Active" | "Archived" | "Needs Follow-up" | "Published";
type ImportAdminStatus = AdminStatus | "Pending Review";
type GGStandardStatus = "Pending" | "Member" | "Suspended";
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
type AdminAnalyticsView = "operations" | "analytics";
type OptionalQueueLoadState = "idle" | "loading" | "available" | "unavailable" | "error";

type AdminRow = {
  id: string;
  profileRecordId?: string;
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
  district?: string;
  sellerFarmer?: string;
  quantity?: string;
  unit?: string;
  priceRange?: string;
  sellingMethod?: string;
  sellingUnit?: string;
  customUnitLabel?: string;
  customUnitReviewed?: boolean;
  unitSizeValue?: string;
  unitSizeMeasure?: string;
  unitSizeApproximate?: boolean;
  priceAmount?: string;
  priceCurrency?: string;
  priceBasis?: string;
  unitsAvailable?: string;
  totalQuantityValue?: string;
  totalQuantityMeasure?: string;
  minimumOrderValue?: string;
  minimumOrderUnit?: string;
  supplyFrequency?: string;
  availableFromDate?: string;
  gradeDescription?: string;
  deliveryDetails?: string;
  recordSource?: string;
  availability?: string;
  description?: string;
  internalOperationsNotes?: string;
  imageUrl?: string;
  imageUrls?: string[];
  isFeatured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
  ggStandardStatus?: GGStandardStatus | string;
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
type LeadRequestSource = "marketplace_listing" | "farmer_profile" | "supplier_profile" | "generic_sourcing" | "legacy";
type ProduceRequestStatusFilter = "All" | "Pending Review" | "Contacted" | "Active Sourcing" | "Completed" | "Lost";
type LeadRequestSnapshot = {
  product?: string;
  seller?: string;
  location?: string;
  pricePackage?: string;
  listedQuantity?: string;
  quantityLabel?: string;
  availability?: string;
  category?: string;
  source?: string;
  marketplaceListingId?: string;
};
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
  source_type: "Farmer" | "Supplier" | "Marketplace Listing" | "Supplier Listing" | "Buyer Request";
  source_id: string;
  source_name: string;
  source_page: string | null;
  status: LeadRequestStatus | "Closed";
  request_source?: LeadRequestSource | null;
  marketplace_listing_id?: string | null;
  farmer_profile_id?: string | null;
  supplier_profile_id?: string | null;
  source_slug?: string | null;
  company_name?: string | null;
  whatsapp_same_as_phone?: boolean | null;
  delivery_location?: string | null;
  required_by?: string | null;
  listing_snapshot?: LeadRequestSnapshot | null;
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
type ApplicationStatus = "New" | "Pending" | "Under Review" | "Approved" | "Rejected" | "Converted";
type SubmissionKind = "listing" | "buyer-request";
type SubmissionStatus = "New" | "Needs Information" | "Under Review" | "Approved" | "Published" | "Paused" | "Rejected" | "Expired" | "Converted";
type LaunchStatus = "Incomplete" | "Complete";
type FarmerBulkAction = "active" | "pending-review" | "under-review" | "verified" | "founding" | "archive";
type FarmerSourceFilter = "All" | "Tally Import" | "Founding Farmer" | "Manual/Test";
type ProfileCompletenessFilter = "All" | "Ready to Publish" | "Needs Follow-up" | "Incomplete";
type MarketplaceOwnerFilter = "All" | "Farmer" | "Supplier" | "Admin";
type FeaturedFilter = "All" | "Featured" | "Not Featured" | "Expired Featured";
type LaunchEditorialStatus = "Public Farmer" | "Featured Farmer" | "Founding Farmer 2026" | "Needs Improvement" | "Hold";
type LaunchEditorialFilter = "All" | "Founding Farmers" | "Homepage Candidates" | "Featured Farmers" | "Story Candidates" | "Launch Ready" | "Needs Improvement";
type LaunchChecklistItem = "Profile photo" | "Farm photos" | "Produce photos" | "Farm story" | "Verified contact" | "Produce listing" | "Region confirmed";
type SupplierLaunchStatus = "Public Supplier" | "Featured Supplier" | "Founding Supplier 2026" | "Needs Improvement" | "Hold";
type SupplierEditorialFilter = "All" | "Founding Suppliers" | "Featured Suppliers" | "Homepage Candidates" | "Launch Ready" | "Needs Improvement" | "Overdue" | "New";
type SupplierChecklistItem = "Business logo" | "Business photos" | "Products or services" | "Business description" | "Verified contact" | "Regions served" | "Registration reviewed";
type SourcingQueueFilter =
  | "All"
  | "New"
  | "Overdue"
  | "Due Today"
  | "Assigned To Me"
  | "Completed"
  | "Waiting Buyer"
  | "Waiting Farmer"
  | "Waiting Supplier"
  | "High Priority";
type SourcingCaseStatus = "New" | "Reviewing" | "Active Sourcing" | "Matching Farmers" | "Matching Suppliers" | "Waiting Buyer" | "Completed" | "Closed";
type EditorialDecisionState = {
  launchStatus: LaunchEditorialStatus;
  homepageCandidate: boolean;
  marketplaceFeatured: boolean;
  storyCandidate: boolean;
  editorialNotes: string;
  checklist: Record<LaunchChecklistItem, boolean>;
};
type SupplierEditorialDecisionState = {
  launchStatus: SupplierLaunchStatus;
  homepageCandidate: boolean;
  marketplaceFeatured: boolean;
  storyCandidate: boolean;
  editorialNotes: string;
  checklist: Record<SupplierChecklistItem, boolean>;
};

const waitingApplicationStatuses = new Set<ApplicationStatus>(["New", "Pending", "Under Review"]);

function applicationNeedsReview(application: { status: ApplicationStatus }) {
  return waitingApplicationStatuses.has(application.status);
}
type SourcingCaseState = {
  status: SourcingCaseStatus;
  owner: string;
  notes: string;
};
type SourcingCaseTab = "Overview" | "Matches" | "Activity";
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
  business_name?: string | null;
  website_url?: string | null;
  registration_number?: string | null;
  categories?: string[] | null;
  regions_served?: string[] | null;
  products_services?: string | null;
  business_description?: string | null;
  years_in_business?: string | null;
  logo_url?: string | null;
  photo_urls?: string[] | null;
  certificate_urls?: string[] | null;
  gg_standard_agreement?: boolean | null;
  launch_status?: SupplierLaunchStatus | string | null;
  homepage_candidate?: boolean | null;
  marketplace_featured?: boolean | null;
  story_candidate?: boolean | null;
  editorial_notes?: string | null;
  launch_ready?: boolean | null;
  launch_checklist?: Partial<Record<SupplierChecklistItem, boolean>> | null;
  editorial_updated_at?: string | null;
  editorial_updated_by?: string | null;
  linked_farmer_id?: string | null;
  linked_supplier_id?: string | null;
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
type SourcingCaseRecord = BuyerRequestSubmissionRecord & {
  case_source: "lead_request" | "buyer_request_submission";
  lead_request_status?: LeadRequestStatus | "Closed";
  request_source?: LeadRequestSource | null;
  source_type?: LeadRequestRecord["source_type"];
  source_name?: string | null;
  linked_source?: string | null;
  marketplace_listing_id?: string | null;
  farmer_profile_id?: string | null;
  supplier_profile_id?: string | null;
  listing_snapshot?: LeadRequestSnapshot | null;
};
type FarmerLinkedMarketplaceListing = {
  id: string;
  slug?: string | null;
  product_name?: string | null;
  status?: string | null;
  availability?: string | null;
  region?: string | null;
  district?: string | null;
  owner_type?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  created_at?: string | null;
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
  farm_photo_urls?: string[] | null;
  produce_photo_urls?: string[] | null;
  document_urls?: string[] | null;
  tally_file_references?: Record<string, unknown> | null;
  photo_import_status?: string | null;
  photo_import_notes?: string | null;
  original_tally_data?: Record<string, unknown>;
  status: ImportAdminStatus;
  verification_status: string;
  verification_date?: string | null;
  verified_by?: string | null;
  verification_notes?: string | null;
  gg_standard_status?: GGStandardStatus | string | null;
  profile_image_url?: string | null;
  description?: string | null;
  launch_status?: LaunchEditorialStatus | string | null;
  homepage_candidate?: boolean | null;
  marketplace_featured?: boolean | null;
  story_candidate?: boolean | null;
  editorial_notes?: string | null;
  launch_ready?: boolean | null;
  launch_checklist?: Partial<Record<LaunchChecklistItem, boolean>> | null;
  editorial_updated_at?: string | null;
  editorial_updated_by?: string | null;
  linked_marketplace_listings?: FarmerLinkedMarketplaceListing[];
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
  type?: "text" | "date" | "number" | "url" | "textarea" | "select" | "image" | "imageGallery";
  required?: boolean;
  helper?: string;
  options?: string[];
  optionLabels?: Record<string, string>;
  bucket?: "farmers" | "suppliers" | "marketplace" | "stories";
  advanced?: boolean;
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
const launchEditorialStatusOptions: LaunchEditorialStatus[] = [
  "Public Farmer",
  "Featured Farmer",
  "Founding Farmer 2026",
  "Needs Improvement",
  "Hold"
];
const launchEditorialChecklistItems: LaunchChecklistItem[] = [
  "Profile photo",
  "Farm photos",
  "Produce photos",
  "Farm story",
  "Verified contact",
  "Produce listing",
  "Region confirmed"
];
const supplierLaunchStatusOptions: SupplierLaunchStatus[] = [
  "Public Supplier",
  "Featured Supplier",
  "Founding Supplier 2026",
  "Needs Improvement",
  "Hold"
];
const supplierLaunchChecklistItems: SupplierChecklistItem[] = [
  "Business logo",
  "Business photos",
  "Products or services",
  "Business description",
  "Verified contact",
  "Regions served",
  "Registration reviewed"
];
const sourcingQueueFilters: SourcingQueueFilter[] = ["All", "New", "Overdue", "Due Today", "Assigned To Me", "Completed", "Waiting Buyer", "Waiting Farmer", "Waiting Supplier", "High Priority"];

const statusStyles: Record<AdminStatus, string> = {
  Pending: "admin-status-badge admin-status-pending",
  "Under Review": "admin-status-badge admin-status-active",
  "Needs Follow-up": "admin-status-badge admin-status-contacted",
  Verified: "admin-status-badge admin-status-complete",
  Rejected: "admin-status-badge admin-status-danger",
  Active: "admin-status-badge admin-status-active",
  Published: "admin-status-badge admin-status-complete",
  Archived: "admin-status-badge admin-status-paused"
};
const importStatusStyles: Record<ImportAdminStatus, string> = {
  ...statusStyles,
  "Pending Review": "admin-status-badge admin-status-pending"
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

  if (status === "Needs Information") {
    return statusStyles["Needs Follow-up"];
  }

  if (status === "Approved" || status === "Converted" || status === "Published") {
    return statusStyles.Verified;
  }

  if (status === "Paused" || status === "Expired") {
    return statusStyles.Archived;
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
  { id: "analytics", label: "Operations Center", icon: LayoutDashboard },
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
  { id: "whatsapp-leads", label: "Notifications", icon: MessageCircle },
  { id: "match-opportunities", label: "Match Opportunities", icon: PackageCheck },
  { id: "learn", label: "Learn Articles", icon: BookOpen },
  { id: "success-stories", label: "Success Stories", icon: Star },
  { id: "market-prices", label: "Market Prices", icon: ChartLine }
];

type AdminNavigationItem = {
  key: string;
  id: AdminSectionId;
  label: string;
  analyticsView?: AdminAnalyticsView;
  applicationTab?: ApplicationKind;
  produceRequestStatusFilter?: ProduceRequestStatusFilter;
  sourcingQueueFilter?: SourcingQueueFilter;
};

const operationsNavigation: Array<{
  group: string;
  items: AdminNavigationItem[];
}> = [
  {
    group: "Today",
    items: [
      { key: "today-operations", id: "analytics", label: "Operations Center", analyticsView: "operations" },
      { key: "today-notifications", id: "whatsapp-leads", label: "Notifications" }
    ]
  },
  {
    group: "Buyer Requests",
    items: [
      { key: "buyer-review", id: "buyer-requests", label: "Review Requests", produceRequestStatusFilter: "Pending Review" },
      { key: "buyer-matches", id: "match-opportunities", label: "Matches", sourcingQueueFilter: "All" },
      { key: "buyer-follow-ups", id: "lead-queue", label: "Follow-ups" },
      { key: "buyer-completed", id: "lead-queue", label: "Completed Requests" }
    ]
  },
  {
    group: "Network",
    items: [
      { key: "network-farmer-applications", id: "applications", label: "Farmer Applications", applicationTab: "farmer" },
      { key: "network-supplier-applications", id: "applications", label: "Supplier Applications", applicationTab: "supplier" },
      { key: "network-members", id: "farmers", label: "Members" },
      { key: "network-directories", id: "suppliers", label: "Directories" }
    ]
  },
  {
    group: "Marketplace",
    items: [
      { key: "marketplace-listings", id: "marketplace", label: "Listings" },
      { key: "marketplace-categories", id: "marketplace", label: "Categories" },
      { key: "marketplace-featured-listings", id: "featured-enquiries", label: "Featured Listings" }
    ]
  },
  {
    group: "Trust & Content",
    items: [
      { key: "trust-verification", id: "verifications", label: "Verification" },
      { key: "trust-gg-standard", id: "verifications", label: "GG Standard" },
      { key: "trust-featured-members", id: "featured-enquiries", label: "Featured Members" },
      { key: "trust-stories", id: "success-stories", label: "Stories" },
      { key: "trust-homepage", id: "learn", label: "Homepage" },
      { key: "trust-photography", id: "submissions", label: "Photography" },
      { key: "trust-learning", id: "learn", label: "Learning" }
    ]
  },
  {
    group: "Reports",
    items: [
      { key: "reports-reports", id: "analytics", label: "Reports", analyticsView: "analytics" },
      { key: "reports-analytics", id: "analytics", label: "Analytics", analyticsView: "analytics" },
      { key: "reports-launch-readiness", id: "launch-checklist", label: "Launch Readiness" }
    ]
  },
  {
    group: "Settings",
    items: [
      { key: "settings-users", id: "launch-checklist", label: "Users" },
      { key: "settings-roles", id: "launch-checklist", label: "Roles" },
      { key: "settings-permissions", id: "launch-checklist", label: "Permissions" },
      { key: "settings-integrations", id: "launch-checklist", label: "Integrations" }
    ]
  }
];

function defaultNavigationItem(section: AdminSectionId) {
  return operationsNavigation.flatMap((group) => group.items).find((item) => item.id === section) ?? {
    key: `workspace-${section}`,
    id: section,
    label: sections.find((item) => item.id === section)?.label ?? "Workspace"
  };
}

function groupForNavigationKey(key: string) {
  return operationsNavigation.find((group) => group.items.some((item) => item.key === key))?.group ?? operationsNavigation[0].group;
}

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

const marketplaceGalleryLimit = 10;

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
    { name: "ggStandardStatus", label: "GG Standard Status", type: "select", required: true, options: ["Pending", "Member", "Suspended"] },
    { name: "profileImageUrl", label: "Farmer Profile Image", type: "image", bucket: "farmers", helper: "Upload an optimized JPG, PNG, or WEBP image up to 5MB. Aim for about 800px on the longest side." }
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
    { name: "ggStandardStatus", label: "GG Standard Status", type: "select", required: true, options: ["Pending", "Member", "Suspended"] },
    { name: "logoUrl", label: "Supplier Image or Logo", type: "image", bucket: "suppliers", helper: "Upload a JPG, PNG, or WEBP image up to 5MB." },
    { name: "website", label: "Website", type: "url" }
  ],
  marketplace: [
    { name: "productName", label: "Product Name", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: ["Vegetables", "Fruits", "Grains", "Roots & Tubers", "Legumes", "Herbs & Spices", "Nuts", "Livestock", "Farm Inputs", "Tools & Equipment", "Packaging", "Logistics Services"] },
    { name: "region", label: "Region", required: true },
    { name: "district", label: "District", required: true },
    { name: "sellerFarmer", label: "Seller/Farmer", required: true },
    { name: "ownerType", label: "Owner Type", type: "select", required: true, options: ["Farmer", "Supplier", "Admin"] },
    { name: "ownerId", label: "Owner ID", helper: "Auto-filled when creating a listing from a farmer review.", advanced: true },
    { name: "ownerName", label: "Owner Name", required: true, helper: "Use the farmer, supplier, or Ghana Growers owner name shown publicly." },
    { name: "sellingMethod", label: "Selling format", type: "select", required: true, options: ["packaged_unit", "weight", "count", "livestock", "volume"], optionLabels: { packaged_unit: "Packaged item such as sack, crate or tray", weight: "Sold by weight", count: "Sold by piece or count", livestock: "Livestock by head", volume: "Sold by litre or container" } },
    { name: "sellingUnit", label: "Unit buyers order", required: true, helper: "Examples: sack, crate, kg, tonne, head, tray, carton, or other." },
    { name: "customUnitLabel", label: "Custom unit label", helper: "Required only when the unit is other." },
    { name: "customUnitReviewed", label: "Custom unit reviewed", type: "select", options: ["false", "true"], optionLabels: { false: "No", true: "Yes" } },
    { name: "unitSizeValue", label: "Approximate amount in one" },
    { name: "unitSizeMeasure", label: "Measure inside one", helper: "Examples: kg, eggs, pieces, bottles, litres, gallons." },
    { name: "unitSizeApproximate", label: "Amount is approximate", type: "select", options: ["false", "true"], optionLabels: { false: "No", true: "Yes" } },
    { name: "priceAmount", label: "Price" },
    { name: "priceCurrency", label: "Price Currency", helper: "Use GHS unless another confirmed currency is required." },
    { name: "unitsAvailable", label: "How many units are available?", helper: "Number of sacks, crates, trays, heads, pieces, or containers." },
    { name: "totalQuantityValue", label: "Calculated or direct total", helper: "Use direct kg/tonne/litre total, or the calculated total from unit size x units available." },
    { name: "totalQuantityMeasure", label: "Total measure" },
    { name: "minimumOrderValue", label: "Optional minimum order" },
    { name: "minimumOrderUnit", label: "Minimum order unit" },
    { name: "quantity", label: "Legacy Quantity", advanced: true },
    { name: "unit", label: "Legacy Unit", advanced: true },
    { name: "priceRange", label: "Legacy Price Text", helper: "Use structured price fields where possible.", advanced: true },
    { name: "availability", label: "Availability", type: "select", required: true, options: ["Available Now", "Limited Stock", "Harvesting Soon", "Sold Out"] },
    { name: "supplyFrequency", label: "Supply Frequency", type: "select", options: ["", "One-time", "Weekly", "Monthly", "On request"] },
    { name: "availableFromDate", label: "Ready / Harvest Date", type: "date" },
    { name: "gradeDescription", label: "Grade or Quality Description" },
    { name: "deliveryDetails", label: "Pickup or Delivery Details", type: "textarea" },
    { name: "recordSource", label: "Listing Record Source", helper: "Accepted values: public_submission, admin, import, demo_seed, sample, mock.", advanced: true },
    { name: "whatsappNumber", label: "WhatsApp Number", required: true },
    { name: "description", label: "Public Description", type: "textarea", helper: "This description is shown publicly to buyers. You can edit the suggested text before publishing." },
    { name: "internalOperationsNotes", label: "Internal Operations Notes", type: "textarea", helper: "Visible only to the Ghana Growers Operations Team." },
    { name: "imageUrls", label: "Listing Gallery", type: "imageGallery", bucket: "marketplace", helper: "Upload up to 10 JPG, PNG, or WEBP images. The first image is the public cover photo." }
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
    { name: "category", label: "Category", type: "select", required: true, options: ["Soil & Compost", "Crop Care", "Pests & Diseases", "Harvest & Storage", "FarmMate Guides", "Video Lessons"] },
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
    { name: "outcome", label: "Story Highlights", type: "textarea", required: true, helper: "Summarize the practical result, milestone, or launch-ready highlight from this story." },
    { name: "date", label: "Story Date", type: "date", required: true },
    { name: "imageUrl", label: "Story Cover Image", type: "image", bucket: "stories", helper: "Upload, replace, or remove the story cover image. JPG, PNG, or WEBP up to 5MB." },
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
    { label: "Supplier Applications Waiting", value: applicationCounts.suppliers, icon: Truck },
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

function oldestOperationalItem(items: Array<{ name: string; date?: string | null }>) {
  if (items.length === 0) {
    return "No waiting items";
  }

  const sorted = [...items].sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
  const item = sorted[0];
  const date = item.date ? relativeActivityTime(item.date) : "date unknown";

  return `${item.name || "Unnamed item"} - ${date}`;
}

function launchStatusFromCount(count: number, target: number): LaunchStatus {
  return count >= target ? "Complete" : "Incomplete";
}

function launchStatusClass(status: LaunchStatus) {
  if (status === "Complete") {
    return "admin-status-badge admin-status-complete";
  }

  return "admin-status-badge admin-status-pending";
}

function statusProgress(status: LaunchStatus) {
  return status === "Complete" ? 1 : 0;
}

function emptyFormValues(formId: AdminFormId) {
  return Object.fromEntries(formConfigs[formId].map((field) => [field.name, ""]));
}

function uniqueMarketplaceGalleryImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean))).slice(0, marketplaceGalleryLimit);
}

function parseMarketplaceGalleryValue(value?: string) {
  const source = value?.trim();

  if (!source) {
    return [];
  }

  if (source.startsWith("[")) {
    try {
      const parsed = JSON.parse(source) as unknown;
      if (Array.isArray(parsed)) {
        return uniqueMarketplaceGalleryImages(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      return [];
    }
  }

  return uniqueMarketplaceGalleryImages(source.split(/\r?\n|,/));
}

function marketplaceGalleryImagesFromValues(values: Record<string, string>) {
  return uniqueMarketplaceGalleryImages([...parseMarketplaceGalleryValue(values.imageUrls), values.imageUrl ?? ""]);
}

function marketplaceGalleryValue(images: string[]) {
  return JSON.stringify(uniqueMarketplaceGalleryImages(images));
}

function marketplaceListingDescriptionDraft(values: Record<string, string>) {
  const product = values.productName?.trim();

  if (!product) {
    return "";
  }

  const category = values.category?.trim().toLowerCase() ?? "";
  const ownerType = values.ownerType?.trim();
  const sellerName = values.ownerName?.trim() || values.sellerFarmer?.trim() || "Ghana Growers member";
  const region = values.region?.trim() || "Ghana";

  if (category.includes("vegetable")) {
    return `Fresh ${product} grown by ${sellerName} in ${region}. Carefully harvested and available for wholesale and bulk buyers. Contact Ghana Growers to confirm current availability, pricing and delivery arrangements.`;
  }

  if (category.includes("fruit")) {
    return `Fresh ${product} supplied by ${sellerName} in ${region}. Suitable for retailers, restaurants and wholesale buyers. Contact Ghana Growers for current availability and delivery options.`;
  }

  if (category.includes("cereal") || category.includes("grain")) {
    return `Quality ${product} supplied by ${sellerName} in ${region}. Available for wholesalers, processors and commercial buyers. Contact Ghana Growers to confirm quantity, pricing and collection.`;
  }

  if (category.includes("tuber") || category.includes("root")) {
    return `Fresh ${product} produced by ${sellerName} in ${region}. Available for wholesale supply. Contact Ghana Growers for availability and delivery arrangements.`;
  }

  if (category.includes("livestock") || category.includes("poultry") || category.includes("animal")) {
    return `Healthy ${product} supplied by ${sellerName}. Available for commercial buyers. Contact Ghana Growers for current availability and collection arrangements.`;
  }

  if (category.includes("input") || category.includes("seed") || category.includes("fertilizer") || ownerType === "Supplier") {
    return `Quality ${product} available from ${sellerName}. Contact Ghana Growers for pricing, availability and delivery information.`;
  }

  if (category.includes("service") || category.includes("logistics") || category.includes("transport") || category.includes("machinery")) {
    return `Professional ${product} available in ${region}. Contact Ghana Growers to discuss your requirements and availability.`;
  }

  return `${product} supplied by ${sellerName} in ${region}. Contact Ghana Growers to confirm current availability, quantity, pricing and delivery arrangements.`;
}

function districtFromLocation(location?: string) {
  return location?.split(",")[0]?.trim() ?? "";
}

function storyTitleForFarmer(farmer: ImportedFarmerRecord) {
  const farmerName = farmer.farmer_name || farmer.farm_name || "";

  if (farmerName.toLowerCase().includes("samuel")) {
    return "From WhatsApp to Marketplace";
  }

  return `${farmer.farm_name || farmer.farmer_name || "Farmer"} Joins the Ghana Growers Network`;
}

function storyDraftForFarmer(farmer: ImportedFarmerRecord) {
  const farmerName = farmer.farmer_name || farmer.farm_name || "This farmer";
  const farmName = farmer.farm_name && farmer.farm_name !== farmerName ? ` of ${farmer.farm_name}` : "";
  const location = [farmer.district, farmer.region].filter(Boolean).join(", ");
  const products = farmer.products?.length ? farmer.products.slice(0, 4).join(", ") : "farm produce";
  const locationText = location ? ` in ${location}` : "";

  return `${farmerName}${farmName}${locationText} became one of the early farmers to trade through Ghana Growers. With ${products} as part of the farm production, ${farmerName.split(" ")[0] || "this farmer"} represents the early farmers helping shape Ghana Growers into a trusted agricultural network.`;
}

function storyOutcomeForFarmer(farmer: ImportedFarmerRecord) {
  const products = farmer.products?.length ? farmer.products.slice(0, 3).join(", ") : "farm produce";

  return `Launch story candidate for ${farmer.farm_name || farmer.farmer_name || "this farmer"}, highlighting ${products} and early participation in the Ghana Growers marketplace.`;
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
      values.availability = "Available Now";
    }

    if (formId === "farmers" || formId === "suppliers") {
      values.verificationStatus = "Pending";
      values.ggStandardStatus = "Pending";
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
      ggStandardStatus: farmer?.ggStandardStatus ?? row.ggStandardStatus ?? "Pending",
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
      ggStandardStatus: supplier?.ggStandardStatus ?? row.ggStandardStatus ?? "Pending",
      logoUrl: supplier?.photos[0] ?? "",
      website: supplier?.website ?? ""
    };
  }

  if (formId === "marketplace") {
    const product = products.find((record) => record.id === row.id);
    const productRecord = product as (typeof product & { priceRange?: string }) | undefined;
    return {
      ...values,
      productName: product?.name ?? row.name,
      category: product?.category ?? row.type,
      region: product?.region ?? row.region,
      district: districtFromLocation(product?.location) || row.district || "",
      sellerFarmer: product?.seller ?? row.sellerFarmer ?? row.ownerName ?? "",
      ownerType: product?.ownerType ?? row.ownerType ?? (product?.farmerSlug ? "Farmer" : "Admin"),
      ownerId: product?.ownerId ?? row.ownerId ?? "",
      ownerName: product?.ownerName ?? row.ownerName ?? product?.seller ?? "",
      quantity: product?.quantity ?? row.quantity ?? "",
      unit: product?.unit ?? row.unit ?? "",
      sellingMethod: product?.sellingMethod ?? row.sellingMethod ?? "packaged_unit",
      sellingUnit: product?.sellingUnit ?? row.sellingUnit ?? product?.unit ?? "",
      customUnitLabel: product?.customUnitLabel ?? row.customUnitLabel ?? "",
      customUnitReviewed: product?.customUnitReviewed || row.customUnitReviewed ? "true" : "false",
      unitSizeValue: product?.unitSizeValue ?? row.unitSizeValue ?? "",
      unitSizeMeasure: product?.unitSizeMeasure ?? row.unitSizeMeasure ?? "",
      unitSizeApproximate: product?.unitSizeApproximate || row.unitSizeApproximate ? "true" : "",
      priceAmount: product?.priceAmount ?? row.priceAmount ?? "",
      priceCurrency: product?.priceCurrency ?? row.priceCurrency ?? "GHS",
      priceBasis: product?.priceBasis ?? row.priceBasis ?? "",
      unitsAvailable: product?.unitsAvailable ?? row.unitsAvailable ?? "",
      totalQuantityValue: product?.totalQuantityValue ?? row.totalQuantityValue ?? "",
      totalQuantityMeasure: product?.totalQuantityMeasure ?? row.totalQuantityMeasure ?? "",
      minimumOrderValue: product?.minimumOrderValue ?? row.minimumOrderValue ?? "",
      minimumOrderUnit: product?.minimumOrderUnit ?? row.minimumOrderUnit ?? "",
      priceRange: productRecord?.priceRange ?? row.priceRange ?? "",
      availability: product?.available ?? row.availability ?? "",
      supplyFrequency: product?.supplyFrequency ?? row.supplyFrequency ?? "",
      availableFromDate: product?.availableFromDate ?? row.availableFromDate ?? "",
      gradeDescription: product?.gradeDescription ?? row.gradeDescription ?? "",
      deliveryDetails: product?.deliveryDetails ?? row.deliveryDetails ?? "",
      recordSource: product?.recordSource ?? row.recordSource ?? "",
      whatsappNumber: product?.whatsappNumber ?? row.whatsapp ?? "",
      description: product?.description ?? row.description ?? "",
      internalOperationsNotes: product?.internalOperationsNotes ?? row.internalOperationsNotes ?? "",
      imageUrl: product?.image ?? row.imageUrl ?? "",
      imageUrls: marketplaceGalleryValue(product?.images?.length ? product.images : row.imageUrls?.length ? row.imageUrls : product?.image ? [product.image] : row.imageUrl ? [row.imageUrl] : [])
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
      verificationStatus: values.verificationStatus,
      ggStandardStatus: values.ggStandardStatus || "Pending",
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
      verificationStatus: values.verificationStatus,
      ggStandardStatus: values.ggStandardStatus || "Pending",
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
    profileRecordId: farmer.id,
    name: farmer.farm_name || farmer.farmer_name,
    type: farmer.farm_type,
    region: farmer.region,
    status: farmer.status,
    verificationStatus: farmer.verification_status,
    ggStandardStatus: farmer.gg_standard_status ?? "Pending",
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
    gg_standard_status: row.ggStandardStatus ?? "Pending",
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
    gg_standard_status: farmer.gg_standard_status ?? null,
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
const imageFilePattern = /\.(?:jpe?g|png|webp)(?:\?|$)/i;
const documentFilePattern = /\.(?:pdf|docx?|xlsx?|csv)(?:\?|$)/i;

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

function filenamesFromText(value?: string | null) {
  return Array.from(value?.matchAll(/[\w .()_-]+\.(?:jpe?g|png|webp|pdf|docx?|xlsx?|csv)/gi) ?? [])
    .map((match) => match[0]?.trim())
    .filter(Boolean);
}

function filenamesFromUnknown(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    const direct = filenamesFromText(value);

    if (direct.length > 0) {
      return direct;
    }

    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return filenamesFromUnknown(JSON.parse(trimmed) as unknown);
      } catch {
        return [];
      }
    }

    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(filenamesFromUnknown);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(filenamesFromUnknown);
  }

  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

type FarmerMediaReference = {
  label: string;
  urls: string[];
  filenames: string[];
  kind: "profile" | "farm" | "produce" | "document" | "other";
  access: "url" | "filename-only";
};

function classifyFarmerMediaReference(label: string, urls: string[], filenames: string[]): FarmerMediaReference["kind"] {
  const normalized = label.toLowerCase();
  const combined = [...urls, ...filenames].join(" ");
  const hasImage = imageFilePattern.test(combined) || /(photo|image|picture)/i.test(label);
  const hasDocument = documentFilePattern.test(combined) || /(certificate|document|license|licence|registration|permit)/i.test(label);

  if (hasDocument && !hasImage) {
    return "document";
  }

  if (/(produce|crop|product|harvest|livestock|animal)/i.test(normalized)) {
    return hasImage ? "produce" : "other";
  }

  if (/(farm|field|land|garden)/i.test(normalized)) {
    return hasImage ? "farm" : "other";
  }

  if (/(farmer|profile|passport|person|owner|selfie|headshot|face)/i.test(normalized)) {
    return hasImage ? "profile" : "other";
  }

  if (hasDocument) {
    return "document";
  }

  return hasImage ? "profile" : "other";
}

function fileReferencesFromTallyData(originalData?: Record<string, unknown> | null): FarmerMediaReference[] {
  return Object.entries(originalData ?? {})
    .map(([label, value]) => {
      const urls = uniqueStrings(urlsFromUnknown(value));
      const filenames = uniqueStrings(filenamesFromUnknown(value));

      if (!photoKeyPattern.test(label) && urls.length === 0 && filenames.length === 0) {
        return null;
      }

      return {
        label,
        urls,
        filenames,
        kind: classifyFarmerMediaReference(label, urls, filenames),
        access: urls.length > 0 ? "url" : "filename-only"
      } satisfies FarmerMediaReference;
    })
    .filter((entry): entry is FarmerMediaReference => Boolean(entry));
}

function storedTallyFileReferences(farmer: ImportedFarmerRecord): FarmerMediaReference[] {
  const references = farmer.tally_file_references?.references;
  return Array.isArray(references)
    ? references.filter((reference): reference is FarmerMediaReference => {
        return Boolean(reference && typeof reference === "object" && "label" in reference && "kind" in reference);
      })
    : [];
}

function farmerMediaReferences(farmer: ImportedFarmerRecord) {
  const stored = storedTallyFileReferences(farmer);
  return stored.length ? stored : fileReferencesFromTallyData(farmer.original_tally_data);
}

function originalTallyPhotoCandidate(originalData?: Record<string, unknown> | null) {
  const references = fileReferencesFromTallyData(originalData);
  const entry = references.find((reference) => reference.kind === "profile" && reference.urls.length > 0)
    ?? references.find((reference) => reference.kind !== "document" && reference.urls.length > 0)
    ?? references.find((reference) => reference.urls.length > 0);

  return {
    key: entry?.label ?? "",
    url: entry?.urls[0] ?? "",
    filename: entry?.filenames[0] ?? ""
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
  const profileReference = farmerMediaReferences(farmer).find((reference) => reference.kind === "profile" && reference.urls.length > 0);
  const candidates = [farmer.profile_image_url, farmer.imported_photo_url, firstUrlFromText(farmer.tally_photo_url), profileReference?.urls[0], originalPhoto.url];

  return candidates.find(isPublicReviewPhotoUrl);
}

function farmerSubmittedPhotoCandidate(farmer: ImportedFarmerRecord) {
  const originalPhoto = originalTallyPhotoCandidate(farmer.original_tally_data);
  const references = farmerMediaReferences(farmer);
  const profileReference = references.find((reference) => reference.kind === "profile");
  const visualReference = references.find((reference) => reference.kind !== "document");
  const tallyPhotoUrl = firstUrlFromText(farmer.tally_photo_url);
  const url = tallyPhotoUrl || profileReference?.urls[0] || visualReference?.urls[0] || originalPhoto.url;
  const filename = originalPhoto.filename || profileReference?.filenames[0] || visualReference?.filenames[0] || "";

  return {
    url,
    key: tallyPhotoUrl ? "tally_photo_url" : profileReference?.label || visualReference?.label || originalPhoto.key,
    filename
  };
}

function photoSubmittedButNotImported(farmer: ImportedFarmerRecord) {
  const submitted = farmerSubmittedPhotoCandidate(farmer);
  return Boolean((submitted.url || submitted.filename) && !farmer.profile_image_url && !farmer.imported_photo_url);
}

function farmerPhotoDiagnostics(farmer: ImportedFarmerRecord) {
  const originalPhoto = originalTallyPhotoCandidate(farmer.original_tally_data);
  const tallyPhotoUrl = firstUrlFromText(farmer.tally_photo_url);
  const submitted = farmerSubmittedPhotoCandidate(farmer);
  const publicPhoto = publicReviewPhotoUrl(farmer);
  const submittedUrlIsPublic = isPublicReviewPhotoUrl(submitted.url);
  const hasFilenameReference = Boolean(submitted.filename);
  const status = farmer.profile_image_url
    ? "Public profile photo exists"
    : farmer.imported_photo_url
      ? "Imported photo exists"
      : submitted.url && submittedUrlIsPublic
        ? "Tally submitted photo found but not imported"
      : submitted.url
        ? "Tally photo URL found but private/expired"
        : hasFilenameReference
          ? "Photo reference found but could not be loaded"
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
    submittedUrlIsPublic,
    photoImportStatus: farmer.photo_import_status ?? "",
    photoImportNotes: farmer.photo_import_notes ?? ""
  };
}

function displayTallyValue(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "Not provided";
  }

  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function farmerReviewReadiness(farmer: ImportedFarmerRecord) {
  const hasVisualReference = Boolean(
    publicReviewPhotoUrl(farmer) ||
    farmerMediaUrlsByKind(farmer, "farm").length ||
    farmerMediaUrlsByKind(farmer, "produce").length ||
    farmerMediaFilenamesByKind(farmer, "farm").length ||
    farmerMediaFilenamesByKind(farmer, "produce").length ||
    farmerSubmittedPhotoCandidate(farmer).filename
  );

  return [
    { label: "Photo", complete: hasVisualReference, note: farmerPhotoDiagnostics(farmer).status },
    { label: "Products", complete: farmer.products.length > 0, note: "No products listed" },
    { label: "Location", complete: hasReviewValue(farmer.region) && hasReviewValue(farmer.district), note: "Location incomplete" },
    { label: "Contact", complete: hasReviewValue(farmer.phone_number) || hasReviewValue(farmer.whatsapp_number), note: "No phone or WhatsApp" }
  ];
}

function hasReviewValue(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(normalized && !["not provided", "n/a", "na", "none", "ghana"].includes(normalized));
}

function splitDisplayList(value?: string | null) {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
    { label: "Farm photo", complete: Boolean(publicReviewPhotoUrl(farmer) || farmerSubmittedPhotoCandidate(farmer).url || farmerSubmittedPhotoCandidate(farmer).filename || farmerMediaUrlsByKind(farmer, "farm").length || farmerMediaFilenamesByKind(farmer, "farm").length) }
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

function daysSinceDate(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

function farmerQueuePriority(farmer: ImportedFarmerRecord) {
  const daysWaiting = daysSinceDate(farmer.created_at);

  if (daysWaiting >= 3 || farmer.status === "Needs Follow-up") {
    return {
      label: "Overdue",
      tone: "border-l-tomato bg-tomato/5 text-tomato",
      dot: "bg-tomato"
    };
  }

  if (daysWaiting >= 1 || farmer.status === "Under Review") {
    return {
      label: "Due Today",
      tone: "border-l-earth-500 bg-earth-50 text-earth-700",
      dot: "bg-earth-500"
    };
  }

  return {
    label: "New",
    tone: "border-l-leaf-600 bg-leaf-50 text-leaf-700",
    dot: "bg-leaf-600"
  };
}

function farmerWaitingLabel(farmer: ImportedFarmerRecord) {
  const daysWaiting = daysSinceDate(farmer.created_at);

  if (daysWaiting === 0) {
    return "Today";
  }

  if (daysWaiting === 1) {
    return "1 day waiting";
  }

  return `${daysWaiting} days waiting`;
}

function farmerRecommendedAction(farmer: ImportedFarmerRecord) {
  const readiness = farmerReviewReadiness(farmer);
  const missing = readiness.filter((item) => !item.complete).map((item) => item.label);

  if (!readiness.find((item) => item.label === "Contact")?.complete) {
    return "Complete Contact Information";
  }

  if (missing.includes("Photo")) {
    return "Request Farm Photos";
  }

  if (missing.includes("Products")) {
    return "Complete Produce Information";
  }

  if (missing.includes("Location")) {
    return "Call Farmer";
  }

  if (farmer.verification_status !== "Verified") {
    return "Approve";
  }

  return farmer.status === "Active" ? "Review Complete" : "Open Profile Review";
}

function farmerReviewTimeline(farmer: ImportedFarmerRecord) {
  return [
    {
      label: "Submitted",
      detail: farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "Submission date not provided"
    },
    {
      label: "Imported",
      detail: farmer.source || "Tally Import"
    },
    {
      label: "Photos Updated",
      detail: publicReviewPhotoUrl(farmer) ? "Profile photo available" : farmerPhotoDiagnostics(farmer).status
    },
    {
      label: "Previous Review",
      detail: farmer.verification_date
        ? `Verified on ${new Date(farmer.verification_date).toLocaleDateString()}`
        : farmer.verification_notes
          ? "Notes saved"
          : "No previous review recorded"
    }
  ];
}

function farmerUploadedDocuments(farmer: ImportedFarmerRecord) {
  const documentReferences = farmerMediaReferences(farmer).filter((reference) => reference.kind === "document");
  const savedDocuments = farmer.document_urls ?? [];
  const fromReferences = documentReferences.flatMap((reference) => {
    const urls = reference.urls.map((url) => ({ label: reference.label, filename: url, url }));
    const filenames = reference.filenames.map((filename) => ({ label: reference.label, filename, url: "" }));
    return [...urls, ...filenames];
  });

  return [
    ...savedDocuments.map((url) => ({ label: "Uploaded document", filename: url, url })),
    ...fromReferences
  ].filter((document, index, documents) => {
    const key = `${document.label}-${document.filename}`;
    return documents.findIndex((item) => `${item.label}-${item.filename}` === key) === index;
  });
}

function farmerMediaUrlsByKind(farmer: ImportedFarmerRecord, kind: FarmerMediaReference["kind"]) {
  const savedUrls = kind === "farm"
    ? farmer.farm_photo_urls ?? []
    : kind === "produce"
      ? farmer.produce_photo_urls ?? []
      : [];
  const referencedUrls = farmerMediaReferences(farmer)
    .filter((reference) => reference.kind === kind)
    .flatMap((reference) => reference.urls);

  return uniqueStrings([...savedUrls, ...referencedUrls]);
}

function farmerMediaFilenamesByKind(farmer: ImportedFarmerRecord, kind: FarmerMediaReference["kind"]) {
  return uniqueStrings(
    farmerMediaReferences(farmer)
      .filter((reference) => reference.kind === kind)
      .flatMap((reference) => reference.filenames)
  );
}

function farmerMediaSummary(farmer: ImportedFarmerRecord) {
  const farmPhotoCount = farmerMediaUrlsByKind(farmer, "farm").length;
  const producePhotoCount = farmerMediaUrlsByKind(farmer, "produce").length;
  const farmReferenceCount = farmerMediaFilenamesByKind(farmer, "farm").length;
  const produceReferenceCount = farmerMediaFilenamesByKind(farmer, "produce").length;

  if (farmPhotoCount || producePhotoCount) {
    return `${farmPhotoCount} farm photo${farmPhotoCount === 1 ? "" : "s"} and ${producePhotoCount} produce photo${producePhotoCount === 1 ? "" : "s"} found.`;
  }

  if (farmReferenceCount || produceReferenceCount) {
    return "Photo reference found but could not be loaded.";
  }

  if (publicReviewPhotoUrl(farmer)) {
    return "Primary farmer photo is available for profile review.";
  }

  return farmerPhotoDiagnostics(farmer).status;
}

function linkedListingImageUrls(listing: FarmerLinkedMarketplaceListing) {
  return uniqueStrings([
    ...(Array.isArray(listing.image_urls) ? listing.image_urls : []),
    listing.image_url ?? ""
  ].filter(Boolean));
}

function farmerLinkedListingsWithPhotos(farmer: ImportedFarmerRecord) {
  return (farmer.linked_marketplace_listings ?? []).map((listing) => ({
    ...listing,
    images: linkedListingImageUrls(listing)
  }));
}

function FarmerMediaGallery({
  title,
  urls,
  filenames,
  emptyLabel
}: {
  title: string;
  urls: string[];
  filenames: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
      <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">{title}</h4>
      {urls.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {urls.map((url, index) => (
            <div key={`${title}-${url}`} className="overflow-hidden rounded-md bg-leaf-50 ring-1 ring-leaf-900/10">
              <div
                role="img"
                aria-label={`${title} ${index + 1}`}
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${url})` }}
              />
            </div>
          ))}
        </div>
      ) : filenames.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {filenames.map((filename) => (
            <div key={`${title}-${filename}`} className="rounded-md bg-earth-50 p-3 ring-1 ring-earth-500/20">
              <p className="text-sm font-black text-ink">Photo reference found but could not be loaded.</p>
              <p className="mt-1 break-all text-xs font-semibold text-ink/55">{filename}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">{emptyLabel}</p>
      )}
    </div>
  );
}

function launchChecklistFromFarmer(farmer: ImportedFarmerRecord): Record<LaunchChecklistItem, boolean> {
  return {
    "Profile photo": Boolean(publicReviewPhotoUrl(farmer)),
    "Farm photos": Boolean(farmerMediaUrlsByKind(farmer, "farm").length || farmerMediaFilenamesByKind(farmer, "farm").length || publicReviewPhotoUrl(farmer) || farmerSubmittedPhotoCandidate(farmer).filename),
    "Produce photos": Boolean(farmerMediaUrlsByKind(farmer, "produce").length || farmerMediaFilenamesByKind(farmer, "produce").length),
    "Farm story": hasReviewValue(farmer.description),
    "Verified contact": hasReviewValue(farmer.phone_number) || hasReviewValue(farmer.whatsapp_number),
    "Produce listing": farmer.products.length > 0,
    "Region confirmed": hasReviewValue(farmer.region)
  };
}

function defaultEditorialDecision(farmer: ImportedFarmerRecord): EditorialDecisionState {
  const autoChecklist = launchChecklistFromFarmer(farmer);
  const savedChecklist = farmer.launch_checklist && typeof farmer.launch_checklist === "object" ? farmer.launch_checklist : {};
  const checklist = Object.fromEntries(
    launchEditorialChecklistItems.map((item) => [item, savedChecklist[item] ?? autoChecklist[item]])
  ) as Record<LaunchChecklistItem, boolean>;
  const checklistComplete = Object.values(checklist).filter(Boolean).length;
  const persistedLaunchStatus = launchEditorialStatusOptions.includes(farmer.launch_status as LaunchEditorialStatus)
    ? farmer.launch_status as LaunchEditorialStatus
    : null;
  const launchStatus: LaunchEditorialStatus = persistedLaunchStatus ??
    (normalizedFarmerSource(farmer.source) === "Founding Farmer"
      ? "Founding Farmer 2026"
      : checklistComplete >= 5
        ? "Public Farmer"
        : "Needs Improvement");

  return {
    launchStatus,
    homepageCandidate: farmer.homepage_candidate === true,
    marketplaceFeatured: farmer.marketplace_featured === true,
    storyCandidate: farmer.story_candidate === true,
    editorialNotes: farmer.editorial_notes ?? "",
    checklist
  };
}

function launchChecklistProgress(editorial: EditorialDecisionState) {
  const complete = launchEditorialChecklistItems.filter((item) => editorial.checklist[item]).length;
  const total = launchEditorialChecklistItems.length;

  return {
    complete,
    total,
    percent: Math.round((complete / total) * 100)
  };
}

function launchReadiness(editorial: EditorialDecisionState) {
  const progress = launchChecklistProgress(editorial);

  if (editorial.launchStatus === "Hold" || progress.percent < 50) {
    return {
      label: "Hold Until Complete",
      tone: "bg-tomato/10 text-tomato ring-1 ring-tomato/20"
    };
  }

  if (editorial.launchStatus === "Needs Improvement" || progress.percent < 85) {
    return {
      label: "Needs Improvements",
      tone: "bg-earth-50 text-earth-700 ring-1 ring-earth-500/20"
    };
  }

  return {
    label: "Launch Ready",
    tone: "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-700/15"
  };
}

function matchesLaunchEditorialFilter(filter: LaunchEditorialFilter, editorial: EditorialDecisionState) {
  const readiness = launchReadiness(editorial).label;

  if (filter === "Founding Farmers") {
    return editorial.launchStatus === "Founding Farmer 2026";
  }

  if (filter === "Homepage Candidates") {
    return editorial.homepageCandidate;
  }

  if (filter === "Featured Farmers") {
    return editorial.launchStatus === "Featured Farmer" || editorial.marketplaceFeatured;
  }

  if (filter === "Story Candidates") {
    return editorial.storyCandidate;
  }

  if (filter === "Launch Ready") {
    return readiness === "Launch Ready";
  }

  if (filter === "Needs Improvement") {
    return editorial.launchStatus === "Needs Improvement" || readiness === "Needs Improvements";
  }

  return true;
}

function farmerMatchesQueueSearch(farmer: ImportedFarmerRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    farmer.farmer_name,
    farmer.farm_name,
    farmer.region,
    farmer.district,
    farmer.farm_location,
    farmer.phone_number,
    farmer.whatsapp_number,
    farmer.email,
    farmer.farm_type,
    farmer.products.join(" ")
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function applicationName(application: ApplicationRecord) {
  return application.business_name || application.business_or_farm_name || application.name || "Unnamed supplier";
}

function applicationCategories(application: ApplicationRecord) {
  const values = application.categories?.length
    ? application.categories
    : splitDisplayList(application.products_or_services || application.products_services || "");

  return values.filter(Boolean);
}

function applicationRegions(application: ApplicationRecord) {
  const values = application.regions_served?.length
    ? application.regions_served
    : [application.region, application.district].filter(Boolean) as string[];

  return values.filter(Boolean);
}

function supplierQueuePriority(application: ApplicationRecord) {
  const waitingDays = daysSinceDate(application.created_at);

  if (waitingDays >= 2) {
    return {
      label: "Overdue",
      tone: "border-l-tomato bg-tomato/5",
      dot: "bg-tomato"
    };
  }

  if (waitingDays >= 1) {
    return {
      label: "Due Today",
      tone: "border-l-earth-500 bg-earth-50",
      dot: "bg-earth-500"
    };
  }

  return {
    label: "New",
    tone: "border-l-leaf-700 bg-white",
    dot: "bg-leaf-700"
  };
}

function supplierWaitingLabel(application: ApplicationRecord) {
  const days = daysSinceDate(application.created_at);

  if (days <= 0) {
    return "New today";
  }

  return `${days} day${days === 1 ? "" : "s"} waiting`;
}

function supplierReviewTimeline(application: ApplicationRecord) {
  return [
    {
      label: "Submitted",
      detail: application.created_at ? new Date(application.created_at).toLocaleDateString() : "Submission date not provided"
    },
    {
      label: "Updated",
      detail: application.updated_at ? new Date(application.updated_at).toLocaleDateString() : "No update recorded"
    },
    {
      label: "Previous Review",
      detail: application.status === "New"
        ? "No previous review recorded"
        : `Application marked ${application.status}`
    }
  ];
}

function supplierUploadedDocuments(application: ApplicationRecord) {
  const certificates = application.certificate_urls ?? [];

  return certificates.map((url, index) => ({
    label: index === 0 ? "Certificate" : `Certificate ${index + 1}`,
    filename: url
  }));
}

function supplierReviewReadiness(application: ApplicationRecord) {
  const categories = applicationCategories(application);
  const regions = applicationRegions(application);

  return [
    {
      label: application.logo_url ? "Business logo available" : "Missing business logo",
      complete: Boolean(application.logo_url),
      note: "Missing Business Logo"
    },
    {
      label: application.photo_urls?.length ? "Business photos available" : "Missing business photos",
      complete: Boolean(application.photo_urls?.length),
      note: "Missing Business Photos"
    },
    {
      label: categories.length ? "Supplier categories provided" : "Missing categories",
      complete: categories.length > 0,
      note: "Missing Categories"
    },
    {
      label: application.registration_number ? "Registration supplied" : "Registration not supplied",
      complete: hasReviewValue(application.registration_number),
      note: "Missing Registration"
    },
    {
      label: application.phone || application.email ? "Contact information available" : "Contact information missing",
      complete: hasReviewValue(application.phone) || hasReviewValue(application.email),
      note: "Missing Contact"
    },
    {
      label: regions.length ? "Regions served provided" : "Regions served missing",
      complete: regions.length > 0,
      note: "Missing Regions"
    }
  ];
}

function supplierRecommendedAction(application: ApplicationRecord) {
  const readiness = supplierReviewReadiness(application);
  const missing = readiness.find((item) => !item.complete);

  if (!missing) {
    return "Approve";
  }

  if (missing.note === "Missing Registration") {
    return "Request Business Registration";
  }

  if (missing.note === "Missing Business Photos" || missing.note === "Missing Business Logo") {
    return "Request Better Photos";
  }

  if (missing.note === "Missing Contact") {
    return "Call Supplier";
  }

  return "Request More Information";
}

function supplierLaunchChecklistFromApplication(application: ApplicationRecord): Record<SupplierChecklistItem, boolean> {
  return {
    "Business logo": Boolean(application.logo_url),
    "Business photos": Boolean(application.photo_urls?.length),
    "Products or services": applicationCategories(application).length > 0 || hasReviewValue(application.products_or_services) || hasReviewValue(application.products_services),
    "Business description": hasReviewValue(application.business_description) || hasReviewValue(application.notes),
    "Verified contact": hasReviewValue(application.phone) || hasReviewValue(application.email),
    "Regions served": applicationRegions(application).length > 0,
    "Registration reviewed": hasReviewValue(application.registration_number)
  };
}

function defaultSupplierEditorialDecision(application: ApplicationRecord): SupplierEditorialDecisionState {
  const autoChecklist = supplierLaunchChecklistFromApplication(application);
  const savedChecklist = application.launch_checklist && typeof application.launch_checklist === "object" ? application.launch_checklist : {};
  const checklist = Object.fromEntries(
    supplierLaunchChecklistItems.map((item) => [item, savedChecklist[item] ?? autoChecklist[item]])
  ) as Record<SupplierChecklistItem, boolean>;
  const complete = Object.values(checklist).filter(Boolean).length;
  const persistedLaunchStatus = supplierLaunchStatusOptions.includes(application.launch_status as SupplierLaunchStatus)
    ? application.launch_status as SupplierLaunchStatus
    : null;

  return {
    launchStatus: persistedLaunchStatus ?? (complete >= 5 ? "Public Supplier" : "Needs Improvement"),
    homepageCandidate: application.homepage_candidate === true,
    marketplaceFeatured: application.marketplace_featured === true,
    storyCandidate: application.story_candidate === true,
    editorialNotes: application.editorial_notes ?? "",
    checklist
  };
}

function supplierLaunchChecklistProgress(editorial: SupplierEditorialDecisionState) {
  const complete = supplierLaunchChecklistItems.filter((item) => editorial.checklist[item]).length;
  const total = supplierLaunchChecklistItems.length;

  return {
    complete,
    total,
    percent: Math.round((complete / total) * 100)
  };
}

function supplierLaunchReadiness(editorial: SupplierEditorialDecisionState) {
  const progress = supplierLaunchChecklistProgress(editorial);

  if (editorial.launchStatus === "Hold" || progress.percent < 50) {
    return {
      label: "Hold Until Complete",
      tone: "bg-tomato/10 text-tomato ring-1 ring-tomato/20"
    };
  }

  if (editorial.launchStatus === "Needs Improvement" || progress.percent < 85) {
    return {
      label: "Needs Improvements",
      tone: "bg-earth-50 text-earth-700 ring-1 ring-earth-500/20"
    };
  }

  return {
    label: "Launch Ready",
    tone: "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-700/15"
  };
}

function matchesSupplierEditorialFilter(filter: SupplierEditorialFilter, application: ApplicationRecord, editorial: SupplierEditorialDecisionState) {
  const readiness = supplierLaunchReadiness(editorial).label;
  const priority = supplierQueuePriority(application).label;

  if (filter === "Founding Suppliers") {
    return editorial.launchStatus === "Founding Supplier 2026";
  }

  if (filter === "Featured Suppliers") {
    return editorial.launchStatus === "Featured Supplier" || editorial.marketplaceFeatured;
  }

  if (filter === "Homepage Candidates") {
    return editorial.homepageCandidate;
  }

  if (filter === "Launch Ready") {
    return readiness === "Launch Ready";
  }

  if (filter === "Needs Improvement") {
    return readiness !== "Launch Ready" || editorial.launchStatus === "Needs Improvement";
  }

  if (filter === "Overdue") {
    return priority === "Overdue";
  }

  if (filter === "New") {
    return application.status === "New" || application.status === "Pending" || priority === "New";
  }

  return true;
}

function sourcingStatusFromSubmission(status: SubmissionStatus): SourcingCaseStatus {
  if (status === "Under Review") {
    return "Reviewing";
  }

  if (status === "Approved" || status === "Published") {
    return "Matching Farmers";
  }

  if (status === "Converted") {
    return "Completed";
  }

  if (status === "Rejected") {
    return "Closed";
  }

  return "New";
}

function sourcingCaseFromLead(lead: LeadRequestRecord): SourcingCaseRecord | null {
  const status = normalizeLeadStatus(lead.status);

  if (status !== "Negotiating") {
    return null;
  }

  const deliveryLocation = leadRequestLocation(lead);

  return {
    id: lead.id,
    product_needed: lead.product_interest,
    quantity: lead.quantity_needed ?? "",
    company_name: lead.company_name ?? null,
    phone_number: lead.phone,
    region: "",
    district: deliveryLocation,
    buyer_name: lead.requester_name,
    buyer_type: lead.company_name ? "Company Buyer" : "Buyer",
    whatsapp_number: lead.whatsapp,
    preferred_delivery: deliveryLocation,
    deadline: lead.required_by ?? "",
    notes: lead.message,
    status: "Approved",
    created_at: lead.created_at,
    updated_at: lead.created_at,
    case_source: "lead_request",
    lead_request_status: lead.status,
    request_source: lead.request_source,
    source_type: lead.source_type,
    source_name: lead.source_name,
    linked_source: lead.source_slug ?? lead.marketplace_listing_id ?? lead.farmer_profile_id ?? lead.supplier_profile_id ?? lead.source_id,
    marketplace_listing_id: lead.marketplace_listing_id ?? null,
    farmer_profile_id: lead.farmer_profile_id ?? null,
    supplier_profile_id: lead.supplier_profile_id ?? null,
    listing_snapshot: lead.listing_snapshot ?? null
  };
}

function sourcingCaseFromBuyerSubmission(request: BuyerRequestSubmissionRecord): SourcingCaseRecord {
  return {
    ...request,
    case_source: "buyer_request_submission"
  };
}

function defaultSourcingCaseStatus(caseItem: SourcingCaseRecord): SourcingCaseStatus {
  if (caseItem.case_source === "lead_request") {
    return "Active Sourcing";
  }

  return sourcingStatusFromSubmission(caseItem.status);
}

function sourcingCaseOperationalStatusLabel(status: SourcingCaseStatus) {
  if (status === "New") {
    return "Pending Review";
  }

  if (status === "Reviewing") {
    return "Contacted";
  }

  if (["Active Sourcing", "Matching Farmers", "Matching Suppliers", "Waiting Buyer"].includes(status)) {
    return "Active Sourcing";
  }

  return status === "Closed" ? "Lost" : status;
}

function sourcingCaseStatusClass(status: SourcingCaseStatus) {
  const label = sourcingCaseOperationalStatusLabel(status);

  if (label === "Pending Review") {
    return "admin-status-pending";
  }

  if (label === "Contacted") {
    return "admin-status-contacted";
  }

  if (label === "Active Sourcing") {
    return "admin-status-active";
  }

  if (label === "Completed") {
    return "admin-status-complete";
  }

  return "admin-status-danger";
}

function dateAtStart(value?: string | null) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function addBusinessDay(value?: string | null) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  date.setDate(date.getDate() + (date.getDay() === 5 ? 3 : date.getDay() === 6 ? 2 : 1));
  return date;
}

function sourcingSla(submittedAt?: string | null) {
  const deadline = addBusinessDay(submittedAt);
  const now = new Date();
  const hoursRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

  return {
    deadline,
    hoursRemaining,
    tone: hoursRemaining < 0 ? "bg-tomato/10 text-tomato" : hoursRemaining <= 6 ? "bg-earth-50 text-earth-700" : "bg-leaf-50 text-leaf-800"
  };
}

function sourcingPriority(caseItem: SourcingCaseRecord, state: SourcingCaseState) {
  const today = dateAtStart(new Date().toISOString());
  const requestDeadline = dateAtStart(caseItem.deadline);
  const sla = sourcingSla(caseItem.created_at);

  if (state.status === "Completed" || state.status === "Closed") {
    return { label: "Complete", tone: "bg-ink/10 text-ink/55", dot: "bg-ink/35" };
  }

  if ((requestDeadline && today && requestDeadline < today) || sla.hoursRemaining < 0) {
    return { label: "Overdue", tone: "bg-tomato/10 text-tomato", dot: "bg-tomato" };
  }

  if (requestDeadline && today && requestDeadline.getTime() === today.getTime()) {
    return { label: "Due Today", tone: "bg-earth-50 text-earth-700", dot: "bg-earth-500" };
  }

  return { label: "New", tone: "bg-leaf-50 text-leaf-800", dot: "bg-leaf-700" };
}

function sourcingTimeline(caseItem: SourcingCaseRecord, state: SourcingCaseState, activityRows: AdminActivityRecord[]) {
  const buyerContacted = sourcingCaseHasActivity({
    caseId: caseItem.id,
    activityRows,
    action: "Contact"
  });
  const matchReviewed = sourcingCaseHasActivity({
    caseId: caseItem.id,
    activityRows,
    action: "Review"
  });
  const availabilityConfirmed = sourcingCaseHasActivity({
    caseId: caseItem.id,
    activityRows,
    action: "Approve",
    marker: "availability"
  });
  const completed = caseItem.case_source === "lead_request"
    ? normalizeLeadStatus(caseItem.lead_request_status ?? "New") === "Completed"
    : state.status === "Completed";

  return [
    { label: "Request received", detail: caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : "Date not captured", complete: true },
    { label: "Buyer contacted", detail: buyerContacted ? "Buyer contact recorded" : "Not recorded", complete: buyerContacted },
    { label: "Farmers/Suppliers matched", detail: matchReviewed ? "Match review recorded" : "Not started", complete: matchReviewed },
    { label: "Availability confirmed", detail: availabilityConfirmed ? "Availability confirmed" : "Not confirmed", complete: availabilityConfirmed },
    { label: "Completed", detail: completed ? "Case completed" : "Still open", complete: completed }
  ];
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

function sourceLabel(sourceType: WhatsAppLeadRecord["source_type"] | LeadRequestRecord["source_type"]) {
  return sourceType === "Floating WhatsApp" ? "Floating Button" : sourceType;
}

function leadRequestSourceLabel(source?: LeadRequestSource | null) {
  if (source === "marketplace_listing") {
    return "Marketplace listing request";
  }

  if (source === "farmer_profile") {
    return "Farmer profile request";
  }

  if (source === "supplier_profile") {
    return "Supplier profile request";
  }

  if (source === "generic_sourcing") {
    return "Generic sourcing request";
  }

  return "Legacy request";
}

const leadPipelineStatuses: LeadRequestStatus[] = ["New", "Contacted", "Negotiating", "Completed", "Lost"];
const leadFunnelStatuses: LeadRequestStatus[] = ["New", "Contacted", "Negotiating", "Completed"];
const produceRequestStatusFilters: ProduceRequestStatusFilter[] = ["All", "Pending Review", "Contacted", "Active Sourcing", "Completed", "Lost"];

function normalizeLeadStatus(status: LeadRequestRecord["status"]): LeadRequestStatus {
  return status === "Closed" ? "Completed" : status;
}

function leadReviewStatusLabel(status: LeadRequestRecord["status"]) {
  const normalized = normalizeLeadStatus(status);

  if (normalized === "New") {
    return "Pending Review";
  }

  if (normalized === "Negotiating") {
    return "Active Sourcing";
  }

  return normalized;
}

function leadMatchesProduceRequestStatus(lead: LeadRequestRecord, filter: ProduceRequestStatusFilter) {
  return filter === "All" || leadReviewStatusLabel(lead.status) === filter;
}

function produceRequestFilterTitle(filter: ProduceRequestStatusFilter) {
  if (filter === "Pending Review") {
    return "Awaiting review";
  }

  if (filter === "Active Sourcing") {
    return "Active sourcing";
  }

  if (filter === "All") {
    return "All private requests";
  }

  return filter;
}

function leadStatusClass(status: LeadRequestStatus) {
  if (status === "New") {
    return "admin-status-badge admin-status-pending";
  }

  if (status === "Contacted") {
    return "admin-status-badge admin-status-contacted";
  }

  if (status === "Negotiating") {
    return "admin-status-badge admin-status-active";
  }

  if (status === "Completed") {
    return "admin-status-badge admin-status-complete";
  }

  return "admin-status-badge admin-status-danger";
}

function featuredEnquiryStatusClass(status: FeaturedEnquiryStatus) {
  if (status === "New") {
    return "admin-status-badge admin-status-pending";
  }

  if (status === "Contacted") {
    return "admin-status-badge admin-status-contacted";
  }

  if (status === "Approved") {
    return "admin-status-badge admin-status-complete";
  }

  if (status === "Rejected") {
    return "admin-status-badge admin-status-danger";
  }

  return "admin-status-badge admin-status-paused";
}

function featuredEnquiryMetricAccent(status: FeaturedEnquiryStatus) {
  if (status === "New") {
    return "admin-metric-pending";
  }

  if (status === "Contacted") {
    return "admin-metric-contacted";
  }

  if (status === "Approved") {
    return "admin-metric-complete";
  }

  return status === "Rejected" ? "admin-metric-danger" : "admin-metric-active";
}

function featuredFollowUpMessage(enquiry: FeaturedEnquiryRecord) {
  return `Hello ${enquiry.name}, thank you for your interest in featured placement on Ghana Growers. We will review your profile/listing (${enquiry.profile_or_listing_name}) and follow up with next steps.`;
}

function leadStatusCount(leads: LeadRequestRecord[], status: LeadRequestStatus) {
  return leads.filter((lead) => normalizeLeadStatus(lead.status) === status).length;
}

function leadRequestLinkedSource(lead: LeadRequestRecord) {
  const snapshotProduct = lead.listing_snapshot?.product;
  const snapshotSeller = lead.listing_snapshot?.seller ? publicSellerDisplayName(lead.listing_snapshot.seller) : "";

  if (snapshotProduct && snapshotSeller) {
    return `${snapshotProduct} — ${snapshotSeller}`;
  }

  if (snapshotProduct) {
    return snapshotProduct;
  }

  return lead.marketplace_listing_id ?? lead.farmer_profile_id ?? lead.supplier_profile_id ?? lead.source_slug ?? lead.source_id;
}

function leadRequestLocation(lead: LeadRequestRecord) {
  return lead.delivery_location ?? lead.location ?? lead.listing_snapshot?.location ?? "Not supplied";
}

function leadRequestSearchValue(lead: LeadRequestRecord) {
  return [
    lead.requester_name,
    lead.company_name,
    lead.phone,
    lead.whatsapp,
    lead.product_interest,
    lead.quantity_needed,
    lead.message,
    lead.location,
    lead.delivery_location,
    lead.required_by,
    lead.source_name,
    leadRequestSourceLabel(lead.request_source),
    leadReviewStatusLabel(lead.status),
    leadRequestLinkedSource(lead),
    lead.listing_snapshot?.product,
    lead.listing_snapshot?.seller,
    lead.listing_snapshot?.location,
    lead.listing_snapshot?.pricePackage,
    lead.listing_snapshot?.listedQuantity,
    lead.listing_snapshot?.availability
  ].filter(Boolean).join(" ").toLowerCase();
}

function sourcingCaseLocation(caseItem: SourcingCaseRecord) {
  if (caseItem.case_source === "lead_request") {
    return caseItem.preferred_delivery || caseItem.district || "Not supplied";
  }

  return [caseItem.district, caseItem.region].filter(Boolean).join(", ") || "Not supplied";
}

function sourcingCaseSourceLabel(caseItem: SourcingCaseRecord) {
  if (caseItem.case_source === "lead_request") {
    return leadRequestSourceLabel(caseItem.request_source);
  }

  return "Legacy buyer request";
}

function sourcingCaseLinkedSource(caseItem: SourcingCaseRecord) {
  if (caseItem.case_source === "lead_request") {
    const snapshotProduct = caseItem.listing_snapshot?.product ?? caseItem.source_name ?? "";
    const snapshotSeller = caseItem.listing_snapshot?.seller ? publicSellerDisplayName(caseItem.listing_snapshot.seller) : "";
    const sourceName = caseItem.source_name ? publicSellerDisplayName(caseItem.source_name) : "";

    if (snapshotProduct && snapshotSeller) {
      return `${snapshotProduct} — ${snapshotSeller}`;
    }

    return snapshotProduct || sourceName || caseItem.linked_source || "Not linked";
  }

  return "Buyer request submission";
}

function sourcingCaseHref(caseItem: SourcingCaseRecord) {
  if (caseItem.case_source !== "lead_request") {
    return "";
  }

  if (caseItem.request_source === "marketplace_listing" && (caseItem.marketplace_listing_id || caseItem.linked_source)) {
    return `/marketplace/${caseItem.linked_source ?? caseItem.marketplace_listing_id}`;
  }

  if (caseItem.request_source === "farmer_profile" && caseItem.linked_source) {
    return `/farmer-directory/${caseItem.linked_source}`;
  }

  if (caseItem.request_source === "supplier_profile" && caseItem.linked_source) {
    return `/supplier-directory/${caseItem.linked_source}`;
  }

  return "";
}

function publicSellerDisplayName(value: string) {
  return /narteh\s+samuel\s+kweku/i.test(value) ? "S. K. Nart Farms" : value;
}

function sourcingCaseActivityRows(caseId: string, activityRows: AdminActivityRecord[]) {
  return activityRows.filter(
    (activity) =>
      activity.entity_type === "Match Opportunity" &&
      Boolean(activity.entity_id) &&
      (activity.entity_id === caseId || activity.entity_id?.startsWith(`${caseId}:`))
  );
}

function sourcingCaseCommunicationRows(caseId: string, activityRows: AdminActivityRecord[]) {
  return sourcingCaseActivityRows(caseId, activityRows).filter((activity) => activity.action_type === "Contact");
}

function sourcingCaseHasActivity({
  caseId,
  activityRows,
  action,
  marker
}: {
  caseId: string;
  activityRows: AdminActivityRecord[];
  action: AdminActivityRecord["action_type"];
  marker?: string;
}) {
  return sourcingCaseActivityRows(caseId, activityRows).some(
    (activity) =>
      activity.action_type === action &&
      (!marker || activity.entity_id === `${caseId}:${marker}` || activity.entity_name.toLowerCase().includes(marker.toLowerCase()))
  );
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

function buyerApplicationMatchSummary(application: BuyerRequestSubmissionRecord | SourcingCaseRecord, analytics: AnalyticsData) {
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
    profileRecordId: textValue(record, "id") || id,
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
    ggStandardStatus: textValue(record, "gg_standard_status") || "Pending",
    href: status === "Active" ? `/farmer-directory/${id}` : undefined,
    verificationTarget: { subject: "farmer", recordId: id }
  };
}

function adminSupplierRowFromAnalytics(record: AnalyticsRecord): AdminRow {
  const id = textValue(record, "slug") || textValue(record, "id");

  return {
    id,
    profileRecordId: textValue(record, "id") || id,
    name: textValue(record, "company_name") || "Supplier record",
    type: textValue(record, "category") || "Supplier",
    region: textValue(record, "region") || "Ghana",
    status: textValue(record, "status") === "Archived" ? "Archived" : statusFromTrust(textValue(record, "verification_status")),
    dateAdded: textValue(record, "created_at")?.slice(0, 10) || "2026-06-07",
    isFeatured: recordBoolean(record, "is_featured"),
    featuredUntil: textValue(record, "featured_until"),
    featuredNote: textValue(record, "featured_note"),
    ggStandardStatus: textValue(record, "gg_standard_status") || "Pending",
    href: `/supplier-directory/${id}`,
    verificationTarget: { subject: "supplier", recordId: id }
  };
}

function adminMarketplaceRowFromAnalytics(record: AnalyticsRecord): AdminRow {
  const id = textValue(record, "slug") || textValue(record, "id");
  const ownerType = textValue(record, "owner_type") || (textValue(record, "seller_type") === "Supplier" ? "Supplier" : "Admin");
  const ownerName = textValue(record, "owner_name") || textValue(record, "seller_name") || "Ghana Growers";
  const imageUrls = arrayValue(record, "image_urls");

  return {
    id,
    name: textValue(record, "product_name") || "Marketplace listing",
    type: textValue(record, "category") || "Marketplace Listing",
    region: textValue(record, "region") || "Ghana",
    status: textValue(record, "status") === "Archived" ? "Archived" : "Active",
    dateAdded: textValue(record, "created_at")?.slice(0, 10) || "2026-06-07",
    district: textValue(record, "district"),
    sellerFarmer: textValue(record, "seller_name"),
    ownerType,
    ownerId: textValue(record, "owner_id"),
    ownerName,
    quantity: textValue(record, "quantity"),
    unit: textValue(record, "unit"),
    sellingMethod: textValue(record, "selling_method"),
    sellingUnit: textValue(record, "selling_unit"),
    customUnitLabel: textValue(record, "custom_unit_label"),
    customUnitReviewed: recordBoolean(record, "custom_unit_reviewed"),
    unitSizeValue: textValue(record, "unit_size_value"),
    unitSizeMeasure: textValue(record, "unit_size_measure"),
    unitSizeApproximate: recordBoolean(record, "unit_size_approximate"),
    priceAmount: textValue(record, "price_amount"),
    priceCurrency: textValue(record, "price_currency"),
    priceBasis: textValue(record, "price_basis"),
    unitsAvailable: textValue(record, "units_available"),
    totalQuantityValue: textValue(record, "total_quantity_value"),
    totalQuantityMeasure: textValue(record, "total_quantity_measure"),
    minimumOrderValue: textValue(record, "minimum_order_value"),
    minimumOrderUnit: textValue(record, "minimum_order_unit"),
    priceRange: textValue(record, "price_range"),
    availability: textValue(record, "availability"),
    supplyFrequency: textValue(record, "supply_frequency"),
    availableFromDate: textValue(record, "available_from_date"),
    gradeDescription: textValue(record, "grade_description"),
    deliveryDetails: textValue(record, "delivery_details"),
    recordSource: textValue(record, "record_source"),
    whatsapp: textValue(record, "whatsapp_number"),
    description: textValue(record, "description"),
    internalOperationsNotes: textValue(record, "internal_operations_notes"),
    imageUrl: textValue(record, "image_url"),
    imageUrls,
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
      gg_standard_status: farmer.ggStandardStatus ?? "Pending",
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
      gg_standard_status: supplier.ggStandardStatus ?? "Pending",
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

function AdminOptionalQueueNotice({
  state,
  unavailableMessage,
  error,
  onRetry
}: {
  state: OptionalQueueLoadState;
  unavailableMessage: string;
  error: string;
  onRetry: () => void;
}) {
  if (state === "available") {
    return null;
  }

  if (state === "error") {
    return (
      <div className="admin-feedback-error p-5 text-sm font-semibold leading-6" role="alert">
        <p>{error}</p>
        <button type="button" onClick={onRetry} className="admin-action-secondary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-empty-state p-5 text-sm font-semibold leading-6" role="status">
      {state === "unavailable" ? unavailableMessage : "Loading this optional admin queue..."}
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
  const initialNavigationItem = defaultNavigationItem(initialSection);
  const [activeSection, setActiveSection] = useState<AdminSectionId>(initialSection);
  const [activeNavigationKey, setActiveNavigationKey] = useState(initialNavigationItem.key);
  const [expandedNavigationGroup, setExpandedNavigationGroup] = useState(() => groupForNavigationKey(initialNavigationItem.key));
  const [analyticsView, setAnalyticsView] = useState<AdminAnalyticsView>(initialNavigationItem.analyticsView ?? "operations");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ImportAdminStatus>("All");
  const [farmerSourceFilter, setFarmerSourceFilter] = useState<FarmerSourceFilter>("All");
  const [profileCompletenessFilter, setProfileCompletenessFilter] = useState<ProfileCompletenessFilter>("All");
  const [launchEditorialFilter, setLaunchEditorialFilter] = useState<LaunchEditorialFilter>("All");
  const [farmerQueueSearch, setFarmerQueueSearch] = useState("");
  const [marketplaceOwnerFilter, setMarketplaceOwnerFilter] = useState<MarketplaceOwnerFilter>("All");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("All");
  const [selectedFarmerRowIds, setSelectedFarmerRowIds] = useState<string[]>([]);
  const [expandedFarmerRowIds, setExpandedFarmerRowIds] = useState<string[]>([]);
  const [pendingFarmerBulkAction, setPendingFarmerBulkAction] = useState<FarmerBulkAction | null>(null);
  const [isUpdatingFarmersBulk, setIsUpdatingFarmersBulk] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ImportAdminStatus>>({});
  const [notice, setNotice] = useState("Choose the next item in the queue and keep daily operations moving.");
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const marketplaceDescriptionDraftRef = useRef("");
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
  const [whatsappLeadLoadState, setWhatsappLeadLoadState] = useState<OptionalQueueLoadState>("idle");
  const [leadRequests, setLeadRequests] = useState<LeadRequestRecord[]>([]);
  const [leadRequestError, setLeadRequestError] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [produceRequestStatusFilter, setProduceRequestStatusFilter] = useState<ProduceRequestStatusFilter>("All");
  const [featuredEnquiries, setFeaturedEnquiries] = useState<FeaturedEnquiryRecord[]>([]);
  const [featuredEnquiryError, setFeaturedEnquiryError] = useState("");
  const [featuredEnquiryLoadState, setFeaturedEnquiryLoadState] = useState<OptionalQueueLoadState>("idle");
  const [selectedFeaturedEnquiryId, setSelectedFeaturedEnquiryId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [closedMatchIds, setClosedMatchIds] = useState<string[]>([]);
  const [selectedSourcingCaseId, setSelectedSourcingCaseId] = useState<string>("");
  const [selectedSourcingCaseTab, setSelectedSourcingCaseTab] = useState<SourcingCaseTab>("Overview");
  const [showSourcingCaseDetailMobile, setShowSourcingCaseDetailMobile] = useState(false);
  const [sourcingQueueFilter, setSourcingQueueFilter] = useState<SourcingQueueFilter>("All");
  const [sourcingCaseStates, setSourcingCaseStates] = useState<Record<string, SourcingCaseState>>({});
  const [applications, setApplications] = useState<Record<ApplicationKind, ApplicationRecord[]>>({
    farmer: [],
    buyer: [],
    supplier: []
  });
  const [applicationTab, setApplicationTab] = useState<ApplicationKind>("farmer");
  const [applicationError, setApplicationError] = useState("");
  const [applicationDiagnostics, setApplicationDiagnostics] = useState<Partial<Record<ApplicationKind, string[]>>>({});
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
  const [pendingFarmerReviewAction, setPendingFarmerReviewAction] = useState<"under-review" | "needs-follow-up" | "verify" | "verify-only" | "reject" | "archive" | "notes" | "import-photo" | "gg-standard" | null>(null);
  const [uploadingFarmerAsset, setUploadingFarmerAsset] = useState<string | null>(null);
  const [farmerReviewMessage, setFarmerReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoadingFarmerReview, setIsLoadingFarmerReview] = useState(false);
  const [farmerReviewDebug, setFarmerReviewDebug] = useState<Record<string, unknown> | null>(null);
  const [editorialDecisions, setEditorialDecisions] = useState<Record<string, EditorialDecisionState>>({});
  const [editorialSaveStates, setEditorialSaveStates] = useState<Record<string, "idle" | "dirty" | "saving" | "saved" | "error">>({});
  const editorialSaveVersions = useRef<Record<string, number>>({});
  const [supplierEditorialFilter, setSupplierEditorialFilter] = useState<SupplierEditorialFilter>("All");
  const [reviewingSupplierId, setReviewingSupplierId] = useState<string | null>(null);
  const [supplierReviewNotes, setSupplierReviewNotes] = useState("");
  const [supplierReviewMessage, setSupplierReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingSupplierReview, setIsUpdatingSupplierReview] = useState(false);
  const [pendingSupplierReviewAction, setPendingSupplierReviewAction] = useState<ApplicationStatus | "archive" | null>(null);
  const [supplierEditorialDecisions, setSupplierEditorialDecisions] = useState<Record<string, SupplierEditorialDecisionState>>({});
  const [supplierEditorialSaveStates, setSupplierEditorialSaveStates] = useState<Record<string, "idle" | "dirty" | "saving" | "saved" | "error">>({});
  const [manualLaunchStatuses, setManualLaunchStatuses] = useState<Record<ManualLaunchChecklistItem, LaunchStatus>>(() =>
    Object.fromEntries(manualLaunchChecklistItems.map((item) => [item, "Incomplete"])) as Record<ManualLaunchChecklistItem, LaunchStatus>
  );
  const marketplaceDescriptionDraftValues = useMemo(
    () => ({
      category: formValues.category ?? "",
      ownerName: formValues.ownerName ?? "",
      ownerType: formValues.ownerType ?? "",
      productName: formValues.productName ?? "",
      region: formValues.region ?? "",
      sellerFarmer: formValues.sellerFarmer ?? ""
    }),
    [formValues.category, formValues.ownerName, formValues.ownerType, formValues.productName, formValues.region, formValues.sellerFarmer]
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

  useEffect(() => {
    if (activeForm?.id !== "marketplace" || activeForm.mode !== "add") {
      marketplaceDescriptionDraftRef.current = "";
      return;
    }

    const draft = marketplaceListingDescriptionDraft(marketplaceDescriptionDraftValues);

    if (!draft) {
      return;
    }

    setFormValues((current) => {
      const currentDescription = current.description ?? "";
      const previousDraft = marketplaceDescriptionDraftRef.current;

      if (currentDescription.trim() && currentDescription !== previousDraft) {
        return current;
      }

      if (currentDescription === draft) {
        return current;
      }

      marketplaceDescriptionDraftRef.current = draft;
      return {
        ...current,
        description: draft
      };
    });
  }, [activeForm?.id, activeForm?.mode, marketplaceDescriptionDraftValues]);

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
    setWhatsappLeadLoadState("loading");
    setWhatsappLeadError("");
    const response = await fetch("/api/admin/whatsapp-leads", { cache: "no-store" }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      leads?: WhatsAppLeadRecord[];
      availability?: "available" | "unavailable";
      error?: string;
    } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setWhatsappLeadLoadState("error");
      setWhatsappLeadError(result?.error ?? "WhatsApp click activity could not be loaded. Please try again.");
      return;
    }

    if (result?.availability === "unavailable") {
      setWhatsappLeads([]);
      setWhatsappLeadLoadState("unavailable");
      setWhatsappLeadError("");
      return;
    }

    setWhatsappLeads(result?.leads ?? []);
    setWhatsappLeadLoadState("available");
    setWhatsappLeadError("");
  }, []);

  useEffect(() => {
    if (activeSection === "whatsapp-leads" || (activeSection === "analytics" && analyticsView === "analytics")) {
      void loadWhatsAppLeads();
    }
  }, [activeSection, analyticsView, loadWhatsAppLeads]);

  const loadLeadRequests = useCallback(async () => {
    const response = await fetch("/api/admin/lead-requests", { cache: "no-store" }).catch(() => null);
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
    setFeaturedEnquiryLoadState("loading");
    setFeaturedEnquiryError("");
    const response = await fetch("/api/admin/featured-enquiries", { cache: "no-store" }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      enquiries?: FeaturedEnquiryRecord[];
      availability?: "available" | "unavailable";
      error?: string;
    } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFeaturedEnquiryLoadState("error");
      setFeaturedEnquiryError(result?.error ?? "Featured enquiries could not be loaded. Please try again.");
      return;
    }

    if (result?.availability === "unavailable") {
      setFeaturedEnquiries([]);
      setSelectedFeaturedEnquiryId(null);
      setFeaturedEnquiryLoadState("unavailable");
      setFeaturedEnquiryError("");
      return;
    }

    const enquiries = result?.enquiries ?? [];
    setFeaturedEnquiries(enquiries);
    setSelectedFeaturedEnquiryId((current) => current ?? enquiries[0]?.id ?? null);
    setFeaturedEnquiryLoadState("available");
    setFeaturedEnquiryError("");
  }, []);

  useEffect(() => {
    if (activeSection === "featured-enquiries") {
      void loadFeaturedEnquiries();
    }
  }, [activeSection, loadFeaturedEnquiries]);

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
      diagnostics?: Partial<Record<ApplicationKind, string[]>>;
    } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setApplicationError(adminDiagnosticMessage(result, "Applications are unavailable."));
      return;
    }

    setApplications({
      farmer: result?.farmers ?? [],
      buyer: result?.buyers ?? [],
      supplier: result?.suppliers ?? []
    });
    setSupplierEditorialDecisions(
      Object.fromEntries((result?.suppliers ?? []).map((supplier) => [supplier.id, defaultSupplierEditorialDecision(supplier)]))
    );
    setApplicationDiagnostics(result?.diagnostics ?? {});
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
    setEditorialDecisions(
      Object.fromEntries(farmers.map((farmer) => [farmer.id, defaultEditorialDecision(farmer)]))
    );
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
    if (activeSection === "farmer-import" || (activeSection === "applications" && applicationTab === "farmer")) {
      void loadImportedFarmers();
    }
  }, [activeSection, applicationTab, loadImportedFarmers]);

  const newApplicationCounts = useMemo(() => ({
    farmers: applications.farmer.filter(applicationNeedsReview).length,
    buyers: applications.buyer.filter(applicationNeedsReview).length,
    suppliers: applications.supplier.filter(applicationNeedsReview).length
  }), [applications]);
  const newSubmissionCounts = useMemo(() => ({
    listings: submissions.listings.filter((submission) => submission.status === "New").length,
    buyerRequests: submissions.buyerRequests.filter((submission) => submission.status === "New").length
  }), [submissions]);
  const sourcingCaseRequests = useMemo(() => {
    const leadCases = leadRequests
      .map(sourcingCaseFromLead)
      .filter((caseItem): caseItem is SourcingCaseRecord => Boolean(caseItem));
    const legacySubmissionCases = submissions.buyerRequests.map(sourcingCaseFromBuyerSubmission);

    return [...leadCases, ...legacySubmissionCases];
  }, [leadRequests, submissions.buyerRequests]);
  const sourcingCases = useMemo(
    () =>
      sourcingCaseRequests.map((request) => {
        const state = sourcingCaseStates[request.id] ?? {
          status: defaultSourcingCaseStatus(request),
          owner: "",
          notes: ""
        };
        const matches = buyerApplicationMatchSummary(request, analyticsData ?? localAnalyticsFallback(whatsappLeads, leadRequests));
        const priority = sourcingPriority(request, state);

        return { request, state, matches, priority };
      }),
    [analyticsData, leadRequests, sourcingCaseRequests, sourcingCaseStates, whatsappLeads]
  );
  const filteredSourcingCases = useMemo(() => sourcingCases.filter((caseItem) => {
    if (sourcingQueueFilter === "All") {
      return true;
    }

    if (sourcingQueueFilter === "New") {
      return caseItem.state.status === "New";
    }

    if (sourcingQueueFilter === "Overdue" || sourcingQueueFilter === "Due Today") {
      return caseItem.priority.label === sourcingQueueFilter;
    }

    if (sourcingQueueFilter === "Assigned To Me") {
      return caseItem.state.owner === currentAdmin.email;
    }

    if (sourcingQueueFilter === "Completed") {
      return caseItem.state.status === "Completed";
    }

    if (sourcingQueueFilter === "Waiting Buyer") {
      return caseItem.state.status === "Waiting Buyer";
    }

    if (sourcingQueueFilter === "Waiting Farmer") {
      return caseItem.state.status === "Matching Farmers";
    }

    if (sourcingQueueFilter === "Waiting Supplier") {
      return caseItem.state.status === "Matching Suppliers";
    }

    if (sourcingQueueFilter === "High Priority") {
      return caseItem.priority.label === "Overdue" || caseItem.priority.label === "Due Today";
    }

    return true;
  }), [currentAdmin.email, sourcingCases, sourcingQueueFilter]);
  const selectedSourcingCase = useMemo(
    () => filteredSourcingCases.find((caseItem) => caseItem.request.id === selectedSourcingCaseId) ?? filteredSourcingCases[0] ?? null,
    [filteredSourcingCases, selectedSourcingCaseId]
  );
  const sourcingMetricCards = useMemo(() => {
    const active = sourcingCases.filter((caseItem) => !["Completed", "Closed"].includes(caseItem.state.status)).length;
    const overdue = sourcingCases.filter((caseItem) => caseItem.priority.label === "Overdue").length;
    const completed = sourcingCases.filter((caseItem) => caseItem.state.status === "Completed").length;

    return [
      { label: "Active Sourcing", value: active, severity: adminPrioritySeverity({ count: active }) },
      { label: "Overdue Requests", value: overdue, severity: adminPrioritySeverity({ count: overdue, hasOverdue: overdue > 0 }) },
      {
        label: "Average Response",
        value: overdue > 0 ? "Needs review" : "On track",
        severity: adminPrioritySeverity({ count: sourcingCases.length, hasOverdue: overdue > 0 })
      },
      { label: "Completed Today", value: completed, severity: adminPrioritySeverity({ count: completed }) }
    ];
  }, [sourcingCases]);
  const filteredSourcingSeverity = adminPrioritySeverity({
    count: filteredSourcingCases.length,
    hasDue: filteredSourcingCases.some((caseItem) => caseItem.priority.label === "Due Today"),
    hasOverdue: filteredSourcingCases.some((caseItem) => caseItem.priority.label === "Overdue")
  });
  const summaryCards = useMemo(
    () => summarize(rowsBySection, whatsappLeads.length, leadRequests.length, newApplicationCounts, newSubmissionCounts),
    [rowsBySection, whatsappLeads.length, leadRequests.length, newApplicationCounts, newSubmissionCounts]
  );
  const pendingItems = useMemo(() => pendingWork(rowsBySection), [rowsBySection]);
  const pendingTaskItems = useMemo(() => pendingTasks(rowsBySection, whatsappLeads.length), [rowsBySection, whatsappLeads.length]);
  const operationsPriorityQueue = useMemo(() => {
    const newLeads = leadStatusCount(leadRequests, "New");
    const requestsNeedingReview = newLeads + submissions.buyerRequests.filter((request) => request.status === "New").length;
    const activeSourcingCases = sourcingCases.filter((caseItem) => !["Completed", "Closed"].includes(caseItem.state.status)).length;
    const sourcingFollowUps = sourcingCases.filter((caseItem) => caseItem.state.status === "Waiting Buyer" || caseItem.priority.label === "Overdue");
    const followUpsDue = leadStatusCount(leadRequests, "Contacted") + sourcingFollowUps.length;
    const listingsAwaitingReview = submissions.listings.filter((submission) => ["New", "Needs Information", "Under Review", "Approved"].includes(submission.status)).length;
    const queue = [
      {
        label: "Requests needing review",
        value: requestsNeedingReview,
        explanation: "Private buyer enquiries waiting for a first admin decision.",
        oldest: oldestOperationalItem([
          ...leadRequests.filter((lead) => normalizeLeadStatus(lead.status) === "New").map((lead) => ({ name: lead.product_interest, date: lead.created_at })),
          ...submissions.buyerRequests.filter((request) => request.status === "New").map((request) => ({ name: request.product_needed, date: request.created_at }))
        ]),
        severity: adminPrioritySeverity({ count: requestsNeedingReview, hasDue: requestsNeedingReview > 0 }),
        section: "buyer-requests" as AdminSectionId,
        action: "Review requests",
        icon: PackageCheck
      },
      {
        label: "Active sourcing cases",
        value: activeSourcingCases,
        explanation: "Requests already moved into sourcing and match review.",
        oldest: activeSourcingCases > 0 ? "Review matches and next action" : "No active sourcing cases",
        severity: adminPrioritySeverity({ count: activeSourcingCases }),
        section: "match-opportunities" as AdminSectionId,
        action: "Open active sourcing",
        icon: Clock3
      },
      {
        label: "Follow-ups due",
        value: followUpsDue,
        explanation: "Contacted or overdue requests needing an admin follow-up.",
        oldest: followUpsDue > 0 ? "Check buyer or supply follow-up" : "No follow-ups due",
        severity: adminPrioritySeverity({
          count: followUpsDue,
          hasDue: followUpsDue > 0,
          hasOverdue: sourcingFollowUps.some((caseItem) => caseItem.priority.label === "Overdue")
        }),
        section: "lead-queue" as AdminSectionId,
        action: "Review follow-ups",
        icon: MessageCircle
      },
      {
        label: "Listing submissions awaiting review",
        value: listingsAwaitingReview,
        explanation: "Public listing submissions waiting for review or publishing.",
        oldest: oldestOperationalItem(submissions.listings.filter((submission) => submission.status === "New" || submission.status === "Approved").map((submission) => ({
          name: submission.product_name,
          date: submission.created_at
        }))),
        severity: adminPrioritySeverity({ count: listingsAwaitingReview, hasDue: listingsAwaitingReview > 0 }),
        section: "submissions" as AdminSectionId,
        action: "Review listings",
        icon: Store
      }
    ];

    const actionClasses = adminPriorityActionClasses(queue.map((item) => ({ count: item.value, severity: item.severity })));

    return queue.map((item, index) => ({
      ...item,
      accent: adminMetricSeverityClass(item.severity),
      countTone: adminCountPillClass(item.severity),
      actionTone: actionClasses[index]
    }));
  }, [leadRequests, sourcingCases, submissions.buyerRequests, submissions.listings]);
  const operationsWaitingCount = operationsPriorityQueue.reduce((total, item) => total + item.value, 0);
  const operationsEstimatedMinutes = Math.max(15, Math.min(120, operationsWaitingCount * 6 + leadStatusCount(leadRequests, "Negotiating") * 4));
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
      {
        label: "WhatsApp contact clicks",
        value: whatsappLeadLoadState === "available"
          ? whatsappLeads.length
          : whatsappLeadLoadState === "error"
            ? "Load failed"
            : whatsappLeadLoadState === "unavailable"
              ? "Not available"
              : "Loading",
        icon: MessageCircle
      },
      { label: "Total leads", value: analytics.leadRequests.length, icon: MessageCircle },
      { label: "Crop health checks", value: analytics.cropHealthReports.length, icon: ClipboardCheck },
      { label: "Market price records", value: analytics.marketPrices.length, icon: ChartLine }
    ];
  }, [analytics, buyerApplicationProducts, submissions.buyerRequests, whatsappLeadLoadState, whatsappLeads.length]);
  const analyticsLeadSources = useMemo(() => countBy(whatsappLeads, "source_type"), [whatsappLeads]);
  const analyticsTopSources = useMemo(() => topClickedSources(whatsappLeads), [whatsappLeads]);
  const produceRequestLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return leadRequests.filter((lead) => {
      const matchesStatus = leadMatchesProduceRequestStatus(lead, produceRequestStatusFilter);
      const matchesSearch = !query || leadRequestSearchValue(lead).includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [leadRequests, produceRequestStatusFilter, searchTerm]);
  const selectedProduceRequest = useMemo(
    () => produceRequestLeads.find((lead) => lead.id === selectedLeadId) ?? produceRequestLeads[0] ?? null,
    [produceRequestLeads, selectedLeadId]
  );
  const produceRequestMetricCards = useMemo(() => {
    const pendingReview = leadStatusCount(leadRequests, "New");
    const contacted = leadStatusCount(leadRequests, "Contacted");
    const activeSourcing = leadStatusCount(leadRequests, "Negotiating");
    const completed = leadStatusCount(leadRequests, "Completed");
    const lost = leadStatusCount(leadRequests, "Lost");

    return [
      { label: "Pending Review", value: pendingReview, icon: CircleDashed, severity: adminPrioritySeverity({ count: pendingReview, hasDue: pendingReview > 0 }) },
      { label: "Contacted", value: contacted, icon: MessageCircle, severity: adminPrioritySeverity({ count: contacted, hasDue: contacted > 0 }) },
      { label: "Active Sourcing", value: activeSourcing, icon: PackageCheck, severity: adminPrioritySeverity({ count: activeSourcing }) },
      { label: "Completed", value: completed, icon: BadgeCheck, severity: adminPrioritySeverity({ count: completed }) },
      { label: "Lost", value: lost, icon: X, severity: adminPrioritySeverity({ count: lost, hasOverdue: lost > 0 }) }
    ];
  }, [leadRequests]);
  const produceRequestListSeverity = adminPrioritySeverity({
    count: produceRequestLeads.length,
    hasDue: produceRequestStatusFilter === "Pending Review" || produceRequestStatusFilter === "Contacted",
    hasOverdue: produceRequestStatusFilter === "Lost"
  });
  const selectedLead = useMemo(() => leadRequests.find((lead) => lead.id === selectedLeadId) ?? leadRequests[0] ?? null, [leadRequests, selectedLeadId]);
  const selectedFeaturedEnquiry = useMemo(
    () => featuredEnquiries.find((enquiry) => enquiry.id === selectedFeaturedEnquiryId) ?? featuredEnquiries[0] ?? null,
    [featuredEnquiries, selectedFeaturedEnquiryId]
  );
  const leadMetricCards = useMemo(() => {
    const newLeads = leadStatusCount(leadRequests, "New");
    const activeSourcing = leadStatusCount(leadRequests, "Negotiating");
    const completed = leadStatusCount(leadRequests, "Completed");
    const lost = leadStatusCount(leadRequests, "Lost");

    return [
      { label: "Total Leads", value: leadRequests.length, icon: MessageCircle, severity: adminPrioritySeverity({ count: leadRequests.length }) },
      { label: "New Leads", value: newLeads, icon: CircleDashed, severity: adminPrioritySeverity({ count: newLeads, hasDue: newLeads > 0 }) },
      { label: "Active Sourcing", value: activeSourcing, icon: MessageCircle, severity: adminPrioritySeverity({ count: activeSourcing }) },
      { label: "Completed", value: completed, icon: BadgeCheck, severity: adminPrioritySeverity({ count: completed }) },
      { label: "Lost", value: lost, icon: X, severity: adminPrioritySeverity({ count: lost, hasOverdue: lost > 0 }) }
    ];
  }, [leadRequests]);
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
  const farmerReviewQueue = importedFarmers.filter((farmer) => {
    if (farmer.status === "Archived") {
      return false;
    }

    const editorialDecision = editorialDecisions[farmer.id] ?? defaultEditorialDecision(farmer);

    return matchesLaunchEditorialFilter(launchEditorialFilter, editorialDecision);
  });
  const visibleFarmerReviewQueue = farmerReviewQueue.filter((farmer) => farmerMatchesQueueSearch(farmer, farmerQueueSearch));
  const remainingFarmerReviewQueue = farmerReviewQueue.filter((farmer) => farmer.status !== "Active" && farmer.verification_status !== "Verified");
  const farmerReviewRemaining = remainingFarmerReviewQueue.length;
  const farmerReviewSeverity = adminPrioritySeverity({
    count: farmerReviewRemaining,
    hasDue: remainingFarmerReviewQueue.some((farmer) => farmerQueuePriority(farmer).label === "Due Today"),
    hasOverdue: remainingFarmerReviewQueue.some((farmer) => farmerQueuePriority(farmer).label === "Overdue")
  });
  const visibleFarmerReviewSeverity = adminPrioritySeverity({
    count: visibleFarmerReviewQueue.length,
    hasDue: visibleFarmerReviewQueue.some((farmer) => farmerQueuePriority(farmer).label === "Due Today"),
    hasOverdue: visibleFarmerReviewQueue.some((farmer) => farmerQueuePriority(farmer).label === "Overdue")
  });
  const oldestWaitingFarmer = farmerReviewQueue
    .slice()
    .sort((a, b) => daysSinceDate(b.created_at) - daysSinceDate(a.created_at))[0];
  const oldestWaitingLabel = oldestWaitingFarmer ? farmerWaitingLabel(oldestWaitingFarmer) : "No waiting applications";
  const farmerAverageReviewTime = farmerReviewRemaining > 0 ? "8 min" : "0 min";
  const farmerReviewMetricCards = [
    { label: "Applications Remaining", value: farmerReviewRemaining, severity: farmerReviewSeverity },
    { label: "Average Review Time", value: farmerAverageReviewTime, severity: adminPrioritySeverity({ count: farmerReviewRemaining }) },
    { label: "Oldest Waiting Application", value: oldestWaitingLabel, severity: farmerReviewSeverity }
  ];
  const recommendedFarmerAction = reviewingImportedFarmer ? farmerRecommendedAction(reviewingImportedFarmer) : "Select Farmer";
  const reviewingDocuments = reviewingImportedFarmer ? farmerUploadedDocuments(reviewingImportedFarmer) : [];
  const reviewingFarmPhotoUrls = reviewingImportedFarmer ? farmerMediaUrlsByKind(reviewingImportedFarmer, "farm") : [];
  const reviewingFarmPhotoFilenames = reviewingImportedFarmer ? farmerMediaFilenamesByKind(reviewingImportedFarmer, "farm") : [];
  const reviewingProducePhotoUrls = reviewingImportedFarmer ? farmerMediaUrlsByKind(reviewingImportedFarmer, "produce") : [];
  const reviewingProducePhotoFilenames = reviewingImportedFarmer ? farmerMediaFilenamesByKind(reviewingImportedFarmer, "produce") : [];
  const reviewingLinkedMarketplaceListings = reviewingImportedFarmer ? farmerLinkedListingsWithPhotos(reviewingImportedFarmer) : [];
  const reviewingLinkedListingPhotoCount = reviewingLinkedMarketplaceListings.reduce((total, listing) => total + listing.images.length, 0);
  const reviewingEditorialDecision = reviewingImportedFarmer
    ? editorialDecisions[reviewingImportedFarmer.id] ?? defaultEditorialDecision(reviewingImportedFarmer)
    : null;
  const reviewingLaunchProgress = reviewingEditorialDecision ? launchChecklistProgress(reviewingEditorialDecision) : null;
  const reviewingLaunchReadiness = reviewingEditorialDecision ? launchReadiness(reviewingEditorialDecision) : null;
  const supplierReviewQueue = applications.supplier.filter((application) => {
    const editorial = supplierEditorialDecisions[application.id] ?? defaultSupplierEditorialDecision(application);
    return matchesSupplierEditorialFilter(supplierEditorialFilter, application, editorial);
  });
  const reviewingSupplier = supplierReviewQueue.find((supplier) => supplier.id === reviewingSupplierId) ?? supplierReviewQueue[0] ?? null;
  const reviewingSupplierIndex = reviewingSupplier ? supplierReviewQueue.findIndex((supplier) => supplier.id === reviewingSupplier.id) : -1;
  const previousSupplier = reviewingSupplierIndex > 0 ? supplierReviewQueue[reviewingSupplierIndex - 1] : null;
  const nextSupplier =
    reviewingSupplierIndex !== -1 && reviewingSupplierIndex < supplierReviewQueue.length - 1
      ? supplierReviewQueue[reviewingSupplierIndex + 1]
      : null;
  const remainingSupplierReviewQueue = supplierReviewQueue.filter((supplier) => supplier.status !== "Approved" && supplier.status !== "Converted");
  const supplierReviewRemaining = remainingSupplierReviewQueue.length;
  const supplierReviewSeverity = adminPrioritySeverity({
    count: supplierReviewRemaining,
    hasDue: remainingSupplierReviewQueue.some((supplier) => supplierQueuePriority(supplier).label === "Due Today"),
    hasOverdue: remainingSupplierReviewQueue.some((supplier) => supplierQueuePriority(supplier).label === "Overdue")
  });
  const oldestWaitingSupplier = supplierReviewQueue
    .slice()
    .sort((a, b) => daysSinceDate(b.created_at) - daysSinceDate(a.created_at))[0];
  const oldestWaitingSupplierLabel = oldestWaitingSupplier ? supplierWaitingLabel(oldestWaitingSupplier) : "No waiting applications";
  const supplierAverageReviewTime = supplierReviewRemaining > 0 ? "7 min" : "0 min";
  const supplierReviewMetricCards = [
    { label: "Applications Remaining", value: supplierReviewRemaining, severity: supplierReviewSeverity },
    { label: "Average Review Time", value: supplierAverageReviewTime, severity: adminPrioritySeverity({ count: supplierReviewRemaining }) },
    { label: "Oldest Waiting Application", value: oldestWaitingSupplierLabel, severity: supplierReviewSeverity }
  ];
  const recommendedSupplierAction = reviewingSupplier ? supplierRecommendedAction(reviewingSupplier) : "Select Supplier";
  const reviewingSupplierDocuments = reviewingSupplier ? supplierUploadedDocuments(reviewingSupplier) : [];
  const reviewingSupplierReadiness = reviewingSupplier ? supplierReviewReadiness(reviewingSupplier) : [];
  const reviewingSupplierEditorialDecision = reviewingSupplier
    ? supplierEditorialDecisions[reviewingSupplier.id] ?? defaultSupplierEditorialDecision(reviewingSupplier)
    : null;
  const reviewingSupplierLaunchProgress = reviewingSupplierEditorialDecision ? supplierLaunchChecklistProgress(reviewingSupplierEditorialDecision) : null;
  const reviewingSupplierLaunchReadiness = reviewingSupplierEditorialDecision ? supplierLaunchReadiness(reviewingSupplierEditorialDecision) : null;

  useEffect(() => {
    if (activeSection !== "applications" || applicationTab !== "farmer" || reviewingImportedFarmerId || farmerReviewQueue.length === 0) {
      return;
    }

    const firstFarmer = farmerReviewQueue[0];
    setReviewingImportedFarmerId(firstFarmer.id);
    setVerificationReviewNotes(firstFarmer.verification_notes ?? "");
    setFarmerReviewDebug(reviewDebugFields(firstFarmer));
    setFarmerReviewMessage(null);
  }, [activeSection, applicationTab, farmerReviewQueue, reviewingImportedFarmerId]);

  useEffect(() => {
    if (activeSection !== "applications" || applicationTab !== "supplier" || reviewingSupplierId || supplierReviewQueue.length === 0) {
      return;
    }

    const firstSupplier = supplierReviewQueue[0];
    setReviewingSupplierId(firstSupplier.id);
    setSupplierReviewNotes(firstSupplier.editorial_notes ?? "");
    setSupplierReviewMessage(null);
  }, [activeSection, applicationTab, reviewingSupplierId, supplierReviewQueue]);

  async function saveEditorialDecision(recordId: string, decision: EditorialDecisionState) {
    const saveVersion = (editorialSaveVersions.current[recordId] ?? 0) + 1;
    editorialSaveVersions.current[recordId] = saveVersion;
    setEditorialSaveStates((current) => ({ ...current, [recordId]: "saving" }));
    const response = await fetch("/api/admin/farmer-import", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "editorial",
        ids: [recordId],
        editorial: {
          launchStatus: decision.launchStatus,
          homepageCandidate: decision.homepageCandidate,
          marketplaceFeatured: decision.marketplaceFeatured,
          storyCandidate: decision.storyCandidate,
          editorialNotes: decision.editorialNotes,
          launchChecklist: decision.checklist
        }
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      farmer?: ImportedFarmerRecord;
      error?: string;
      message?: string;
      category?: string;
      diagnostic?: string;
      migration?: string;
    } | null;

    if (editorialSaveVersions.current[recordId] !== saveVersion) {
      return;
    }

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const errorMessage = [
        result?.category,
        result?.error ?? "Could not save editorial decision.",
        result?.diagnostic ? `Details: ${result.diagnostic}` : "",
        result?.migration ? `Migration: ${result.migration}` : ""
      ].filter(Boolean).join("\n");
      setEditorialSaveStates((current) => ({ ...current, [recordId]: "error" }));
      setFarmerReviewMessage({ type: "error", text: errorMessage });
      return;
    }

    const savedFarmer = result?.farmer
      ? ({
          ...result.farmer,
          launch_status: decision.launchStatus,
          homepage_candidate: decision.homepageCandidate,
          marketplace_featured: decision.marketplaceFeatured,
          story_candidate: decision.storyCandidate,
          editorial_notes: decision.editorialNotes,
          launch_checklist: decision.checklist,
          launch_ready: launchReadiness(decision).label === "Launch Ready"
        } satisfies ImportedFarmerRecord)
      : null;

    if (savedFarmer) {
      setImportedFarmers((current) => current.map((farmer) => (farmer.id === savedFarmer.id ? savedFarmer : farmer)));
      setFarmerReviewDebug(reviewDebugFields(savedFarmer));
    }

    setEditorialDecisions((current) => ({
      ...current,
      [recordId]: decision
    }));
    setEditorialSaveStates((current) => ({ ...current, [recordId]: "saved" }));
    setFarmerReviewMessage({ type: "success", text: result?.message ?? "Editorial decision saved." });
    void loadActivity();
  }

  async function uploadFarmerAsset(
    farmer: ImportedFarmerRecord,
    assetType: "profile" | "farm" | "produce" | "document",
    event: ChangeEvent<HTMLInputElement>,
    replace = false
  ) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedDocumentTypes = ["application/pdf", ...allowedImageTypes];
    const allowedTypes = assetType === "document" ? allowedDocumentTypes : allowedImageTypes;
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type));
    const oversizeFile = files.find((file) => file.size > (assetType === "document" ? 10 : 5) * 1024 * 1024);

    if (invalidFile) {
      setFarmerReviewMessage({
        type: "error",
        text: assetType === "document" ? "Upload a PDF, JPG, PNG, or WEBP certificate/document." : "Upload JPG, PNG, or WEBP images."
      });
      event.target.value = "";
      return;
    }

    if (oversizeFile) {
      setFarmerReviewMessage({
        type: "error",
        text: assetType === "document" ? "Documents must be 10MB or smaller." : "Images must be 5MB or smaller."
      });
      event.target.value = "";
      return;
    }

    const uploadKey = `${farmer.id}:${assetType}${replace ? ":replace" : ""}`;
    editorialSaveVersions.current[farmer.id] = (editorialSaveVersions.current[farmer.id] ?? 0) + 1;
    setUploadingFarmerAsset(uploadKey);
    setFarmerReviewMessage(null);

    const formData = new FormData();
    formData.append("action", "upload-asset");
    formData.append("farmerId", farmer.id);
    formData.append("assetType", assetType);
    formData.append("replace", replace ? "true" : "false");
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/admin/farmer-import", {
      method: "POST",
      body: formData
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as {
      farmer?: ImportedFarmerRecord;
      error?: string;
      category?: string;
      diagnostic?: string;
      message?: string;
    } | null;

    setUploadingFarmerAsset(null);
    event.target.value = "";

    if (!response?.ok || !result?.farmer) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFarmerReviewMessage({
        type: "error",
        text: adminDiagnosticMessage(result, "Could not upload farmer asset. Check Supabase Storage and farmer media migrations.")
      });
      return;
    }

    const updatedFarmer = result.farmer;
    setImportedFarmers((current) => current.map((item) => (item.id === updatedFarmer.id ? updatedFarmer : item)));
    setEditorialDecisions((current) => ({
      ...current,
      [updatedFarmer.id]: defaultEditorialDecision(updatedFarmer)
    }));
    setFarmerReviewDebug(reviewDebugFields(updatedFarmer));
    setFarmerReviewMessage({ type: "success", text: result.message ?? "Farmer asset uploaded successfully." });
    void loadActivity();
  }

  function updateEditorialDecision(recordId: string, updater: (current: EditorialDecisionState) => EditorialDecisionState, _saveDelay = 450) {
    const farmer = importedFarmers.find((item) => item.id === recordId);

    if (!farmer) {
      return;
    }

    setEditorialDecisions((current) => {
      const existing = current[recordId] ?? defaultEditorialDecision(farmer);
      const nextDecision = updater(existing);

      setEditorialSaveStates((states) => ({ ...states, [recordId]: "dirty" }));
      return {
        ...current,
        [recordId]: nextDecision
      };
    });
  }

  async function saveSupplierEditorialDecision(recordId: string, decision: SupplierEditorialDecisionState) {
    const supplier = applications.supplier.find((item) => item.id === recordId);

    if (!supplier) {
      return;
    }

    setSupplierEditorialSaveStates((current) => ({ ...current, [recordId]: "saving" }));
    const readiness = supplierLaunchReadiness(decision).label === "Launch Ready";
    const response = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "supplier-editorial",
        kind: "supplier",
        id: recordId,
        entityName: applicationName(supplier),
        editorial: {
          launchStatus: decision.launchStatus,
          homepageCandidate: decision.homepageCandidate,
          marketplaceFeatured: decision.marketplaceFeatured,
          storyCandidate: decision.storyCandidate,
          editorialNotes: decision.editorialNotes,
          launchChecklist: decision.checklist,
          launchReady: readiness
        }
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { record?: ApplicationRecord; error?: string; message?: string } | null;

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const errorMessage = result?.error ?? "Could not save supplier editorial decision.";
      setSupplierEditorialSaveStates((current) => ({ ...current, [recordId]: "error" }));
      setSupplierReviewMessage({ type: "error", text: errorMessage });
      return;
    }

    if (result?.record) {
      setApplications((current) => ({
        ...current,
        supplier: current.supplier.map((item) => (item.id === recordId ? { ...item, ...result.record } : item))
      }));
      setSupplierEditorialDecisions((current) => ({
        ...current,
        [recordId]: defaultSupplierEditorialDecision({ ...supplier, ...result.record })
      }));
    }

    setSupplierEditorialSaveStates((current) => ({ ...current, [recordId]: "saved" }));
    setSupplierReviewMessage({ type: "success", text: result?.message ?? "Supplier editorial decision saved." });
    void loadActivity();
  }

  function updateSupplierEditorialDecision(recordId: string, updater: (current: SupplierEditorialDecisionState) => SupplierEditorialDecisionState, _saveDelay = 450) {
    const supplier = applications.supplier.find((item) => item.id === recordId);

    if (!supplier) {
      return;
    }

    setSupplierEditorialDecisions((current) => {
      const existing = current[recordId] ?? defaultSupplierEditorialDecision(supplier);
      const nextDecision = updater(existing);

      setSupplierEditorialSaveStates((states) => ({ ...states, [recordId]: "dirty" }));
      return {
        ...current,
        [recordId]: nextDecision
      };
    });
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

  async function applyImportedFarmerReviewAction(action: "under-review" | "needs-follow-up" | "verify" | "verify-only" | "reject" | "archive" | "notes" | "import-photo" | "gg-standard") {
    if (!reviewingImportedFarmer) {
      return;
    }

    setIsUpdatingFarmerReview(true);
    setPendingFarmerReviewAction(action);
    setFarmerReviewMessage(null);
    setFarmerImportError("");
    const shouldAdvanceAfterAction = ["under-review", "needs-follow-up", "verify", "verify-only", "reject", "archive"].includes(action);
    const nextFarmerAfterDecision = shouldAdvanceAfterAction ? nextImportedFarmer : null;
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
      : action === "gg-standard"
        ? "GG Standard membership approved."
          : action === "needs-follow-up"
            ? "Farmer marked as needs follow-up."
          : action === "reject"
            ? "Farmer rejected."
            : action === "archive"
              ? "Farmer archived."
              : "Verification notes saved.";

    setImportedFarmers((current) => current.map((farmer) => (farmer.id === updatedFarmer.id ? updatedFarmer : farmer)));
    if (nextFarmerAfterDecision) {
      setReviewingImportedFarmerId(nextFarmerAfterDecision.id);
      setVerificationReviewNotes(nextFarmerAfterDecision.verification_notes ?? "");
    } else {
      setReviewingImportedFarmerId(updatedFarmer.id);
      setVerificationReviewNotes(updatedFarmer.verification_notes ?? "");
    }
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
                ggStandardStatus: updatedFarmer.gg_standard_status ?? "Pending",
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
    setFarmerReviewMessage({
      type: "success",
      text: nextFarmerAfterDecision ? `${successMessage} Next farmer ready.` : successMessage
    });
    setNotice(successMessage);
    void loadActivity();
    void loadAnalytics();
    void loadAdminFarmers();
  }

  function openAdminNavigationItem(item: AdminNavigationItem, groupName = groupForNavigationKey(item.key)) {
    setActiveSection(item.id);
    setActiveNavigationKey(item.key);
    setExpandedNavigationGroup(groupName);
    setAnalyticsView(item.analyticsView ?? "operations");
    setSearchTerm("");
    setStatusFilter(item.id === "verifications" ? "Pending" : "All");
    setProduceRequestStatusFilter(item.produceRequestStatusFilter ?? "All");
    setSourcingQueueFilter(item.sourcingQueueFilter ?? "All");
    setShowSourcingCaseDetailMobile(false);
    if (item.applicationTab) {
      setApplicationTab(item.applicationTab);
    }
  }

  function openAdminSection(section: AdminSectionId, intent?: string) {
    const item = defaultNavigationItem(section);
    openAdminNavigationItem(item);
    if (intent) {
      setNotice(`${intent} Phase 1 actions are mock controls until a database is connected.`);
    }
  }

  function runQuickAction(section: AdminSectionId, intent: string) {
    openAdminSection(section, intent);
  }

  function openAdminForm(formId: AdminFormId, mode: "add" | "edit", row?: AdminRow) {
    openAdminSection(formId);
    setSearchTerm("");
    setStatusFilter("All");
    const rawValues = formValuesForRow(formId, row);
    const nextValues = Object.fromEntries(
      Object.entries(rawValues).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)])
    ) as Record<string, string>;
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

  function openFarmerListingForm(farmer: ImportedFarmerRecord) {
    const farmerName = farmer.farm_name || farmer.farmer_name || "Farmer";
    const nextValues = {
      ...emptyFormValues("marketplace"),
      ownerType: "Farmer",
      ownerId: farmer.id,
      ownerName: farmerName,
      sellerFarmer: farmerName,
      region: farmer.region || "",
      district: farmer.district || "",
      whatsappNumber: farmer.whatsapp_number || farmer.phone_number || "",
      availability: "Available Now",
      unit: "",
      quantity: "",
      category: farmer.farm_type || "",
      description: "",
      internalOperationsNotes: "",
      imageUrl: "",
      imageUrls: marketplaceGalleryValue([])
    };

    openAdminSection("marketplace");
    setSearchTerm("");
    setStatusFilter("All");
    setFormValues(nextValues);
    setImagePreviews({});
    setFormError("");
    setFormSuccess("");
    setUploadingField(null);
    setActiveForm({
      id: "marketplace",
      mode: "add",
      title: "Create Listing for this Farmer",
      recordId: farmer.id,
      recordName: farmerName
    });
    setNotice(`Creating a farmer-owned marketplace listing for ${farmerName}. Owner fields are pre-filled.`);
  }

  function openFarmerStoryForm(farmer: ImportedFarmerRecord) {
    const farmerName = farmer.farmer_name || farmer.farm_name || "Farmer";
    const profileImage = farmer.profile_image_url || farmer.imported_photo_url || farmer.tally_photo_url || farmer.farm_photo_urls?.[0] || farmer.produce_photo_urls?.[0] || "";
    const nextValues = {
      ...emptyFormValues("success-stories"),
      title: storyTitleForFarmer(farmer),
      category: "Farmers",
      personBusinessName: farmer.farm_name || farmerName,
      region: farmer.region || "",
      summary: storyDraftForFarmer(farmer),
      outcome: storyOutcomeForFarmer(farmer),
      date: new Date().toISOString().slice(0, 10),
      imageUrl: profileImage,
      status: "Draft"
    };

    openAdminSection("success-stories");
    setSearchTerm("");
    setStatusFilter("All");
    setFormValues(nextValues);
    setImagePreviews({});
    setFormError("");
    setFormSuccess("");
    setUploadingField(null);
    setActiveForm({
      id: "success-stories",
      mode: "add",
      title: "Create Story for this Farmer",
      recordId: farmer.id,
      recordName: farmerName
    });
    setNotice(`Creating an editable success story draft for ${farmerName}. Farmer ID: ${farmer.id}`);
  }

  function closeAdminForm() {
    setActiveForm(null);
    setFormValues({});
    setImagePreviews({});
    setFormError("");
    setFormSuccess("");
    setUploadingField(null);
  }

  function adminDiagnosticMessage(
    result: { error?: string; category?: string; diagnostic?: string; table?: string; bucket?: string } | null,
    fallback: string
  ) {
    const diagnosticParts = [
      result?.category,
      result?.error,
      result?.diagnostic ? `Details: ${result.diagnostic}` : "",
      result?.table ? `Table: ${result.table}` : "",
      result?.bucket ? `Bucket: ${result.bucket}` : ""
    ].filter(Boolean);

    return diagnosticParts.join("\n") || fallback;
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

    const result = (await response?.json().catch(() => null)) as {
      publicUrl?: string;
      error?: string;
      category?: string;
      diagnostic?: string;
      bucket?: string;
    } | null;

    if (!response?.ok || !result?.publicUrl) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setFormError(adminDiagnosticMessage(result, "Image upload failed. Check Supabase Storage configuration."));
      return;
    }

    setFormValues((current) => ({ ...current, [field.name]: result.publicUrl ?? "" }));
    setImagePreviews((current) => ({ ...current, [field.name]: result.publicUrl ?? localPreview }));
    setFormSuccess("Image uploaded. Save the form to attach it to this record.");
  }

  async function uploadMarketplaceGalleryImages(field: FormField, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length || !field.bucket) {
      return;
    }

    const currentImages = marketplaceGalleryImagesFromValues(formValues);
    const remainingSlots = marketplaceGalleryLimit - currentImages.length;

    if (remainingSlots <= 0) {
      setFormError(`A listing can include up to ${marketplaceGalleryLimit} images.`);
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    const invalidFile = selectedFiles.find((file) => !allowedTypes.includes(file.type));
    if (invalidFile) {
      setFormError("Upload JPG, PNG, or WEBP images only.");
      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      setFormError("Each image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploadingField(field.name);
    setFormError("");
    setFormSuccess("");

    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("bucket", field.bucket);
      formData.append("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData
      }).catch(() => null);
      const result = (await response?.json().catch(() => null)) as {
        publicUrl?: string;
        error?: string;
        category?: string;
        diagnostic?: string;
        bucket?: string;
      } | null;

      if (!response?.ok || !result?.publicUrl) {
        setUploadingField(null);
        event.target.value = "";

        if (response?.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        setFormError(adminDiagnosticMessage(result, "One or more gallery images failed to upload. Check Supabase Storage configuration."));
        return;
      }

      uploadedUrls.push(result.publicUrl);
    }

    const nextImages = uniqueMarketplaceGalleryImages([...currentImages, ...uploadedUrls]);
    setFormValues((current) => ({
      ...current,
      imageUrl: nextImages[0] ?? "",
      imageUrls: marketplaceGalleryValue(nextImages)
    }));
    setUploadingField(null);
    event.target.value = "";
    setFormSuccess(`Gallery updated. ${nextImages[0] ? "The first image is the cover photo." : ""} Save the form to update the listing.`);
  }

  function updateMarketplaceGallery(images: string[], successMessage: string) {
    const nextImages = uniqueMarketplaceGalleryImages(images);
    setFormValues((current) => ({
      ...current,
      imageUrl: nextImages[0] ?? "",
      imageUrls: marketplaceGalleryValue(nextImages)
    }));
    setFormError("");
    setFormSuccess(successMessage);
  }

  function moveMarketplaceGalleryImage(index: number, direction: -1 | 1) {
    const images = marketplaceGalleryImagesFromValues(formValues);
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const nextImages = [...images];
    [nextImages[index], nextImages[targetIndex]] = [nextImages[targetIndex], nextImages[index]];
    updateMarketplaceGallery(nextImages, "Gallery order updated. Save the form to update the listing.");
  }

  function setMarketplaceGalleryCover(index: number) {
    const images = marketplaceGalleryImagesFromValues(formValues);
    const selectedImage = images[index];

    if (!selectedImage) {
      return;
    }

    updateMarketplaceGallery([selectedImage, ...images.filter((_, currentIndex) => currentIndex !== index)], "Cover image updated. Save the form to update the listing.");
  }

  function removeMarketplaceGalleryImage(index: number) {
    const images = marketplaceGalleryImagesFromValues(formValues);
    updateMarketplaceGallery(images.filter((_, currentIndex) => currentIndex !== index), "Image removed from the gallery. Save the form to update the listing.");
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

      const result = (await response?.json().catch(() => null)) as {
        error?: string;
        message?: string;
        record?: unknown;
        category?: string;
        diagnostic?: string;
        table?: string;
        operation?: string;
      } | null;

      if (!response?.ok) {
        if (response?.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        setFormError(adminDiagnosticMessage(result, "Supabase insert failed. Check the admin session, environment variables, and table schema."));
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
  const isOperationsLanding = isAnalyticsSection && analyticsView === "operations";
  const isAnalyticsReportsSection = isAnalyticsSection && analyticsView === "analytics";
  const isLaunchChecklistSection = activeSection === "launch-checklist";
  const isFarmerImportSection = activeSection === "farmer-import";
  const isApplicationsSection = activeSection === "applications";
  const isSubmissionsSection = activeSection === "submissions";
  const isWhatsAppLeadsSection = activeSection === "whatsapp-leads";
  const isLeadQueueSection = activeSection === "lead-queue";
  const isBuyerRequestsSection = activeSection === "buyer-requests";
  const isFeaturedEnquiriesSection = activeSection === "featured-enquiries";
  const isMatchOpportunitiesSection = activeSection === "match-opportunities";
  const isFarmerReviewWorkspace = isApplicationsSection && applicationTab === "farmer";
  const isSupplierReviewWorkspace = isApplicationsSection && applicationTab === "supplier";
  const sectionEyebrow = isAnalyticsReportsSection ? "Reports" : isFarmerReviewWorkspace || isSupplierReviewWorkspace ? "Review Workspace" : isBuyerRequestsSection ? "Private Enquiry Workspace" : isMatchOpportunitiesSection ? "Sourcing Workspace" : isWhatsAppLeadsSection ? "Optional Analytics" : "Manage Records";
  const sectionTitle = isAnalyticsReportsSection ? "Analytics" : isFarmerReviewWorkspace ? "Farmer Review Workspace" : isSupplierReviewWorkspace ? "Supplier Review Workspace" : isBuyerRequestsSection ? "Produce Requests" : isMatchOpportunitiesSection ? "Sourcing Queue" : isWhatsAppLeadsSection ? "Notifications" : activeSectionLabel;
  const sectionNotice = isFarmerReviewWorkspace
    ? "Review one farmer, make one decision, then continue to the next application."
    : isSupplierReviewWorkspace
      ? "Review one supplier, make one decision, then continue to the next application."
    : isBuyerRequestsSection
      ? "Review private buyer enquiries from marketplace listings, directory profiles, and generic sourcing forms."
    : isMatchOpportunitiesSection
      ? "Help buyers source produce by reviewing one case, choosing matches, and deciding the next action."
    : isWhatsAppLeadsSection
      ? "Review WhatsApp contact-click analytics. Buyer enquiries remain in Produce Requests."
    : notice;
  const visibleApplicationDiagnostics = applicationDiagnostics[applicationTab]?.join(" ") ?? "";

  async function updateLeadRequestStatus(lead: LeadRequestRecord | SourcingCaseRecord, status: LeadRequestStatus) {
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
    setNotice(`${"requester_name" in lead ? lead.requester_name : lead.buyer_name} lead marked ${status}.`);
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

  async function convertProfileApplication(kind: "farmer" | "supplier", application: ApplicationRecord) {
    const linkedProfileId = kind === "farmer" ? application.linked_farmer_id : application.linked_supplier_id;
    if (linkedProfileId) {
      window.location.href = `/admin/profiles/${kind}/${encodeURIComponent(linkedProfileId)}`;
      return;
    }
    if (application.status !== "Approved") {
      setApplicationError("Approve the application before creating a profile.");
      return;
    }
    if (!window.confirm(`Create a non-public ${kind} profile from this approved application?`)) return;

    const response = await fetch("/api/admin/profile-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "convert", kind, id: application.id })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { profileId?: string; reused?: boolean; error?: string } | null;
    if (!response?.ok || !result?.profileId) {
      if (response?.status === 401) window.location.href = "/admin/login";
      setApplicationError(result?.error ?? "The profile could not be created.");
      return;
    }
    window.location.href = `/admin/profiles/${kind}/${encodeURIComponent(result.profileId)}`;
  }

  async function applySupplierReviewAction(application: ApplicationRecord, action: "under-review" | "approve-only" | "request-changes" | "reject" | "archive") {
    const nextStatus: ApplicationStatus =
      action === "approve-only"
        ? "Approved"
        : action === "under-review" || action === "request-changes"
          ? "Under Review"
          : "Rejected";
    const actionLabel =
      action === "approve-only"
          ? "approved"
          : action === "request-changes"
            ? "marked for changes"
            : action === "archive"
              ? "archived"
              : action === "reject"
                ? "rejected"
                : "marked under review";

    setIsUpdatingSupplierReview(true);
    setPendingSupplierReviewAction(action === "archive" ? "archive" : nextStatus);
    setSupplierReviewMessage(null);

    const response = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "supplier",
        id: application.id,
        status: nextStatus,
        entityName: applicationName(application)
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string; record?: ApplicationRecord } | null;

    setIsUpdatingSupplierReview(false);
    setPendingSupplierReviewAction(null);

    if (!response?.ok) {
      if (response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      setSupplierReviewMessage({ type: "error", text: result?.error ?? "Could not update supplier application." });
      return;
    }

    setApplications((current) => ({
      ...current,
      supplier: current.supplier.map((item) =>
        item.id === application.id
          ? { ...item, ...(result?.record ?? {}), status: nextStatus, updated_at: new Date().toISOString() }
          : item
      )
    }));
    setSupplierReviewMessage({ type: "success", text: `${applicationName(application)} ${actionLabel}.` });
    setNotice(`${applicationName(application)} ${actionLabel}.`);
    void loadActivity();
  }

  async function updateSubmissionStatus(
    submission: ListingSubmissionRecord | BuyerRequestSubmissionRecord,
    status: Exclude<SubmissionStatus, "New" | "Converted">,
    explicitKind: SubmissionKind = submissionTab
  ) {
    const entityName = explicitKind === "listing"
      ? (submission as ListingSubmissionRecord).product_name
      : (submission as BuyerRequestSubmissionRecord).product_needed;
    const response = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: explicitKind,
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

    if (explicitKind === "listing") {
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

  async function convertSubmission(submission: ListingSubmissionRecord | BuyerRequestSubmissionRecord, explicitKind: SubmissionKind = submissionTab) {
    const entityName = explicitKind === "listing"
      ? (submission as ListingSubmissionRecord).product_name
      : (submission as BuyerRequestSubmissionRecord).product_needed;
    const response = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: explicitKind,
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

    if (explicitKind === "listing") {
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
    setNotice(`${entityName} ${explicitKind === "listing" ? "converted to a live marketplace listing" : "published as a live buyer request"}.`);
    void loadActivity();
  }

  function updateSourcingCaseState(caseId: string, updater: (current: SourcingCaseState) => SourcingCaseState) {
    const request = sourcingCaseRequests.find((item) => item.id === caseId);

    if (!request) {
      return;
    }

    setSourcingCaseStates((current) => {
      const existing = current[caseId] ?? {
        status: defaultSourcingCaseStatus(request),
        owner: "",
        notes: ""
      };

      return {
        ...current,
        [caseId]: updater(existing)
      };
    });
  }

  async function setSourcingCaseStatus(caseItem: SourcingCaseRecord, status: SourcingCaseStatus) {
    updateSourcingCaseState(caseItem.id, (current) => ({ ...current, status }));

    if (caseItem.case_source === "lead_request") {
      if (status === "Completed") {
        await updateLeadRequestStatus(caseItem, "Completed");
        return;
      }

      if (status === "Closed") {
        await updateLeadRequestStatus(caseItem, "Lost");
        return;
      }

      if (status === "Reviewing") {
        await updateLeadRequestStatus(caseItem, "Contacted");
        return;
      }

      await updateLeadRequestStatus(caseItem, "Negotiating");
      return;
    }

    if (status === "Reviewing") {
      await updateSubmissionStatus(caseItem, "Under Review", "buyer-request");
    }

    if (status === "Completed") {
      await convertSubmission(caseItem, "buyer-request");
    }

    if (status === "Closed") {
      await updateSubmissionStatus(caseItem, "Rejected", "buyer-request");
    }
  }

  async function recordSourcingCaseActivity({
    action,
    caseItem,
    matchId,
    entityName
  }: {
    action: "Review" | "Contact";
    caseItem: SourcingCaseRecord;
    matchId?: string;
    entityName: string;
  }) {
    const activityId = matchId ?? caseItem.id;
    const alreadyRecorded = sourcingCaseHasActivity({
      caseId: caseItem.id,
      activityRows,
      action,
      marker: activityId === caseItem.id ? undefined : activityId.replace(`${caseItem.id}:`, "")
    });

    if (alreadyRecorded) {
      return true;
    }

    const response = await fetch("/api/admin/matches/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        matchId: activityId,
        entityName
      })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      setLeadRequestError(result?.error ?? "Could not record sourcing activity.");
      return false;
    }

    setLeadRequestError("");
    void loadActivity();
    return true;
  }

  async function contactSourcingBuyer(caseItem: SourcingCaseRecord) {
    const recorded = await recordSourcingCaseActivity({
      action: "Contact",
      caseItem,
      entityName: `Buyer contact recorded for ${caseItem.product_needed}`
    });

    if (!recorded) {
      return;
    }

    updateSourcingCaseState(caseItem.id, (current) => ({
      ...current,
      owner: current.owner || currentAdmin.email
    }));
    setNotice(`Contact ${caseItem.buyer_name} about ${caseItem.product_needed}.`);
    window.open(
      whatsappUrl(caseItem.whatsapp_number || caseItem.phone_number, `Hello ${caseItem.buyer_name}, Ghana Growers is reviewing your sourcing request for ${caseItem.product_needed}.`),
      "_blank",
      "noopener,noreferrer"
    );
  }

  function assignSourcingOwner(caseId: string) {
    updateSourcingCaseState(caseId, (current) => ({ ...current, owner: currentAdmin.email }));
  }

  async function reviewSourcingMatches(caseItem: SourcingCaseRecord, matchType: "farmer" | "supplier") {
    const label = matchType === "farmer" ? "Farmer" : "Supplier";
    const recorded = await recordSourcingCaseActivity({
      action: "Review",
      caseItem,
      matchId: `${caseItem.id}:${matchType}-match`,
      entityName: `${label} match reviewed for ${caseItem.product_needed}`
    });

    if (!recorded) {
      return;
    }

    updateSourcingCaseState(caseItem.id, (current) => ({
      ...current,
      status: matchType === "farmer" ? "Matching Farmers" : "Matching Suppliers",
      owner: current.owner || currentAdmin.email
    }));
    setNotice(`${label} match review recorded for ${caseItem.product_needed}.`);
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
    <main className="admin-dashboard min-h-screen w-full max-w-full overflow-x-hidden bg-earth-50">
      <section className="border-b border-leaf-900/10 bg-earth-50">
        <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 2xl:max-w-[110rem]">
          <p className="text-sm font-black uppercase tracking-wide text-earth-700">Ghana Growers Operations</p>
          <div className="mt-3 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-black text-ink sm:text-4xl">Operations Center</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Daily workspace for sourcing, onboarding, verification, marketplace publishing, and member support.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="break-all text-sm font-bold text-ink/60">Signed in as {currentAdmin.email}</p>
              <button
                type="button"
                onClick={logoutAdmin}
                className="admin-action-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[96rem] gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-6 2xl:max-w-[110rem] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="admin-queue-panel order-2 px-5 py-4 lg:order-none lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-earth-700">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Workspaces
          </div>
          <nav className="mt-5 grid gap-2">
            {operationsNavigation.map((group) => {
              const groupHasActiveItem = group.items.some((item) => item.key === activeNavigationKey);
              const isExpanded = expandedNavigationGroup === group.group || groupHasActiveItem;

              return (
                <div key={group.group} className="admin-nav-group">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`admin-nav-${group.group.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                    onClick={() => setExpandedNavigationGroup((current) => (current === group.group ? "" : group.group))}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left text-sm font-black transition ${
                      groupHasActiveItem ? "text-leaf-800" : "text-ink/68 hover:text-leaf-800"
                    }`}
                  >
                    <span>{group.group}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {isExpanded ? (
                    <div id={`admin-nav-${group.group.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="grid gap-1 px-2 pb-2">
                      {group.items.map((item) => {
                        const isActive = item.key === activeNavigationKey;

                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => openAdminNavigationItem(item, group.group)}
                            className={`admin-nav-item rounded px-3 py-2 text-left text-sm font-black ${
                              isActive ? "admin-nav-item-active" : ""
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="order-1 min-w-0 lg:order-none">
          {isOperationsLanding ? (
            <section className="grid min-w-0 gap-6">
              <div className="admin-panel min-w-0 overflow-hidden p-6">
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Operations Center</p>
                <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="min-w-0">
                    <h2 className="text-3xl font-black text-ink sm:text-4xl">Good Morning.</h2>
                    <p className="mt-2 text-xl font-black text-ink/72">Welcome back.</p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/62">
                      Today&apos;s work should take approximately {operationsEstimatedMinutes} minutes.
                    </p>
                  </div>
                  <div className="admin-context-panel min-w-0 p-4 text-left lg:min-w-[260px]">
                    <p className="text-xs font-black uppercase tracking-wide text-ink/45">Current focus</p>
                    <p className="mt-2 text-2xl font-black text-leaf-800">{operationsWaitingCount}</p>
                    <p className="mt-1 text-sm font-semibold text-ink/60">items waiting for action</p>
                  </div>
                </div>
              </div>

              <section className="admin-panel overflow-hidden p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Today&apos;s Priority Queue</p>
                    <h3 className="mt-2 text-2xl font-black text-ink">Start here</h3>
                  </div>
                  <p className="text-sm font-semibold text-ink/55">Highest-impact work appears first.</p>
                </div>
                <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-2">
                  {operationsPriorityQueue.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article key={item.label} className={`admin-metric-card ${item.accent} min-w-0 overflow-hidden rounded-md border border-leaf-900/10 p-5 shadow-sm`}>
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700 ring-1 ring-leaf-700/10">
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <h4 className="break-words text-base font-black leading-tight text-ink">{item.label}</h4>
                              <p className="mt-2 text-sm font-semibold leading-5 text-ink/58">{item.explanation}</p>
                              <p className="mt-1 text-xs font-black uppercase tracking-wide text-earth-700">{item.oldest}</p>
                            </div>
                          </div>
                          <span className={`${item.countTone} text-sm sm:shrink-0`}>
                            <span className="sr-only">{item.label}: </span>{item.value}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => runQuickAction(item.section, `${item.label} opened from today's priority queue.`)}
                          className={`${item.actionTone} mt-5 w-full gap-2 sm:w-auto`}
                        >
                          {item.action} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            </section>
          ) : null}

          {!isOperationsLanding ? (
          <>
          <section className="admin-panel min-w-0 overflow-hidden">
            <div className="border-b border-leaf-900/10 p-5">
              <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">{sectionEyebrow}</p>
                  <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">{sectionTitle}</h2>
                  <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-ink/58">{sectionNotice}</p>
                </div>
                {!isAnalyticsReportsSection && !isLaunchChecklistSection && !isFarmerImportSection && !isLeadQueueSection && !isBuyerRequestsSection && !isFeaturedEnquiriesSection && !isApplicationsSection && !isSubmissionsSection && !isWhatsAppLeadsSection && !isMatchOpportunitiesSection ? (
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

            {isAnalyticsReportsSection ? (
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
                  <div className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Marketplace Activity</p>
                    <h3 className="mt-2 text-xl font-black text-ink">Listings by category</h3>
                    <div className="mt-5">
                      <SimpleBarList items={listingsByCategory} emptyLabel="No marketplace listing data yet." />
                    </div>
                  </div>
                  <div className="admin-panel p-5">
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
                {applicationError || visibleApplicationDiagnostics ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">
                    {applicationError || visibleApplicationDiagnostics}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {([
                    ["farmer", "Farmer Applications", farmerReviewQueue.length],
                    ["buyer", "Buyer Applications", applications.buyer.filter(applicationNeedsReview).length],
                    ["supplier", "Supplier Applications", applications.supplier.filter(applicationNeedsReview).length]
                  ] as Array<[ApplicationKind, string, number]>).map(([kind, label, count]) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setApplicationTab(kind)}
                      className={`rounded-md px-4 py-2.5 text-sm font-black transition ${
                        applicationTab === kind ? "bg-leaf-700 text-white" : "bg-leaf-50 text-leaf-800 hover:bg-white"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>
                {applicationTab === "farmer" ? (
                  <div className="grid min-w-0 gap-5">
                    <section className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-earth-700">Editorial Filter</p>
                        <p className="mt-1 break-words text-sm font-semibold text-ink/58">
                          Prepare launch collections without leaving the farmer review workspace.
                        </p>
                      </div>
                      <label className="grid min-w-0 gap-2 text-xs font-black uppercase tracking-wide text-ink/45 sm:min-w-64">
                        Show farmers
                        <select
                          value={launchEditorialFilter}
                          onChange={(event) => setLaunchEditorialFilter(event.target.value as LaunchEditorialFilter)}
                          className="min-h-11 rounded-md border border-leaf-900/10 bg-leaf-50 px-3 py-2 text-sm font-black normal-case tracking-normal text-ink outline-none transition focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                        >
                          {(["All", "Founding Farmers", "Homepage Candidates", "Featured Farmers", "Story Candidates", "Launch Ready", "Needs Improvement"] as LaunchEditorialFilter[]).map((filter) => (
                            <option key={filter} value={filter}>
                              {filter}
                            </option>
                          ))}
                        </select>
                      </label>
                    </section>

                    <section className="admin-context-panel grid gap-3 p-4 sm:grid-cols-3">
                      {farmerReviewMetricCards.map((card) => (
                        <div key={card.label} className={`admin-metric-card ${adminMetricSeverityClass(card.severity)} rounded-md p-4 ring-1 ring-leaf-900/10`}>
                          <p className="text-xs font-black uppercase tracking-wide text-ink/45">{card.label}</p>
                          <p className="mt-2 text-xl font-black text-ink">{card.value}</p>
                        </div>
                      ))}
                    </section>

                    <section className="grid min-h-[720px] min-w-0 gap-5 xl:grid-cols-[250px_minmax(520px,1fr)_300px] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                      <aside className="admin-queue-panel p-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-earth-700">Farmer Queue</p>
                            <h3 className="mt-1 text-xl font-black text-ink">Review next</h3>
                          </div>
                          <span className={adminCountPillClass(visibleFarmerReviewSeverity)}>
                            <span className="sr-only">Farmers shown: </span>
                            {visibleFarmerReviewQueue.length}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2">
                          <label className="grid gap-2 text-xs font-black uppercase tracking-wide text-ink/45">
                            Search farmers
                            <div className="flex min-h-11 items-center gap-2 rounded-md bg-white px-3 ring-1 ring-leaf-900/10 transition focus-within:ring-2 focus-within:ring-leaf-600/20">
                              <Search className="h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                              <input
                                type="search"
                                value={farmerQueueSearch}
                                onChange={(event) => setFarmerQueueSearch(event.target.value)}
                                placeholder="Search farmer, farm, region, town or phone..."
                                className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold normal-case tracking-normal text-ink outline-none placeholder:text-ink/38"
                              />
                              {farmerQueueSearch ? (
                                <button
                                  type="button"
                                  onClick={() => setFarmerQueueSearch("")}
                                  className="grid min-h-8 min-w-8 place-items-center rounded-full text-ink/45 transition hover:bg-leaf-50 hover:text-leaf-800"
                                  aria-label="Clear farmer search"
                                >
                                  <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                              ) : null}
                            </div>
                          </label>
                          <p className="text-xs font-black uppercase tracking-wide text-ink/45">
                            {visibleFarmerReviewQueue.length} of {farmerReviewQueue.length} farmers shown
                          </p>
                          {visibleFarmerReviewQueue.map((farmer) => {
                            const priority = farmerQueuePriority(farmer);
                            const isSelected = reviewingImportedFarmer?.id === farmer.id;

                            return (
                              <button
                                key={farmer.id}
                                type="button"
                                onClick={() => void openImportedFarmerReview(farmer)}
                                className={`rounded-md border border-l-4 p-3 text-left transition ${
                                  isSelected
                                    ? "admin-selected-row border-leaf-700"
                                    : `border-leaf-900/10 ${priority.tone} hover:bg-white`
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-ink">{farmer.farm_name || farmer.farmer_name || "Unnamed farmer"}</p>
                                    <p className="mt-1 text-xs font-semibold text-ink/55">{farmer.region || "Region not provided"}</p>
                                  </div>
                                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${priority.dot}`} aria-hidden="true" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-ink/55 ring-1 ring-leaf-900/10">
                                    {farmer.status}
                                  </span>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-ink/55 ring-1 ring-leaf-900/10">
                                    {farmerWaitingLabel(farmer)}
                                  </span>
                                </div>
                                <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-ink/40">
                                  {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : "No date"}
                                </p>
                              </button>
                            );
                          })}
                          {visibleFarmerReviewQueue.length === 0 ? (
                            <p className="rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/58 ring-1 ring-leaf-900/10">
                              {farmerQueueSearch
                                ? "No farmer found. Try another name, farm, region or phone number."
                                : "No imported farmer applications are waiting for review."}
                            </p>
                          ) : null}
                        </div>
                      </aside>

                      <div className="admin-panel min-w-0 p-5">
                        {isLoadingFarmerReview ? (
                          <p className="rounded-md bg-earth-50 px-4 py-3 text-sm font-black text-earth-700">
                            Loading full farmer application...
                          </p>
                        ) : null}

                        {reviewingImportedFarmer ? (
                          <div className="grid gap-6">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Farmer Review</p>
                              <h3 className="mt-2 text-3xl font-black text-ink">{reviewingImportedFarmer.farm_name || reviewingImportedFarmer.farmer_name}</h3>
                              <p className="mt-2 text-sm font-semibold text-ink/60">
                                Welcome this farmer into the Ghana Growers network with a complete, trusted profile.
                              </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
                              <div className="aspect-[4/5] overflow-hidden rounded-md bg-leaf-50 ring-1 ring-leaf-900/10 sm:aspect-[3/4]">
                                {publicReviewPhotoUrl(reviewingImportedFarmer) ? (
                                  <div
                                    role="img"
                                    aria-label={`${reviewingImportedFarmer.farm_name || reviewingImportedFarmer.farmer_name} profile photo`}
                                    className="h-full w-full bg-contain bg-center bg-no-repeat"
                                    style={{ backgroundImage: `url(${publicReviewPhotoUrl(reviewingImportedFarmer)})` }}
                                  />
                                ) : (
                                  <div className="grid h-full place-items-center px-6 text-center text-sm font-black uppercase tracking-wide text-ink/35">
                                    {photoSubmittedButNotImported(reviewingImportedFarmer) ? farmerPhotoDiagnostics(reviewingImportedFarmer).status : "No photo submitted."}
                                  </div>
                                )}
                              </div>
                              <div className="grid gap-3">
                                <div className="rounded-md bg-leaf-50 p-4 ring-1 ring-leaf-900/10">
                                  <p className="text-xs font-black uppercase tracking-wide text-ink/45">Farm Photographs</p>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">
                                    {farmerMediaSummary(reviewingImportedFarmer)}
                                  </p>
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
                                </div>
                                <div className="rounded-md bg-earth-50 p-4 ring-1 ring-earth-500/20">
                                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">Photo Status</p>
                                  <p className="mt-2 text-sm font-black text-ink">{farmerPhotoDiagnostics(reviewingImportedFarmer).status}</p>
                                </div>
                              </div>
                            </div>

                            <section className="rounded-md border border-earth-500/25 bg-earth-50 p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Asset Uploads</h4>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
                                    Upload profile photos, farm photos, produce photos, and certificates directly to this farmer profile.
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Link
                                    href={`/admin/profiles/farmer/${encodeURIComponent(reviewingImportedFarmer.id)}`}
                                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                                  >
                                    <FilePenLine className="h-4 w-4" aria-hidden="true" />
                                    Edit Farmer Profile
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => openFarmerListingForm(reviewingImportedFarmer)}
                                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                                  >
                                    <Store className="h-4 w-4" aria-hidden="true" />
                                    Add / Review Marketplace Listing
                                  </button>
                                </div>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {([
                                  {
                                    key: "profile",
                                    label: publicReviewPhotoUrl(reviewingImportedFarmer) ? "Replace Profile Photo" : "Upload Profile Photo",
                                    accept: "image/jpeg,image/png,image/webp",
                                    multiple: false,
                                    replace: Boolean(publicReviewPhotoUrl(reviewingImportedFarmer))
                                  },
                                  {
                                    key: "farm",
                                    label: "Upload Farm Photos",
                                    accept: "image/jpeg,image/png,image/webp",
                                    multiple: true,
                                    replace: false
                                  },
                                  {
                                    key: "produce",
                                    label: "Upload Produce Photos",
                                    accept: "image/jpeg,image/png,image/webp",
                                    multiple: true,
                                    replace: false
                                  },
                                  {
                                    key: "document",
                                    label: "Upload Business / Registration Certificate",
                                    accept: "application/pdf,image/jpeg,image/png,image/webp",
                                    multiple: true,
                                    replace: false
                                  }
                                ] as Array<{ key: "profile" | "farm" | "produce" | "document"; label: string; accept: string; multiple: boolean; replace: boolean }>).map((action) => {
                                  const uploadKey = `${reviewingImportedFarmer.id}:${action.key}${action.replace ? ":replace" : ""}`;
                                  const isUploading = uploadingFarmerAsset === uploadKey;

                                  return (
                                    <label
                                      key={action.key}
                                      className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-center text-sm font-black ring-1 transition ${
                                        isUploading
                                          ? "bg-ink/10 text-ink/45 ring-ink/10"
                                          : "bg-white text-leaf-800 ring-leaf-900/10 hover:bg-leaf-50"
                                      }`}
                                    >
                                      <UploadCloud className="h-4 w-4 shrink-0" aria-hidden="true" />
                                      {isUploading ? "Uploading..." : action.label}
                                      <input
                                        type="file"
                                        accept={action.accept}
                                        multiple={action.multiple}
                                        disabled={Boolean(uploadingFarmerAsset)}
                                        onChange={(event) => void uploadFarmerAsset(reviewingImportedFarmer, action.key, event, action.replace)}
                                        className="sr-only"
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                              <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
                                Farmer profile photos and produce gallery photos stay separate from linked marketplace listing photos.
                              </p>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-2">
                              <FarmerMediaGallery
                                title="Farm Photos"
                                urls={reviewingFarmPhotoUrls}
                                filenames={reviewingFarmPhotoFilenames}
                                emptyLabel="No farm photos submitted."
                              />
                              <FarmerMediaGallery
                                title="Produce Photos"
                                urls={reviewingProducePhotoUrls}
                                filenames={reviewingProducePhotoFilenames}
                                emptyLabel={
                                  reviewingLinkedListingPhotoCount > 0
                                    ? "No profile produce photos submitted. Listing photos are available below."
                                    : "No produce photos submitted."
                                }
                              />
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                  <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Linked Marketplace Listings</h4>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
                                    Listing photos stay separate from farmer profile photos, but they help verify what this farmer is actively selling.
                                  </p>
                                </div>
                                <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10">
                                  {reviewingLinkedMarketplaceListings.length} listing{reviewingLinkedMarketplaceListings.length === 1 ? "" : "s"}
                                </span>
                              </div>

                              {reviewingLinkedMarketplaceListings.length > 0 ? (
                                <div className="mt-4 grid gap-3">
                                  {reviewingLinkedMarketplaceListings.map((listing) => (
                                    <article key={listing.id} className="rounded-md bg-leaf-50 p-3 ring-1 ring-leaf-900/10">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="break-words text-sm font-black text-ink">{listing.product_name || "Marketplace listing"}</p>
                                          <p className="mt-1 text-xs font-semibold text-ink/55">
                                            {[listing.availability, listing.status].filter(Boolean).join(" • ") || "Status not provided"}
                                          </p>
                                        </div>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-earth-700 ring-1 ring-leaf-900/10">
                                          {listing.status || "Listed"}
                                        </span>
                                      </div>
                                      {listing.images.length > 0 ? (
                                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                          {listing.images.slice(0, 8).map((url, index) => (
                                            <div key={`${listing.id}-${url}`} className="aspect-[4/3] overflow-hidden rounded-md bg-white ring-1 ring-leaf-900/10">
                                              <div
                                                role="img"
                                                aria-label={`${listing.product_name || "Listing"} photo ${index + 1}`}
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${url})` }}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-ink/55 ring-1 ring-leaf-900/10">
                                          This listing has no uploaded photos.
                                        </p>
                                      )}
                                    </article>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">
                                  No linked marketplace listings found for this farmer.
                                </p>
                              )}
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Farmer Information</h4>
                              <dl className="mt-4 divide-y divide-leaf-900/10 rounded-md bg-leaf-50 ring-1 ring-leaf-900/10">
                                {[
                                  ["Name", reviewingImportedFarmer.farmer_name],
                                  ["Farm", reviewingImportedFarmer.farm_name],
                                  ["Phone", reviewingImportedFarmer.phone_number || reviewingImportedFarmer.whatsapp_number],
                                  ["WhatsApp", reviewingImportedFarmer.whatsapp_number],
                                  ["Email", reviewingImportedFarmer.email],
                                  ["Region", reviewingImportedFarmer.region],
                                  ["District", reviewingImportedFarmer.district],
                                  ["Farm Size", reviewingImportedFarmer.farm_size],
                                  ["Years Farming", reviewingImportedFarmer.farming_experience]
                                ].map(([label, value]) => (
                                  <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                                    <dt className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</dt>
                                    <dd className="min-w-0 break-words text-sm font-black leading-6 text-ink">{value || "Not provided"}</dd>
                                  </div>
                                ))}
                              </dl>
                              <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wide text-ink/45">Internal Farmer ID</p>
                                    <p className="mt-2 break-all text-sm font-black text-ink">{reviewingImportedFarmer.id}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(reviewingImportedFarmer.id)}
                                    className="min-h-11 rounded-md bg-leaf-50 px-4 py-2 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                                  >
                                    Copy ID
                                  </button>
                                </div>
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Produce</h4>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {reviewingImportedFarmer.products.length > 0 ? (
                                  reviewingImportedFarmer.products.map((product) => (
                                    <span key={product} className="rounded-full bg-leaf-50 px-3 py-1.5 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10">
                                      {product}
                                    </span>
                                  ))
                                ) : (
                                  <span className="rounded-full bg-earth-50 px-3 py-1.5 text-sm font-black text-earth-700">
                                    Produce not provided
                                  </span>
                                )}
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-md bg-leaf-50 p-3">
                                  <p className="text-xs font-black uppercase tracking-wide text-ink/45">Current Availability</p>
                                  <p className="mt-2 text-sm font-black text-ink">{reviewingImportedFarmer.currently_harvesting || "To be confirmed"}</p>
                                </div>
                                <div className="rounded-md bg-leaf-50 p-3">
                                  <p className="text-xs font-black uppercase tracking-wide text-ink/45">Supply Frequency</p>
                                  <p className="mt-2 text-sm font-black text-ink">{reviewingImportedFarmer.supply_frequency || "To be confirmed"}</p>
                                </div>
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Farm Story</h4>
                              <p className="mt-3 text-sm font-semibold leading-7 text-ink/68">
                                {reviewingImportedFarmer.description || `${reviewingImportedFarmer.farm_name || reviewingImportedFarmer.farmer_name} is applying to join the Ghana Growers farmer network from ${[reviewingImportedFarmer.district, reviewingImportedFarmer.region].filter(Boolean).join(", ") || "Ghana"}.`}
                              </p>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                                <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Uploaded Documents</h4>
                                <div className="mt-3 grid gap-2">
                                  {reviewingDocuments.length > 0 ? (
                                    reviewingDocuments.map((document) => (
                                      <div key={`${document.label}-${document.filename}`} className="rounded-md bg-leaf-50 p-3">
                                        <p className="text-sm font-black text-ink">{document.label}</p>
                                        {document.url ? (
                                          <a
                                            href={document.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1 block break-all text-xs font-black text-leaf-800 hover:text-leaf-900"
                                          >
                                            Open document
                                          </a>
                                        ) : null}
                                        <p className="mt-1 break-all text-xs font-semibold text-ink/55">{document.filename}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">No certificates or additional files submitted.</p>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                                <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Application Timeline</h4>
                                <div className="mt-4 grid gap-3">
                                  {farmerReviewTimeline(reviewingImportedFarmer).map((item) => (
                                    <div key={item.label} className="flex gap-3">
                                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-leaf-700" />
                                      <div>
                                        <p className="text-sm font-black text-ink">{item.label}</p>
                                        <p className="mt-1 text-xs font-semibold text-ink/55">{item.detail}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Profile Readiness</h4>
                              <div className="mt-4 grid gap-2">
                                {reviewingReadiness.map((item) => (
                                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-leaf-900/10">
                                    <span className="text-sm font-black text-ink">{item.label}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${item.complete ? "bg-leaf-100 text-leaf-800" : "bg-earth-50 text-earth-700"}`}>
                                      {item.complete ? "Ready" : item.note}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        ) : (
                          <div className="grid min-h-[420px] place-items-center rounded-md bg-leaf-50 p-8 text-center">
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-earth-700">No farmer selected</p>
                              <h3 className="mt-2 text-2xl font-black text-ink">Choose a farmer from the queue</h3>
                              <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-ink/60">
                                The review workspace keeps the queue, application, and decision controls visible for continuous review.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <aside className="admin-panel p-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
                        <p className="text-xs font-black uppercase tracking-wide text-earth-700">Decision Center</p>
                        {reviewingImportedFarmer ? (
                          <div className="mt-4 grid gap-4">
                            {farmerReviewMessage ? (
                              <div
                                className={`whitespace-pre-line rounded-md px-4 py-3 text-sm font-black ${
                                  farmerReviewMessage.type === "success"
                                  ? "admin-feedback-success"
                                    : "admin-feedback-error"
                                }`}
                                role={farmerReviewMessage.type === "error" ? "alert" : "status"}
                              >
                                {farmerReviewMessage.text}
                              </div>
                            ) : null}

                            <div className="admin-recommendation-panel p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-ink/45">Recommended Action</p>
                              <p className="mt-2 text-xl font-black text-ink">{recommendedFarmerAction}</p>
                              <p className="mt-2 text-xs font-semibold leading-5 text-ink/55">
                                Recommendations assist the reviewer. The final decision remains with Ghana Growers.
                              </p>
                            </div>

                            <label htmlFor="farmer-verification-notes" className="grid gap-2 text-sm font-black text-ink">
                              Internal Notes
                              <textarea
                                id="farmer-verification-notes"
                                value={verificationReviewNotes}
                                onChange={(event) => setVerificationReviewNotes(event.target.value)}
                                rows={7}
                                className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                                placeholder="Record call notes, missing details, and decision context."
                              />
                            </label>

                            <div className="admin-context-panel p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-ink/45">Trust</p>
                              <div className="mt-3 grid gap-2">
                                {[
                                  ["Verification", reviewingImportedFarmer.verification_status],
                                  ["GG Standard", reviewingImportedFarmer.gg_standard_status ?? "Pending"],
                                  ["Featured Farmer", "Not featured"],
                                  ["Founding Farmer", normalizedFarmerSource(reviewingImportedFarmer.source) === "Founding Farmer" ? "Yes" : "No"]
                                ].map(([label, value]) => (
                                  <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-leaf-900/10">
                                    <span className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</span>
                                    <span className="text-xs font-black text-ink">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {reviewingEditorialDecision && reviewingLaunchProgress && reviewingLaunchReadiness ? (
                              <div className="rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">Launch & Editorial</p>
                                    <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">
                                      Internal curation for launch collections.
                                    </p>
                                  </div>
                                  <div className="grid justify-items-end gap-1">
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${reviewingLaunchReadiness.tone}`}>
                                      {reviewingLaunchReadiness.label}
                                    </span>
                                    <span className="text-[11px] font-black uppercase tracking-wide text-ink/35">
                                      {editorialSaveStates[reviewingImportedFarmer.id] === "saving"
                                        ? "Saving"
                                        : editorialSaveStates[reviewingImportedFarmer.id] === "error"
                                          ? "Save failed"
                                          : editorialSaveStates[reviewingImportedFarmer.id] === "dirty"
                                            ? "Unsaved changes"
                                          : editorialSaveStates[reviewingImportedFarmer.id] === "saved"
                                            ? "Saved"
                                            : reviewingImportedFarmer.editorial_updated_by
                                              ? `Saved by ${reviewingImportedFarmer.editorial_updated_by}`
                                              : "Not saved yet"}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => void saveEditorialDecision(reviewingImportedFarmer.id, reviewingEditorialDecision)}
                                  disabled={editorialSaveStates[reviewingImportedFarmer.id] !== "dirty"}
                                  className="admin-action-secondary mt-4 w-full"
                                >
                                  Save application review
                                </button>

                                <div className="mt-4 grid gap-2">
                                  <p className="text-xs font-black uppercase tracking-wide text-ink/45">Launch Status</p>
                                  <div className="grid gap-2">
                                    {launchEditorialStatusOptions.map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() =>
                                          updateEditorialDecision(reviewingImportedFarmer.id, (current) => ({
                                            ...current,
                                            launchStatus: status
                                          }), 0)
                                        }
                                        className={`rounded-md px-3 py-2 text-left text-xs font-black transition ${
                                          reviewingEditorialDecision.launchStatus === status
                                            ? "bg-leaf-700 text-white"
                                            : "bg-leaf-50 text-ink/65 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-2">
                                  {([
                                    ["Homepage Candidate", "homepageCandidate"],
                                    ["Marketplace Featured", "marketplaceFeatured"],
                                    ["Story Candidate", "storyCandidate"]
                                  ] as Array<[string, "homepageCandidate" | "marketplaceFeatured" | "storyCandidate"]>).map(([label, key]) => (
                                    <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-leaf-50 px-3 py-2 ring-1 ring-leaf-900/10">
                                      <span className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateEditorialDecision(reviewingImportedFarmer.id, (current) => ({
                                            ...current,
                                            [key]: !current[key]
                                          }), 0)
                                        }
                                        className={`rounded-full px-3 py-1 text-xs font-black transition ${
                                          reviewingEditorialDecision[key]
                                            ? "bg-leaf-700 text-white"
                                            : "bg-white text-ink/55 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                                        }`}
                                      >
                                        {reviewingEditorialDecision[key] ? "Yes" : "No"}
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => openFarmerStoryForm(reviewingImportedFarmer)}
                                    className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                                  >
                                    <Star className="h-4 w-4" aria-hidden="true" />
                                    Create Story for this Farmer
                                  </button>
                                </div>

                                <label className="mt-4 grid gap-2 text-xs font-black uppercase tracking-wide text-ink/45">
                                  Editorial Notes
                                  <textarea
                                    value={reviewingEditorialDecision.editorialNotes}
                                    onChange={(event) =>
                                      updateEditorialDecision(reviewingImportedFarmer.id, (current) => ({
                                        ...current,
                                        editorialNotes: event.target.value
                                      }), 800)
                                    }
                                    rows={4}
                                    className="resize-y rounded-md border border-leaf-900/10 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-ink/75 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                                    placeholder="Excellent communication. Needs better produce photos."
                                  />
                                </label>

                                <div className="mt-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-black uppercase tracking-wide text-ink/45">Launch Checklist</p>
                                    <span className="text-xs font-black text-leaf-800">
                                      {reviewingLaunchProgress.complete}/{reviewingLaunchProgress.total}
                                    </span>
                                  </div>
                                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf-50">
                                    <div className="h-full rounded-full bg-leaf-700" style={{ width: `${reviewingLaunchProgress.percent}%` }} />
                                  </div>
                                  <div className="mt-3 grid gap-2">
                                    {launchEditorialChecklistItems.map((item) => (
                                      <label
                                        key={item}
                                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-ink/70 ring-1 ring-leaf-900/10"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={reviewingEditorialDecision.checklist[item]}
                                          onChange={(event) =>
                                            updateEditorialDecision(reviewingImportedFarmer.id, (current) => ({
                                              ...current,
                                              checklist: {
                                                ...current.checklist,
                                                [item]: event.target.checked
                                              }
                                            }), 200)
                                          }
                                          className="h-4 w-4 rounded border-leaf-900/20 text-leaf-700"
                                        />
                                        {item}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            <div className="rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Communication</p>
                              <div className="mt-3 grid gap-2 text-sm font-semibold text-ink/65">
                                <p>Phone: {reviewingImportedFarmer.phone_number || "Not provided"}</p>
                                <p>WhatsApp: {reviewingImportedFarmer.whatsapp_number || "Not provided"}</p>
                                <p>Email: {reviewingImportedFarmer.email || "Not provided"}</p>
                              </div>
                              <div className="mt-3 grid gap-2">
                                <button
                                  type="button"
                                  onClick={() => reviewingImportedFarmer.phone_number && navigator.clipboard.writeText(reviewingImportedFarmer.phone_number)}
                                  className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                                >
                                  Copy Number
                                </button>
                                {reviewingWhatsappUrl ? (
                                  <a
                                    href={reviewingWhatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md bg-white px-3 py-2 text-center text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50"
                                  >
                                    Open WhatsApp
                                  </a>
                                ) : null}
                              </div>
                            </div>

                            <div className="rounded-md bg-leaf-50 p-4 ring-1 ring-leaf-900/10">
                              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Marketplace</p>
                              <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">
                                Create a farmer-owned listing without copying owner details.
                              </p>
                              <button
                                type="button"
                                onClick={() => openFarmerListingForm(reviewingImportedFarmer)}
                                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800"
                              >
                                <Store className="h-4 w-4" aria-hidden="true" />
                                Create Listing for this Farmer
                              </button>
                            </div>

                            <div className="grid gap-2">
                              <Link
                                href={`/admin/profiles/farmer/${encodeURIComponent(reviewingImportedFarmer.id)}`}
                                className="admin-action-primary w-full"
                              >
                                Open profile review & publication
                              </Link>
                              <button
                                type="button"
                                onClick={() => void applyImportedFarmerReviewAction("needs-follow-up")}
                                disabled={isUpdatingFarmerReview}
                                className="admin-action-warning w-full"
                              >
                                {pendingFarmerReviewAction === "needs-follow-up" ? "Requesting..." : "Request Changes"}
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => previousImportedFarmer && void openImportedFarmerReview(previousImportedFarmer)}
                                disabled={!previousImportedFarmer || isUpdatingFarmerReview}
                                className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                onClick={() => nextImportedFarmer && void openImportedFarmerReview(nextImportedFarmer)}
                                disabled={!nextImportedFarmer || isUpdatingFarmerReview}
                                className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Next Farmer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 rounded-md bg-leaf-50 p-4 text-sm font-semibold leading-6 text-ink/58">
                            Select a farmer from the queue to make a review decision.
                          </p>
                        )}
                      </aside>
                    </section>
                  </div>
                ) : applicationTab === "supplier" ? (
                  <div className="grid min-w-0 gap-5">
                    <section className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-earth-700">Supplier Editorial Filter</p>
                        <p className="mt-1 break-words text-sm font-semibold text-ink/58">
                          Prepare supplier launch collections without leaving the review workspace.
                        </p>
                      </div>
                      <label className="grid min-w-0 gap-2 text-xs font-black uppercase tracking-wide text-ink/45 sm:min-w-64">
                        Show suppliers
                        <select
                          value={supplierEditorialFilter}
                          onChange={(event) => setSupplierEditorialFilter(event.target.value as SupplierEditorialFilter)}
                          className="min-h-11 rounded-md border border-leaf-900/10 bg-leaf-50 px-3 py-2 text-sm font-black normal-case tracking-normal text-ink outline-none transition focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                        >
                          {(["All", "Founding Suppliers", "Featured Suppliers", "Homepage Candidates", "Launch Ready", "Needs Improvement", "Overdue", "New"] as SupplierEditorialFilter[]).map((filter) => (
                            <option key={filter} value={filter}>
                              {filter}
                            </option>
                          ))}
                        </select>
                      </label>
                    </section>

                    <section className="admin-context-panel grid gap-3 p-4 sm:grid-cols-3">
                      {supplierReviewMetricCards.map((card) => (
                        <div key={card.label} className={`admin-metric-card ${adminMetricSeverityClass(card.severity)} rounded-md p-4 ring-1 ring-leaf-900/10`}>
                          <p className="text-xs font-black uppercase tracking-wide text-ink/45">{card.label}</p>
                          <p className="mt-2 text-xl font-black text-ink">{card.value}</p>
                        </div>
                      ))}
                    </section>

                    <section className="grid min-h-[720px] min-w-0 gap-5 xl:grid-cols-[250px_minmax(520px,1fr)_300px] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                      <aside className="admin-queue-panel p-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-earth-700">Supplier Queue</p>
                            <h3 className="mt-1 text-xl font-black text-ink">Review next</h3>
                          </div>
                          <span className={adminCountPillClass(supplierReviewSeverity)}>
                            <span className="sr-only">Suppliers shown: </span>
                            {supplierReviewQueue.length}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2">
                          {supplierReviewQueue.map((supplier) => {
                            const priority = supplierQueuePriority(supplier);
                            const isSelected = reviewingSupplier?.id === supplier.id;
                            const categories = applicationCategories(supplier);
                            const region = applicationRegions(supplier)[0] || supplier.region || "Region not provided";

                            return (
                              <button
                                key={supplier.id}
                                type="button"
                                onClick={() => {
                                  setReviewingSupplierId(supplier.id);
                                  setSupplierReviewNotes(supplier.editorial_notes ?? "");
                                  setSupplierReviewMessage(null);
                                }}
                                className={`rounded-md border border-l-4 p-3 text-left transition ${
                                  isSelected
                                    ? "admin-selected-row border-leaf-700"
                                    : `border-leaf-900/10 ${priority.tone} hover:bg-white`
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-ink">{applicationName(supplier)}</p>
                                    <p className="mt-1 truncate text-xs font-semibold text-ink/55">{supplier.name || "Contact not provided"}</p>
                                  </div>
                                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${priority.dot}`} aria-hidden="true" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-ink/55 ring-1 ring-leaf-900/10">
                                    {categories[0] || "Category missing"}
                                  </span>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-ink/55 ring-1 ring-leaf-900/10">
                                    {region}
                                  </span>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-ink/55 ring-1 ring-leaf-900/10">
                                    {supplier.status}
                                  </span>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-ink/55 ring-1 ring-leaf-900/10">
                                    {supplierWaitingLabel(supplier)}
                                  </span>
                                </div>
                                <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-ink/40">
                                  {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "No date"}
                                </p>
                              </button>
                            );
                          })}
                          {supplierReviewQueue.length === 0 ? (
                            <p className="rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/58 ring-1 ring-leaf-900/10">
                              No supplier applications match this filter.
                            </p>
                          ) : null}
                        </div>
                      </aside>

                      <div className="admin-panel min-w-0 p-5">
                        {reviewingSupplier ? (
                          <div className="grid gap-6">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Supplier Review</p>
                              <h3 className="mt-2 text-3xl font-black text-ink">{applicationName(reviewingSupplier)}</h3>
                              <p className="mt-2 text-sm font-semibold text-ink/60">
                                Review this business for the Ghana Growers supplier network.
                              </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                              <div className="aspect-square overflow-hidden rounded-md bg-leaf-50 ring-1 ring-leaf-900/10">
                                {reviewingSupplier.logo_url ? (
                                  <div
                                    role="img"
                                    aria-label={`${applicationName(reviewingSupplier)} logo`}
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${reviewingSupplier.logo_url})` }}
                                  />
                                ) : (
                                  <div className="grid h-full place-items-center px-6 text-center text-sm font-black uppercase tracking-wide text-ink/35">
                                    Business logo not submitted.
                                  </div>
                                )}
                              </div>
                              <div className="rounded-md bg-leaf-50 p-4 ring-1 ring-leaf-900/10">
                                <p className="text-xs font-black uppercase tracking-wide text-ink/45">Business Photos</p>
                                {reviewingSupplier.photo_urls?.length ? (
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    {reviewingSupplier.photo_urls.slice(0, 4).map((url, index) => (
                                      <div
                                        key={`${url}-${index}`}
                                        role="img"
                                        aria-label={`${applicationName(reviewingSupplier)} business photo ${index + 1}`}
                                        className="aspect-[4/3] rounded-md bg-cover bg-center ring-1 ring-leaf-900/10"
                                        style={{ backgroundImage: `url(${url})` }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 rounded-md bg-white p-3 text-sm font-semibold leading-6 text-ink/58 ring-1 ring-leaf-900/10">
                                    No business photos submitted.
                                  </p>
                                )}
                              </div>
                            </div>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Business Information</h4>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {[
                                  ["Business Name", applicationName(reviewingSupplier)],
                                  ["Contact Person", reviewingSupplier.name],
                                  ["Phone", reviewingSupplier.phone || reviewingSupplier.whatsapp_number],
                                  ["Email", reviewingSupplier.email],
                                  ["Website", reviewingSupplier.website_url],
                                  ["Registration Number", reviewingSupplier.registration_number],
                                  ["Years in Business", reviewingSupplier.years_in_business]
                                ].map(([label, value]) => (
                                  <div key={label} className="rounded-md bg-leaf-50 p-3">
                                    <p className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</p>
                                    <p className="mt-2 break-words text-sm font-black text-ink">{value || "Not provided"}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Categories</h4>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {applicationCategories(reviewingSupplier).length > 0 ? (
                                  applicationCategories(reviewingSupplier).map((category) => (
                                    <span key={category} className="rounded-full bg-leaf-50 px-3 py-1.5 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10">
                                      {category}
                                    </span>
                                  ))
                                ) : (
                                  <span className="rounded-full bg-earth-50 px-3 py-1.5 text-sm font-black text-earth-700">
                                    Categories not provided
                                  </span>
                                )}
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Regions Served</h4>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {applicationRegions(reviewingSupplier).map((region) => (
                                  <span key={region} className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-ink/65 ring-1 ring-leaf-900/10">
                                    {region}
                                  </span>
                                ))}
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Business Description</h4>
                              <p className="mt-3 text-sm font-semibold leading-7 text-ink/68">
                                {reviewingSupplier.business_description || reviewingSupplier.notes || `${applicationName(reviewingSupplier)} is applying to join the Ghana Growers supplier network.`}
                              </p>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                                <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Uploaded Documents</h4>
                                <div className="mt-3 grid gap-2">
                                  {reviewingSupplierDocuments.length > 0 ? (
                                    reviewingSupplierDocuments.map((document) => (
                                      <div key={`${document.label}-${document.filename}`} className="rounded-md bg-leaf-50 p-3">
                                        <p className="text-sm font-black text-ink">{document.label}</p>
                                        <p className="mt-1 break-all text-xs font-semibold text-ink/55">{document.filename}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">No certificates or additional files submitted.</p>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                                <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Timeline</h4>
                                <div className="mt-4 grid gap-3">
                                  {supplierReviewTimeline(reviewingSupplier).map((item) => (
                                    <div key={item.label} className="flex gap-3">
                                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-leaf-700" />
                                      <div>
                                        <p className="text-sm font-black text-ink">{item.label}</p>
                                        <p className="mt-1 text-xs font-semibold text-ink/55">{item.detail}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>

                            <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                              <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Profile Readiness</h4>
                              <div className="mt-4 grid gap-2">
                                {reviewingSupplierReadiness.map((item) => (
                                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-leaf-900/10">
                                    <span className="text-sm font-black text-ink">{item.label}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${item.complete ? "bg-leaf-100 text-leaf-800" : "bg-earth-50 text-earth-700"}`}>
                                      {item.complete ? "Ready" : item.note}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        ) : (
                          <div className="grid min-h-[420px] place-items-center rounded-md bg-leaf-50 p-8 text-center">
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-earth-700">No supplier selected</p>
                              <h3 className="mt-2 text-2xl font-black text-ink">Choose a supplier from the queue</h3>
                            </div>
                          </div>
                        )}
                      </div>

                      <aside className="admin-panel p-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
                        <p className="text-xs font-black uppercase tracking-wide text-earth-700">Decision Center</p>
                        {reviewingSupplier ? (
                          <div className="mt-4 grid gap-4">
                            {supplierReviewMessage ? (
                              <div
                                className={`rounded-md px-4 py-3 text-sm font-black ${
                                  supplierReviewMessage.type === "success"
                                  ? "admin-feedback-success"
                                    : "admin-feedback-error"
                                }`}
                                role={supplierReviewMessage.type === "error" ? "alert" : "status"}
                              >
                                {supplierReviewMessage.text}
                              </div>
                            ) : null}

                            <div className="admin-recommendation-panel p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-ink/45">Recommended Action</p>
                              <p className="mt-2 text-xl font-black text-ink">{recommendedSupplierAction}</p>
                              <p className="mt-2 text-xs font-semibold leading-5 text-ink/55">
                                Recommendations assist the reviewer. The final decision remains with Ghana Growers.
                              </p>
                            </div>

                            <label htmlFor="supplier-review-notes" className="grid gap-2 text-sm font-black text-ink">
                              Internal Notes
                              <textarea
                                id="supplier-review-notes"
                                value={supplierReviewNotes}
                                onChange={(event) => setSupplierReviewNotes(event.target.value)}
                                rows={7}
                                className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                                placeholder="Record call notes, missing details, and decision context."
                              />
                            </label>

                            <div className="admin-context-panel p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-ink/45">Trust</p>
                              <div className="mt-3 grid gap-2">
                                {[
                                  ["Verified Business", reviewingSupplier.status === "Approved" || reviewingSupplier.status === "Converted" ? "Yes" : "Pending"],
                                  ["GG Standard", reviewingSupplier.gg_standard_agreement ? "Agreed" : "Pending"],
                                  ["Featured Supplier", reviewingSupplierEditorialDecision?.marketplaceFeatured ? "Yes" : "No"],
                                  ["Founding Supplier", reviewingSupplierEditorialDecision?.launchStatus === "Founding Supplier 2026" ? "Yes" : "No"]
                                ].map(([label, value]) => (
                                  <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-leaf-900/10">
                                    <span className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</span>
                                    <span className="text-xs font-black text-ink">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {reviewingSupplierEditorialDecision && reviewingSupplierLaunchProgress && reviewingSupplierLaunchReadiness ? (
                              <div className="rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">Launch & Editorial</p>
                                    <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">
                                      Internal curation for supplier launch collections.
                                    </p>
                                  </div>
                                  <div className="grid justify-items-end gap-1">
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${reviewingSupplierLaunchReadiness.tone}`}>
                                      {reviewingSupplierLaunchReadiness.label}
                                    </span>
                                    <span className="text-[11px] font-black uppercase tracking-wide text-ink/35">
                                      {supplierEditorialSaveStates[reviewingSupplier.id] === "saving"
                                        ? "Saving"
                                        : supplierEditorialSaveStates[reviewingSupplier.id] === "error"
                                          ? "Save failed"
                                          : supplierEditorialSaveStates[reviewingSupplier.id] === "dirty"
                                            ? "Unsaved changes"
                                          : supplierEditorialSaveStates[reviewingSupplier.id] === "saved"
                                            ? "Saved"
                                            : reviewingSupplier.editorial_updated_by
                                              ? `Saved by ${reviewingSupplier.editorial_updated_by}`
                                              : "Not saved yet"}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => void saveSupplierEditorialDecision(reviewingSupplier.id, reviewingSupplierEditorialDecision)}
                                  disabled={supplierEditorialSaveStates[reviewingSupplier.id] !== "dirty"}
                                  className="admin-action-secondary mt-4 w-full"
                                >
                                  Save application review
                                </button>

                                <div className="mt-4 grid gap-2">
                                  <p className="text-xs font-black uppercase tracking-wide text-ink/45">Launch Status</p>
                                  <div className="grid gap-2">
                                    {supplierLaunchStatusOptions.map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() =>
                                          updateSupplierEditorialDecision(reviewingSupplier.id, (current) => ({
                                            ...current,
                                            launchStatus: status
                                          }), 0)
                                        }
                                        className={`rounded-md px-3 py-2 text-left text-xs font-black transition ${
                                          reviewingSupplierEditorialDecision.launchStatus === status
                                            ? "bg-leaf-700 text-white"
                                            : "bg-leaf-50 text-ink/65 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-2">
                                  {([
                                    ["Homepage Candidate", "homepageCandidate"],
                                    ["Marketplace Featured", "marketplaceFeatured"],
                                    ["Story Candidate", "storyCandidate"]
                                  ] as Array<[string, "homepageCandidate" | "marketplaceFeatured" | "storyCandidate"]>).map(([label, key]) => (
                                    <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-leaf-50 px-3 py-2 ring-1 ring-leaf-900/10">
                                      <span className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateSupplierEditorialDecision(reviewingSupplier.id, (current) => ({
                                            ...current,
                                            [key]: !current[key]
                                          }), 0)
                                        }
                                        className={`rounded-full px-3 py-1 text-xs font-black transition ${
                                          reviewingSupplierEditorialDecision[key]
                                            ? "bg-leaf-700 text-white"
                                            : "bg-white text-ink/55 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                                        }`}
                                      >
                                        {reviewingSupplierEditorialDecision[key] ? "Yes" : "No"}
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <label className="mt-4 grid gap-2 text-xs font-black uppercase tracking-wide text-ink/45">
                                  Editorial Notes
                                  <textarea
                                    value={reviewingSupplierEditorialDecision.editorialNotes}
                                    onChange={(event) =>
                                      updateSupplierEditorialDecision(reviewingSupplier.id, (current) => ({
                                        ...current,
                                        editorialNotes: event.target.value
                                      }), 800)
                                    }
                                    rows={4}
                                    className="resize-y rounded-md border border-leaf-900/10 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-ink/75 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                                    placeholder="Strong input supplier. Needs better business photos."
                                  />
                                </label>

                                <div className="mt-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-black uppercase tracking-wide text-ink/45">Launch Checklist</p>
                                    <span className="text-xs font-black text-leaf-800">
                                      {reviewingSupplierLaunchProgress.complete}/{reviewingSupplierLaunchProgress.total}
                                    </span>
                                  </div>
                                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-leaf-50">
                                    <div className="h-full rounded-full bg-leaf-700" style={{ width: `${reviewingSupplierLaunchProgress.percent}%` }} />
                                  </div>
                                  <div className="mt-3 grid gap-2">
                                    {supplierLaunchChecklistItems.map((item) => (
                                      <label
                                        key={item}
                                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md bg-leaf-50 px-3 py-2 text-sm font-black text-ink/70 ring-1 ring-leaf-900/10"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={reviewingSupplierEditorialDecision.checklist[item]}
                                          onChange={(event) =>
                                            updateSupplierEditorialDecision(reviewingSupplier.id, (current) => ({
                                              ...current,
                                              checklist: {
                                                ...current.checklist,
                                                [item]: event.target.checked
                                              }
                                            }), 200)
                                          }
                                          className="h-4 w-4 rounded border-leaf-900/20 text-leaf-700"
                                        />
                                        {item}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            <div className="rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                              <p className="text-xs font-black uppercase tracking-wide text-earth-700">Communication</p>
                              <div className="mt-3 grid gap-2 text-sm font-semibold text-ink/65">
                                <p>Phone: {reviewingSupplier.phone || reviewingSupplier.whatsapp_number || "Not provided"}</p>
                                <p>Email: {reviewingSupplier.email || "Not provided"}</p>
                              </div>
                              <div className="mt-3 grid gap-2">
                                <button
                                  type="button"
                                  onClick={() => (reviewingSupplier.phone || reviewingSupplier.whatsapp_number) && navigator.clipboard.writeText(reviewingSupplier.phone || reviewingSupplier.whatsapp_number)}
                                  className="rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white"
                                >
                                  Copy Number
                                </button>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <button
                                type="button"
                                onClick={() => void applySupplierReviewAction(reviewingSupplier, "approve-only")}
                                disabled={isUpdatingSupplierReview}
                                className="admin-action-primary w-full"
                              >
                                {pendingSupplierReviewAction === "Approved" ? "Approving..." : "Approve Application"}
                              </button>
                              {reviewingSupplier.status === "Approved" || reviewingSupplier.linked_supplier_id ? (
                                <button
                                  type="button"
                                  onClick={() => void convertProfileApplication("supplier", reviewingSupplier)}
                                  disabled={isUpdatingSupplierReview}
                                  className="admin-action-secondary w-full"
                                >
                                  {reviewingSupplier.linked_supplier_id ? "Open Supplier Profile" : "Create Supplier Profile"}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void applySupplierReviewAction(reviewingSupplier, "request-changes")}
                                disabled={isUpdatingSupplierReview}
                                className="admin-action-warning w-full"
                              >
                                {pendingSupplierReviewAction === "Under Review" ? "Requesting..." : "Request Changes"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void applySupplierReviewAction(reviewingSupplier, "reject")}
                                disabled={isUpdatingSupplierReview}
                                className="admin-action-destructive w-full"
                              >
                                {pendingSupplierReviewAction === "Rejected" ? "Rejecting..." : "Reject"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void applySupplierReviewAction(reviewingSupplier, "archive")}
                                disabled={isUpdatingSupplierReview}
                                className="admin-action-tertiary w-full"
                              >
                                {pendingSupplierReviewAction === "archive" ? "Archiving..." : "Archive"}
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => previousSupplier && setReviewingSupplierId(previousSupplier.id)}
                                disabled={!previousSupplier || isUpdatingSupplierReview}
                                className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                onClick={() => nextSupplier && setReviewingSupplierId(nextSupplier.id)}
                                disabled={!nextSupplier || isUpdatingSupplierReview}
                                className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Next Supplier
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 rounded-md bg-leaf-50 p-4 text-sm font-semibold leading-6 text-ink/58">
                            Select a supplier from the queue to make a review decision.
                          </p>
                        )}
                      </aside>
                    </section>
                  </div>
                ) : (
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
                )}
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
            ) : isBuyerRequestsSection ? (
              <div className="grid gap-6 p-5">
                {leadRequestError ? (
                  <div className="rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700">{leadRequestError}</div>
                ) : null}

                <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-earth-700">Unified Buyer Enquiries</p>
                      <h3 className="mt-2 text-2xl font-black text-ink">Review private produce requests</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
                        Marketplace listing requests, directory connection requests, and generic sourcing requests all appear here before any sourcing action starts.
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
                      Refresh Requests
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                    <label className="relative block">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search buyer, product, listing, location, phone..."
                        className="w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-black uppercase tracking-wide text-ink/45 lg:min-w-56">
                      Status
                      <select
                        value={produceRequestStatusFilter}
                        onChange={(event) => setProduceRequestStatusFilter(event.target.value as ProduceRequestStatusFilter)}
                        className="min-h-11 rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-sm font-black normal-case tracking-normal text-ink outline-none transition focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                      >
                        {produceRequestStatusFilters.map((filter) => (
                          <option key={filter} value={filter}>{filter === "All" ? "All statuses" : filter}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {produceRequestMetricCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div key={card.label} className={`admin-metric-card ${adminMetricSeverityClass(card.severity)} rounded-md border border-leaf-900/10 p-4 shadow-sm`}>
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

                <section className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr]">
                  <div className="admin-queue-panel p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Produce Requests</p>
                        <h3 className="mt-2 text-xl font-black text-ink">{produceRequestFilterTitle(produceRequestStatusFilter)}</h3>
                      </div>
                      <p className={`${adminCountPillClass(produceRequestListSeverity)} text-sm`}>
                        {produceRequestLeads.length} {produceRequestFilterTitle(produceRequestStatusFilter).toLowerCase()} shown
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {produceRequestLeads.map((lead) => {
                        const status = normalizeLeadStatus(lead.status);
                        const isSelected = selectedProduceRequest?.id === lead.id;

                        return (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setNotice(`Viewing produce request from ${lead.requester_name}.`);
                            }}
                            className={`rounded-md border p-4 text-left transition ${
                              isSelected ? "admin-selected-row border-leaf-700" : "border-leaf-900/10 bg-white hover:border-leaf-700 hover:bg-leaf-50"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-black text-ink">{lead.product_interest}</h4>
                                <p className="mt-1 text-sm font-semibold text-ink/60">{lead.requester_name}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${leadStatusClass(status)}`}>{leadReviewStatusLabel(status)}</span>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                              <p className="font-semibold text-ink/58">Source: {leadRequestSourceLabel(lead.request_source)}</p>
                              <p className="font-semibold text-ink/58">Quantity: {lead.quantity_needed ?? "Not specified"}</p>
                              <p className="font-semibold text-ink/58">Delivery: {leadRequestLocation(lead)}</p>
                              <p className="font-semibold text-ink/58">Date: {relativeActivityTime(lead.created_at)}</p>
                            </div>
                          </button>
                        );
                      })}
                      {produceRequestLeads.length === 0 && !leadRequestError ? (
                        <p className="admin-empty-state p-5 text-sm font-semibold">No produce requests match this search or status filter.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-panel p-5">
                    {selectedProduceRequest ? (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Request Detail</p>
                            <h3 className="mt-2 text-2xl font-black text-ink">{selectedProduceRequest.product_interest}</h3>
                            <p className="mt-1 text-sm font-semibold text-ink/58">
                              {selectedProduceRequest.requester_name} - {relativeActivityTime(selectedProduceRequest.created_at)}
                            </p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${leadStatusClass(normalizeLeadStatus(selectedProduceRequest.status))}`}>
                            {leadReviewStatusLabel(selectedProduceRequest.status)}
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <LeadDetailItem label="Buyer" value={selectedProduceRequest.requester_name} />
                          <LeadDetailItem label="Company" value={selectedProduceRequest.company_name ?? "Not provided"} />
                          <LeadDetailItem label="Phone" value={selectedProduceRequest.phone} />
                          <LeadDetailItem label="WhatsApp" value={selectedProduceRequest.whatsapp} />
                          <LeadDetailItem label="Request Source" value={leadRequestSourceLabel(selectedProduceRequest.request_source)} />
                          <LeadDetailItem label="Linked Listing / Profile" value={leadRequestLinkedSource(selectedProduceRequest)} />
                          <LeadDetailItem label="Product" value={selectedProduceRequest.product_interest} />
                          <LeadDetailItem label="Quantity" value={selectedProduceRequest.quantity_needed ?? "Not specified"} />
                          <LeadDetailItem label="Delivery Location" value={leadRequestLocation(selectedProduceRequest)} />
                          <LeadDetailItem label="Required By" value={selectedProduceRequest.required_by ?? "Not specified"} />
                          <LeadDetailItem label="Current Status" value={leadReviewStatusLabel(selectedProduceRequest.status)} />
                          <LeadDetailItem label="Submitted" value={selectedProduceRequest.created_at ? new Date(selectedProduceRequest.created_at).toLocaleString() : "Not captured"} />
                        </dl>

                        {selectedProduceRequest.listing_snapshot ? (
                          <div className="admin-context-panel mt-5 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-earth-700">Public listing/profile snapshot</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-ink/50">
                              Public listing context only. Seller private contact details are not exposed here.
                            </p>
                            <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              <LeadDetailItem label="Product" value={selectedProduceRequest.listing_snapshot.product ?? selectedProduceRequest.product_interest} />
                              <LeadDetailItem label="Seller / Profile" value={selectedProduceRequest.listing_snapshot.seller ?? selectedProduceRequest.source_name} />
                              <LeadDetailItem label="Location" value={selectedProduceRequest.listing_snapshot.location ?? "Not captured"} />
                              <LeadDetailItem label="Price / Package" value={selectedProduceRequest.listing_snapshot.pricePackage ?? "Not captured"} />
                              <LeadDetailItem label="Listed Quantity" value={selectedProduceRequest.listing_snapshot.listedQuantity ?? "Not captured"} />
                              <LeadDetailItem label="Availability" value={selectedProduceRequest.listing_snapshot.availability ?? "Not captured"} />
                            </dl>
                          </div>
                        ) : null}

                        <div className="admin-context-panel mt-5 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Buyer Message</p>
                          <p className="mt-2 text-sm leading-6 text-ink/68">{selectedProduceRequest.message || "No message was provided with this request."}</p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedProduceRequest, "Contacted")} className="admin-action-secondary px-3 text-xs">
                            Mark Contacted
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedProduceRequest, "Negotiating")} className="admin-action-warning px-3 text-xs">
                            Start Sourcing
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedProduceRequest, "Completed")} className="admin-action-primary px-3 text-xs">
                            Mark Completed
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedProduceRequest, "Lost")} className="admin-action-destructive px-3 text-xs">
                            Mark Lost
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="admin-empty-state p-5 text-sm font-semibold">Select a produce request to view buyer details, listing context, and review actions.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : isLeadQueueSection ? (
              <div className="grid gap-6 p-5">
                {leadRequestError ? (
                  <div className="admin-feedback-error p-4 text-sm font-semibold leading-6" role="alert">{leadRequestError}</div>
                ) : null}

                <section className="admin-panel p-5">
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
                      className="admin-action-secondary"
                    >
                      Refresh Leads
                    </button>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {leadMetricCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div key={card.label} className={`admin-metric-card ${adminMetricSeverityClass(card.severity)} rounded-md border border-leaf-900/10 p-4 shadow-sm`}>
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
                  <div className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Conversion Funnel</p>
                    <div className="mt-5 grid gap-3">
                      {leadFunnelStatuses.map((status, index) => {
                        const value = leadStatusCount(leadRequests, status);
                        const maxValue = Math.max(...leadFunnelStatuses.map((item) => leadStatusCount(leadRequests, item)), 1);

                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-black text-ink">{index + 1}. {leadReviewStatusLabel(status)}</span>
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
                  <div className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Most Requested Products</p>
                    <div className="mt-5">
                      <SimpleBarList items={mostRequestedProducts} emptyLabel="No product requests have been captured yet." />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                  <div className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Top Farmers by Leads</p>
                    <div className="mt-5">
                      <SimpleBarList items={topFarmersByLeads} emptyLabel="No farmer lead data yet." />
                    </div>
                  </div>
                  <div className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Top Suppliers by Leads</p>
                    <div className="mt-5">
                      <SimpleBarList items={topSuppliersByLeads} emptyLabel="No supplier lead data yet." />
                    </div>
                  </div>
                  <div className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Most Requested Listings</p>
                    <div className="mt-5">
                      <SimpleBarList items={mostRequestedListings} emptyLabel="No listing lead data yet." />
                    </div>
                  </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="admin-queue-panel p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Leads</p>
                        <h3 className="mt-2 text-xl font-black text-ink">Connection pipeline</h3>
                      </div>
                      <p className={`${adminCountPillClass(adminPrioritySeverity({ count: leadRequests.length }))} text-sm`}>{leadRequests.length} total</p>
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
                              isSelected ? "admin-selected-row border-leaf-700" : "border-leaf-900/10 bg-white hover:border-leaf-700 hover:bg-leaf-50"
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
                        <p className="admin-empty-state p-5 text-sm font-semibold">No connection requests have been submitted yet.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-panel p-5">
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
                          <LeadDetailItem label="Company" value={selectedLead.company_name ?? "Not provided"} />
                          <LeadDetailItem label="Delivery Location" value={selectedLead.delivery_location ?? selectedLead.location} />
                          <LeadDetailItem label="Required By" value={selectedLead.required_by ?? "Not specified"} />
                          <LeadDetailItem label="Quantity" value={selectedLead.quantity_needed ?? "Not specified"} />
                          <LeadDetailItem label="Product / Service" value={selectedLead.product_interest} />
                          <LeadDetailItem label="Request Source" value={leadRequestSourceLabel(selectedLead.request_source)} />
                          <LeadDetailItem label="Source Type" value={sourceLabel(selectedLead.source_type)} />
                          <LeadDetailItem label="Linked Listing / Profile" value={leadRequestLinkedSource(selectedLead)} />
                          <LeadDetailItem label="Assigned Farmer / Supplier" value={selectedLead.source_name} />
                          <LeadDetailItem label="Source Page" value={selectedLead.source_page ?? "Not captured"} />
                        </dl>

                        {selectedLead.listing_snapshot ? (
                          <div className="admin-context-panel mt-5 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-earth-700">Public listing/profile snapshot</p>
                            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                              <LeadDetailItem label="Product" value={selectedLead.listing_snapshot.product ?? selectedLead.product_interest} />
                              <LeadDetailItem label="Seller / Profile" value={selectedLead.listing_snapshot.seller ? publicSellerDisplayName(selectedLead.listing_snapshot.seller) : selectedLead.source_name} />
                              <LeadDetailItem label="Location" value={selectedLead.listing_snapshot.location ?? "Not captured"} />
                              <LeadDetailItem label="Price / Package" value={selectedLead.listing_snapshot.pricePackage ?? "Not captured"} />
                              <LeadDetailItem label="Listed Quantity" value={selectedLead.listing_snapshot.listedQuantity ?? "Not captured"} />
                              <LeadDetailItem label="Availability" value={selectedLead.listing_snapshot.availability ?? "Not captured"} />
                            </dl>
                          </div>
                        ) : null}

                        <div className="admin-context-panel mt-5 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Message</p>
                          <p className="mt-2 text-sm leading-6 text-ink/68">{selectedLead.message || "No message was provided with this lead."}</p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Contacted")} className="admin-action-secondary px-3 text-xs">
                            Mark Contacted
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Negotiating")} className="admin-action-warning px-3 text-xs">
                            Mark Active Sourcing
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Completed")} className="admin-action-primary px-3 text-xs">
                            Mark Completed
                          </button>
                          <button type="button" onClick={() => updateLeadRequestStatus(selectedLead, "Lost")} className="admin-action-destructive px-3 text-xs">
                            Mark Lost
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="admin-empty-state p-5 text-sm font-semibold">Select a lead to view buyer details and pipeline actions.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : isFeaturedEnquiriesSection ? (
              <div className="grid gap-6 p-5">
                {featuredEnquiryLoadState !== "available" ? (
                  <AdminOptionalQueueNotice
                    state={featuredEnquiryLoadState}
                    unavailableMessage="Featured enquiry requests are not available yet."
                    error={featuredEnquiryError}
                    onRetry={() => void loadFeaturedEnquiries()}
                  />
                ) : (
                  <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {(["New", "Contacted", "Approved", "Rejected", "Closed"] as FeaturedEnquiryStatus[]).map((status) => (
                    <div key={status} className={`admin-metric-card ${featuredEnquiryMetricAccent(status)} rounded-md border border-leaf-900/10 p-4 shadow-sm`}>
                      <p className="text-sm font-black text-ink/60">{status}</p>
                      <p className="mt-3 text-3xl font-black text-ink">{featuredEnquiries.filter((enquiry) => enquiry.status === status).length}</p>
                    </div>
                  ))}
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="admin-queue-panel p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-earth-700">Featured Enquiries</p>
                        <h3 className="mt-2 text-xl font-black text-ink">Visibility interest queue</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadFeaturedEnquiries()}
                        className="admin-action-secondary"
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
                              isSelected ? "admin-selected-row border-leaf-700" : "border-leaf-900/10 bg-white hover:border-leaf-700 hover:bg-leaf-50"
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
                      {featuredEnquiries.length === 0 ? (
                        <p className="admin-empty-state p-5 text-sm font-semibold">No featured placement enquiries have been submitted yet.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-panel p-5">
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

                        <div className="admin-context-panel mt-5 p-4">
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
                            className="admin-action-secondary px-3 text-xs"
                            >
                              Copy Message
                            </button>
                            <a
                              href={whatsappUrl(selectedFeaturedEnquiry.whatsapp, featuredFollowUpMessage(selectedFeaturedEnquiry))}
                              target="_blank"
                              rel="noreferrer"
                            className="admin-action-secondary px-3 text-xs"
                            >
                              Open WhatsApp
                            </a>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Contacted")} className="admin-action-secondary px-3 text-xs">
                            Mark Contacted
                          </button>
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Approved")} className="admin-action-primary px-3 text-xs">
                            Approve
                          </button>
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Rejected")} className="admin-action-destructive px-3 text-xs">
                            Reject
                          </button>
                          <button type="button" onClick={() => updateFeaturedEnquiryStatus(selectedFeaturedEnquiry, "Closed")} className="admin-action-tertiary px-3 text-xs">
                            Close
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="admin-empty-state p-5 text-sm font-semibold">Select an enquiry to view details and follow-up actions.</p>
                    )}
                  </div>
                    </section>
                  </>
                )}
              </div>
            ) : isWhatsAppLeadsSection ? (
              <div className="grid gap-6 p-5">
                {whatsappLeadLoadState !== "available" ? (
                  <AdminOptionalQueueNotice
                    state={whatsappLeadLoadState}
                    unavailableMessage="WhatsApp click tracking is not available yet. Buyer enquiries remain available in Produce Requests."
                    error={whatsappLeadError}
                    onRetry={() => void loadWhatsAppLeads()}
                  />
                ) : (
                  <>
                    <div className="grid gap-4 lg:grid-cols-3">
                  <div className="admin-context-panel p-4">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Total Clicks</p>
                    <p className="mt-3 text-4xl font-black text-ink">{whatsappLeads.length}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/58">Recent tracked WhatsApp contact clicks.</p>
                  </div>
                  <div className="admin-panel p-4 lg:col-span-2">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Clicks by Source Type</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {leadSourceTotals.length > 0 ? leadSourceTotals.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-leaf-50 px-3 py-2">
                          <span className="text-sm font-black text-ink">{sourceLabel(item.label as WhatsAppLeadRecord["source_type"])}</span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-leaf-700">{item.value}</span>
                        </div>
                      )) : (
                        <p className="text-sm font-semibold text-ink/58">No click source data yet.</p>
                      )}
                    </div>
                  </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <section className="admin-panel p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-earth-700">Latest Contact Clicks</p>
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
                      {whatsappLeads.length === 0 ? (
                        <p className="rounded-md bg-leaf-50 p-4 text-sm font-semibold text-ink/58">No WhatsApp contact clicks have been recorded yet.</p>
                      ) : null}
                    </div>
                  </section>

                  <section className="admin-context-panel p-5">
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
                  </>
                )}
              </div>
            ) : isMatchOpportunitiesSection ? (
              <div className="grid min-w-0 gap-5 p-5">
                {leadRequestError ? (
                  <div className="flex flex-col gap-3 rounded-md bg-earth-50 p-4 text-sm font-semibold leading-6 text-earth-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>{leadRequestError}</span>
                    <button
                      type="button"
                      onClick={() => {
                        void loadLeadRequests();
                        void loadAnalytics();
                      }}
                      className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-white px-4 py-2 text-xs font-black text-earth-700 ring-1 ring-earth-700/15 transition hover:bg-earth-100"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}

                <section className="grid gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-3 sm:grid-cols-2 xl:grid-cols-4">
                  {sourcingMetricCards.map((card) => (
                    <div key={card.label} className={`admin-metric-card ${adminMetricSeverityClass(card.severity)} rounded-md p-3 ring-1 ring-leaf-900/10`}>
                      <p className="text-xs font-black uppercase tracking-wide text-ink/45">{card.label}</p>
                      <p className="mt-2 text-xl font-black text-ink">{card.value}</p>
                    </div>
                  ))}
                </section>

                <section className="flex min-w-0 flex-col gap-3 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">Sourcing Queue</p>
                    <h3 className="mt-1 text-2xl font-black text-ink">One case. One next action.</h3>
                    <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-ink/58">
                      Track buyer sourcing requests, review suitable supply options, and decide the next operational step.
                    </p>
                  </div>
                  <label className="grid min-w-0 gap-2 text-xs font-black uppercase tracking-wide text-ink/45 sm:min-w-64">
                    Show cases
                    <select
                      value={sourcingQueueFilter}
                      onChange={(event) => {
                        setSourcingQueueFilter(event.target.value as SourcingQueueFilter);
                        setShowSourcingCaseDetailMobile(false);
                      }}
                      className="min-h-11 rounded-md border border-leaf-900/10 bg-leaf-50 px-3 py-2 text-sm font-black normal-case tracking-normal text-ink outline-none transition focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                    >
                      {sourcingQueueFilters.map((filter) => (
                        <option key={filter} value={filter}>{filter}</option>
                      ))}
                    </select>
                  </label>
                </section>

                <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start">
                  <aside className={`${showSourcingCaseDetailMobile ? "hidden lg:block" : "block"} admin-queue-panel p-4 lg:sticky lg:top-24 lg:self-start`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-earth-700">Queue</p>
                        <h3 className="mt-1 text-xl font-black text-ink">Sourcing cases</h3>
                      </div>
                      <span className={adminCountPillClass(filteredSourcingSeverity)}>
                        <span className="sr-only">Sourcing cases shown: </span>
                        {filteredSourcingCases.length}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {filteredSourcingCases.map((caseItem) => {
                        const isSelected = selectedSourcingCase?.request.id === caseItem.request.id;

                        return (
                          <button
                            key={caseItem.request.id}
                            type="button"
                            onClick={() => {
                              setSelectedSourcingCaseId(caseItem.request.id);
                              setSelectedSourcingCaseTab("Overview");
                              setShowSourcingCaseDetailMobile(true);
                            }}
                            className={`rounded-md border border-l-4 p-3 text-left transition ${
                              isSelected
                                ? "admin-selected-row border-leaf-700"
                                : "border-leaf-900/10 border-l-leaf-300 bg-white hover:border-leaf-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-ink">{caseItem.request.buyer_name}</p>
                                <p className="mt-1 text-xs font-semibold text-ink/55">{caseItem.request.buyer_type || "Buyer"}</p>
                              </div>
                              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${caseItem.priority.dot}`} aria-hidden="true" />
                            </div>
                            <p className="mt-3 text-sm font-black text-ink">{caseItem.request.product_needed}</p>
                            <p className="mt-1 text-xs font-semibold text-ink/55">{caseItem.request.quantity || "Quantity not supplied"}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className={`admin-status-badge ${sourcingCaseStatusClass(caseItem.state.status)} px-2 py-0.5 text-[11px]`}>
                                {sourcingCaseOperationalStatusLabel(caseItem.state.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-ink/40">
                              Submitted {caseItem.request.created_at ? new Date(caseItem.request.created_at).toLocaleDateString() : "No date"}
                            </p>
                          </button>
                        );
                      })}
                      {filteredSourcingCases.length === 0 ? (
                        <p className="rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/58 ring-1 ring-leaf-900/10">
                          {leadRequestError ? "Sourcing cases could not be loaded. Please refresh and try again." : "No sourcing cases match this filter."}
                        </p>
                      ) : null}
                    </div>
                  </aside>

                  <div className={`${showSourcingCaseDetailMobile ? "block" : "hidden lg:block"} admin-panel min-w-0 p-4 sm:p-5`}>
                    {selectedSourcingCase ? (
                      (() => {
                        const sla = sourcingSla(selectedSourcingCase.request.created_at);
                        const communicationRows = sourcingCaseCommunicationRows(selectedSourcingCase.request.id, activityRows);
                        const previousSourcingRequests = submissions.buyerRequests.filter((request) =>
                          selectedSourcingCase.request.case_source === "buyer_request_submission" &&
                          request.id !== selectedSourcingCase.request.id &&
                          (request.whatsapp_number === selectedSourcingCase.request.whatsapp_number || request.phone_number === selectedSourcingCase.request.phone_number)
                        );
                        const linkedSourceHref = sourcingCaseHref(selectedSourcingCase.request);
                        const linkedSourceLabel = sourcingCaseLinkedSource(selectedSourcingCase.request);

                        return (
                          <div className="grid gap-5">
                            <section className="admin-context-panel p-4">
                              <button
                                type="button"
                                onClick={() => setShowSourcingCaseDetailMobile(false)}
                                className="admin-action-secondary mb-4 px-3 text-xs lg:hidden"
                              >
                                Back to sourcing cases
                              </button>
                              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                                <div className="min-w-0">
                                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">Selected Case</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <h3 className="text-2xl font-black leading-tight text-ink sm:text-3xl">{linkedSourceLabel !== "Not linked" ? linkedSourceLabel : selectedSourcingCase.request.product_needed}</h3>
                                    <span className={`admin-status-badge ${sourcingCaseStatusClass(selectedSourcingCase.state.status)} text-center`}>
                                      {sourcingCaseOperationalStatusLabel(selectedSourcingCase.state.status)}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">
                                    {selectedSourcingCase.request.company_name ? `${selectedSourcingCase.request.buyer_name} — ${selectedSourcingCase.request.company_name}` : selectedSourcingCase.request.buyer_name} needs sourcing support in {sourcingCaseLocation(selectedSourcingCase.request)}.
                                  </p>
                                </div>
                                <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                  <p className="text-xs font-black uppercase tracking-wide text-ink/45">Primary action</p>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSourcingCaseTab("Matches")}
                                    className="admin-action-primary mt-2 w-full text-sm"
                                  >
                                    Review Matches
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                                <div className="min-w-0 rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">Buyer / Company</p>
                                  <p className="mt-1 break-words text-sm font-black text-ink">{selectedSourcingCase.request.buyer_name}</p>
                                  <p className="mt-1 break-words text-xs font-semibold text-ink/55">{selectedSourcingCase.request.company_name || "No company supplied"}</p>
                                </div>
                                <div className="min-w-0 rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">Owner</p>
                                  <p className="mt-1 break-words text-sm font-black text-ink">{selectedSourcingCase.state.owner || "Unassigned"}</p>
                                </div>
                                <div className="min-w-0 rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">SLA / Response Deadline</p>
                                  <p className="mt-1 break-words text-sm font-semibold text-ink/65">{sla.deadline.toLocaleString()}</p>
                                  <p className={`mt-2 break-words rounded-md px-3 py-2 text-sm font-black ${sla.tone}`}>
                                    {sla.hoursRemaining < 0 ? `${Math.abs(sla.hoursRemaining)} hours overdue` : `${sla.hoursRemaining} hours remaining`}
                                  </p>
                                </div>
                                <div className="min-w-0 rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">Request Source</p>
                                  <p className="mt-1 break-words text-sm font-black text-ink">{sourcingCaseSourceLabel(selectedSourcingCase.request)}</p>
                                  <p className="mt-1 break-words text-xs font-semibold text-ink/55">{linkedSourceLabel}</p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => assignSourcingOwner(selectedSourcingCase.request.id)}
                                  className="admin-action-secondary"
                                >
                                  Assign to Me
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void contactSourcingBuyer(selectedSourcingCase.request)}
                                  className="admin-action-secondary text-center"
                                >
                                  Contact Buyer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm("Mark this sourcing request as completed? This will not send any message.")) {
                                      void setSourcingCaseStatus(selectedSourcingCase.request, "Completed");
                                    }
                                  }}
                                  className="admin-action-warning"
                                >
                                  Complete Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm("Mark this sourcing request as lost? This will not send any message.")) {
                                      void setSourcingCaseStatus(selectedSourcingCase.request, "Closed");
                                    }
                                  }}
                                  className="admin-action-destructive"
                                >
                                  Mark Lost
                                </button>
                              </div>
                            </section>

                            <div className="flex gap-2 overflow-x-auto border-b border-leaf-900/10 pb-2" role="tablist" aria-label="Sourcing case details">
                              {(["Overview", "Matches", "Activity"] as SourcingCaseTab[]).map((tab) => (
                                <button
                                  key={tab}
                                  type="button"
                                  role="tab"
                                  aria-selected={selectedSourcingCaseTab === tab}
                                  onClick={() => setSelectedSourcingCaseTab(tab)}
                                  className={`admin-nav-item min-h-10 rounded-md px-4 py-2 text-sm font-black ${
                                    selectedSourcingCaseTab === tab
                                      ? "admin-nav-item-active"
                                      : "bg-white ring-1 ring-leaf-900/10"
                                  }`}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>

                            {selectedSourcingCaseTab === "Overview" ? (
                              <div className="grid gap-4">
                                <section className="admin-context-panel p-4">
                                  <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer and Request Overview</h4>
                                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <LeadDetailItem label="Buyer / Company" value={selectedSourcingCase.request.company_name ? `${selectedSourcingCase.request.buyer_name} - ${selectedSourcingCase.request.company_name}` : selectedSourcingCase.request.buyer_name} />
                                    <LeadDetailItem label="Buyer Type" value={selectedSourcingCase.request.buyer_type || "Buyer"} />
                                    <LeadDetailItem label="Phone" value={selectedSourcingCase.request.phone_number} />
                                    <LeadDetailItem label="WhatsApp" value={selectedSourcingCase.request.whatsapp_number} />
                                    <LeadDetailItem label="Requested Product" value={selectedSourcingCase.request.product_needed} />
                                    <LeadDetailItem label="Requested Quantity" value={selectedSourcingCase.request.quantity || "Not supplied"} />
                                    <LeadDetailItem label="Delivery Location" value={sourcingCaseLocation(selectedSourcingCase.request)} />
                                    <LeadDetailItem label="Required By" value={selectedSourcingCase.request.deadline || "Not supplied"} />
                                    <LeadDetailItem label="Request Source" value={sourcingCaseSourceLabel(selectedSourcingCase.request)} />
                                    <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                      <dt className="text-xs font-black uppercase tracking-wide text-ink/40">Linked Listing / Profile</dt>
                                      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-ink/72">
                                        {linkedSourceHref ? (
                                          <Link
                                            href={linkedSourceHref}
                                            className="font-black text-leaf-700 underline-offset-4 transition hover:text-leaf-900 hover:underline focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
                                          >
                                            {linkedSourceLabel}
                                          </Link>
                                        ) : (
                                          linkedSourceLabel
                                        )}
                                      </dd>
                                    </div>
                                    <LeadDetailItem label="Submitted" value={selectedSourcingCase.request.created_at ? new Date(selectedSourcingCase.request.created_at).toLocaleDateString() : "Not captured"} />
                                  </dl>
                                  <div className="mt-4 rounded-md bg-white p-4 ring-1 ring-leaf-900/10">
                                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">Buyer Message</p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">{selectedSourcingCase.request.notes || "No additional notes were supplied."}</p>
                                  </div>
                                </section>

                                {selectedSourcingCase.request.listing_snapshot ? (
                                  <details className="rounded-md border border-leaf-900/10 bg-white p-4" open>
                                    <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-earth-700">Public Listing Snapshot</summary>
                                    <p className="mt-2 text-xs font-semibold leading-5 text-ink/50">
                                      Public listing context only. Seller private contact details are not exposed here.
                                    </p>
                                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                      <LeadDetailItem label="Product" value={selectedSourcingCase.request.listing_snapshot.product ?? selectedSourcingCase.request.product_needed} />
                                      <LeadDetailItem label="Seller / Profile" value={selectedSourcingCase.request.listing_snapshot.seller ? publicSellerDisplayName(selectedSourcingCase.request.listing_snapshot.seller) : selectedSourcingCase.request.source_name ?? "Not captured"} />
                                      <LeadDetailItem label="Location" value={selectedSourcingCase.request.listing_snapshot.location ?? "Not captured"} />
                                      <LeadDetailItem label="Price / Package" value={selectedSourcingCase.request.listing_snapshot.pricePackage ?? "Not captured"} />
                                      <LeadDetailItem label="Listed Quantity" value={selectedSourcingCase.request.listing_snapshot.listedQuantity ?? "Not captured"} />
                                      <LeadDetailItem label="Availability" value={selectedSourcingCase.request.listing_snapshot.availability ?? "Not captured"} />
                                    </dl>
                                  </details>
                                ) : null}
                              </div>
                            ) : null}

                            {selectedSourcingCaseTab === "Matches" ? (
                              <div className="grid gap-4">
                                <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Suggested and Assigned Matches</h4>
                                      <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
                                        Review possible supply matches here. This does not contact any buyer, farmer, or supplier automatically.
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                                      <button type="button" onClick={() => void reviewSourcingMatches(selectedSourcingCase.request, "farmer")} className="rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800">
                                        Review Farmer Matches
                                      </button>
                                      <button type="button" onClick={() => void reviewSourcingMatches(selectedSourcingCase.request, "supplier")} className="rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50">
                                        Review Supplier Matches
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                    <MatchPreview title="Recommended Farmers" records={selectedSourcingCase.matches.farmers} nameKeys={["farm_name", "farmer_name"]} />
                                    <MatchPreview title="Recommended Suppliers" records={selectedSourcingCase.matches.suppliers} nameKeys={["company_name", "category"]} />
                                    <MatchPreview title="Marketplace Listing Matches" records={selectedSourcingCase.matches.listings} nameKeys={["product_name"]} />
                                  </div>
                                </section>

                                <section className="grid gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-4 md:grid-cols-2">
                                  <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">Assigned / Selected Matches</p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">No matches have been assigned yet.</p>
                                  </div>
                                  <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                    <p className="text-xs font-black uppercase tracking-wide text-earth-700">Availability Confirmation</p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">Not confirmed yet.</p>
                                  </div>
                                </section>
                              </div>
                            ) : null}

                            {selectedSourcingCaseTab === "Activity" ? (
                              <div className="grid gap-4">
                                <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                                  <label className="grid gap-2 text-sm font-black text-ink">
                                    Internal Notes
                                    <textarea
                                      value={selectedSourcingCase.state.notes}
                                      onChange={(event) => updateSourcingCaseState(selectedSourcingCase.request.id, (current) => ({ ...current, notes: event.target.value }))}
                                      rows={4}
                                      className="resize-y rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                                      placeholder="Record sourcing context, calls, availability, and next steps."
                                    />
                                  </label>
                                </section>

                                <section className="grid gap-4 xl:grid-cols-2">
                                  <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                                    <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Communication History</h4>
                                    <div className="mt-4 grid gap-3">
                                      {communicationRows.slice(0, 4).map((activity) => (
                                        <div key={activity.id} className="rounded-md bg-leaf-50 p-3">
                                          <p className="text-sm font-black text-ink">{activity.action_type}</p>
                                          <p className="mt-1 text-xs font-semibold text-ink/55">{relativeActivityTime(activity.created_at)} by {activity.admin_email}</p>
                                        </div>
                                      ))}
                                      {communicationRows.length === 0 ? (
                                        <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">No communication has been recorded yet.</p>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                                    <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Previous Sourcing Requests</h4>
                                    <div className="mt-4 grid gap-2">
                                      {previousSourcingRequests.slice(0, 4).map((request) => (
                                        <div key={request.id} className="rounded-md bg-leaf-50 p-3">
                                          <p className="text-sm font-black text-ink">{request.product_needed}</p>
                                          <p className="mt-1 text-xs font-semibold text-ink/55">{request.status} - {request.created_at ? new Date(request.created_at).toLocaleDateString() : "No date"}</p>
                                        </div>
                                      ))}
                                      {previousSourcingRequests.length === 0 ? (
                                        <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">No previous sourcing requests from this buyer.</p>
                                      ) : null}
                                    </div>
                                  </div>
                                </section>

                                <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                                  <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Timeline</h4>
                                  <div className="mt-4 grid gap-3">
                                    {sourcingTimeline(selectedSourcingCase.request, selectedSourcingCase.state, activityRows).map((item) => (
                                      <div key={item.label} className="flex gap-3 rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.complete ? "bg-leaf-700" : "bg-earth-500"}`} />
                                        <div>
                                          <p className="text-sm font-black text-ink">{item.label}</p>
                                          <p className="mt-1 text-xs font-semibold text-ink/55">{item.detail}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>

                                <section className="rounded-md border border-leaf-900/10 bg-white p-4">
                                  <h4 className="text-sm font-black uppercase tracking-wide text-earth-700">Additional Activity</h4>
                                  <div className="mt-4 grid gap-3">
                                    {sourcingCaseActivityRows(selectedSourcingCase.request.id, activityRows).filter((activity) => activity.action_type !== "Contact").slice(0, 5).map((activity) => (
                                      <div key={activity.id} className="rounded-md bg-leaf-50 p-3">
                                        <p className="text-sm font-black text-ink">{activity.action_type}</p>
                                        <p className="mt-1 text-xs font-semibold text-ink/55">{relativeActivityTime(activity.created_at)} by {activity.admin_email}</p>
                                      </div>
                                    ))}
                                    {sourcingCaseActivityRows(selectedSourcingCase.request.id, activityRows).filter((activity) => activity.action_type !== "Contact").length === 0 ? (
                                      <p className="rounded-md bg-leaf-50 p-3 text-sm font-semibold text-ink/58">No additional activity has been recorded.</p>
                                    ) : null}
                                  </div>
                                </section>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="grid min-h-[420px] place-items-center rounded-md bg-leaf-50 p-8 text-center">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-earth-700">No case selected</p>
                          <h3 className="mt-2 text-2xl font-black text-ink">Choose a sourcing case</h3>
                          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-ink/60">
                            The sourcing workspace keeps the buyer request, suggested matches, and next decision visible.
                          </p>
                        </div>
                      </div>
                    )}
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
                    {activeSection === "farmers" || activeSection === "suppliers" ? <th className="px-5 py-4">GG Standard</th> : null}
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
                      {activeSection === "farmers" || activeSection === "suppliers" ? (
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            row.ggStandardStatus === "Member"
                              ? "bg-leaf-50 text-leaf-800"
                              : row.ggStandardStatus === "Suspended"
                                ? "bg-tomato/10 text-tomato"
                                : "bg-ink/10 text-ink/55"
                          }`}>
                            {row.ggStandardStatus ?? "Pending"}
                          </span>
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
                          {activeSection === "marketplace" ? (
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
                                  if (activeSection === "farmers" || activeSection === "suppliers") {
                                    const kind = activeSection === "farmers" ? "farmer" : "supplier";
                                    window.location.href = `/admin/profiles/${kind}/${encodeURIComponent(row.profileRecordId || row.id)}`;
                                    return;
                                  }
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
                                {activeSection === "farmers" || activeSection === "suppliers" ? "Open profile" : "Edit"}
                              </button>
                              {activeSection !== "farmers" && activeSection !== "suppliers" ? <button
                                type="button"
                                onClick={() => mockAction(row, "Mark Verified")}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Mark Verified
                              </button> : null}
                              {activeSection !== "farmers" && activeSection !== "suppliers" ? <button
                                type="button"
                                onClick={() => archiveAdminRow(row)}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-black text-ink/65 ring-1 ring-leaf-900/10 transition hover:text-leaf-800"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                Archive
                              </button> : null}
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

          {reviewingImportedFarmer && !(isApplicationsSection && applicationTab === "farmer") ? (
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
                    <div className="aspect-[4/5] overflow-hidden rounded-md bg-leaf-50 ring-1 ring-leaf-900/10">
                      {publicReviewPhotoUrl(reviewingImportedFarmer) ? (
                        <div
                          role="img"
                          aria-label={`${reviewingImportedFarmer.farm_name || reviewingImportedFarmer.farmer_name} profile photo`}
                          className="h-full w-full bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${publicReviewPhotoUrl(reviewingImportedFarmer)})` }}
                        />
                        ) : (
                          <div className="grid h-full place-items-center px-6 text-center text-sm font-black uppercase tracking-wide text-ink/35">
                          {photoSubmittedButNotImported(reviewingImportedFarmer) ? farmerPhotoDiagnostics(reviewingImportedFarmer).status : "No photo submitted."}
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
                          ["public/displayable", farmerPhotoDiagnostics(reviewingImportedFarmer).publicDisplayable ? "yes" : "no"],
                          ["farm_photo_urls", reviewingFarmPhotoUrls.length ? `${reviewingFarmPhotoUrls.length}` : "0"],
                          ["produce_photo_urls", reviewingProducePhotoUrls.length ? `${reviewingProducePhotoUrls.length}` : "0"],
                          ["file references", farmerMediaReferences(reviewingImportedFarmer).length ? `${farmerMediaReferences(reviewingImportedFarmer).length}` : "0"],
                          ["photo_import_status", farmerPhotoDiagnostics(reviewingImportedFarmer).photoImportStatus || "none"],
                          ["photo_import_notes", farmerPhotoDiagnostics(reviewingImportedFarmer).photoImportNotes || "none"]
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
                        <div className="rounded-md bg-white p-3 ring-1 ring-leaf-900/10">
                          <p className="text-[11px] font-black uppercase tracking-wide text-ink/45">GG Standard Status</p>
                          <p className="mt-1 text-sm font-black text-ink">{reviewingImportedFarmer.gg_standard_status ?? "Pending"}</p>
                          <p className="mt-1 text-xs font-semibold text-ink/50">
                            GG Standard is separate from verification and is not certification.
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
                      <Link
                        href={`/admin/profiles/farmer/${encodeURIComponent(reviewingImportedFarmer.id)}`}
                        className="admin-action-primary"
                      >
                        Open profile review & publication
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
          </>
          ) : null}

          {activeForm ? (
            <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-3 py-4 sm:px-4 sm:py-6">
              <section className={`max-h-[92dvh] w-full overflow-y-auto rounded-md bg-white shadow-soft ${activeForm.id === "marketplace" ? "max-w-4xl" : "max-w-3xl"}`}>
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

                      if (field.advanced) {
                        return null;
                      }

                      if (field.type === "imageGallery") {
                        const images = marketplaceGalleryImagesFromValues(formValues);
                        const isUploading = uploadingField === field.name;

                        return (
                          <div key={field.name} className="grid gap-3 text-sm font-black text-ink md:col-span-2">
                            <span>{field.label}</span>
                            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                              <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
                                <div className="overflow-hidden rounded-md bg-white ring-1 ring-leaf-900/10">
                                  {images[0] ? (
                                    <div
                                      role="img"
                                      aria-label="Marketplace cover image preview"
                                      className="aspect-[4/3] w-full bg-cover bg-center"
                                      style={{ backgroundImage: `url(${images[0]})` }}
                                    />
                                  ) : (
                                    <div className="grid aspect-[4/3] place-items-center px-4 text-center text-xs font-black uppercase tracking-wide text-ink/35">
                                      Cover preview
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
                                      {isUploading ? "Uploading..." : "Upload Images"}
                                    </label>
                                    <input
                                      id={fieldId}
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      multiple
                                      disabled={isUploading || images.length >= marketplaceGalleryLimit}
                                      onChange={(event) => uploadMarketplaceGalleryImages(field, event)}
                                      className="sr-only"
                                    />
                                    <span className="inline-flex items-center rounded-md border border-leaf-900/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-ink/45">
                                      {images.length}/{marketplaceGalleryLimit} images
                                    </span>
                                  </div>
                                  <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">
                                    {field.helper}
                                  </p>
                                </div>
                              </div>

                              {images.length > 0 ? (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                  {images.map((image, index) => (
                                    <div key={`${image}-${index}`} className="rounded-md border border-leaf-900/10 bg-white p-2 shadow-sm">
                                      <div
                                        role="img"
                                        aria-label={`Marketplace gallery image ${index + 1}`}
                                        className="aspect-[4/3] rounded-md bg-leaf-50 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${image})` }}
                                      />
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {index === 0 ? (
                                          <span className="rounded-md bg-earth-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-earth-700">Cover</span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setMarketplaceGalleryCover(index)}
                                            className="rounded-md border border-leaf-900/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
                                          >
                                            Set cover
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => moveMarketplaceGalleryImage(index, -1)}
                                          disabled={index === 0}
                                          aria-label="Move image left"
                                          className="grid h-7 w-7 place-items-center rounded-md border border-leaf-900/10 text-ink/55 transition hover:border-leaf-700 hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <ArrowLeft className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveMarketplaceGalleryImage(index, 1)}
                                          disabled={index === images.length - 1}
                                          aria-label="Move image right"
                                          className="grid h-7 w-7 place-items-center rounded-md border border-leaf-900/10 text-ink/55 transition hover:border-leaf-700 hover:text-leaf-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeMarketplaceGalleryImage(index)}
                                          aria-label="Delete image"
                                          className="grid h-7 w-7 place-items-center rounded-md border border-leaf-900/10 text-ink/55 transition hover:border-tomato hover:text-tomato"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      }

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
                                  {field.optionLabels?.[option] ?? option}
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

                  {activeForm.id === "marketplace" ? (
                    <details className="mt-5 rounded-md border border-leaf-900/10 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-black text-ink">Advanced listing details</summary>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {formConfigs.marketplace.filter((field) => field.advanced).map((field) => {
                          const fieldId = `admin-${activeForm.id}-${field.name}`;
                          const value = formValues[field.name] ?? "";

                          return (
                            <label key={field.name} htmlFor={fieldId} className="grid gap-2 text-sm font-black text-ink">
                              {field.label}
                              <input
                                id={fieldId}
                                type="text"
                                value={value}
                                onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                                className="rounded-md border border-leaf-900/10 px-4 py-3 text-sm font-semibold text-ink/80 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-600/20"
                              />
                              {field.helper ? <span className="text-xs font-semibold leading-5 text-ink/50">{field.helper}</span> : null}
                            </label>
                          );
                        })}
                      </div>
                    </details>
                  ) : null}

                  {formError ? <p className="mt-5 whitespace-pre-line rounded-md bg-earth-50 px-4 py-3 text-sm font-black text-earth-700">{formError}</p> : null}
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
