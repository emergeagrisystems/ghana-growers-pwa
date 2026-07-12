import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFarmMateResponse, type FarmMateBrainResponse } from "../src/lib/farmmate/decision-engine";
import { buildFarmMateVoiceLayerInput } from "../src/lib/farmmate/ai";
import {
  cleanFarmMateFinalAnswer,
  compactFollowUpSummary,
  farmMateFallbackMessage,
  shouldCompleteWeatherGuidedFlow,
  shouldRenderLocalFarmMateGuidance,
  weatherGuidedRecommendationCards
} from "../src/lib/farmmate/conversation-ui";
import { farmMateDailySummaries, getFarmMateDailySummary, getFarmMateGreetingForHour } from "../src/lib/farmmate/daily-summary";
import { homepageFarmMateDescription, homepageFarmMateTools } from "../src/data/farmmatePublicTools";
import { smartTools } from "../src/data/smartTools";
import featuredListingData from "../src/data/featuredListings.json";
import { getCurrentLearnChallenge, isChallengeComplete, learnChallenges, nextOpenChallengeDay } from "../src/lib/learn-challenges";
import {
  cleanFarmerLocation,
  cleanFarmerProfileLabel,
  farmerCardProducts,
  homepageFeaturedFarmerProfiles,
  isDemoSeedFarmerProfile,
  isVerifiedFarmer,
  orderFarmerDirectoryProfiles,
  paginateFarmers,
  paginationPages,
  publicFarmerProfiles
} from "../src/lib/farmerDirectory";
import {
  isVerifiedSupplier,
  orderSupplierDirectoryProfiles,
  paginateSuppliers,
  publicSupplierProfiles,
  supplierProducts
} from "../src/lib/supplierDirectory";
import {
  featuredMarketplaceListings,
  marketplaceAvailability,
  marketplaceResultRange,
  marketplaceSupplyFrequency,
  normalizeMarketplaceQuantity,
  paginateMarketplaceListings,
  publicMarketplaceListings
} from "../src/lib/marketplace/publicListings";
import {
  canonicalMarketplaceTradeFields,
  calculatedMarketplaceTotal,
  formatMarketplaceCurrency,
  marketplacePriceLine,
  marketplaceQuantityLine,
  marketplaceTradeLines,
  pluralizeMarketplaceUnit,
  reviewedCustomUnitMessage,
  validateMarketplaceTradeInput
} from "../src/lib/marketplace/trade";
import { manageFarmMateConversation, type ConversationState } from "../src/lib/farmmate/conversation-manager";
import { weatherDecisionGuidance } from "../src/lib/farmmate/weather-decision-specialist";
import { diagnosisFromFileName, farmMateQuestionFromDiagnosis, unknownCropDiagnosis } from "../src/lib/farmmate/crop-doctor-demo";
import {
  buildCropDoctorAskFarmMatePrompt,
  buildCropDoctorHandoffContext,
  cropDoctorResultHasUnsafeLanguage,
  CROP_DOCTOR_MAX_IMAGE_BYTES,
  CROP_DOCTOR_TOO_LARGE_MESSAGE,
  cropDoctorResultBadge,
  cropDoctorResultHeading,
  cropDoctorResultHeadline,
  cropDoctorVisionSystemPrompt,
  normalizeCropDoctorVisionResult,
  normalizePossibleIssueWording,
  validateCropDoctorImage
} from "../src/lib/farmmate/crop-doctor-vision";
import { routeFarmMateQuestion } from "../src/lib/farmmate/router";
import {
  canUseMemoryUsageFallback,
  askFarmMateCreditMessage,
  getFarmMateCreditDecision,
  getFarmMateCreditStatus,
  isCountableFarmMateSubmission,
  CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT,
  CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE,
  FARM_MATE_EXHAUSTED_LEARN_CTA,
  FARM_MATE_SOIL_HEALTH_CHALLENGE_CTA,
  cropDoctorCreditMessage,
  farmMateCreditLine,
  formatRefreshIn,
  shouldDisableCropDoctorAnalysis,
  shouldDisableCropDoctorUpload,
  usageTrackingUnavailableDecision,
  type FarmMateUsageEvent
} from "../src/lib/farmmate/usage";
import type { FarmerProfile, Product, SupplierProfile } from "../src/types";

type TestCase = {
  name: string;
  run: () => void;
};

const plantHealthTomatoState: ConversationState = {
  activeTopic: "plant_health",
  activeCropName: "Tomato",
  activeSpecialist: "crop_health",
  waitingForFollowUp: true,
  turns: [{ message: "My tomato leaves are yellow", topic: "plant_health", cropName: "Tomato", specialist: "crop_health" }]
};

const emptyState: ConversationState = {
  waitingForFollowUp: false,
  turns: []
};

function responseText(response: FarmMateBrainResponse) {
  return response.sections.flatMap((section) => [section.title, ...section.body]).join("\n");
}

function farmerFixture(overrides: Partial<FarmerProfile> = {}): FarmerProfile {
  return {
    slug: overrides.slug ?? "test-farmer",
    farmName: overrides.farmName ?? "Test Farm",
    contactName: overrides.contactName ?? "Test Farmer",
    region: overrides.region ?? "Eastern Region",
    district: overrides.district ?? "TIE NKWANTA-KOFORIDUA/EASTERN REGION",
    products: overrides.products ?? ["Maise", "Aquaculture And Poultry", "Cabbages And Chili Pepper", "Yam"],
    farmType: overrides.farmType ?? "Crop",
    farmSize: overrides.farmSize ?? "5 acres",
    availabilityStatus: overrides.availabilityStatus ?? "Available",
    description: overrides.description ?? "Test farmer profile.",
    harvestSeason: overrides.harvestSeason ?? "Seasonal",
    capacityVolume: overrides.capacityVolume ?? "Confirm by request",
    photos: overrides.photos ?? [],
    hasRealPhoto: overrides.hasRealPhoto,
    verificationStatus: overrides.verificationStatus ?? "Verified",
    source: overrides.source,
    isFeatured: overrides.isFeatured,
    trust: overrides.trust,
    whatsappMessage: overrides.whatsappMessage ?? "Hello Ghana Growers"
  };
}

function supplierFixture(overrides: Partial<SupplierProfile> = {}): SupplierProfile {
  return {
    slug: overrides.slug ?? "test-supplier",
    companyName: overrides.companyName ?? "Test Supplier",
    contactPerson: overrides.contactPerson ?? "Supplier Contact",
    supplierCategory: overrides.supplierCategory ?? "Seeds",
    region: overrides.region ?? "Ashanti Region",
    district: overrides.district ?? "Kumasi",
    productsServices: overrides.productsServices ?? ["Seeds", "Fertilizer", "Farm Tools"],
    shortDescription: overrides.shortDescription ?? "Test supplier profile.",
    companyOverview: overrides.companyOverview ?? "Supplier overview.",
    serviceCoverageArea: overrides.serviceCoverageArea ?? "Ashanti Region",
    photos: overrides.photos ?? [],
    website: overrides.website,
    socialLink: overrides.socialLink,
    phone: overrides.phone ?? "0000000000",
    verificationStatus: overrides.verificationStatus ?? "Verified",
    verificationDate: overrides.verificationDate,
    verifiedBy: overrides.verifiedBy,
    verificationNotes: overrides.verificationNotes,
    ggStandardStatus: overrides.ggStandardStatus,
    status: overrides.status,
    isFeatured: overrides.isFeatured,
    featuredUntil: overrides.featuredUntil,
    featuredNote: overrides.featuredNote,
    trust: overrides.trust,
    whatsappMessage: overrides.whatsappMessage ?? "Hello Ghana Growers"
  };
}

function marketplaceProductFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? "fresh-tomatoes-real-farm",
    name: overrides.name ?? "Fresh Tomatoes",
    category: overrides.category ?? "Vegetables",
    location: overrides.location ?? "accra",
    region: overrides.region ?? "Greater Accra Region",
    seller: overrides.seller ?? "Real Farm",
    description: overrides.description ?? "Fresh produce listing.",
    quantity: overrides.quantity ?? "50",
    unit: overrides.unit ?? "Kilo",
    sellingMethod: overrides.sellingMethod,
    sellingUnit: overrides.sellingUnit,
    customUnitLabel: overrides.customUnitLabel,
    customUnitReviewed: overrides.customUnitReviewed,
    unitSizeValue: overrides.unitSizeValue,
    unitSizeMeasure: overrides.unitSizeMeasure,
    unitSizeApproximate: overrides.unitSizeApproximate,
    priceAmount: overrides.priceAmount,
    priceCurrency: overrides.priceCurrency,
    priceBasis: overrides.priceBasis,
    unitsAvailable: overrides.unitsAvailable,
    totalQuantityValue: overrides.totalQuantityValue,
    totalQuantityMeasure: overrides.totalQuantityMeasure,
    minimumOrderValue: overrides.minimumOrderValue,
    minimumOrderUnit: overrides.minimumOrderUnit,
    supplyFrequency: overrides.supplyFrequency,
    availableFromDate: overrides.availableFromDate,
    gradeDescription: overrides.gradeDescription,
    deliveryDetails: overrides.deliveryDetails,
    recordSource: overrides.recordSource,
    image: overrides.image ?? "/images/marketplace/fresh-tomatoes.jpg",
    images: overrides.images,
    available: overrides.available ?? "Available Now",
    datePosted: overrides.datePosted ?? "2026-07-01",
    verified: overrides.verified,
    verificationStatus: overrides.verificationStatus ?? "Pending",
    status: overrides.status ?? "Active",
    featured: overrides.featured,
    featuredUntil: overrides.featuredUntil,
    featuredNote: overrides.featuredNote,
    whatsappNumber: overrides.whatsappNumber,
    farmerSlug: overrides.farmerSlug ?? "real-farm",
    ownerType: overrides.ownerType ?? "Farmer",
    ownerId: overrides.ownerId,
    ownerName: overrides.ownerName ?? "Real Farm",
    internalOperationsNotes: overrides.internalOperationsNotes
  };
}

function assertNoDeveloperLanguage(response: FarmMateBrainResponse) {
  const text = responseText(response).toLowerCase();
  assert.equal(text.includes("tell the farmer"), false);
  assert.equal(text.includes("medium confidence"), false);
  assert.equal(text.includes("high confidence"), false);
  assert.equal(text.includes("low confidence"), false);
}

function usageEvent(tool: "ask_farmmate" | "crop_doctor", createdAt: string): FarmMateUsageEvent {
  return { tool, createdAt };
}

function normalizeAdviceText(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function repoFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const tests: TestCase[] = [
  {
    name: "Listing submissions reconciliation migration creates the missing public queue safely",
    run: () => {
      const migration = repoFile("supabase/migrations/031_reconcile_listing_submissions.sql");

      assert.equal(migration.includes("begin;"), true);
      assert.equal(migration.includes("commit;"), true);
      assert.equal(migration.includes("create table if not exists public.listing_submissions"), true);
      assert.equal(migration.includes("id uuid primary key default gen_random_uuid()"), true);
      assert.equal(migration.includes("status text not null default 'New'"), true);
      assert.equal(migration.includes("check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted'))"), true);
      assert.equal(migration.includes("conrelid = 'public.listing_submissions'::regclass"), true);
      assert.equal(migration.includes("before update on public.listing_submissions"), true);
      assert.equal(migration.includes("execute function public.set_updated_at()"), true);
      assert.equal(migration.includes("alter table public.listing_submissions enable row level security"), true);
      assert.equal(migration.includes("listing_submissions_status_idx"), true);
      assert.equal(migration.includes("on public.listing_submissions (status, created_at desc)"), true);
      assert.equal(migration.includes("grant insert ("), true);
      assert.equal(migration.includes("to anon"), true);
      assert.equal(migration.includes("for insert"), true);
      assert.equal(migration.includes("with check"), true);
      assert.equal(migration.includes("grant select, insert, update, delete on public.listing_submissions to service_role"), true);
      assert.equal(/grant\s+select\s+on\s+public\.listing_submissions\s+to\s+anon/i.test(migration), false);
      assert.equal(/for\s+select\s+to\s+anon/i.test(migration), false);
      assert.equal(migration.includes("marketplace_listings"), true);
      assert.equal(migration.includes("create table if not exists public.buyer_request_submissions"), false);
      assert.equal(migration.includes("alter table public.marketplace_listings"), false);
    }
  },
  {
    name: "Marketplace trade migration runs after listing submission reconciliation",
    run: () => {
      const tradeMigration = repoFile("supabase/migrations/032_marketplace_trade_fields.sql");

      assert.equal(tradeMigration.includes("begin;"), true);
      assert.equal(tradeMigration.includes("commit;"), true);
      assert.equal(tradeMigration.includes("alter table public.marketplace_listings"), true);
      assert.equal(tradeMigration.includes("alter table public.listing_submissions"), true);
      assert.equal(tradeMigration.includes("to_regclass('public.listing_submissions')"), false);
      assert.equal(tradeMigration.includes("Skipping listing_submissions"), false);
      assert.equal(tradeMigration.includes("listing_submissions_selling_method_check"), true);
      assert.equal(tradeMigration.includes("'public.listing_submissions'::regclass"), true);
      assert.equal(tradeMigration.includes("'packaged_unit', 'weight', 'count', 'livestock', 'volume'"), true);
      assert.equal(tradeMigration.includes("selling_method in ('packaged_unit', 'weight', 'count', 'livestock', 'volume', 'other')"), false);
    }
  },
  {
    name: "Public listing submission workflow uses listing_submissions and converts structured trade fields",
    run: () => {
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");
      const route = repoFile("src/app/api/listing-submissions/route.ts");

      assert.equal(route.includes("createListingSubmission(formData)"), true);
      assert.equal(publicSubmissions.includes('insertSupabaseRecord("listing_submissions"'), true);
      assert.equal(publicSubmissions.includes('selectSupabaseRecords<ListingSubmission>("listing_submissions"'), true);
      assert.equal(publicSubmissions.includes('const table = kind === "listing" ? "listing_submissions" : "buyer_request_applications"'), true);
      assert.equal(publicSubmissions.includes('insertSupabaseRecord("marketplace_listings"'), true);
      assert.equal(publicSubmissions.includes("selling_method: submission.selling_method"), true);
      assert.equal(publicSubmissions.includes("selling_unit: submission.selling_unit"), true);
      assert.equal(publicSubmissions.includes("custom_unit_label: submission.custom_unit_label"), true);
      assert.equal(publicSubmissions.includes("price_amount: submission.price_amount"), true);
      assert.equal(publicSubmissions.includes("units_available: submission.units_available"), true);
      assert.equal(publicSubmissions.includes("total_quantity_value: submission.total_quantity_value"), true);
      assert.equal(publicSubmissions.includes("record_source: \"public_submission\""), true);
    }
  },
  {
    name: "Farmer Directory normalizes rough farmer labels and locations",
    run: () => {
      const farmer = farmerFixture();

      assert.equal(cleanFarmerLocation(farmer), "Tie Nkwanta-Koforidua, Eastern Region");
      assert.equal(cleanFarmerProfileLabel("Maise"), "Maize");
      assert.equal(cleanFarmerProfileLabel("Aquaculture And Poultry"), "Aquaculture & Poultry");
      assert.equal(cleanFarmerProfileLabel("Cabbages And Chili Pepper"), "Cabbage & Chili Pepper");
    }
  },
  {
    name: "Farmer Directory excludes unpublished or under-review profiles",
    run: () => {
      const publicProfiles = publicFarmerProfiles([
        farmerFixture({ slug: "verified", verificationStatus: "Verified" }),
        farmerFixture({ slug: "pending", verificationStatus: "Pending Verification", source: undefined, isFeatured: false }),
        farmerFixture({ slug: "founding", verificationStatus: "Pending Verification", source: "Founding Farmer" })
      ]);

      assert.deepEqual(publicProfiles.map((farmer) => farmer.slug), ["verified", "founding"]);
    }
  },
  {
    name: "Farmer Directory excludes demo seed profiles from public UI",
    run: () => {
      const publicProfiles = publicFarmerProfiles([
        farmerFixture({ slug: "demo-seed", source: "Demo Seed", verificationStatus: "Verified", isFeatured: true }),
        farmerFixture({ slug: "sample-record", source: "Sample", verificationStatus: "Verified", isFeatured: true }),
        farmerFixture({ slug: "real-featured", source: "Tally Import", verificationStatus: "Verified", isFeatured: true })
      ]);

      assert.equal(isDemoSeedFarmerProfile(farmerFixture({ source: "Demo Seed" })), true);
      assert.equal(isDemoSeedFarmerProfile(farmerFixture({ source: "Tally Import" })), false);
      assert.deepEqual(publicProfiles.map((farmer) => farmer.slug), ["real-featured"]);
    }
  },
  {
    name: "Homepage featured farmers excludes demo seed configured profiles",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles(
        [],
        [
          farmerFixture({ slug: "akumadan-growers-group", source: "Demo Seed", verificationStatus: "Verified", isFeatured: true }),
          farmerFixture({ slug: "real-configured", source: "Tally Import", verificationStatus: "Verified", isFeatured: true })
        ]
      );

      assert.deepEqual(featuredFarmers.map((farmer) => farmer.slug), ["real-configured"]);
    }
  },
  {
    name: "Featured farmer config uses genuine curated profile slugs",
    run: () => {
      const obsoleteDemoSlugs = [
        "akumadan-growers-group",
        "nsawam-fruit-farmers",
        "northern-root-crops-network",
        "ada-vegetable-cooperative",
        "techiman-maize-and-beans-farm",
        "western-cocoa-and-plantain-farm"
      ];

      assert.deepEqual(featuredListingData.farmerSlugs, [
        "ibrahim-mohammed-farm",
        "duakib-baariyan-farm",
        "s-k-nart-farms"
      ]);
      assert.equal(featuredListingData.farmerSlugs.some((slug) => obsoleteDemoSlugs.includes(slug)), false);
    }
  },
  {
    name: "Homepage featured farmers maps configured slugs to live public farmers",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles(
        [
          farmerFixture({ slug: "s-k-nart-farms", farmName: "S. K. Nart Farms", source: "Tally Import", verificationStatus: "Verified" }),
          farmerFixture({ slug: "unconfigured-featured", source: "Tally Import", verificationStatus: "Verified", isFeatured: true }),
          farmerFixture({ slug: "ibrahim-mohammed-farm", farmName: "Ibrahim Mohammed Farm", source: "Tally Import", verificationStatus: "Verified" }),
          farmerFixture({ slug: "duakib-baariyan-farm", farmName: "Duakib Baariyan Farm", source: "Tally Import", verificationStatus: "Verified" })
        ],
        [],
        4,
        ["ibrahim-mohammed-farm", "duakib-baariyan-farm", "s-k-nart-farms"]
      );

      assert.deepEqual(featuredFarmers.map((farmer) => farmer.slug), [
        "ibrahim-mohammed-farm",
        "duakib-baariyan-farm",
        "s-k-nart-farms"
      ]);
    }
  },
  {
    name: "Homepage featured farmers does not duplicate configured farmers",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles(
        [farmerFixture({ slug: "ibrahim-mohammed-farm", source: "Tally Import", verificationStatus: "Verified" })],
        [farmerFixture({ slug: "ibrahim-mohammed-farm", source: "Tally Import", verificationStatus: "Verified" })],
        4,
        ["ibrahim-mohammed-farm"]
      );

      assert.deepEqual(featuredFarmers.map((farmer) => farmer.slug), ["ibrahim-mohammed-farm"]);
    }
  },
  {
    name: "Homepage featured farmers renders genuine approved featured profiles",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles([
        farmerFixture({ slug: "real-featured", source: "Tally Import", verificationStatus: "Verified", isFeatured: true }),
        farmerFixture({ slug: "real-normal", source: "Tally Import", verificationStatus: "Verified", isFeatured: false }),
        farmerFixture({ slug: "demo-featured", source: "Demo Seed", verificationStatus: "Verified", isFeatured: true })
      ]);

      assert.deepEqual(featuredFarmers.map((farmer) => farmer.slug), ["real-featured"]);
    }
  },
  {
    name: "Homepage featured farmers hides when no eligible real featured profiles exist",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles(
        [
          farmerFixture({ slug: "real-under-review", source: "Tally Import", verificationStatus: "Pending Verification", isFeatured: true }),
          farmerFixture({ slug: "demo-featured", source: "Demo Seed", verificationStatus: "Verified", isFeatured: true })
        ],
        [farmerFixture({ slug: "configured-demo", source: "Demo Seed", verificationStatus: "Verified", isFeatured: true })]
      );

      assert.deepEqual(featuredFarmers, []);
    }
  },
  {
    name: "Farmer Directory verified badge is conditional",
    run: () => {
      assert.equal(isVerifiedFarmer(farmerFixture({ verificationStatus: "Verified" })), true);
      assert.equal(isVerifiedFarmer(farmerFixture({ verificationStatus: "Premium Member" })), false);
      assert.equal(isVerifiedFarmer(farmerFixture({ verificationStatus: "Pending Verification" })), false);
    }
  },
  {
    name: "Farmer Directory pins up to four featured profiles in the main grid",
    run: () => {
      const farmers = [
        farmerFixture({ slug: "normal-1", isFeatured: false }),
        farmerFixture({ slug: "featured-1", isFeatured: true }),
        farmerFixture({ slug: "featured-2", isFeatured: true }),
        farmerFixture({ slug: "featured-3", isFeatured: true }),
        farmerFixture({ slug: "featured-4", isFeatured: true }),
        farmerFixture({ slug: "featured-5", isFeatured: true }),
        farmerFixture({ slug: "pending-featured", isFeatured: true, verificationStatus: "Pending Verification" }),
        farmerFixture({ slug: "normal-2", isFeatured: false })
      ];

      assert.deepEqual(orderFarmerDirectoryProfiles(farmers).map((farmer) => farmer.slug), [
        "featured-1",
        "featured-2",
        "featured-3",
        "featured-4",
        "normal-1",
        "featured-5",
        "normal-2"
      ]);
    }
  },
  {
    name: "Farmer Directory card chips omit broad farm-type labels",
    run: () => {
      assert.deepEqual(
        farmerCardProducts(
          farmerFixture({
            farmType: "Mixed",
            products: ["Aquaculture And Poultry", "Fish", "Poultry", "Eggs"]
          })
        ),
        ["Fish", "Poultry", "Eggs"]
      );
      assert.deepEqual(
        farmerCardProducts(
          farmerFixture({
            farmType: "Mixed",
            products: ["Aquaculture And Poultry"]
          })
        ),
        []
      );
    }
  },
  {
    name: "Farmer Directory paginates 12 profiles per page",
    run: () => {
      const farmers = Array.from({ length: 25 }, (_, index) => farmerFixture({ slug: `farmer-${index + 1}` }));
      const firstPage = paginateFarmers(farmers, 1, 12);
      const thirdPage = paginateFarmers(farmers, 3, 12);

      assert.equal(firstPage.pageItems.length, 12);
      assert.equal(firstPage.totalPages, 3);
      assert.equal(thirdPage.pageItems.length, 1);
      assert.equal(thirdPage.startIndex, 24);
    }
  },
  {
    name: "Supplier Directory publishes only verified supplier profiles",
    run: () => {
      const publicProfiles = publicSupplierProfiles([
        supplierFixture({ slug: "verified", verificationStatus: "Verified" }),
        supplierFixture({ slug: "pending", verificationStatus: "Pending Verification" })
      ]);

      assert.equal(isVerifiedSupplier(supplierFixture({ verificationStatus: "Verified" })), true);
      assert.equal(isVerifiedSupplier(supplierFixture({ verificationStatus: "Pending Verification" })), false);
      assert.deepEqual(publicProfiles.map((supplier) => supplier.slug), ["verified"]);
    }
  },
  {
    name: "Supplier Directory pins up to four approved featured suppliers",
    run: () => {
      const suppliers = [
        supplierFixture({ slug: "normal-1", isFeatured: false }),
        supplierFixture({ slug: "featured-1", isFeatured: true }),
        supplierFixture({ slug: "featured-2", isFeatured: true }),
        supplierFixture({ slug: "featured-3", isFeatured: true }),
        supplierFixture({ slug: "featured-4", isFeatured: true }),
        supplierFixture({ slug: "featured-5", isFeatured: true }),
        supplierFixture({ slug: "pending-featured", verificationStatus: "Pending Verification", isFeatured: true })
      ];

      assert.deepEqual(orderSupplierDirectoryProfiles(suppliers).map((supplier) => supplier.slug), [
        "featured-1",
        "featured-2",
        "featured-3",
        "featured-4",
        "normal-1",
        "featured-5"
      ]);
    }
  },
  {
    name: "Supplier Directory prepares compact products and paginates 12 profiles",
    run: () => {
      const suppliers = Array.from({ length: 25 }, (_, index) => supplierFixture({ slug: `supplier-${index + 1}` }));
      const firstPage = paginateSuppliers(suppliers, 1, 12);
      const thirdPage = paginateSuppliers(suppliers, 3, 12);

      assert.deepEqual(supplierProducts(supplierFixture({ productsServices: ["fertilizer", "farm tools", "fertilizer"] })), ["Fertilizer", "Farm Tools"]);
      assert.equal(firstPage.pageItems.length, 12);
      assert.equal(firstPage.totalPages, 3);
      assert.equal(thirdPage.pageItems.length, 1);
    }
  },
  {
    name: "Farmer Directory pagination creates compact page list",
    run: () => {
      assert.deepEqual(paginationPages(5, 9), [1, "ellipsis", 4, 5, 6, "ellipsis", 9]);
    }
  },
  {
    name: "Homepage FarmMate tools hide inactive Market Price Check",
    run: () => {
      const titles = homepageFarmMateTools.map((tool) => tool.title);

      assert.deepEqual(titles, ["Crop Doctor", "Live Weather", "Ask FarmMate"]);
      assert.equal(titles.includes("Market Price Check"), false);
    }
  },
  {
    name: "Homepage FarmMate description no longer mentions market prices",
    run: () => {
      const description = homepageFarmMateDescription.toLowerCase();

      assert.equal(description, "check weather, diagnose crop problems, and get practical farming advice in one place.");
      assert.equal(description.includes("market price"), false);
      assert.equal(description.includes("compare market"), false);
    }
  },
  {
    name: "Inactive market price public links are not exposed by smart tools",
    run: () => {
      const toolText = smartTools.map((tool) => `${tool.title} ${tool.description} ${tool.cta} ${tool.href}`).join(" ").toLowerCase();

      assert.equal(toolText.includes("market price"), false);
      assert.equal(toolText.includes("#market-prices"), false);
      assert.equal(smartTools.some((tool) => tool.href === "#market-prices"), false);
    }
  },
  {
    name: "Marketplace public listings exclude demo seed sellers",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({ id: "demo-listing", farmerSlug: "demo-farm", seller: "Demo Farm", ownerName: "Demo Farm" }),
          marketplaceProductFixture({ id: "real-listing", farmerSlug: "real-farm", seller: "Real Farm", ownerName: "Real Farm" })
        ],
        [
          farmerFixture({ slug: "demo-farm", farmName: "Demo Farm", source: "Demo Seed", verificationStatus: "Verified" }),
          farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Tally Import", verificationStatus: "Verified" })
        ],
        []
      );

      assert.deepEqual(listings.map((listing) => listing.product.id), ["real-listing"]);
    }
  },
  {
    name: "Marketplace excludes Farmer J and related tomato demo listings",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({
            id: "farmer-j-tomato-1",
            seller: "Farmer J",
            ownerName: "Farmer J",
            farmerSlug: "farmer-j",
            name: "Fresh Tomatoes",
            recordSource: "demo_seed"
          }),
          marketplaceProductFixture({
            id: "farmer-j-tomato-2",
            seller: "Farmer J",
            ownerName: "Farmer J",
            farmerSlug: "farmer-j",
            name: "Fresh Tomatoes"
          }),
          marketplaceProductFixture({
            id: "yellow-maize-sk-nart",
            seller: "S. K. Nart Farms",
            ownerName: "S. K. Nart Farms",
            farmerSlug: "s-k-nart-farms",
            name: "Yellow Maize",
            category: "Cereals"
          })
        ],
        [
          farmerFixture({ slug: "farmer-j", farmName: "Farmer J", source: "Demo Seed", verificationStatus: "Verified" }),
          farmerFixture({ slug: "s-k-nart-farms", farmName: "S. K. Nart Farms", source: "Tally Import", verificationStatus: "Verified" })
        ],
        []
      );

      assert.deepEqual(listings.map((listing) => listing.product.id), ["yellow-maize-sk-nart"]);
      assert.equal(listings[0].title, "Yellow Maize");
    }
  },
  {
    name: "Marketplace public listings exclude exact duplicates",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({ id: "tomato-1" }),
          marketplaceProductFixture({ id: "tomato-2" })
        ],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Tally Import", verificationStatus: "Verified" })],
        []
      );

      assert.deepEqual(listings.map((listing) => listing.product.id), ["tomato-1"]);
    }
  },
  {
    name: "Marketplace public listings exclude inactive unpublished or invalid seller records",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({ id: "active", farmerSlug: "real-farm", ownerName: "Real Farm" }),
          marketplaceProductFixture({ id: "draft", status: "Draft", farmerSlug: "real-farm", ownerName: "Real Farm" }),
          marketplaceProductFixture({ id: "inactive", status: "Inactive", farmerSlug: "real-farm", ownerName: "Real Farm" }),
          marketplaceProductFixture({ id: "inactive-supplier", ownerType: "Supplier", ownerName: "Input Supplier", farmerSlug: undefined }),
          marketplaceProductFixture({ id: "missing-seller", farmerSlug: "missing-farm", ownerName: "Missing Farm" })
        ],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Tally Import", verificationStatus: "Verified" })],
        [supplierFixture({ slug: "input-supplier", companyName: "Input Supplier", verificationStatus: "Verified", status: "Inactive" })]
      );

      assert.deepEqual(listings.map((listing) => listing.product.id), ["active"]);
    }
  },
  {
    name: "Marketplace unverified sellers do not receive a verified badge",
    run: () => {
      const listings = publicMarketplaceListings(
        [marketplaceProductFixture({ verified: true })],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Founding Farmer", verificationStatus: "Pending Verification" })],
        []
      );

      assert.equal(listings.length, 1);
      assert.equal(listings[0].isSellerVerified, false);
    }
  },
  {
    name: "Marketplace featured section hides without genuine featured listings",
    run: () => {
      const listings = publicMarketplaceListings(
        [marketplaceProductFixture({ featured: false })],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Tally Import", verificationStatus: "Verified" })],
        []
      );

      assert.deepEqual(featuredMarketplaceListings(listings), []);
    }
  },
  {
    name: "Marketplace formatting separates quantity availability and supply frequency",
    run: () => {
      assert.equal(normalizeMarketplaceQuantity(marketplaceProductFixture({ quantity: "50", unit: "Kg" })), "50 kg");
      assert.equal(normalizeMarketplaceQuantity(marketplaceProductFixture({ quantity: "50", unit: "Kilo" })), "50 kg");
      assert.equal(marketplaceAvailability("Monthly"), "Ask availability");
      assert.equal(marketplaceSupplyFrequency("Monthly"), "Monthly");
      assert.equal(marketplaceAvailability(""), "Ask availability");
    }
  },
  {
    name: "Marketplace structured package totals calculate and format separately",
    run: () => {
      const product = marketplaceProductFixture({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        priceAmount: "700",
        priceCurrency: "GHS",
        unitsAvailable: "20",
        totalQuantityValue: "1000",
        totalQuantityMeasure: "kg",
        minimumOrderValue: "2",
        minimumOrderUnit: "sack"
      });

      assert.equal(calculatedMarketplaceTotal(product), "1,000 kg");
      assert.equal(marketplacePriceLine(product), "GH₵700 per 50 kg sack");
      assert.equal(marketplaceQuantityLine(product), "20 sacks available · 1,000 kg total");
      assert.equal(pluralizeMarketplaceUnit("crate", 1), "crate");
      assert.equal(pluralizeMarketplaceUnit("crate", 40), "crates");
      assert.equal(marketplaceTradeLines(product).find((line) => line.label === "Minimum order")?.value, "2 sacks");
    }
  },
  {
    name: "Marketplace approximate crate totals stay local and clearly marked",
    run: () => {
      const product = marketplaceProductFixture({
        sellingMethod: "packaged_unit",
        sellingUnit: "crate",
        unitSizeValue: "25",
        unitSizeMeasure: "kg",
        unitSizeApproximate: true,
        priceAmount: "250",
        priceCurrency: "GHS",
        unitsAvailable: "40",
        totalQuantityValue: "1000",
        totalQuantityMeasure: "kg",
        minimumOrderValue: "4",
        minimumOrderUnit: "crate"
      });

      assert.equal(calculatedMarketplaceTotal(product), "1,000 kg");
      assert.equal(marketplacePriceLine(product), "GH₵250 per 25 kg crate");
      assert.equal(marketplaceQuantityLine(product), "40 crates available \u00b7 approx. 1,000 kg total");
    }
  },
  {
    name: "Marketplace direct weight listing uses confirmed stock without package math",
    run: () => {
      const product = marketplaceProductFixture({
        sellingMethod: "weight",
        sellingUnit: "kg",
        totalQuantityValue: "1000",
        totalQuantityMeasure: "kg",
        priceAmount: "14",
        priceCurrency: "GHS",
        priceBasis: "kg",
        unitsAvailable: undefined,
        unitSizeValue: undefined
      });

      assert.equal(calculatedMarketplaceTotal(product), "");
      assert.equal(marketplacePriceLine(product), "GH₵14 per kg");
      assert.equal(marketplaceQuantityLine(product), "1,000 kg available");
    }
  },
  {
    name: "Marketplace count and livestock listings do not invent weight totals",
    run: () => {
      const countProduct = marketplaceProductFixture({
        sellingMethod: "count",
        sellingUnit: "bunch",
        priceAmount: "30",
        priceCurrency: "GHS",
        unitsAvailable: "80",
        unitSizeValue: "10",
        unitSizeMeasure: "kg"
      });
      const livestockProduct = marketplaceProductFixture({
        sellingMethod: "livestock",
        sellingUnit: "goat",
        priceAmount: "900",
        priceCurrency: "GHS",
        unitsAvailable: "12",
        unitSizeValue: "20",
        unitSizeMeasure: "kg"
      });

      assert.equal(calculatedMarketplaceTotal(countProduct), "");
      assert.equal(marketplacePriceLine(countProduct), "GH₵30 per bunch");
      assert.equal(marketplaceQuantityLine(countProduct), "80 bunches available");
      assert.equal(calculatedMarketplaceTotal(livestockProduct), "");
      assert.equal(marketplacePriceLine(livestockProduct), "GH₵900 per goat");
      assert.equal(marketplaceQuantityLine(livestockProduct), "12 goats available");
    }
  },
  {
    name: "Marketplace volume listings calculate only with confirmed volume size",
    run: () => {
      const product = marketplaceProductFixture({
        sellingMethod: "volume",
        sellingUnit: "container",
        unitSizeValue: "20",
        unitSizeMeasure: "litres",
        priceAmount: "150",
        priceCurrency: "GHS",
        priceBasis: "litres",
        unitsAvailable: "10",
        totalQuantityValue: "200",
        totalQuantityMeasure: "litres",
        minimumOrderValue: "2",
        minimumOrderUnit: "container"
      });

      assert.equal(calculatedMarketplaceTotal(product), "200 litres");
      assert.equal(marketplacePriceLine(product), "GH₵150 per litres");
      assert.equal(marketplaceQuantityLine(product), "10 containers available \u00b7 200 litres total");
    }
  },
  {
    name: "Marketplace canonical trade fields ignore stale client total",
    run: () => {
      const fields = canonicalMarketplaceTradeFields({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        unitsAvailable: "20",
        totalQuantityValue: "999999",
        totalQuantityMeasure: "tonnes"
      });

      assert.equal(fields.total_quantity_value, 1000);
      assert.equal(fields.total_quantity_measure, "kg");
      assert.equal(fields.price_basis, "sack");
    }
  },
  {
    name: "Marketplace canonical direct weight keeps entered total",
    run: () => {
      const fields = canonicalMarketplaceTradeFields({
        sellingMethod: "weight",
        sellingUnit: "kg",
        totalQuantityValue: "1000.5",
        totalQuantityMeasure: "kg"
      });

      assert.equal(fields.total_quantity_value, 1000.5);
      assert.equal(fields.total_quantity_measure, "kg");
      assert.equal(fields.price_basis, "kg");
    }
  },
  {
    name: "Marketplace incomplete listings do not invent quantities or prices",
    run: () => {
      const yellowMaize = marketplaceProductFixture({
        name: "Yellow Maize",
        quantity: "",
        unit: "",
        priceAmount: undefined,
        priceRange: undefined,
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: undefined,
        unitsAvailable: undefined,
        totalQuantityValue: undefined
      });

      assert.equal(marketplacePriceLine(yellowMaize), "Ask for price");
      assert.equal(marketplaceQuantityLine(yellowMaize), "Ask for quantity");
      assert.equal(marketplaceTradeLines(yellowMaize).find((line) => line.label === "Total available")?.value, "Ask for details");
    }
  },
  {
    name: "Marketplace keeps Yellow Maize eligible without invented trade data",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({
            id: "yellow-maize-sk-nart",
            name: "Yellow Maize",
            quantity: "",
            unit: "",
            priceAmount: undefined,
            priceRange: undefined,
            sellingMethod: undefined,
            sellingUnit: undefined,
            unitsAvailable: undefined,
            totalQuantityValue: undefined,
            farmerSlug: "s-k-nart-farms",
            ownerName: "S. K. Nart Farms",
            seller: "S. K. Nart Farms"
          })
        ],
        [farmerFixture({ slug: "s-k-nart-farms", farmName: "S. K. Nart Farms", source: "Tally Import", verificationStatus: "Verified" })],
        []
      );

      assert.equal(listings.length, 1);
      assert.equal(listings[0].title, "Yellow Maize");
      assert.equal(listings[0].priceLine, "Ask for price");
      assert.equal(listings[0].quantity, "Ask for quantity");
    }
  },
  {
    name: "Marketplace trade validation rejects invalid values but keeps price optional",
    run: () => {
      assert.deepEqual(validateMarketplaceTradeInput({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        unitsAvailable: "20",
        minimumOrderValue: "2",
        minimumOrderUnit: "sack"
      }), []);

      assert.equal(validateMarketplaceTradeInput({ priceAmount: "-1" }).includes("Price cannot be negative."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "count", sellingUnit: "tray", unitsAvailable: "0" }).includes("Units available must be greater than zero."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "packaged_unit", sellingUnit: "sack", unitsAvailable: "5", minimumOrderValue: "6", minimumOrderUnit: "sack" }).includes("Minimum order cannot be greater than available units."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "packaged_unit", sellingUnit: "sack", unitsAvailable: "5", minimumOrderValue: "2", minimumOrderUnit: "kg" }).includes("Minimum order unit must match the available stock unit."), true);
      assert.equal(validateMarketplaceTradeInput({ priceAmount: "12abc" }).includes("Price must be a valid number."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "weight", priceBasis: "crate" }).includes("Weight listings need a kg or tonnes price basis."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "packaged_unit" }).includes("Packaged listings need a unit or container type."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "other" as never }).includes("Selling method is not supported."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingUnit: "other" }).includes("Custom units need a clear label."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingUnit: "other", customUnitLabel: "paint bucket" }).includes(reviewedCustomUnitMessage), true);
    }
  },
  {
    name: "Marketplace method validation separates whole counts from decimal measures",
    run: () => {
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50.5",
        unitSizeMeasure: "kg",
        unitsAvailable: "20.5",
        minimumOrderValue: "2",
        minimumOrderUnit: "sack"
      }).includes("Units available must be a whole number for this selling method."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50.5",
        unitSizeMeasure: "kg",
        unitsAvailable: "20",
        minimumOrderValue: "2.5",
        minimumOrderUnit: "sack"
      }).includes("Minimum order must be a whole number for this selling method."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "count",
        sellingUnit: "piece",
        unitsAvailable: "3.5",
        minimumOrderValue: "1"
      }).includes("Units available must be a whole number for this selling method."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "livestock",
        sellingUnit: "goat",
        unitsAvailable: "2",
        minimumOrderValue: "1.5"
      }).includes("Minimum order must be a whole number for this selling method."), true);
      assert.deepEqual(validateMarketplaceTradeInput({
        sellingMethod: "weight",
        sellingUnit: "kg",
        totalQuantityValue: "1000.75",
        totalQuantityMeasure: "kg",
        minimumOrderValue: "25.5",
        minimumOrderUnit: "kg"
      }), []);
    }
  },
  {
    name: "Marketplace validation blocks inconsistent method and measure combinations",
    run: () => {
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "packaged_unit",
        sellingUnit: "kg",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        unitsAvailable: "20",
        minimumOrderValue: "2",
        minimumOrderUnit: "kg"
      }).includes("Packaged listings need a recognised package unit."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "weight",
        sellingUnit: "crate",
        totalQuantityValue: "100",
        totalQuantityMeasure: "kg"
      }).includes("Direct weight listings need kg or tonnes as the selling unit."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "volume",
        sellingUnit: "container",
        unitSizeValue: "20",
        unitSizeMeasure: "kg",
        unitsAvailable: "10"
      }).includes("Volume listings need litres or gallons as the unit size measure."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "livestock",
        sellingUnit: "crate",
        unitsAvailable: "5",
        minimumOrderValue: "1"
      }).includes("Livestock listings need an animal type, not a package unit."), true);
      assert.equal(validateMarketplaceTradeInput({
        sellingMethod: "volume",
        sellingUnit: "container",
        unitSizeValue: "20.5",
        unitSizeMeasure: "litres",
        unitsAvailable: "10.25",
        minimumOrderValue: "1"
      }).includes("Units available must be a whole number for this selling method."), true);
    }
  },
  {
    name: "Marketplace price basis and currency are normalised server-side",
    run: () => {
      const packageFields = canonicalMarketplaceTradeFields({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        priceAmount: "700",
        priceCurrency: "ghs",
        priceBasis: "litres",
        unitsAvailable: "20",
        totalQuantityValue: "1",
        minimumOrderValue: "2",
        minimumOrderUnit: "sack"
      });
      const weightFields = canonicalMarketplaceTradeFields({
        sellingMethod: "weight",
        sellingUnit: "kg",
        totalQuantityValue: "1000",
        totalQuantityMeasure: "kg",
        priceBasis: "crate"
      });

      assert.equal(packageFields.price_currency, "GHS");
      assert.equal(packageFields.price_basis, "sack");
      assert.equal(packageFields.total_quantity_value, 1000);
      assert.equal(weightFields.price_basis, "kg");
      assert.equal(formatMarketplaceCurrency("700", "GHS"), "GH₵700");
    }
  },
  {
    name: "Marketplace availability and supply frequency stay separate",
    run: () => {
      const listing = publicMarketplaceListings(
        [marketplaceProductFixture({ available: "Available Now", supplyFrequency: "One-time" })],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Tally Import", verificationStatus: "Verified" })],
        []
      )[0];

      assert.equal(marketplaceAvailability("Available Now"), "Available now");
      assert.equal(marketplaceAvailability("Harvesting Soon"), "Seasonal");
      assert.equal(marketplaceAvailability("Sold Out"), "Unavailable");
      assert.equal(marketplaceSupplyFrequency("One-time"), "One-time");
      assert.equal(listing.availability, "Available now");
      assert.equal(listing.supplyFrequency, "One-time");
    }
  },
  {
    name: "Marketplace custom units require review before publication",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({
            id: "custom-unit-pending",
            sellingUnit: "other",
            customUnitLabel: "paint bucket",
            customUnitReviewed: false,
            verificationStatus: "Verified"
          }),
          marketplaceProductFixture({
            id: "custom-unit-reviewed",
            sellingUnit: "other",
            customUnitLabel: "paint bucket",
            customUnitReviewed: true,
            verificationStatus: "Verified"
          })
        ],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Tally Import", verificationStatus: "Verified" })],
        []
      );

      assert.deepEqual(listings.map((listing) => listing.product.id), ["custom-unit-reviewed"]);
    }
  },
  {
    name: "Marketplace pagination runs after filtering and uses result range",
    run: () => {
      const items = Array.from({ length: 25 }, (_, index) => index + 1);
      const firstPage = paginateMarketplaceListings(items, 1);
      const thirdPage = paginateMarketplaceListings(items, 3);

      assert.equal(firstPage.pageItems.length, 12);
      assert.equal(thirdPage.pageItems.length, 1);
      assert.equal(marketplaceResultRange(1, 25), "Showing 1–12 of 25 listings");
      assert.equal(marketplaceResultRange(3, 25), "Showing 25–25 of 25 listings");
    }
  },
  {
    name: "FarmMate greeting never returns Good night",
    run: () => {
      for (let hour = 0; hour < 24; hour += 1) {
        assert.notEqual(getFarmMateGreetingForHour(hour), "Good night");
      }
    }
  },
  {
    name: "night time greeting returns Good evening",
    run: () => {
      assert.equal(getFarmMateGreetingForHour(21), "Good evening");
      assert.equal(getFarmMateGreetingForHour(0), "Good evening");
      assert.equal(getFarmMateGreetingForHour(4), "Good evening");
    }
  },
  {
    name: "at least 14 daily summaries exist",
    run: () => {
      assert.equal(farmMateDailySummaries.length >= 14, true);
    }
  },
  {
    name: "daily summary changes by date",
    run: () => {
      const first = getFarmMateDailySummary(new Date(2026, 6, 9, 9));
      const second = getFarmMateDailySummary(new Date(2026, 6, 10, 9));

      assert.notEqual(first.mainRecommendation, second.mainRecommendation);
    }
  },
  {
    name: "same date returns same daily summary",
    run: () => {
      const first = getFarmMateDailySummary(new Date(2026, 6, 9, 8));
      const second = getFarmMateDailySummary(new Date(2026, 6, 9, 10));

      assert.deepEqual(first, second);
    }
  },
  {
    name: "evening daily summary does not show plant before noon",
    run: () => {
      const summary = getFarmMateDailySummary(new Date(2026, 6, 9, 18));
      const text = `${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`.toLowerCase();

      assert.equal(text.includes("plant before noon"), false);
      assert.notEqual(summary.suitableTimeOfDay, "morning");
    }
  },
  {
    name: "night daily summary does not show morning-only advice",
    run: () => {
      const summary = getFarmMateDailySummary(new Date(2026, 6, 9, 22));
      const text = `${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`.toLowerCase();

      assert.equal(text.includes("before noon"), false);
      assert.equal(text.includes("early when the day is cool"), false);
      assert.notEqual(summary.suitableTimeOfDay, "morning");
    }
  },
  {
    name: "daily summaries do not repeat the exact recommendation as the tip",
    run: () => {
      for (const summary of farmMateDailySummaries) {
        assert.notEqual(normalizeAdviceText(summary.mainRecommendation), normalizeAdviceText(summary.todaysTip));
      }
    }
  },
  {
    name: "each daily summary has a practical tip",
    run: () => {
      const practicalWords = ["check", "water", "remove", "keep", "separate", "disinfect", "use", "open", "pull", "shake", "mark", "dig"];

      for (const summary of farmMateDailySummaries) {
        const tip = normalizeAdviceText(summary.todaysTip);

        assert.equal(summary.todaysTip.length > 24, true);
        assert.equal(practicalWords.some((word) => tip.includes(word)), true);
      }
    }
  },
  {
    name: "evening and night summaries avoid immediate morning-only field work",
    run: () => {
      const summaries = farmMateDailySummaries.filter((summary) => summary.suitableTimeOfDay === "evening" || summary.suitableTimeOfDay === "night");

      for (const summary of summaries) {
        const text = normalizeAdviceText(`${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`);

        assert.equal(text.includes("water young vegetables early"), false);
        assert.equal(text.includes("weed young crops"), false);
        assert.equal(text.includes("transplant when soil is moist"), false);
        assert.equal(text.includes("while the sun is still gentle"), false);
      }
    }
  },
  {
    name: "daily summary does not claim live weather",
    run: () => {
      for (const summary of farmMateDailySummaries) {
        const text = `${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`.toLowerCase();

        assert.equal(text.includes("rain expected after"), false);
        assert.equal(text.includes("rain will come"), false);
        assert.equal(text.includes("rain is coming"), false);
      }
    }
  },
  {
    name: "Skills Center has rotating challenges with required durations",
    run: () => {
      assert.deepEqual(
        learnChallenges.map((challenge) => challenge.durationDays),
        [7, 5, 3, 5, 7, 3]
      );
      assert.equal(learnChallenges[0].title, "7-Day Soil Health Challenge");
      assert.equal(learnChallenges.every((challenge) => challenge.days.length === challenge.durationDays), true);
    }
  },
  {
    name: "Skills Center challenge rotation is stable during one day",
    run: () => {
      const morning = getCurrentLearnChallenge(new Date("2026-07-09T06:00:00.000Z"));
      const evening = getCurrentLearnChallenge(new Date("2026-07-09T20:00:00.000Z"));

      assert.equal(morning.id, evening.id);
    }
  },
  {
    name: "Skills Center challenge rotation respects challenge duration",
    run: () => {
      const first = getCurrentLearnChallenge(new Date("1970-01-01T12:00:00.000Z"));
      const seventh = getCurrentLearnChallenge(new Date("1970-01-07T12:00:00.000Z"));
      const eighth = getCurrentLearnChallenge(new Date("1970-01-08T12:00:00.000Z"));

      assert.equal(first.id, "soil-health");
      assert.equal(seventh.id, "soil-health");
      assert.equal(eighth.id, "water-saving");
    }
  },
  {
    name: "Skills Center challenge progress finds next open day",
    run: () => {
      const challenge = learnChallenges[0];

      assert.equal(nextOpenChallengeDay(challenge, []), 1);
      assert.equal(nextOpenChallengeDay(challenge, [1, 2, 3]), 4);
      assert.equal(isChallengeComplete(challenge, [1, 2, 3, 4, 5, 6, 7]), true);
    }
  },
  {
    name: "Soil Health Challenge days include practical action details",
    run: () => {
      const dayOne = learnChallenges[0].days[0];

      assert.equal(dayOne.title, "Collect dry leaves and crop waste");
      assert.equal(dayOne.howToDoIt.length >= 5, true);
      assert.equal(dayOne.doneWhen.includes("collected enough clean farm waste"), true);
      assert.equal(dayOne.commonMistake.includes("Do not add plastic"), true);
      assert.deepEqual(dayOne.actionSteps, ["Gather materials", "Remove rubbish", "Keep in shade"]);
      assert.equal(dayOne.farmMatePrompt, "What materials on my farm can I use for compost?");
    }
  },
  {
    name: "maize question resolves maize",
    run: () => {
      const response = buildFarmMateResponse("My maize is not growing well", routeFarmMateQuestion("My maize is not growing well"));
      assert.equal(response.resolvedCrop, "Maize");
      assert.notEqual(response.flow?.requiredInformation.crop, "Tomato");
    }
  },
  {
    name: "tomato yellow leaves resolves tomato",
    run: () => {
      const response = buildFarmMateResponse("My tomato leaves are yellow", routeFarmMateQuestion("My tomato leaves are yellow"));
      assert.equal(response.resolvedCrop, "Tomato");
      assert.equal(response.flow?.requiredInformation.crop, "Tomato");
    }
  },
  {
    name: "cassava curling leaves resolves cassava",
    run: () => {
      const response = buildFarmMateResponse("My cassava leaves are curling", routeFarmMateQuestion("My cassava leaves are curling"));
      assert.equal(response.resolvedCrop, "Cassava");
      assert.notEqual(response.flow?.requiredInformation.crop, "Tomato");
    }
  },
  {
    name: "asking maize after tomato resets crop context",
    run: () => {
      const decision = manageFarmMateConversation("My maize is not growing well", plantHealthTomatoState);
      const response = buildFarmMateResponse("My maize is not growing well", routeFarmMateQuestion("My maize is not growing well"), {
        previousCropName: decision.shouldKeepContext ? plantHealthTomatoState.activeCropName : undefined
      });

      assert.equal(decision.action, "reset");
      assert.equal(decision.resetReason, "new_crop");
      assert.equal(response.resolvedCrop, "Maize");
    }
  },
  {
    name: "fertilizer question routes to fertilizer",
    run: () => {
      const router = routeFarmMateQuestion("Best fertilizer for maize");
      assert.equal(router.selectedSpecialist, "fertilizer");
      assert.equal(router.detectedCrop, "Maize");
    }
  },
  {
    name: "NPK pepper question routes to fertilizer",
    run: () => {
      const router = routeFarmMateQuestion("What NPK for pepper?");
      assert.equal(router.selectedSpecialist, "fertilizer");
      assert.equal(router.detectedCrop, "Pepper");
    }
  },
  {
    name: "compost tomato question routes to fertilizer",
    run: () => {
      const router = routeFarmMateQuestion("Can I use compost for tomatoes?");
      assert.equal(router.selectedSpecialist, "fertilizer");
      assert.equal(router.detectedCrop, "Tomato");
    }
  },
  {
    name: "best fertilizer for maize asks growth stage first",
    run: () => {
      const question = "Best fertilizer for maize";
      const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));

      assert.equal(response.routerResult?.selectedSpecialist, "fertilizer");
      assert.equal(response.flow?.id, "best-fertilizer-for-maize");
      assert.equal(response.flow?.followUpQuestions[0]?.question, "How old is the maize?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Less than 2 weeks", "2 to 4 weeks", "More than 4 weeks", "Already flowering"]);
      assert.equal(response.flow?.followUpQuestions.some((followUp) => followUp.id.includes("yellow")), false);
    }
  },
  {
    name: "fertilizer recommendation does not invent dosage",
    run: () => {
      const response = buildFarmMateResponse("Best fertilizer for maize", routeFarmMateQuestion("Best fertilizer for maize"));
      const text = responseText(response).toLowerCase();

      assert.equal(/\b\d+(?:\.\d+)?\s?(?:kg|g|ml|l)\b/.test(text), false);
      assert.equal(text.includes("do not guess rates"), true);
    }
  },
  {
    name: "fertilizer advice warns against heavy rain",
    run: () => {
      const response = buildFarmMateResponse("When to apply fertilizer after rain?", routeFarmMateQuestion("When to apply fertilizer after rain?"));
      const text = responseText(response).toLowerCase();

      assert.equal(response.flow?.id, "fertilizer-after-rain");
      assert.equal(text.includes("do not apply before heavy rain"), true);
    }
  },
  {
    name: "fertilizer advice includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("What NPK for pepper?", routeFarmMateQuestion("What NPK for pepper?"));
      const nextBestAction = response.sections.find((section) => section.title === "Next Best Action")?.body ?? [];

      assert.equal(response.flow?.id, "fertilizer-for-pepper");
      assert.equal(nextBestAction.length, 1);
      assert.equal(Boolean(response.nextBestAction.instruction), true);
    }
  },
  {
    name: "maize yellow leaves routes to plant health first",
    run: () => {
      const question = "Maize leaves are yellow";
      const router = routeFarmMateQuestion(question);
      const response = buildFarmMateResponse(question, router);

      assert.equal(router.selectedSpecialist, "crop_health");
      assert.notEqual(response.flow?.id, "best-fertilizer-for-maize");
      assert.equal(response.flow?.intent, "crop-health");
    }
  },
  {
    name: "OpenAI payload for fertilizer includes specialist context",
    run: () => {
      const farmerQuestion = "Best fertilizer for maize";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; crop?: string; safeUseNotes?: string[] } };

      assert.equal(payload.selectedSpecialist, "fertilizer");
      assert.equal(payload.specialistContext?.specialist, "fertilizer");
      assert.equal(payload.specialistContext?.crop, "Maize");
      assert.equal(payload.specialistContext?.safeUseNotes?.some((note) => note.toLowerCase().includes("do not guess rates")), true);
    }
  },
  {
    name: "spray question routes to weather decision",
    run: () => {
      assert.equal(routeFarmMateQuestion("Can I spray today?").selectedSpecialist, "weather_decision");
    }
  },
  {
    name: "fertilizer before rain routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Can I apply fertilizer before rain?");
      const response = buildFarmMateResponse("Can I apply fertilizer before rain?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "fertilizer-before-rain");
    }
  },
  {
    name: "irrigation question routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Should I irrigate today?");
      const response = buildFarmMateResponse("Should I irrigate today?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "should-i-irrigate-today");
    }
  },
  {
    name: "harvest before rain routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Can I harvest before rain?");
      const response = buildFarmMateResponse("Can I harvest before rain?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "harvest-before-rain");
    }
  },
  {
    name: "dry produce outside routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Can I dry produce outside?");
      const response = buildFarmMateResponse("Can I dry produce outside?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "dry-produce-outside");
    }
  },
  {
    name: "weather flow asks rain expectation first when live weather is unavailable",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));

      assert.equal(response.flow?.followUpQuestions[0]?.id, "rain-window");
      assert.equal(response.flow?.followUpQuestions[0]?.question, "Is rain expected in the next 4 to 6 hours?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Yes, rain is expected", "No rain expected", "I am not sure"]);
      assert.equal(response.flow?.followUpQuestions[1]?.question, "Is the wind calm?");
      assert.deepEqual(response.flow?.followUpQuestions[1]?.options, ["Yes, wind is calm", "No, it is windy", "I am not sure"]);
      assert.equal(response.flow?.followUpQuestions[2]?.question, "Are the leaves dry?");
      assert.deepEqual(response.flow?.followUpQuestions[2]?.options, ["Yes, leaves are dry", "No, leaves are wet", "I am not sure"]);
    }
  },
  {
    name: "weather spray flow does not recommend immediately when conditions are missing",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));

      assert.equal(response.flow?.recommendation.confidence, "medium");
      assert.equal(response.flow?.followUpQuestions.length, 3);
      assert.equal(shouldCompleteWeatherGuidedFlow(response.flow?.id, []), false);
    }
  },
  {
    name: "rain expected answer leads to do-not-spray recommendation",
    run: () => {
      const answers = [{ question: "Is rain expected in the next 4 to 6 hours?", answer: "Rain is expected soon" }];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n").toLowerCase() ?? "";

      assert.equal(shouldCompleteWeatherGuidedFlow("can-i-spray-today", answers), true);
      assert.equal(text.includes("do not spray now"), true);
      assert.equal(text.includes("wait until after the rain"), true);
      assert.equal(text.includes("leaves are dry and wind is calm"), true);
    }
  },
  {
    name: "clear spray conditions lead to cautious suitable recommendation",
    run: () => {
      const answers = [
        { question: "Is rain expected in the next 4 to 6 hours?", answer: "No rain expected soon" },
        { question: "Is the wind calm?", answer: "Wind is calm" },
        { question: "Are the leaves dry?", answer: "Leaves are dry" }
      ];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n").toLowerCase() ?? "";

      assert.equal(shouldCompleteWeatherGuidedFlow("can-i-spray-today", answers), true);
      assert.equal(text.includes("spraying may be suitable"), true);
      assert.equal(text.includes("follow product label instructions"), true);
      assert.equal(text.includes("avoid spraying during hot midday sun"), true);
    }
  },
  {
    name: "unsure weather answer leads to cautious delay recommendation",
    run: () => {
      const answers = [{ question: "Is rain expected in the next 4 to 6 hours?", answer: "I am not sure about rain" }];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n").toLowerCase() ?? "";

      assert.equal(shouldCompleteWeatherGuidedFlow("can-i-spray-today", answers), true);
      assert.equal(text.includes("do not spray until you confirm rain"), true);
      assert.equal(text.includes("wind"), true);
    }
  },
  {
    name: "weather guided recommendation includes exactly one next step card",
    run: () => {
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", [
        { question: "Is rain expected in the next 4 to 6 hours?", answer: "No rain expected soon" },
        { question: "Is the wind calm?", answer: "Wind is calm" },
        { question: "Are the leaves dry?", answer: "Leaves are dry" }
      ]);

      assert.equal(cards?.filter((card) => card.title === "Next step").length, 1);
      assert.equal(cards?.find((card) => card.title === "Next step")?.body.length, 1);
    }
  },
  {
    name: "spraying advice warns against rain within 4 to 6 hours and strong wind",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("4 to 6 hours"), true);
      assert.equal(text.includes("do not spray before rain"), true);
      assert.equal(text.includes("wind is calm"), true);
    }
  },
  {
    name: "fertilizer weather advice warns against heavy rain and runoff",
    run: () => {
      const response = buildFarmMateResponse("Can I apply fertilizer before rain?", routeFarmMateQuestion("Can I apply fertilizer before rain?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("heavy rain"), true);
      assert.equal(text.includes("runoff"), true);
      assert.equal(response.flow?.recommendation.guidance.some((line) => line.toLowerCase().includes("runoff")), true);
    }
  },
  {
    name: "weather advice does not invent live forecast",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("rain is coming today"), false);
      assert.equal(text.includes("rain will come today"), false);
      assert.equal(text.includes("check whether rain is expected"), true);
    }
  },
  {
    name: "weather recommendation includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("Can I harvest before rain?", routeFarmMateQuestion("Can I harvest before rain?"));

      assert.equal(response.flow?.recommendation.nextBestAction.instruction, "Harvest mature produce first if heavy rain may damage it.");
      assert.equal(response.sections.find((section) => section.title === "Next Best Action")?.body.length, 1);
    }
  },
  {
    name: "OpenAI payload includes weather specialist context",
    run: () => {
      const farmerQuestion = "Can I apply fertilizer before rain?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; task?: string; noLiveWeatherRule?: string; safetyWarnings?: string[] } };

      assert.equal(payload.selectedSpecialist, "weather_decision");
      assert.equal(payload.specialistContext?.specialist, "weather_decision");
      assert.equal(payload.specialistContext?.task, "fertilizer-before-rain");
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.toLowerCase().includes("do not invent live"), true);
      assert.equal(payload.specialistContext?.safetyWarnings?.some((warning) => warning.toLowerCase().includes("heavy rain")), true);
    }
  },
  {
    name: "weather specialist includes all required decision task types",
    run: () => {
      const tasks = weatherDecisionGuidance.map((guidance) => guidance.task);

      assert.deepEqual(
        [
          "spraying",
          "fertilizer-before-rain",
          "planting-before-rain",
          "irrigation",
          "harvesting-before-rain",
          "drying-produce",
          "heavy-rain-warning",
          "windy-conditions",
          "wet-leaves",
          "waterlogged-soil"
        ].every((task) => tasks.includes(task as (typeof tasks)[number])),
        true
      );
    }
  },
  {
    name: "what should I plant this month routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("What should I plant this month?");
      const response = buildFarmMateResponse("What should I plant this month?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "what-should-i-plant-this-month");
    }
  },
  {
    name: "can I plant tomatoes now routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("Can I plant tomatoes now?");
      const response = buildFarmMateResponse("Can I plant tomatoes now?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "can-i-plant-tomatoes-now");
      assert.equal(response.resolvedCrop, "Tomato");
    }
  },
  {
    name: "best spacing for pepper routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("Best spacing for pepper?");
      const response = buildFarmMateResponse("Best spacing for pepper?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "best-spacing-for-pepper");
      assert.equal(response.resolvedCrop, "Pepper");
    }
  },
  {
    name: "when should I plant maize routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("When should I plant maize?");
      const response = buildFarmMateResponse("When should I plant maize?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "when-should-i-plant-maize");
      assert.equal(response.resolvedCrop, "Maize");
    }
  },
  {
    name: "planting flow asks region first when crop is known but region is missing",
    run: () => {
      const response = buildFarmMateResponse("Can I plant tomatoes now?", routeFarmMateQuestion("Can I plant tomatoes now?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "Which region are you farming in?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]);
    }
  },
  {
    name: "planting flow asks crop type first when crop is not specified",
    run: () => {
      const response = buildFarmMateResponse("What should I plant this month?", routeFarmMateQuestion("What should I plant this month?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "What type of crop are you interested in?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Vegetables", "Staples", "Root/tuber crops", "I am not sure"]);
    }
  },
  {
    name: "planting advice does not invent weather or market prices",
    run: () => {
      const response = buildFarmMateResponse("What should I plant this month?", routeFarmMateQuestion("What should I plant this month?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("rain is coming today"), false);
      assert.equal(text.includes("market price"), false);
      assert.equal(text.includes("guaranteed profit"), false);
      assert.equal(text.includes("local planting context"), true);
    }
  },
  {
    name: "planting advice includes spacing when relevant",
    run: () => {
      const response = buildFarmMateResponse("Best spacing for pepper?", routeFarmMateQuestion("Best spacing for pepper?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("spacing"), true);
      assert.equal(text.includes("45 to 60 cm"), true);
    }
  },
  {
    name: "planting advice warns against waterlogged soil",
    run: () => {
      const response = buildFarmMateResponse("Can I plant tomatoes now?", routeFarmMateQuestion("Can I plant tomatoes now?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("waterlogged soil"), true);
    }
  },
  {
    name: "planting recommendation includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("When should I plant maize?", routeFarmMateQuestion("When should I plant maize?"));
      const nextBestAction = response.sections.find((section) => section.title === "Next Best Action")?.body ?? [];

      assert.equal(response.flow?.id, "when-should-i-plant-maize");
      assert.equal(nextBestAction.length, 1);
      assert.equal(Boolean(response.nextBestAction.instruction), true);
    }
  },
  {
    name: "OpenAI payload includes planting specialist context",
    run: () => {
      const farmerQuestion = "Best spacing for pepper?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; crop?: string; noLiveWeatherRule?: string; noMarketRule?: string; spacingGuidance?: string[] } };

      assert.equal(payload.selectedSpecialist, "planting");
      assert.equal(payload.specialistContext?.specialist, "planting");
      assert.equal(payload.specialistContext?.crop, "Pepper");
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.toLowerCase().includes("do not invent exact local weather"), true);
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("market prices"), true);
      assert.equal(payload.specialistContext?.spacingGuidance?.some((line) => line.toLowerCase().includes("45 to 60 cm")), true);
    }
  },
  {
    name: "buy produce does not route to plant health",
    run: () => {
      const router = routeFarmMateQuestion("How can I buy produce from Ghana Growers?");
      const decision = manageFarmMateConversation("How can I buy produce from Ghana Growers?", plantHealthTomatoState);
      assert.notEqual(router.selectedSpecialist, "crop_health");
      assert.equal(decision.isMarketplaceInfoRequest, true);
      assert.equal(decision.action, "reset");
    }
  },
  {
    name: "upload crop photo routes to crop doctor",
    run: () => {
      assert.equal(routeFarmMateQuestion("Upload crop photo").selectedSpecialist, "crop_doctor");
    }
  },
  {
    name: "topic changes reset old context",
    run: () => {
      const decision = manageFarmMateConversation("Can I spray today?", plantHealthTomatoState);
      assert.equal(decision.action, "reset");
      assert.equal(decision.resetReason, "new_intent");
    }
  },
  {
    name: "short answers continue only with active follow-up",
    run: () => {
      assert.equal(manageFarmMateConversation("yes", plantHealthTomatoState).action, "continue");
      assert.equal(manageFarmMateConversation("yes", emptyState).action, "clarify");
      assert.equal(manageFarmMateConversation("bottom leaves", emptyState).resetReason, "unclear_without_active_follow_up");
    }
  },
  {
    name: "unknown crop handoff is neutral",
    run: () => {
      const question = farmMateQuestionFromDiagnosis(unknownCropDiagnosis);
      assert.equal(question, "I uploaded a crop photo. What should I check next?");
      assert.equal(question.toLowerCase().includes("tomato"), false);
      assert.equal(question.toLowerCase().includes("blight"), false);
    }
  },
  {
    name: "cassava crop doctor handoff remains cassava",
    run: () => {
      const diagnosis = diagnosisFromFileName("cassava-leaf-photo.jpg");
      const question = farmMateQuestionFromDiagnosis(diagnosis);
      assert.equal(diagnosis.crop, "Cassava");
      assert.equal(question.includes("cassava crop photo"), true);
      assert.equal(question.toLowerCase().includes("tomato"), false);
    }
  },
  {
    name: "response builder avoids developer language and visible confidence labels",
    run: () => {
      const response = buildFarmMateResponse("My cassava leaves are curling", routeFarmMateQuestion("My cassava leaves are curling"));
      assertNoDeveloperLanguage(response);
    }
  },
  {
    name: "response builder keeps local answer concise",
    run: () => {
      const response = buildFarmMateResponse("My tomato leaves are yellow", routeFarmMateQuestion("My tomato leaves are yellow"));
      const totalLines = response.sections.reduce((count, section) => count + section.body.length, 0);
      assert.ok(totalLines <= 18);
      assert.ok(response.sections.every((section) => section.body.every((line) => line.length <= 220)));
    }
  },
  {
    name: "Ask FarmMate credits decrease after successful AI call",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const before = getFarmMateCreditStatus("ask_farmmate", [], now);
      const after = getFarmMateCreditStatus("ask_farmmate", [usageEvent("ask_farmmate", now.toISOString())], now);

      assert.equal(before.limit, 5);
      assert.equal(before.windowHours, 6);
      assert.equal(before.remaining, 5);
      assert.equal(after.remaining, 4);
    }
  },
  {
    name: "Ask FarmMate allows 5 questions within 6 hours",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const fourPreviousEvents = Array.from({ length: 4 }, (_, index) => usageEvent("ask_farmmate", new Date(now.getTime() - (index + 1) * 30 * 60_000).toISOString()));
      const fifthDecision = getFarmMateCreditDecision("ask_farmmate", fourPreviousEvents, now);

      assert.equal(fifthDecision.allowed, true);
      assert.equal(fifthDecision.limit, 5);
      assert.equal(fifthDecision.windowHours, 6);
      assert.equal(fifthDecision.remaining, 1);
    }
  },
  {
    name: "6th Ask FarmMate question is blocked",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = Array.from({ length: 5 }, (_, index) => usageEvent("ask_farmmate", new Date(now.getTime() - (index + 1) * 30 * 60_000).toISOString()));
      const decision = getFarmMateCreditDecision("ask_farmmate", events, now);

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
      assert.equal(decision.remaining, 0);
    }
  },
  {
    name: "exhausted Ask FarmMate message keeps refresh time and points to Learn",
    run: () => {
      const message = askFarmMateCreditMessage({ reason: "credits_exhausted", refreshInText: "6h 20m" });

      assert.equal(message.includes("You've used your free FarmMate AI questions for now"), true);
      assert.equal(message.includes("Your credits refresh in 6h 20m"), true);
      assert.equal(message.includes("While you wait, continue learning practical farming tips."), true);
      assert.equal(message.includes("FarmMate tools and learning tips"), false);
    }
  },
  {
    name: "exhausted Ask FarmMate state exposes Open Learn CTA",
    run: () => {
      assert.equal(FARM_MATE_EXHAUSTED_LEARN_CTA.label, "Open Learn");
      assert.equal(FARM_MATE_EXHAUSTED_LEARN_CTA.href, "/learn");
    }
  },
  {
    name: "exhausted Ask FarmMate state exposes Soil Health Challenge CTA",
    run: () => {
      assert.equal(FARM_MATE_SOIL_HEALTH_CHALLENGE_CTA.label, "Start Soil Health Challenge");
      assert.equal(FARM_MATE_SOIL_HEALTH_CHALLENGE_CTA.href, "/learn/challenges/soil-health");
    }
  },
  {
    name: "Ask FarmMate exhausted credits still prevent OpenAI call",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = Array.from({ length: 5 }, (_, index) => usageEvent("ask_farmmate", new Date(now.getTime() - (index + 1) * 30 * 60_000).toISOString()));
      const decision = getFarmMateCreditDecision("ask_farmmate", events, now);

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
    }
  },
  {
    name: "Crop Doctor credits decrease after analysis",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const after = getFarmMateCreditStatus("crop_doctor", [usageEvent("crop_doctor", now.toISOString())], now);

      assert.equal(after.limit, 2);
      assert.equal(after.windowHours, 12);
      assert.equal(after.remaining, 1);
      assert.equal(after.creditState, "available");
    }
  },
  {
    name: "fresh anonymous Crop Doctor user gets 2 checks remaining",
    run: () => {
      const status = getFarmMateCreditStatus("crop_doctor", [], new Date("2026-07-09T12:00:00.000Z"));

      assert.equal(status.remaining, 2);
      assert.equal(status.creditState, "available");
      assert.equal(farmMateCreditLine("crop_doctor", status), "Crop Doctor Credits: 2 checks remaining");
      assert.equal(shouldDisableCropDoctorUpload(status), false);
    }
  },
  {
    name: "one previous Crop Doctor event gives 1 check remaining",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus("crop_doctor", [usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString())], now);

      assert.equal(status.remaining, 1);
      assert.equal(status.creditState, "available");
      assert.equal(farmMateCreditLine("crop_doctor", status), "Crop Doctor Credits: 1 check remaining");
      assert.equal(shouldDisableCropDoctorUpload(status), false);
    }
  },
  {
    name: "two previous Crop Doctor events gives 0 checks remaining",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(status.remaining, 0);
      assert.equal(status.creditState, "exhausted");
      assert.equal(farmMateCreditLine("crop_doctor", status).startsWith("0 checks remaining"), true);
    }
  },
  {
    name: "Ask FarmMate credits refresh after 6 hours",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const oldEvent = usageEvent("ask_farmmate", new Date(now.getTime() - 6 * 60 * 60 * 1000 - 1).toISOString());
      const status = getFarmMateCreditStatus("ask_farmmate", [oldEvent], now);

      assert.equal(status.used, 0);
      assert.equal(status.remaining, 5);
      assert.equal(status.windowHours, 6);
      assert.equal(status.resetAt, null);
    }
  },
  {
    name: "Crop Doctor credits refresh after 12 hours",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const oldEvent = usageEvent("crop_doctor", new Date(now.getTime() - 12 * 60 * 60 * 1000 - 1).toISOString());
      const status = getFarmMateCreditStatus("crop_doctor", [oldEvent], now);

      assert.equal(status.used, 0);
      assert.equal(status.remaining, 2);
      assert.equal(status.windowHours, 12);
      assert.equal(status.resetAt, null);
    }
  },
  {
    name: "empty submissions do not consume credits",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = isCountableFarmMateSubmission("   ") ? [usageEvent("ask_farmmate", now.toISOString())] : [];
      const status = getFarmMateCreditStatus("ask_farmmate", events, now);

      assert.equal(isCountableFarmMateSubmission("   "), false);
      assert.equal(status.remaining, 5);
    }
  },
  {
    name: "production usage check failure blocks OpenAI",
    run: () => {
      const decision = usageTrackingUnavailableDecision("ask_farmmate", new Date("2026-07-09T12:00:00.000Z"));

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "usage_tracking_unavailable");
      assert.equal(decision.remaining, 0);
    }
  },
  {
    name: "development usage check failure may use memory fallback",
    run: () => {
      assert.equal(canUseMemoryUsageFallback("development"), true);
      assert.equal(canUseMemoryUsageFallback("test"), true);
      assert.equal(canUseMemoryUsageFallback("production"), false);
    }
  },
  {
    name: "missing usage table fail-safe decision does not crash",
    run: () => {
      assert.doesNotThrow(() => usageTrackingUnavailableDecision("crop_doctor", new Date("2026-07-09T12:00:00.000Z")));
    }
  },
  {
    name: "failed usage write does not double-charge credits",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [usageEvent("ask_farmmate", now.toISOString())];
      const beforeFailedWrite = getFarmMateCreditStatus("ask_farmmate", events, now);
      const afterFailedWrite = getFarmMateCreditStatus("ask_farmmate", events, now);

      assert.equal(beforeFailedWrite.used, 1);
      assert.equal(afterFailedWrite.used, 1);
      assert.equal(afterFailedWrite.remaining, 4);
    }
  },
  {
    name: "successful OpenAI response records one usage event",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [usageEvent("ask_farmmate", now.toISOString())];
      const status = getFarmMateCreditStatus("ask_farmmate", events, now);

      assert.equal(status.used, 1);
      assert.equal(status.remaining, 4);
    }
  },
  {
    name: "Crop Doctor rejects unsupported file type",
    run: () => {
      const result = validateCropDoctorImage({ type: "application/pdf", size: 128_000 });

      assert.equal(result.ok, false);
      assert.equal(result.reason, "unsupported_file_type");
    }
  },
  {
    name: "Crop Doctor rejects image above 5 MB",
    run: () => {
      const result = validateCropDoctorImage({ type: "image/jpeg", size: CROP_DOCTOR_MAX_IMAGE_BYTES + 1 });

      assert.equal(result.ok, false);
      assert.equal(result.reason, "file_too_large");
      assert.equal(result.message, CROP_DOCTOR_TOO_LARGE_MESSAGE);
    }
  },
  {
    name: "Crop Doctor blocks analysis when credits are exhausted",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [
        usageEvent("crop_doctor", new Date(now.getTime() - 10 * 60_000).toISOString()),
        usageEvent("crop_doctor", new Date(now.getTime() - 5 * 60_000).toISOString())
      ];
      const decision = getFarmMateCreditDecision("crop_doctor", events, now);

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
      assert.equal(decision.remaining, 0);
    }
  },
  {
    name: "exhausted Crop Doctor credits show refresh message",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [
        usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
        usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
      ];
      const decision = getFarmMateCreditDecision("crop_doctor", events, now);
      const message = cropDoctorCreditMessage(decision);

      assert.equal(message.includes("You've used your free Crop Doctor checks for now."), true);
      assert.equal(message.includes("Your credits refresh in"), true);
      assert.equal(message.includes("soon"), false);
      assert.equal(message.includes("temporarily limited"), false);
    }
  },
  {
    name: "credit refresh text never renders soon",
    run: () => {
      assert.equal(formatRefreshIn(null), "within 12 hours");
      assert.equal(farmMateCreditLine("crop_doctor", {
        tool: "crop_doctor",
        label: "analyses",
        limit: 2,
        remaining: 0,
        used: 2,
        windowHours: 12,
        resetAt: null,
        refreshInText: formatRefreshIn(null),
        isExhausted: true,
        creditState: "exhausted"
      }).includes("soon"), false);
    }
  },
  {
    name: "known Crop Doctor reset time renders compactly",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const resetAt = new Date(now.getTime() + 6 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString();
      const refreshInText = formatRefreshIn(resetAt, now);

      assert.equal(refreshInText, "6h 20m");
      assert.equal(
        farmMateCreditLine("crop_doctor", {
          tool: "crop_doctor",
          label: "analyses",
          limit: 2,
          remaining: 0,
          used: 2,
          windowHours: 12,
          resetAt,
          refreshInText,
          isExhausted: true,
          creditState: "exhausted"
        }),
        "0 checks remaining - refreshes in 6h 20m"
      );
    }
  },
  {
    name: "unknown Crop Doctor reset time renders within 12 hours",
    run: () => {
      const message = cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: formatRefreshIn(null) });

      assert.equal(message, "You've used your free Crop Doctor checks for now. Your credits refresh within 12 hours.");
      assert.equal(message.includes("soon"), false);
    }
  },
  {
    name: "exhausted Crop Doctor credits disable Analyse Crop button",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(status.remaining, 0);
      assert.equal(shouldDisableCropDoctorAnalysis(status), true);
      assert.equal(farmMateCreditLine("crop_doctor", status).startsWith("0 checks remaining"), true);
    }
  },
  {
    name: "exhausted Crop Doctor credits disable upload area",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(shouldDisableCropDoctorUpload(status), true);
      assert.equal(shouldDisableCropDoctorAnalysis(status), true);
    }
  },
  {
    name: "system failure shows temporary Crop Doctor limited message",
    run: () => {
      const decision = usageTrackingUnavailableDecision("crop_doctor", new Date("2026-07-09T12:00:00.000Z"));
      const message = cropDoctorCreditMessage(decision);

      assert.equal(message, CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE);
      assert.equal(message.includes("Your credits refresh"), false);
      assert.equal(decision.creditState, "temporarily_unavailable");
      assert.equal(farmMateCreditLine("crop_doctor", decision), "Crop Doctor Credits: temporarily unavailable");
      assert.equal(farmMateCreditLine("crop_doctor", decision).includes("0 checks"), false);
    }
  },
  {
    name: "Crop Doctor wording never says 0 of 2 checks available",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(farmMateCreditLine("crop_doctor", status).includes("0 of 2 checks available"), false);
    }
  },
  {
    name: "OpenAI is not called when Crop Doctor credits are exhausted",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const decision = getFarmMateCreditDecision(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
    }
  },
  {
    name: "Crop Doctor unavailable handoff uses neutral wording",
    run: () => {
      assert.equal(
        CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT,
        "I do not have Crop Doctor checks available right now. Can you guide me on what to check from my crop photo?"
      );
      assert.equal(CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT.toLowerCase().includes("tomato"), false);
      assert.equal(CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT.toLowerCase().includes("blight"), false);
    }
  },
  {
    name: "failed Crop Doctor OpenAI call does not consume credit",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events: FarmMateUsageEvent[] = [];
      const before = getFarmMateCreditStatus("crop_doctor", events, now);
      const afterFailedCall = getFarmMateCreditStatus("crop_doctor", events, now);

      assert.equal(before.remaining, 2);
      assert.equal(afterFailedCall.used, 0);
      assert.equal(afterFailedCall.remaining, 2);
    }
  },
  {
    name: "unknown Crop Doctor result does not mention tomato",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: null,
        cropConfidence: "low",
        possibleIssue: "Possible crop health issue",
        visibleSigns: ["yellowing on lower leaves"],
        recommendedAction: ["Check nearby plants"],
        prevention: ["Avoid overwatering"],
        nextBestAction: "Inspect five nearby plants."
      });

      assert.equal(result.crop, null);
      assert.equal(result.askFarmMatePrompt.toLowerCase().includes("tomato"), false);
    }
  },
  {
    name: "Crop Doctor handoff uses dynamic crop when known",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        crop: "Cassava",
        possibleIssue: "Mosaic disease",
        visibleSigns: ["leaf curling", "pale patches"]
      });

      assert.equal(prompt.includes("cassava photo"), true);
      assert.equal(prompt.includes("leaf curling, pale patches"), true);
      assert.equal(prompt.toLowerCase().includes("tomato"), false);
    }
  },
  {
    name: "Crop Doctor handoff uses neutral wording when crop unknown",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        crop: null,
        possibleIssue: "Possible disease",
        visibleSigns: ["brown spots"]
      });

      assert.equal(prompt, "I uploaded a crop photo. Crop Doctor could not confirm the crop. What should I check next?");
    }
  },
  {
    name: "Crop Doctor handoff routes to Crop Doctor specialist",
    run: () => {
      const handoff = buildCropDoctorHandoffContext(
        normalizeCropDoctorVisionResult({
          crop: "Tomato",
          cropConfidence: "high",
          resultType: "possible_pest",
          issueCategory: "pest",
          possibleIssue: "possible spider mites or tiny sucking pests",
          visibleSigns: ["pale speckles", "dull leaves", "no chewing damage"],
          nextBestAction: "Check the underside of affected leaves today."
        })
      );
      const route = routeFarmMateQuestion(handoff.question, handoff);

      assert.equal(route.selectedSpecialist, "crop_doctor");
      assert.notEqual(route.selectedSpecialist, "fertilizer");
      assert.equal(route.detectedCrop, "Tomato");
    }
  },
  {
    name: "Crop Doctor handoff starts fresh consultation",
    run: () => {
      const oldFertilizerState: ConversationState = {
        activeTopic: "fertilizer",
        activeCropName: "Tomato",
        activeSpecialist: "fertilizer",
        waitingForFollowUp: true,
        turns: [{ message: "Can I use compost for tomatoes?", topic: "fertilizer", cropName: "Tomato", specialist: "fertilizer" }]
      };
      const handoff = buildCropDoctorHandoffContext(
        normalizeCropDoctorVisionResult({
          crop: "Tomato",
          cropConfidence: "high",
          resultType: "possible_pest",
          issueCategory: "pest",
          possibleIssue: "possible spider mites",
          visibleSigns: ["pale speckles"],
          nextBestAction: "Check leaf undersides."
        })
      );
      const decision = manageFarmMateConversation(handoff.question, oldFertilizerState, handoff);

      assert.equal(decision.action, "reset");
      assert.equal(decision.topic, "crop_doctor");
      assert.equal(decision.resetReason, "crop_doctor_handoff");
      assert.equal(decision.specialist, "crop_doctor");
      assert.equal(decision.shouldKeepContext, false);
    }
  },
  {
    name: "Crop Doctor pest handoff asks leaf or pest follow-up",
    run: () => {
      const handoff = buildCropDoctorHandoffContext(
        normalizeCropDoctorVisionResult({
          crop: "Tomato",
          cropConfidence: "high",
          resultType: "possible_pest",
          issueCategory: "pest",
          possibleIssue: "possible spider mites or tiny sucking pests",
          visibleSigns: ["pale speckles", "dull leaves", "no chewing damage"],
          nextBestAction: "Check the underside of affected leaves today."
        })
      );
      const route = routeFarmMateQuestion(handoff.question, handoff);
      const response = buildFarmMateResponse(handoff.question, route, { cropDoctorContext: handoff });
      const followUpText = response.flow?.followUpQuestions.map((question) => `${question.question} ${(question.options ?? []).join(" ")}`).join(" ").toLowerCase() ?? "";

      assert.equal(followUpText.includes("insects") || followUpText.includes("webbing") || followUpText.includes("speckling"), true);
      assert.equal(followUpText.includes("compost"), false);
      assert.equal(followUpText.includes("tomatoes are not planted yet"), false);
      assert.notEqual(response.flow?.id, "compost-for-tomatoes");
    }
  },
  {
    name: "Crop Doctor handoff allows nutrient questions only for nutrient issue",
    run: () => {
      const pestHandoff = buildCropDoctorHandoffContext(
        normalizeCropDoctorVisionResult({
          crop: "Tomato",
          cropConfidence: "high",
          resultType: "possible_pest",
          issueCategory: "pest",
          possibleIssue: "possible spider mites",
          visibleSigns: ["pale speckles"],
          nextBestAction: "Check leaf undersides."
        })
      );
      const nutrientHandoff = buildCropDoctorHandoffContext(
        normalizeCropDoctorVisionResult({
          crop: "Tomato",
          cropConfidence: "high",
          resultType: "possible_nutrient_issue",
          issueCategory: "nutrient",
          possibleIssue: "possible nutrient stress",
          visibleSigns: ["yellowing leaves"],
          nextBestAction: "Check older and newer leaves."
        })
      );
      const pestResponse = buildFarmMateResponse(pestHandoff.question, routeFarmMateQuestion(pestHandoff.question, pestHandoff), { cropDoctorContext: pestHandoff });
      const nutrientResponse = buildFarmMateResponse(nutrientHandoff.question, routeFarmMateQuestion(nutrientHandoff.question, nutrientHandoff), { cropDoctorContext: nutrientHandoff });
      const pestQuestions = pestResponse.flow?.followUpQuestions.map((question) => question.question).join(" ").toLowerCase() ?? "";
      const nutrientQuestions = nutrientResponse.flow?.followUpQuestions.map((question) => question.question).join(" ").toLowerCase() ?? "";

      assert.equal(pestQuestions.includes("soil moisture"), false);
      assert.equal(nutrientQuestions.includes("soil moisture") || nutrientQuestions.includes("leaf colour"), true);
    }
  },
  {
    name: "Crop Doctor handoff removes duplicate possible wording",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Tomato",
        cropConfidence: "high",
        resultType: "possible_pest",
        issueCategory: "pest",
        possibleIssue: "possible possible spider mites",
        visibleSigns: ["pale speckles"],
        nextBestAction: "Check leaf undersides."
      });

      assert.equal(result.possibleIssue, "possible spider mites");
      assert.equal(result.askFarmMatePrompt.includes("possible possible"), false);
      assert.equal(normalizePossibleIssueWording("possible possible spider mites"), "possible spider mites");
    }
  },
  {
    name: "no clear Crop Doctor problem does not use Possible issue heading",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "no_clear_problem",
        possibleIssue: "No clear disease problem visible",
        mainFinding: "No clear crop health problem is visible from this photo.",
        visibleSigns: ["mostly normal rough skin"],
        recommendedAction: ["Check a few roots for rot."],
        prevention: ["Keep roots shaded."],
        nextBestAction: "Separate any soft roots."
      });

      assert.equal(cropDoctorResultHeading(result), "No clear problem visible");
      assert.notEqual(cropDoctorResultHeading(result), "Possible issue");
    }
  },
  {
    name: "harvest Crop Doctor result renders harvest or storage heading",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "harvest_or_storage_check",
        possibleIssue: "Harvest or storage check",
        mainFinding: "The image shows harvested cassava roots with mostly normal rough skin.",
        visibleSigns: ["harvested roots", "rough outer skin"],
        recommendedAction: ["Cut open 3 to 5 roots."],
        prevention: ["Keep good roots shaded."],
        nextBestAction: "Separate roots that are soft, rotten, or smell bad."
      });

      assert.equal(cropDoctorResultHeading(result), "Harvest or storage check");
    }
  },
  {
    name: "cassava root Crop Doctor result is concise",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "harvest_or_storage_check",
        possibleIssue: "Harvest or storage check",
        mainFinding: "No clear crop health problem is visible from this photo. The image shows harvested cassava roots with mostly normal rough skin.",
        visibleSigns: ["harvested roots", "mostly normal rough skin", "no clear rot visible", "extra sign should be trimmed"],
        recommendedAction: [
          "Cut open 3 to 5 roots.",
          "Check for brown streaks, bad smell, soft tissue, or mould.",
          "Keep good roots shaded and use or sell them soon.",
          "Extra action should be trimmed."
        ],
        prevention: ["Avoid leaving harvested roots in direct sun.", "Keep roots dry and shaded.", "Sort damaged roots early.", "Extra tip should be trimmed."],
        nextBestAction: "Separate any roots that are soft, rotten, or smell bad."
      });

      assert.equal(result.resultType, "harvest_or_storage_check");
      assert.ok(result.mainFinding.length <= 150);
      assert.deepEqual(result.recommendedAction, [
        "Cut open 3 to 5 roots.",
        "Check for brown streaks, bad smell, soft tissue, or mould.",
        "Keep good roots shaded and use or sell them soon."
      ]);
      assert.equal(result.nextBestAction, "Separate any roots that are soft, rotten, or smell bad.");
    }
  },
  {
    name: "Crop Doctor result limits visible signs actions and prevention to 3",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Pepper",
        visibleSigns: ["one", "two", "three", "four"],
        recommendedAction: ["one", "two", "three", "four"],
        prevention: ["one", "two", "three", "four"]
      });

      assert.equal(result.visibleSigns.length, 3);
      assert.equal(result.recommendedAction.length, 3);
      assert.equal(result.prevention.length, 3);
    }
  },
  {
    name: "Crop Doctor no clear known crop handoff is dynamic",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "harvest_or_storage_check",
        possibleIssue: "Harvest or storage check",
        mainFinding: "The photo shows harvested cassava roots.",
        visibleSigns: ["harvested roots"],
        recommendedAction: ["Check roots for rot."],
        nextBestAction: "Separate any roots that are soft, rotten, or smell bad."
      });

      assert.equal(
        result.askFarmMatePrompt,
        "I uploaded a cassava photo. Crop Doctor did not see a clear disease problem, but recommended checking the roots for rot or bad smell. What should I do next?"
      );
    }
  },
  {
    name: "Crop Doctor vision prompt discourages forced diagnosis",
    run: () => {
      const prompt = cropDoctorVisionSystemPrompt();

      assert.equal(prompt.includes("harvest_or_storage_check"), true);
      assert.equal(prompt.includes("do not force a disease diagnosis"), true);
      assert.equal(prompt.includes("Do not invent pesticide dosage"), true);
    }
  },
  {
    name: "Crop Doctor main heading uses finding not Crop detected",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "high",
        resultType: "possible_disease",
        issueCategory: "disease",
        possibleIssue: "Possible maize rust",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange brown spots on leaves"],
        recommendedAction: ["Check both sides of 10 nearby maize leaves."],
        nextBestAction: "Inspect nearby plants today to see if the spots are spreading."
      });

      assert.equal(cropDoctorResultHeadline(result), "Possible maize rust symptoms");
      assert.notEqual(cropDoctorResultHeadline(result), "Crop detected: Maize");
      assert.equal(result.crop, "Maize");
    }
  },
  {
    name: "Crop Doctor crop detected appears as metadata",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange spots"]
      });

      const metadata = result.crop ? `Crop detected: ${result.crop}` : "Crop not confirmed";
      assert.equal(metadata, "Crop detected: Maize");
      assert.equal(cropDoctorResultHeadline(result).includes("Crop detected"), false);
    }
  },
  {
    name: "Crop Doctor badge wording replaces Needs checking",
    run: () => {
      const medium = normalizeCropDoctorVisionResult({
        crop: "Pepper",
        cropConfidence: "medium",
        resultType: "possible_pest",
        confidence: "medium",
        mainFinding: "Possible pest damage",
        visibleSigns: ["holes in leaves"]
      });
      const unclear = normalizeCropDoctorVisionResult({
        crop: null,
        resultType: "photo_unclear",
        confidence: "low",
        mainFinding: "Photo not clear enough",
        visibleSigns: ["blurred image"]
      });

      assert.equal(cropDoctorResultBadge(medium), "Needs field check");
      assert.equal(cropDoctorResultBadge(unclear), "Photo unclear");
      assert.notEqual(cropDoctorResultBadge(medium), "Needs checking");
    }
  },
  {
    name: "Crop Doctor prompt blocks filename diagnosis evidence",
    run: () => {
      const prompt = cropDoctorVisionSystemPrompt();

      assert.equal(prompt.includes("Do not use the filename to identify the crop or issue."), true);
      assert.equal(prompt.includes("Use only what is visible in the image."), true);
    }
  },
  {
    name: "maize rust Crop Doctor result remains cautious",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "high",
        resultType: "possible_disease",
        issueCategory: "disease",
        confidence: "medium",
        possibleIssue: "Possible maize rust",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange or brown spots", "leaf spots"],
        recommendedAction: [
          "Check both sides of 10 nearby maize leaves.",
          "Look for orange or brown powder that rubs off.",
          "If many plants are affected, contact an extension officer before using fungicide."
        ],
        nextBestAction: "Inspect nearby plants today to see if the spots are spreading."
      });

      assert.equal(cropDoctorResultHeadline(result), "Possible maize rust symptoms");
      assert.deepEqual(result.recommendedAction, [
        "Check both sides of 10 nearby maize leaves.",
        "Look for orange or brown powder that rubs off.",
        "If many plants are affected, contact an extension officer before using fungicide."
      ]);
      assert.equal(result.nextBestAction, "Inspect nearby plants today to see if the spots are spreading.");
      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Crop Doctor response strips pesticide dosage language",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "high",
        resultType: "possible_disease",
        issueCategory: "disease",
        mainFinding: "Possible maize rust symptoms",
        recommendedAction: ["Spray 10ml per litre on the crop."],
        nextBestAction: "Check nearby plants before treatment."
      });

      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
      assert.equal(result.recommendedAction[0].includes("10ml per litre"), false);
      assert.equal(result.recommendedAction[0].includes("product label guidance"), true);
    }
  },
  {
    name: "Crop Doctor response does not expose developer language",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "medium",
        possibleIssue: "Tell the farmer to check nutrient stress",
        visibleSigns: ["yellow leaves"],
        recommendedAction: ["Tell the farmer to check older leaves"],
        prevention: ["Keep records"],
        nextBestAction: "Tell the farmer to inspect nearby plants."
      });

      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Crop Doctor response does not claim guaranteed diagnosis",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Tomato",
        cropConfidence: "high",
        possibleIssue: "This is definitely early blight",
        confidence: "high",
        visibleSigns: ["leaf spots"],
        recommendedAction: ["Remove affected leaves"],
        prevention: ["Improve airflow"],
        nextBestAction: "Inspect five nearby plants."
      });

      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
      assert.equal(result.possibleIssue.toLowerCase().includes("definitely"), false);
    }
  },
  {
    name: "Ask FarmMate internal structured cards are hidden while AI is preparing",
    run: () => {
      const shouldRender = shouldRenderLocalFarmMateGuidance({
        isGeneratingNaturalAnswer: true,
        naturalAnswer: "",
        aiFallbackMessage: "",
        localCards: [
          { title: "Here's what I understand", body: ["Crop: Maize"] },
          { title: "What I think", body: ["Possible nutrient stress."] },
          { title: "What to do now", body: ["Wait for moisture."] },
          { title: "Next step", body: ["Check the soil today."] }
        ]
      });

      assert.equal(shouldRender, false);
    }
  },
  {
    name: "Ask FarmMate filler phrases are never rendered in final answer",
    run: () => {
      const cleaned = cleanFarmMateFinalAnswer(
        "I can help.\n\nI will keep it short and focused. Based on what you told me, wait for soil moisture.\n\nHere is the practical next step. Next step: Check the soil today."
      );

      assert.equal(cleaned.includes("I will keep it short and focused"), false);
      assert.equal(cleaned.includes("I can help."), false);
      assert.equal(cleaned.includes("Here is the practical next step"), false);
      assert.equal(cleaned.includes("Next step: Check the soil today."), true);
    }
  },
  {
    name: "Ask FarmMate completed follow-up answers collapse into compact summary",
    run: () => {
      const summary = compactFollowUpSummary([
        { answer: "Maize is already flowering" },
        { answer: "Soil is dry" },
        { answer: "No fertilizer has been applied yet" }
      ]);

      assert.equal(summary, "Maize is already flowering · Soil is dry · No fertilizer has been applied yet");
    }
  },
  {
    name: "Ask FarmMate local structured response only appears during fallback or local-only response",
    run: () => {
      const localCards = [{ title: "What I think", body: ["Use local guidance."] }];

      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "Based on what you told me, wait for moisture.",
          aiFallbackMessage: "",
          localCards
        }),
        false
      );
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: "FarmMate AI is temporarily limited, but you can still use the local guidance.",
          localCards
        }),
        true
      );
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: "",
          localCards,
          isLocalOnlyResponse: true
        }),
        true
      );
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: "",
          localCards
        }),
        false
      );
    }
  },
  {
    name: "Ask FarmMate final AI response displays cleanly",
    run: () => {
      const finalAnswer = cleanFarmMateFinalAnswer(
        "Based on what you told me, your maize is already flowering, the soil is dry, and no fertilizer has been applied yet.\n\nNext step: Wait until the soil has moisture before applying fertilizer."
      );

      assert.equal(finalAnswer.startsWith("Based on what you told me"), true);
      assert.equal(finalAnswer.includes("What I think"), false);
      assert.equal(finalAnswer.includes("Here's what I understand"), false);
    }
  },
  {
    name: "Ask FarmMate fallback still works when OpenAI fails",
    run: () => {
      const message = farmMateFallbackMessage();

      assert.equal(message, "FarmMate AI is temporarily limited, but you can still use the local guidance.");
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: message,
          localCards: [{ title: "Next step", body: ["Check the soil today."] }]
        }),
        true
      );
    }
  }
];

let failures = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} FarmMate regression tests passed.`);
}
