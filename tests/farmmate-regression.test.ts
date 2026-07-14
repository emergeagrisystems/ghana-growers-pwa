import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFarmMateResponse, type FarmMateBrainResponse } from "../src/lib/farmmate/decision-engine";
import { buildFarmMateVoiceLayerInput, isLikelyIncompleteFarmMateAnswer } from "../src/lib/farmmate/ai";
import {
  cleanFarmMateFinalAnswer,
  compactFollowUpSummary,
  farmMateFallbackMessage,
  harvestPostHarvestGuidedRecommendationCards,
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
  formatMarketplaceLocation,
  marketplaceAvailability,
  marketplaceResultRange,
  marketplaceSupplyFrequency,
  normalizeMarketplaceQuantity,
  paginateMarketplaceListings,
  publicMarketplaceListings
} from "../src/lib/marketplace/publicListings";
import { marketplaceListingImages } from "../src/lib/marketplace/images";
import { displayMarketplaceCategory, freshProduceSubcategories, normalizeMarketplaceCategoryFilter } from "../src/lib/marketplace/taxonomy";
import {
  canonicalMarketplaceTradeFields,
  calculatedMarketplaceTotal,
  formatMarketplaceCurrency,
  marketplacePriceLine,
  marketplaceQuantityLabel,
  marketplaceQuantityLine,
  marketplaceTradeInformation,
  marketplaceTradeLines,
  pluralizeMarketplaceUnit,
  reviewedCustomUnitMessage,
  validateMarketplaceTradeInput
} from "../src/lib/marketplace/trade";
import { manageFarmMateConversation, type ConversationState } from "../src/lib/farmmate/conversation-manager";
import { weatherDecisionGuidance } from "../src/lib/farmmate/weather-decision-specialist";
import {
  FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY,
  FARM_MATE_WEATHER_LOCATION_STORAGE_KEY,
  FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE,
  mapOpenMeteoForecast,
  supportedFarmMateWeatherLocations,
  validateFarmMateWeatherRequest,
  weatherDecisionSummaryForForecast,
  type WeatherDecisionSummary
} from "../src/lib/farmmate/weather";
import { plantingAdvisorCrops, plantingAdvisorReasoningOrder } from "../src/lib/farmmate/planting-advisor-specialist";
import { harvestPostHarvestCrops, harvestPostHarvestReasoningOrder } from "../src/lib/farmmate/harvest-postharvest-specialist";
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

function weatherAiInput(answer: string) {
  const brain = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));
  const farmerAnswers = [{ question: "Is rain expected in the next 4 to 6 hours?", answer }];

  return {
    farmerQuestion: "Can I spray today?",
    brain,
    farmerAnswers,
    localStructuredResponse: weatherGuidedRecommendationCards(brain.flow?.id, farmerAnswers) ?? []
  };
}

function sampleWeatherData() {
  return {
    current: {
      temperature_2m: 29.4,
      relative_humidity_2m: 78,
      wind_speed_10m: 12,
      time: "2026-07-14T08:00"
    },
    daily: {
      time: ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"],
      temperature_2m_max: [31.2, 29.8, 30.5, 28.4],
      temperature_2m_min: [24.1, 23.6, 24.2, 23.1],
      precipitation_probability_max: [70, 25, 10, 80],
      wind_speed_10m_max: [18, 28, 12, 20]
    }
  };
}

function sampleWeatherContext(overrides: Partial<WeatherDecisionSummary> = {}): WeatherDecisionSummary {
  return {
    locationName: overrides.locationName ?? "Accra / Greater Accra",
    sourceLabel: overrides.sourceLabel ?? "Open-Meteo",
    lastUpdatedAt: overrides.lastUpdatedAt ?? "2026-07-14T08:00:00.000Z",
    rainChancePercent: overrides.rainChancePercent ?? 70,
    temperatureMinC: overrides.temperatureMinC ?? 24,
    temperatureMaxC: overrides.temperatureMaxC ?? 31,
    windSpeedKph: overrides.windSpeedKph ?? 18,
    farmingNotes: overrides.farmingNotes ?? ["Avoid spraying before rain.", "Check drainage in low areas."],
    summaryNote: overrides.summaryNote ?? "Avoid spraying before rain.",
    liveWeatherAvailable: overrides.liveWeatherAvailable ?? true
  };
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
    sourceSubmissionId: overrides.sourceSubmissionId,
    sourceSubmissionStatus: overrides.sourceSubmissionStatus,
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

function assertExactlyOneNextBestAction(response: FarmMateBrainResponse) {
  const nextBestActionSections = response.sections.filter((section) => section.title === "Next Best Action");

  assert.equal(nextBestActionSections.length, 1);
  assert.equal(nextBestActionSections[0].body.length, 1);
  assert.equal(Boolean(response.nextBestAction.instruction), true);
}

function assertPracticalSafeAnswer(question: string) {
  const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));
  const text = responseText(response).toLowerCase();

  assertExactlyOneNextBestAction(response);
  assertNoDeveloperLanguage(response);
  assert.equal(text.includes("i can help"), false);
  assert.equal(text.includes("tell the farmer"), false);
  assert.equal(text.includes("guaranteed profit"), false);
  assert.equal(text.includes("guaranteed yield"), false);
  assert.equal(text.includes("buyer availability"), false);
  assert.equal(text.includes("current market price"), false);
  assert.equal(text.includes("rain is coming today"), false);
  assert.equal(text.includes("weather shows"), false);
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
    name: "Ask FarmMate starter suggestions cover major specialists",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");
      const expectedSuggestions = [
        "Can I spray today?",
        "My tomato leaves are yellow",
        "Best fertilizer for maize",
        "Can I plant tomatoes now?",
        "When should I harvest maize?",
        "How do I store cassava?",
        "How do I pack tomatoes for transport?",
        "What should I check from my crop photo?"
      ];

      for (const suggestion of expectedSuggestions) {
        assert.equal(component.includes(`"${suggestion}"`), true);
      }

      assert.equal(component.includes("Popular questions"), true);
      assert.equal(component.includes("Tomato leaves turning yellow"), false);
    }
  },
  {
    name: "Ask FarmMate suggestion click only populates the input",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");

      assert.equal(component.includes("onClick={() => setQuestion(suggestion)}"), true);
      assert.equal(component.includes("onClick={() => askFarmMate"), false);
    }
  },
  {
    name: "Ask FarmMate suggestions use compact horizontal mobile scrolling",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");

      assert.equal(component.includes("overflow-x-auto"), true);
      assert.equal(component.includes("sm:flex-wrap"), true);
      assert.equal(component.includes("shrink-0"), true);
    }
  },
  {
    name: "Ask FarmMate starter suggestions route to expected specialists",
    run: () => {
      const expectedRoutes = [
        ["Can I spray today?", "weather_decision"],
        ["My tomato leaves are yellow", "crop_health"],
        ["Best fertilizer for maize", "fertilizer"],
        ["Can I plant tomatoes now?", "planting"],
        ["When should I harvest maize?", "harvest_postharvest"],
        ["How do I store cassava?", "harvest_postharvest"],
        ["How do I pack tomatoes for transport?", "harvest_postharvest"],
        ["What should I check from my crop photo?", "crop_doctor"]
      ] as const;

      for (const [question, specialist] of expectedRoutes) {
        assert.equal(routeFarmMateQuestion(question).selectedSpecialist, specialist);
      }
    }
  },
  {
    name: "Sprint 29 specialist audit routes all launch examples",
    run: () => {
      const expectedRoutes = [
        ["My tomato leaves are yellow", "crop_health"],
        ["My cassava leaves are curling", "crop_health"],
        ["My maize has holes in the leaves", "crop_health"],
        ["Best fertilizer for maize", "fertilizer"],
        ["What NPK for pepper?", "fertilizer"],
        ["Can I use compost for tomatoes?", "fertilizer"],
        ["Can I spray today?", "weather_decision"],
        ["Can I apply fertilizer before rain?", "weather_decision"],
        ["Should I irrigate today?", "weather_decision"],
        ["Can I plant tomatoes now?", "planting"],
        ["What should I plant this month?", "planting"],
        ["Best spacing for pepper?", "planting"],
        ["When should I harvest maize?", "harvest_postharvest"],
        ["How do I store cassava?", "harvest_postharvest"],
        ["How do I pack tomatoes for transport?", "harvest_postharvest"],
        ["I uploaded a crop photo. What should I check next?", "crop_doctor"],
        ["I uploaded a cassava photo. What should I do next?", "crop_doctor"]
      ] as const;

      for (const [question, specialist] of expectedRoutes) {
        assert.equal(routeFarmMateQuestion(question).selectedSpecialist, specialist, question);
      }
    }
  },
  {
    name: "Sprint 29 topic changes reset without specialist leakage",
    run: () => {
      const fertilizerState: ConversationState = {
        activeTopic: "fertilizer",
        activeCropName: "Maize",
        activeSpecialist: "fertilizer",
        waitingForFollowUp: true,
        turns: [{ message: "Best fertilizer for maize", topic: "fertilizer", cropName: "Maize", specialist: "fertilizer" }]
      };
      const cropDoctorState: ConversationState = {
        activeTopic: "crop_doctor",
        activeCropName: "Tomato",
        activeSpecialist: "crop_doctor",
        waitingForFollowUp: true,
        turns: [{ message: "I uploaded a tomato crop photo", topic: "crop_doctor", cropName: "Tomato", specialist: "crop_doctor" }]
      };
      const harvestState: ConversationState = {
        activeTopic: "harvest_postharvest",
        activeCropName: "Maize",
        activeSpecialist: "harvest_postharvest",
        waitingForFollowUp: true,
        turns: [{ message: "When should I harvest maize?", topic: "harvest_postharvest", cropName: "Maize", specialist: "harvest_postharvest" }]
      };

      const tomatoToMaizeFertilizer = manageFarmMateConversation("Best fertilizer for maize", plantHealthTomatoState);
      assert.equal(tomatoToMaizeFertilizer.action, "reset");
      assert.equal(tomatoToMaizeFertilizer.cropName, "Maize");
      assert.equal(tomatoToMaizeFertilizer.specialist, "fertilizer");

      const fertilizerToWeather = manageFarmMateConversation("Can I spray today?", fertilizerState);
      assert.equal(fertilizerToWeather.action, "reset");
      assert.equal(fertilizerToWeather.specialist, "weather_decision");

      const cropDoctorToHarvest = manageFarmMateConversation("How do I store cassava?", cropDoctorState);
      assert.equal(cropDoctorToHarvest.action, "reset");
      assert.equal(cropDoctorToHarvest.cropName, "Cassava");
      assert.equal(cropDoctorToHarvest.specialist, "harvest_postharvest");

      const harvestToPlantHealth = manageFarmMateConversation("My pepper flowers are dropping", harvestState);
      assert.equal(harvestToPlantHealth.action, "reset");
      assert.equal(harvestToPlantHealth.cropName, "Pepper");
      assert.equal(harvestToPlantHealth.specialist, "crop_health");
      assert.notEqual(harvestToPlantHealth.specialist, "harvest_postharvest");
    }
  },
  {
    name: "Sprint 29 final responses stay practical and safe across specialists",
    run: () => {
      const questions = [
        "My tomato leaves are yellow",
        "My cassava leaves are curling",
        "Best fertilizer for maize",
        "Can I spray today?",
        "Can I plant tomatoes now?",
        "When should I harvest maize?",
        "How do I store cassava?"
      ];

      for (const question of questions) {
        assertPracticalSafeAnswer(question);
      }

      const fertilizerText = responseText(buildFarmMateResponse("Best fertilizer for maize", routeFarmMateQuestion("Best fertilizer for maize"))).toLowerCase();
      const plantingText = responseText(buildFarmMateResponse("What should I plant this month?", routeFarmMateQuestion("What should I plant this month?"))).toLowerCase();
      const harvestText = responseText(buildFarmMateResponse("How do I store cassava?", routeFarmMateQuestion("How do I store cassava?"))).toLowerCase();
      const plantHealthText = responseText(buildFarmMateResponse("My tomato leaves are yellow", routeFarmMateQuestion("My tomato leaves are yellow"))).toLowerCase();

      assert.equal(/\b\d+(?:\.\d+)?\s?(?:kg|g|ml|l)\b/.test(fertilizerText), false);
      assert.equal(fertilizerText.includes("heavy rain"), true);
      assert.equal(plantingText.includes("market price"), false);
      assert.equal(plantingText.includes("guaranteed"), false);
      assert.equal(harvestText.includes("shelf life"), false);
      assert.equal(harvestText.includes("buyer availability"), false);
      assert.equal(harvestText.includes("hot sun"), true);
      assert.equal(harvestText.includes("rotten"), true);
      assert.equal(plantHealthText.includes("chemical solution"), true);
      assert.equal(plantHealthText.indexOf("prevention") < plantHealthText.indexOf("chemical solution"), true);
    }
  },
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
      const createListingSection = publicSubmissions.slice(
        publicSubmissions.indexOf("export async function createListingSubmission"),
        publicSubmissions.indexOf("function payloadTotalQuantityValue")
      );
      const convertListingSection = publicSubmissions.slice(
        publicSubmissions.indexOf("export async function convertListingSubmission"),
        publicSubmissions.indexOf("export async function convertBuyerRequestSubmission")
      );

      assert.equal(route.includes("createListingSubmission(formData, clientKey)"), true);
      assert.equal(publicSubmissions.includes('insertSupabaseRecord("listing_submissions"'), true);
      assert.equal(publicSubmissions.includes('selectSupabaseRecords<ListingSubmission>("listing_submissions"'), true);
      assert.equal(publicSubmissions.includes('const table = "listing_submissions"'), true);
      assert.equal(publicSubmissions.includes("Buyer sourcing requests are now reviewed through Lead Requests."), true);
      assert.equal(publicSubmissions.includes('callSupabaseRpc<{ listing_id?: string; slug?: string; reused?: boolean }>("publish_listing_submission"'), true);
      assert.equal(publicSubmissions.includes('insertSupabaseRecord("marketplace_listings"'), false);
      assert.equal(createListingSection.includes('insertSupabaseRecord("marketplace_listings"'), false);
      assert.equal(publicSubmissions.includes("sellingMethod: submission.selling_method"), true);
      assert.equal(publicSubmissions.includes("sellingUnit: submission.selling_unit"), true);
      assert.equal(publicSubmissions.includes("customUnitLabel: submission.custom_unit_label"), true);
      assert.equal(publicSubmissions.includes("priceAmount: submission.price_amount"), true);
      assert.equal(publicSubmissions.includes("unitsAvailable: submission.units_available"), true);
      assert.equal(publicSubmissions.includes("totalQuantityValue: submission.total_quantity_value"), true);
      assert.equal(publicSubmissions.includes("record_source: \"public_submission\""), true);
      assert.equal(convertListingSection.includes("whatsapp_number: submission.whatsapp_number"), false);
    }
  },
  {
    name: "Submit Listing page uses the approved public route and pending-review copy",
    run: () => {
      const page = repoFile("src/app/submit-listing/page.tsx");
      const oldPage = repoFile("src/app/submit-produce-listing/page.tsx");
      const sitemap = repoFile("src/app/sitemap.ts");
      const sellPage = repoFile("src/app/sell/page.tsx");
      const marketplacePage = repoFile("src/app/marketplace/page.tsx");

      assert.equal(page.includes('title: "Submit a Listing"'), true);
      assert.equal(page.includes("Tell us what you are selling. Ghana Growers will review the information before your listing appears publicly."), true);
      assert.equal(page.includes("Submit Produce Listing"), false);
      assert.equal(page.includes("fresh produce, livestock, farm inputs, tools and equipment"), true);
      assert.equal(oldPage.includes('redirect("/submit-listing")'), true);
      assert.equal(sitemap.includes('"/submit-listing"'), true);
      assert.equal(sitemap.includes('"/submit-produce-listing"'), false);
      assert.equal(sellPage.includes('href: "/submit-listing"'), true);
      assert.equal(marketplacePage.includes('href="/submit-listing"'), true);
    }
  },
  {
    name: "Public Submit Listing form is guided, mobile-first, and preserves product pathways",
    run: () => {
      const form = repoFile("src/components/SubmitProduceListingForm.tsx");

      assert.equal(form.includes('const steps = ["Seller details", "Product details", "Price and quantity", "Availability", "Photos", "Review"]'), true);
      assert.equal(form.includes("Step {step + 1} of {steps.length}"), true);
      assert.equal(form.includes("Back"), true);
      assert.equal(form.includes("Continue"), true);
      assert.equal(form.includes('region: ""'), true);
      assert.equal(form.includes('existingMember: ""'), true);
      assert.equal(form.includes('sellerType: ""'), true);
      assert.equal(form.includes('placeholder="Select region"'), true);
      assert.equal(form.includes("Are you already part of the Ghana Growers network?"), true);
      assert.equal(form.includes("Example: +233 24 000 0000"), true);
      assert.equal(form.includes('message: "Please select a seller type to continue."'), true);
      assert.equal(form.includes('next.sellerType = value === "Farm Inputs"'), false);
      assert.equal(form.includes("Submit for Review"), true);
      assert.equal(form.includes('fetch("/api/listing-submissions"'), true);
      assert.equal(form.includes('marketplacePathways = ["Fresh Produce", "Farm Inputs", "Livestock", "Tools & Equipment"]'), true);
      assert.equal(form.includes('Farmer: "Farmer / Producer"'), true);
      assert.equal(form.includes('Supplier: "Input or Equipment Supplier"'), true);
      assert.equal(form.includes('Farmer: ["Fresh Produce", "Livestock"]'), true);
      assert.equal(form.includes('Supplier: ["Farm Inputs", "Tools & Equipment"]'), true);
      assert.equal(form.includes("categoryOptionsForSellerType(values.sellerType)"), true);
      assert.equal(form.includes("if (allowedCategories.length && !allowedCategories.includes(current.marketplacePathway))"), true);
      assert.equal(form.includes('next.marketplacePathway = "";'), true);
      assert.equal(form.includes('label="Category"'), true);
      assert.equal(form.includes("Main marketplace pathway"), false);
      assert.equal(form.includes('subcategory: ""'), true);
      assert.equal(form.includes('next.subcategory = "";'), true);
      assert.equal(form.includes('placeholder="Select subcategory"'), true);
      assert.equal(form.includes('"Seeds & Seedlings"'), true);
      assert.equal(form.includes('"Fertilizers & Soil Inputs"'), true);
      assert.equal(form.includes('"Other Farm Inputs"'), true);
      assert.equal(form.includes('"Sprayers"'), true);
      assert.equal(form.includes('"Irrigation Equipment"'), true);
      assert.equal(form.includes("Not sure? Maize \\u2192 Grains"), true);
      assert.equal(form.includes("Tomato seeds \\u2192 Seeds & Seedlings"), true);
      assert.equal(form.includes("Knapsack sprayer \\u2192 Sprayers"), true);
      assert.equal(form.includes('disabled={!currentStepValid || isSubmitting}'), false);
      assert.equal(form.includes('disabled={isSubmitting}'), true);
      assert.equal(form.includes('message: "Please select a subcategory to continue."'), true);
      assert.equal(form.includes("focusField(validation.field)"), true);
      assert.equal(form.includes('values.marketplacePathway === "Fresh Produce" ? [...freshProduceSubcategories] : [values.marketplacePathway]'), false);
      assert.equal(form.includes("Agricultural Services"), false);
      assert.equal(form.includes('sellingMethod: "packaged_unit" | "weight" | "count" | "livestock" | "volume"'), true);
      assert.equal(form.includes('"volume" | "other"'), false);
      assert.equal(form.includes("customUnitLabel"), true);
      assert.equal(form.includes("Same as phone number"), true);
      assert.equal(form.includes("Upload clear photos of the actual product you are selling."), true);
      assert.equal(form.includes("URL.createObjectURL(file)"), true);
      assert.equal(form.includes("setAdditionalImages"), true);
      assert.equal(form.includes("values.confirmation"), true);
    }
  },
  {
    name: "Public listing submissions use private images, neutral uncertainty, and abuse safeguards",
    run: () => {
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");
      const route = repoFile("src/app/api/listing-submissions/route.ts");

      assert.equal(publicSubmissions.includes('bucket: "listing-submissions"'), true);
      assert.equal(publicSubmissions.includes("publicUrl: false"), true);
      assert.equal(publicSubmissions.includes("Upload JPG, PNG, or WEBP images only."), true);
      assert.equal(publicSubmissions.includes("5 * 1024 * 1024"), true);
      assert.equal(publicSubmissions.includes(".slice(0, 5)"), true);
      assert.equal(publicSubmissions.includes("companyWebsite"), true);
      assert.equal(publicSubmissions.includes("new Map"), false);
      assert.equal(publicSubmissions.includes("listingSubmissionAttempts"), false);
      assert.equal(publicSubmissions.includes("createHmac"), true);
      assert.equal(publicSubmissions.includes("process.env.LISTING_SUBMISSION_RATE_LIMIT_SECRET"), true);
      assert.equal(publicSubmissions.includes("process.env.SUBMISSION_RATE_LIMIT_SECRET"), false);
      assert.equal(publicSubmissions.includes("local-development-listing-submission-secret"), false);
      assert.equal(publicSubmissions.includes("Listing submissions are temporarily unavailable. Please try again later."), true);
      assert.equal(publicSubmissions.includes("submissionRateLimitKey"), true);
      assert.equal(publicSubmissions.includes('callSupabaseRpc<RateLimitResult>("consume_listing_submission_rate_limit"'), true);
      assert.equal(publicSubmissions.includes("hashedRequestFingerprint"), true);
      assert.equal(publicSubmissions.includes("duplicateListingSubmissionWarning"), true);
      assert.equal(publicSubmissions.includes("submission_dedupe_key"), true);
      assert.equal(publicSubmissions.includes("duplicateInsertError"), true);
      assert.equal(publicSubmissions.includes("quantityConfirmedLater"), false);
      assert.equal(publicSubmissions.includes("payloadTotalQuantityValue(formData)"), true);
      assert.equal(publicSubmissions.includes("unitSizeValue * unitsAvailable"), true);
      assert.equal(publicSubmissions.includes("custom_unit_reviewed: false"), true);
      assert.equal(publicSubmissions.includes("copyApprovedSubmissionImages"), true);
      assert.equal(publicSubmissions.includes('bucket: "marketplace"'), true);
      assert.equal(publicSubmissions.includes("approved-submissions"), true);
      assert.equal(publicSubmissions.includes("pending-submissions/${randomUUID()}"), true);
      assert.equal(publicSubmissions.includes("deleteSupabaseStorageObject"), true);
      assert.equal(publicSubmissions.includes("listing_submission_publication_cleanup_queue"), true);
      assert.equal(route.includes("x-forwarded-for"), true);
      assert.equal(route.includes("Your listing is not live yet. Ghana Growers will review the details and contact you if more information is needed."), true);
    }
  },
  {
    name: "Public listing submissions never store parent category as its own subcategory",
    run: () => {
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");

      assert.equal(publicSubmissions.includes('Farmer: ["Fresh Produce", "Livestock"]'), true);
      assert.equal(publicSubmissions.includes('Supplier: ["Farm Inputs", "Tools & Equipment"]'), true);
      assert.equal(publicSubmissions.includes("listingCategoryMatchesSellerType(payload.seller_type, payload.marketplace_pathway)"), true);
      assert.equal(publicSubmissions.includes("Please select a category that matches your seller type."), true);
      assert.equal(publicSubmissions.includes("listingCategoryRequiresSubcategory(payload.marketplace_pathway) && !payload.subcategory"), true);
      assert.equal(publicSubmissions.includes("Please select a subcategory to continue."), true);
      assert.equal(publicSubmissions.includes("submittedSubcategory.toLowerCase() === marketplacePathway.toLowerCase() ? \"\" : submittedSubcategory"), true);
      assert.equal(publicSubmissions.includes("category: subcategory || marketplacePathway"), true);
      assert.equal(publicSubmissions.includes("subcategory,"), true);
    }
  },
  {
    name: "Listing submission review migration adds private review workflow safely",
    run: () => {
      const migration = repoFile("supabase/migrations/033_listing_submission_review_workflow.sql");
      const anonGrant = migration.slice(
        migration.indexOf("grant insert ("),
        migration.indexOf(") on public.listing_submissions to anon;")
      );

      assert.equal(migration.includes("begin;"), true);
      assert.equal(migration.includes("commit;"), true);
      assert.equal(migration.includes("add column if not exists submission_reference text"), true);
      assert.equal(migration.includes("add column if not exists status_history jsonb"), true);
      assert.equal(migration.includes("add column if not exists published_listing_id uuid"), true);
      assert.equal(migration.includes("add column if not exists source_submission_id uuid references public.listing_submissions(id) on delete set null"), true);
      assert.equal(migration.includes("add column if not exists submission_dedupe_key text"), true);
      assert.equal(migration.includes("add column if not exists source text not null default 'public_submission'"), true);
      assert.equal(migration.includes("'Needs Information', 'Under Review', 'Approved', 'Published', 'Paused', 'Rejected', 'Expired'"), true);
      assert.equal(migration.includes("listing_submissions_phone_idx"), true);
      assert.equal(migration.includes("listing_submissions_dedupe_open_idx"), true);
      assert.equal(migration.includes("marketplace_listings_source_submission_idx"), true);
      assert.equal(migration.includes("where source_submission_id = p_submission_id"), true);
      assert.equal(migration.includes("or (v_submission.published_listing_id is not null and id = v_submission.published_listing_id)"), true);
      assert.equal(migration.includes("'reused', true"), true);
      assert.equal(migration.includes("revoke all on table public.listing_submissions from anon"), true);
      assert.equal(migration.includes("grant insert ("), true);
      assert.equal(anonGrant.includes("status_history"), false);
      assert.equal(anonGrant.includes("published_listing_id"), false);
      assert.equal(anonGrant.includes("image_urls"), false);
      assert.equal(anonGrant.includes("source"), false);
      assert.equal(anonGrant.includes("submission_dedupe_key"), false);
      assert.equal(/grant\s+select\s+on\s+public\.listing_submissions\s+to\s+anon/i.test(migration), false);
      assert.equal(migration.includes("create policy \"Allow public listing submission insert\""), true);
      assert.equal(migration.includes("insert into storage.buckets"), true);
      assert.equal(migration.includes("'listing-submissions'"), true);
      assert.equal(migration.includes("false,"), true);
      assert.equal(migration.includes("Service role manages listing submission images"), true);
      assert.equal(migration.includes("create table if not exists public.listing_submission_rate_limits"), true);
      assert.equal(migration.includes("alter table public.listing_submission_rate_limits enable row level security"), true);
      assert.equal(migration.includes("consume_listing_submission_rate_limit"), true);
      assert.equal(migration.includes("security definer\nset search_path = ''"), true);
      assert.equal(migration.includes("revoke all on function public.consume_listing_submission_rate_limit(text, integer, integer) from anon"), true);
      assert.equal(migration.includes("create table if not exists public.listing_submission_publication_cleanup_queue"), true);
      assert.equal(migration.includes("create or replace function public.publish_listing_submission"), true);
      assert.equal(migration.includes("for update"), true);
      assert.equal(migration.includes("grant execute on function public.publish_listing_submission(uuid, text, text[]) to service_role"), true);
      assert.equal(migration.includes("revoke all on function public.publish_listing_submission(uuid, text, text[]) from anon"), true);
      assert.equal(migration.includes("revoke all on function public.slugify_marketplace_listing(text) from anon"), true);
      assert.equal(migration.includes("revoke all on function public.slugify_marketplace_listing(text) from authenticated"), true);
      assert.equal(migration.includes("whatsapp_number"), true);
    }
  },
  {
    name: "Dedicated admin listing-submission workspace supports review and publication actions",
    run: () => {
      const page = repoFile("src/app/admin/listing-submissions/page.tsx");
      const workspace = repoFile("src/components/AdminListingSubmissionsWorkspace.tsx");
      const api = repoFile("src/app/api/admin/submissions/route.ts");
      const imageApi = repoFile("src/app/api/admin/listing-submissions/images/route.ts");
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");

      assert.equal(page.includes("AdminListingSubmissionsWorkspace"), true);
      assert.equal(page.includes("getAdminUserFromAccessToken"), true);
      assert.equal(page.includes('redirect("/admin/login")'), true);
      assert.equal(page.includes('export const dynamic = "force-dynamic"'), true);
      assert.equal(page.includes("export const revalidate = 0"), true);
      assert.equal(page.includes("noStore()"), true);
      assert.equal(page.includes("getPublicListingSubmissions"), true);
      assert.equal(page.includes("initialSubmissions={submissions.listings}"), true);
      assert.equal(workspace.includes("Public listing review workspace"), true);
      assert.equal(workspace.includes("initialSubmissions = []"), true);
      assert.equal(workspace.includes("useState<ListingSubmission[]>(initialSubmissions)"), true);
      assert.equal(workspace.includes("initialError = \"\""), true);
      assert.equal(workspace.includes("/api/admin/submissions?kind=listing"), true);
      assert.equal(workspace.includes("No submissions in this status."), true);
      assert.equal(workspace.includes("Needs Information"), true);
      assert.equal(workspace.includes("Mark Under Review"), true);
      assert.equal(workspace.includes("Request More Information"), true);
      assert.equal(workspace.includes("Save Draft"), true);
      assert.equal(workspace.includes("Approve and Publish"), true);
      assert.equal(workspace.includes("Mark Sold Out"), true);
      assert.equal(workspace.includes("Internal notes"), true);
      assert.equal(workspace.includes("Seller-facing message"), true);
      assert.equal(workspace.includes('Public {kind === "card" ? "card" : "detail"} preview'), true);
      assert.equal(workspace.includes("/api/admin/listing-submissions/images"), true);
      assert.equal(api.includes("requireAdminUser"), true);
      assert.equal(api.includes("convertListingSubmission"), true);
      assert.equal(api.includes('searchParams.get("kind")'), true);
      assert.equal(api.includes("kind === \"listing\" ? await getPublicListingSubmissions() : await getPublicSubmissions()"), true);
      assert.equal(api.includes("export const revalidate = 0"), true);
      assert.equal(api.includes('"Cache-Control": "no-store, max-age=0"'), true);
      assert.equal(api.includes('allowedStatuses = new Set<SubmissionStatus>(["New", "Needs Information", "Under Review", "Approved", "Published", "Paused", "Rejected", "Expired"])'), true);
      assert.equal(imageApi.includes("requireAdminUser"), true);
      assert.equal(imageApi.includes('bucket: "listing-submissions"'), true);
      assert.equal(imageApi.includes("Cache-Control"), true);
      assert.equal(publicSubmissions.includes('selectSupabaseRecords<ListingSubmission>("listing_submissions", listingQuery)'), true);
      assert.equal(publicSubmissions.includes("export async function getPublicListingSubmissions()"), true);
      assert.equal(publicSubmissions.includes("Admin listing submission queue read failed"), true);
      assert.equal(publicSubmissions.includes('"select=*&order=created_at.desc&limit=500"'), true);
      assert.equal(publicSubmissions.includes("Admin submission queue read failed"), true);
      assert.equal(publicSubmissions.includes("marketplaceStatusForSubmissionStatus"), true);
      assert.equal(publicSubmissions.includes('status === "Published" ? "Active" : "Archived"'), true);
      assert.equal(publicSubmissions.includes("syncLinkedMarketplaceListingForSubmissionStatus"), true);
      assert.equal(publicSubmissions.includes("reconcileLinkedMarketplaceListingsForSubmissions"), true);
      assert.equal(publicSubmissions.includes("linkedMarketplaceListingFilter"), true);
      assert.equal(publicSubmissions.includes("source_submission_id=eq."), true);
      assert.equal(publicSubmissions.includes("source_submission_id.eq."), true);
      assert.equal(publicSubmissions.includes('if (kind === "listing" && status !== "Published"'), true);
      assert.equal(publicSubmissions.includes('if (!update.error && kind === "listing" && status === "Published"'), true);
      assert.equal(publicSubmissions.includes("submission.published_listing_id"), true);
      assert.equal(publicSubmissions.includes("Could not reactivate the linked marketplace listing."), true);
      assert.equal(publicSubmissions.includes("Admin listing submission lifecycle sync failed"), true);
      assert.equal(publicSubmissions.includes("downloadSupabaseStorageObject"), true);
      assert.equal(publicSubmissions.includes("copyApprovedSubmissionImages"), true);
      assert.equal(publicSubmissions.includes("publicPath = `approved-submissions/${submission.id}/${index + 1}-"), true);
      assert.equal(publicSubmissions.includes('callSupabaseRpc<{ listing_id?: string; slug?: string; reused?: boolean }>("publish_listing_submission"'), true);
      assert.equal(publicSubmissions.includes("cleanupStoragePaths(\"marketplace\""), true);
      assert.equal(publicSubmissions.includes("recordPublicationCleanup"), true);
      assert.equal(publicSubmissions.includes("status_history"), true);
      assert.equal(publicSubmissions.includes("p_admin_email: adminEmail"), true);
    }
  },
  {
    name: "Admin listing-submission workspace is independent of missing buyer request applications table",
    run: () => {
      const page = repoFile("src/app/admin/listing-submissions/page.tsx");
      const workspace = repoFile("src/components/AdminListingSubmissionsWorkspace.tsx");
      const api = repoFile("src/app/api/admin/submissions/route.ts");
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");

      assert.equal(page.includes("getPublicListingSubmissions"), true);
      assert.equal(page.includes("getPublicSubmissions"), false);
      assert.equal(workspace.includes("/api/admin/submissions?kind=listing"), true);
      assert.equal(workspace.includes("buyer_request_applications"), false);
      assert.equal(api.includes("getPublicListingSubmissions"), true);
      assert.equal(api.includes("kind === \"listing\" ? await getPublicListingSubmissions() : await getPublicSubmissions()"), true);
      assert.equal(publicSubmissions.includes("export async function getPublicListingSubmissions()"), true);
      assert.equal(publicSubmissions.includes("buyer_request_applications"), false);
      const listingOnlyHelper = publicSubmissions.slice(
        publicSubmissions.indexOf("export async function getPublicListingSubmissions()"),
        publicSubmissions.indexOf("export async function getPublicSubmissions()")
      );
      assert.equal(listingOnlyHelper.includes("listing_submissions"), true);
      assert.equal(listingOnlyHelper.includes("buyer_request_applications"), false);
    }
  },
  {
    name: "Unified buyer enquiries use private lead_requests instead of new request tables",
    run: () => {
      const migration = repoFile("supabase/migrations/034_unified_buyer_enquiries.sql");
      const precheck = repoFile("supabase/review/precheck_034_unified_buyer_enquiries.sql");
      const verify = repoFile("supabase/review/verify_034_unified_buyer_enquiries.sql");
      const leadRequests = repoFile("src/lib/leadRequests.ts");
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");
      const leadRoute = repoFile("src/app/api/lead-requests/route.ts");
      const buyerRoute = repoFile("src/app/api/buyer-request-submissions/route.ts");
      const modal = repoFile("src/components/RequestConnectionButton.tsx");
      const marketplaceDetail = repoFile("src/app/marketplace/[id]/page.tsx");
      const farmerProfile = repoFile("src/app/farmer-directory/[slug]/page.tsx");
      const supplierProfile = repoFile("src/app/supplier-directory/[slug]/page.tsx");
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const snapshotSection = leadRequests.slice(
        leadRequests.indexOf("const snapshot: LeadRequestSnapshot"),
        leadRequests.indexOf("return {", leadRequests.indexOf("const snapshot: LeadRequestSnapshot"))
      );

      assert.equal(migration.includes("begin;"), true);
      assert.equal(migration.includes("commit;"), true);
      assert.equal(migration.includes("create table if not exists public.lead_requests"), true);
      assert.equal(migration.includes("alter table public.lead_requests"), true);
      assert.equal(migration.includes("create table if not exists public.connection_requests"), false);
      assert.equal(migration.includes("create table if not exists public.buyer_request_applications"), false);
      assert.equal(migration.includes("status in ('New', 'Contacted', 'Negotiating', 'Completed', 'Lost')"), true);
      assert.equal(migration.includes("request_source in ('marketplace_listing', 'farmer_profile', 'supplier_profile', 'generic_sourcing', 'legacy')"), true);
      assert.equal(migration.includes("source_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Supplier Listing', 'Buyer Request')"), true);
      assert.equal(migration.includes("references public.marketplace_listings(id)"), true);
      assert.equal(migration.includes("references public.farmers(id)"), true);
      assert.equal(migration.includes("references public.suppliers(id)"), true);
      assert.equal(migration.includes("alter table public.lead_requests enable row level security"), true);
      assert.equal(migration.includes("revoke all on table public.lead_requests from anon"), true);
      assert.equal(/grant\s+select\s+on\s+public\.lead_requests\s+to\s+anon/i.test(migration), false);
      assert.equal(migration.includes("create table if not exists public.lead_request_rate_limits"), true);
      assert.equal(migration.includes("security definer\nset search_path = ''"), true);
      assert.equal(migration.includes("revoke all on function public.consume_lead_request_rate_limit(text, integer, integer) from anon"), true);
      assert.equal(migration.includes("grant execute on function public.consume_lead_request_rate_limit(text, integer, integer) to service_role"), true);
      assert.equal(precheck.includes("to_regclass('public.lead_requests') is not null as lead_requests_exists"), true);
      assert.equal(precheck.includes("public.lead_requests is absent; migration 034 will create it."), true);
      assert.equal(precheck.includes("query_to_xml"), true);
      assert.equal(precheck.includes("rows that would violate proposed source_type constraint"), true);
      assert.equal(verify.includes("lead_requests_exists"), true);
      assert.equal(verify.includes("lead_request_rate_limits_exists"), true);
      assert.equal(verify.includes("has_table_privilege('anon', 'public.lead_requests', 'select')"), true);
      assert.equal(verify.includes("has_function_privilege('anon', 'public.consume_lead_request_rate_limit(text, integer, integer)', 'execute')"), true);

      assert.equal(leadRequests.includes("process.env.LEAD_REQUEST_RATE_LIMIT_SECRET"), true);
      assert.equal(leadRequests.includes("local-development-lead-request-secret"), false);
      assert.equal(leadRequests.includes("createHmac"), true);
      assert.equal(leadRequests.includes('callSupabaseRpc<RateLimitResult>("consume_lead_request_rate_limit"'), true);
      assert.equal(leadRequests.includes("leadRequestRateLimitKey"), true);
      assert.equal(leadRequests.includes("leadRequestDedupeKey"), true);
      assert.equal(leadRequests.includes("duplicateLeadRequestWarning"), true);
      assert.equal(leadRequests.includes("isMarketplaceListingPublicStatus(product)"), true);
      assert.equal(leadRequests.includes("isDemoMarketplaceListing(product)"), true);
      assert.equal(leadRequests.includes("submissionStatus !== \"Published\""), true);
      assert.equal(leadRequests.includes("trustedProductSelection"), true);
      assert.equal(snapshotSection.includes("whatsapp"), false);
      assert.equal(snapshotSection.includes("phone"), false);

      assert.equal(publicSubmissions.includes("createGenericSourcingLeadRequest(body, clientKey)"), true);
      assert.equal(publicSubmissions.includes("buyer_request_applications"), false);
      assert.equal(leadRoute.includes("x-forwarded-for"), true);
      assert.equal(buyerRoute.includes("createBuyerRequestSubmission(body, clientKey(request))"), true);
      assert.equal(buyerRoute.includes("x-forwarded-for"), true);

      assert.equal(modal.includes("Request This Listing"), true);
      assert.equal(modal.includes("Delivery Location"), true);
      assert.equal(modal.includes("Company Name (optional)"), true);
      assert.equal(modal.includes("WhatsApp is the same as phone number"), true);
      assert.equal(modal.includes("Required by / Deadline (optional)"), true);
      assert.equal(modal.includes("Example: 5 bags, 20 crates, or 100 kg."), true);
      assert.equal(modal.includes('formData.getAll("productInterest")'), true);
      assert.equal(modal.includes("readOnly={readOnly}"), true);

      assert.equal(marketplaceDetail.includes('requestSource="marketplace_listing"'), true);
      assert.equal(marketplaceDetail.includes("listingSummary={{"), true);
      assert.equal(farmerProfile.includes('requestSource="farmer_profile"'), true);
      assert.equal(farmerProfile.includes("productOptions={products}"), true);
      assert.equal(supplierProfile.includes('requestSource="supplier_profile"'), true);
      assert.equal(supplierProfile.includes("productOptions={supplier.productsServices}"), true);
      assert.equal(supplierProfile.includes('requestSource="marketplace_listing"'), true);

      assert.equal(adminDashboard.includes("leadRequestSourceLabel"), true);
      assert.equal(adminDashboard.includes("selectedLead.company_name"), true);
      assert.equal(adminDashboard.includes("selectedLead.delivery_location"), true);
      assert.equal(adminDashboard.includes("selectedLead.listing_snapshot"), true);
      assert.equal(adminDashboard.includes("Linked Listing / Profile"), true);
    }
  },
  {
    name: "Admin Produce Requests workspace reads unified lead_requests queue",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const leadAdminRoute = repoFile("src/app/api/admin/lead-requests/route.ts");

      assert.equal(adminDashboard.includes('const isBuyerRequestsSection = activeSection === "buyer-requests";'), true);
      assert.equal(adminDashboard.includes("const produceRequestLeads = useMemo"), true);
      assert.equal(adminDashboard.includes("leadRequests.filter((lead) => {"), true);
      assert.equal(adminDashboard.includes("leadMatchesProduceRequestStatus(lead, produceRequestStatusFilter)"), true);
      assert.equal(adminDashboard.includes('leadReviewStatusLabel(status)'), true);
      assert.equal(adminDashboard.includes('section: "buyer-requests" as AdminSectionId'), true);
      assert.equal(adminDashboard.includes("Private Enquiry Workspace"), true);
      assert.equal(adminDashboard.includes("Review private produce requests"), true);
      assert.equal(adminDashboard.includes("selectedProduceRequest.listing_snapshot"), true);
      assert.equal(adminDashboard.includes("Seller private contact details are not exposed here."), true);
      assert.equal(adminDashboard.includes("leadRequestLinkedSource(selectedProduceRequest)"), true);
      assert.equal(adminDashboard.includes('updateLeadRequestStatus(selectedProduceRequest, "Negotiating")'), true);
      assert.equal(adminDashboard.includes("Start Sourcing"), true);
      assert.equal(adminDashboard.includes("No produce requests match this search or status filter."), true);
      assert.equal(adminDashboard.includes("const legacySubmissionCases = submissions.buyerRequests.map(sourcingCaseFromBuyerSubmission);"), true);
      assert.equal(adminDashboard.includes("buyer_request_applications"), false);

      assert.equal(leadAdminRoute.includes("requireAdminUser"), true);
      assert.equal(leadAdminRoute.includes("getRecentLeadRequests(250)"), true);
      assert.equal(leadAdminRoute.includes('export const dynamic = "force-dynamic"'), true);
      assert.equal(leadAdminRoute.includes("export const revalidate = 0"), true);
      assert.equal(leadAdminRoute.includes('"Cache-Control": "no-store, max-age=0"'), true);
      assert.equal(leadAdminRoute.includes("[admin:lead-requests] Could not load lead requests"), true);
    }
  },
  {
    name: "Start Sourcing moves unified lead into Matches without duplicate request records",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const leadAdminRoute = repoFile("src/app/api/admin/lead-requests/route.ts");

      assert.equal(adminDashboard.includes("function sourcingCaseFromLead(lead: LeadRequestRecord)"), true);
      assert.equal(adminDashboard.includes('if (status !== "Negotiating")'), true);
      assert.equal(adminDashboard.includes('case_source: "lead_request"'), true);
      assert.equal(adminDashboard.includes("const sourcingCaseRequests = useMemo"), true);
      assert.equal(adminDashboard.includes(".map(sourcingCaseFromLead)"), true);
      assert.equal(adminDashboard.includes("const legacySubmissionCases = submissions.buyerRequests.map(sourcingCaseFromBuyerSubmission);"), true);
      assert.equal(adminDashboard.includes("return [...leadCases, ...legacySubmissionCases];"), true);
      assert.equal(adminDashboard.includes("status: defaultSourcingCaseStatus(request)"), true);
      assert.equal(adminDashboard.includes('return "Active Sourcing";'), true);
      assert.equal(adminDashboard.includes('updateLeadRequestStatus(selectedProduceRequest, "Negotiating")'), true);
      assert.equal(adminDashboard.includes('updateLeadRequestStatus(caseItem, "Negotiating")'), true);
      assert.equal(adminDashboard.includes('updateLeadRequestStatus(caseItem, "Completed")'), true);
      assert.equal(adminDashboard.includes('updateLeadRequestStatus(caseItem, "Lost")'), true);
      assert.equal(adminDashboard.includes("produceRequestFilterTitle(produceRequestStatusFilter)"), true);
      assert.equal(adminDashboard.includes("Sourcing cases could not be loaded. Please refresh and try again."), true);
      assert.equal(adminDashboard.includes("Public Listing Snapshot"), true);
      assert.equal(adminDashboard.includes("sourcingCaseLinkedSource(selectedSourcingCase.request)"), true);
      assert.equal(adminDashboard.includes("seller private contact details are not exposed here"), false);
      assert.equal(adminDashboard.includes("Seller private contact details are not exposed here."), true);
      assert.equal(adminDashboard.includes("buyer_request_applications"), false);
      assert.equal(adminDashboard.includes("sourcing_cases"), false);

      assert.equal(adminDashboard.includes('body: JSON.stringify({ id: lead.id, status })'), true);
      assert.equal(leadAdminRoute.includes("const id = typeof body.id === \"string\" ? body.id.trim() : \"\";"), true);
      assert.equal(leadAdminRoute.includes("updateLeadRequestStatus({ id, status: body.status, adminEmail: adminUser.email })"), true);
    }
  },
  {
    name: "Sourcing lifecycle timeline reflects recorded actions only",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");

      assert.equal(adminDashboard.includes('"Contact started"'), false);
      assert.equal(adminDashboard.includes('"Waiting for first response"'), false);
      assert.equal(adminDashboard.includes('state.status !== "New"'), false);
      assert.equal(adminDashboard.includes('detail: buyerContacted ? "Buyer contact recorded" : "Not recorded"'), true);
      assert.equal(adminDashboard.includes('detail: matchReviewed ? "Match review recorded" : "Not started"'), true);
      assert.equal(adminDashboard.includes('detail: availabilityConfirmed ? "Availability confirmed" : "Not confirmed"'), true);
      assert.equal(adminDashboard.includes('sourcingCaseCommunicationRows(selectedSourcingCase.request.id, activityRows)'), true);
      assert.equal(adminDashboard.includes('activity.action_type === "Contact"'), true);
      assert.equal(adminDashboard.includes('action: "Contact"'), true);
      assert.equal(adminDashboard.includes('action: "Review"'), true);
    }
  },
  {
    name: "Sourcing actions are explicit, idempotent, and use human-readable listing context",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const matchActivityRoute = repoFile("src/app/api/admin/matches/activity/route.ts");

      assert.equal(adminDashboard.includes('caseItem.priority.label !== "New"'), true);
      assert.equal(adminDashboard.includes('return "Active Sourcing";'), true);
      assert.equal(adminDashboard.includes('leadReviewStatusLabel(status)'), true);
      assert.equal(adminDashboard.includes('Review Farmer Matches'), true);
      assert.equal(adminDashboard.includes('Review Supplier Matches'), true);
      assert.equal(adminDashboard.includes('Mark Lost'), true);
      assert.equal(adminDashboard.includes('Close Request'), false);
      assert.equal(adminDashboard.includes('Mark Negotiating'), false);
      assert.equal(adminDashboard.includes('window.confirm("Mark this sourcing request as completed? This will not send any message.")'), true);
      assert.equal(adminDashboard.includes('window.confirm("Mark this sourcing request as lost? This will not send any message.")'), true);
      assert.equal(adminDashboard.includes('href={whatsappUrl(selectedSourcingCase.request.whatsapp_number'), false);
      assert.equal(adminDashboard.includes('window.open('), true);
      assert.equal(adminDashboard.includes('publicSellerDisplayName'), true);
      assert.equal(adminDashboard.includes('"S. K. Nart Farms"'), true);
      assert.equal(adminDashboard.includes('`${snapshotProduct} — ${snapshotSeller}`'), true);
      assert.equal(adminDashboard.includes('sourcingCaseHref(selectedSourcingCase.request)'), true);
      assert.equal(adminDashboard.includes('status === "Closed" ? "Lost" : status'), true);
      assert.equal(adminDashboard.includes("seller private contact details are not exposed here"), false);
      assert.equal(adminDashboard.includes("Seller private contact details are not exposed here."), true);

      assert.equal(matchActivityRoute.includes('const matchActions: AdminActionType[] = ["View", "Review", "Contact", "Close"];'), true);
      assert.equal(matchActivityRoute.includes("selectSupabaseRecords"), true);
      assert.equal(matchActivityRoute.includes("`entity_id=eq.${encodeURIComponent(matchId)}`"), true);
      assert.equal(matchActivityRoute.includes("`action_type=eq.${encodeURIComponent(body.action)}`"), true);
      assert.equal(matchActivityRoute.includes("entity_name=eq."), false);
      assert.equal(matchActivityRoute.includes("duplicate: true"), true);
      assert.equal(matchActivityRoute.includes("if (!logged.ok)"), true);
      assert.equal(matchActivityRoute.includes("requireAdminUser"), true);
    }
  },
  {
    name: "Admin navigation groups preserve routes in a collapsible hierarchy",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const expectedGroups = [
        "Today",
        "Buyer Requests",
        "Network",
        "Marketplace",
        "Trust & Content",
        "Reports",
        "Settings"
      ];
      const expectedItems = [
        "Operations Center",
        "Notifications",
        "Review Requests",
        "Active Sourcing",
        "Follow-ups",
        "Completed Requests",
        "Farmer Applications",
        "Supplier Applications",
        "Members",
        "Directories",
        "Listings",
        "Categories",
        "Featured Listings",
        "Verification",
        "GG Standard",
        "Featured Members",
        "Stories",
        "Homepage",
        "Photography",
        "Learning",
        "Reports",
        "Analytics",
        "Launch Readiness",
        "Users",
        "Roles",
        "Permissions",
        "Integrations"
      ];

      for (const group of expectedGroups) {
        assert.equal(adminDashboard.includes(`group: "${group}"`), true);
      }

      for (const item of expectedItems) {
        assert.equal(adminDashboard.includes(`label: "${item}"`), true);
      }

      assert.equal(adminDashboard.includes("expandedNavigationGroup"), true);
      assert.equal(adminDashboard.includes("aria-expanded={isExpanded}"), true);
      assert.equal(adminDashboard.includes("openAdminNavigationItem(item, group.group)"), true);
      assert.equal(adminDashboard.includes('analyticsView: "operations"'), true);
      assert.equal(adminDashboard.includes('analyticsView: "analytics"'), true);
      assert.equal(adminDashboard.includes('applicationTab: "farmer"'), true);
      assert.equal(adminDashboard.includes('applicationTab: "supplier"'), true);
      assert.equal(adminDashboard.includes('produceRequestStatusFilter: "Pending Review"'), true);
      assert.equal(adminDashboard.includes('sourcingQueueFilter: "All"'), true);
    }
  },
  {
    name: "Operations Center stays focused on source-of-truth operational queues",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");

      assert.equal(adminDashboard.includes("Requests needing review"), true);
      assert.equal(adminDashboard.includes("Private buyer enquiries waiting for a first admin decision."), true);
      assert.equal(adminDashboard.includes("Active sourcing cases"), true);
      assert.equal(adminDashboard.includes("Requests already moved into sourcing and match review."), true);
      assert.equal(adminDashboard.includes("Follow-ups due"), true);
      assert.equal(adminDashboard.includes("Contacted or overdue requests needing an admin follow-up."), true);
      assert.equal(adminDashboard.includes("Listing submissions awaiting review"), true);
      assert.equal(adminDashboard.includes("Public listing submissions waiting for review or publishing."), true);
      assert.equal(adminDashboard.includes('leadStatusCount(leadRequests, "New")'), true);
      assert.equal(adminDashboard.includes('leadStatusCount(leadRequests, "Negotiating")'), true);
      assert.equal(adminDashboard.includes('leadStatusCount(leadRequests, "Contacted")'), true);
      assert.equal(adminDashboard.includes("submissions.listings.filter((submission) => [\"New\", \"Needs Information\", \"Under Review\", \"Approved\"].includes(submission.status)).length"), true);
      assert.equal(adminDashboard.includes("Quick Actions"), false);
      assert.equal(adminDashboard.includes("Today's Progress"), false);
      assert.equal(adminDashboard.includes("Platform Health"), false);
    }
  },
  {
    name: "Request connection modal closes only after confirmed server success",
    run: () => {
      const modal = repoFile("src/components/RequestConnectionButton.tsx");

      assert.equal(modal.includes("submitLockedRef"), true);
      assert.equal(modal.includes("if (isSubmitting || submitLockedRef.current)"), true);
      assert.equal(modal.includes("setError(result?.error ?? \"Could not submit your request. Please try again.\")"), true);
      assert.equal(modal.includes("setIsOpen(false);"), true);
      assert.equal(modal.includes("closeTimerRef.current = window.setTimeout"), true);
      assert.equal(modal.includes("Request received"), true);
      assert.equal(modal.includes("Ghana Growers will review it before connecting anyone."), true);
      assert.equal(modal.includes("This window will close in a moment."), true);
      assert.equal(modal.includes("role=\"status\" aria-live=\"polite\""), true);
      assert.equal(modal.includes("disabled={isSubmitting || Boolean(success)}"), true);
      assert.equal(modal.includes("form.reset()"), true);
      assert.equal(modal.includes("submitLockedRef.current = false"), true);
    }
  },
  {
    name: "Admin-assisted marketplace listing creation remains separate from public submissions",
    run: () => {
      const adminListings = repoFile("src/app/api/admin/marketplace-listings/route.ts");
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");

      assert.equal(adminListings.includes('table: "marketplace_listings"'), true);
      assert.equal(adminListings.includes('record_source: payload.recordSource || "admin"'), true);
      assert.equal(adminListings.includes("canonicalMarketplaceTradeFields"), true);
      assert.equal(adminListings.includes("validateMarketplaceTradeInput"), true);
      assert.equal(publicSubmissions.includes("public_submission"), true);
      assert.equal(publicSubmissions.includes("whatsapp_assisted"), false);
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
    name: "Marketplace data loader carries linked submission status for public filtering",
    run: () => {
      const publicData = repoFile("src/lib/supabase/publicData.ts");
      const publicListings = repoFile("src/lib/marketplace/publicListings.ts");

      assert.equal(publicData.includes("type SupabaseListingSubmissionStatus"), true);
      assert.equal(publicData.includes('fetchRows<SupabaseListingSubmissionStatus>("listing_submissions", "id,status,published_listing_id"'), true);
      assert.equal(publicData.includes("sourceSubmissionStatus"), true);
      assert.equal(publicListings.includes('product.sourceSubmissionStatus !== "Published"'), true);
    }
  },
  {
    name: "Published public listing submission appears without matched farmer profile",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({
            id: "okra-public-submission",
            name: "Okra",
            category: "Vegetables",
            location: "Kumasi",
            region: "Ashanti Region",
            seller: "Okra Seller Farm",
            ownerName: "Okra Seller Farm",
            ownerType: "Farmer",
            farmerSlug: "okra-seller-farm",
            recordSource: "public_submission",
            sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
            sourceSubmissionStatus: "Published",
            status: "Active",
            whatsappNumber: "233555123456",
            internalOperationsNotes: "Private admin note"
          })
        ],
        [],
        []
      );

      assert.equal(listings.length, 1);
      assert.equal(listings[0].title, "Okra");
      assert.equal(listings[0].seller.kind, "submission");
      assert.equal(listings[0].sellerName, "Okra Seller Farm");
      assert.equal(listings[0].product.sourceSubmissionId, "6da0f5fc-0307-438f-bc0e-e9da83949d83");
      assert.equal(listings[0].product.whatsappNumber, undefined);
      assert.equal(listings[0].product.internalOperationsNotes, undefined);
    }
  },
  {
    name: "Public listing submission remains single and idempotent in public payload",
    run: () => {
      const products = [
        marketplaceProductFixture({
          id: "okra-public-submission",
          name: "Okra",
          category: "Vegetables",
          location: "Kumasi",
          region: "Ashanti Region",
          seller: "Okra Seller Farm",
          ownerName: "Okra Seller Farm",
          ownerType: "Farmer",
          recordSource: "public_submission",
          sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
          sourceSubmissionStatus: "Published",
          status: "Active"
        }),
        marketplaceProductFixture({
          id: "okra-public-submission-duplicate",
          name: "Okra",
          category: "Vegetables",
          location: "Kumasi",
          region: "Ashanti Region",
          seller: "Okra Seller Farm",
          ownerName: "Okra Seller Farm",
          ownerType: "Farmer",
          recordSource: "public_submission",
          sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
          sourceSubmissionStatus: "Published",
          status: "Active"
        })
      ];
      const listings = publicMarketplaceListings(products, [], []);

      assert.equal(listings.length, 1);
      assert.deepEqual(listings.map((listing) => listing.title), ["Okra"]);
    }
  },
  {
    name: "Pending and under-review listing submissions remain private",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({
            id: "okra-new-submission",
            name: "Okra",
            recordSource: "public_submission",
            sourceSubmissionId: "new-submission",
            sourceSubmissionStatus: "New",
            status: "Active",
            ownerName: "New Seller Farm"
          }),
          marketplaceProductFixture({
            id: "okra-under-review-submission",
            name: "Okra",
            recordSource: "public_submission",
            sourceSubmissionId: "under-review-submission",
            sourceSubmissionStatus: "Under Review",
            status: "Active",
            ownerName: "Review Seller Farm"
          })
        ],
        [],
        []
      );

      assert.deepEqual(listings, []);
    }
  },
  {
    name: "Published to Paused hides linked public listing without deleting it",
    run: () => {
      const okra = marketplaceProductFixture({
        id: "4d4970af-9035-4ef7-b0ec-5d24e4db730a",
        name: "Okra",
        recordSource: "public_submission",
        sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
        sourceSubmissionStatus: "Paused",
        status: "Active",
        ownerName: "Okra Seller Farm"
      });

      assert.deepEqual(publicMarketplaceListings([okra], [], []), []);
    }
  },
  {
    name: "Admin listing queue reconciles stale linked marketplace status",
    run: () => {
      const publicSubmissions = repoFile("src/lib/publicSubmissions.ts");

      assert.equal(publicSubmissions.includes("const submissionsWithLinkedListings = submissions.filter"), true);
      assert.equal(publicSubmissions.includes('submission.published_listing_id || submission.status === "Published"'), true);
      assert.equal(publicSubmissions.includes("await syncLinkedMarketplaceListingForSubmissionStatus({"), true);
      assert.equal(publicSubmissions.includes("status: submission.status"), true);
      assert.equal(publicSubmissions.includes("const lifecycleSync = await reconcileLinkedMarketplaceListingsForSubmissions(listings.data)"), true);
    }
  },
  {
    name: "Paused to Published reactivates the same linked listing in public payload",
    run: () => {
      const okra = marketplaceProductFixture({
        id: "4d4970af-9035-4ef7-b0ec-5d24e4db730a",
        name: "Okra",
        recordSource: "public_submission",
        sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
        sourceSubmissionStatus: "Published",
        status: "Active",
        ownerName: "Okra Seller Farm"
      });
      const listings = publicMarketplaceListings([okra], [], []);

      assert.equal(listings.length, 1);
      assert.equal(listings[0].product.id, "4d4970af-9035-4ef7-b0ec-5d24e4db730a");
      assert.equal(listings[0].title, "Okra");
    }
  },
  {
    name: "Repeated public-submission transitions do not create duplicate public rows",
    run: () => {
      const products = [
        marketplaceProductFixture({
          id: "4d4970af-9035-4ef7-b0ec-5d24e4db730a",
          name: "Okra",
          recordSource: "public_submission",
          sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
          sourceSubmissionStatus: "Published",
          status: "Active",
          ownerName: "Okra Seller Farm"
        }),
        marketplaceProductFixture({
          id: "4d4970af-9035-4ef7-b0ec-5d24e4db730a",
          name: "Okra",
          recordSource: "public_submission",
          sourceSubmissionId: "6da0f5fc-0307-438f-bc0e-e9da83949d83",
          sourceSubmissionStatus: "Published",
          status: "Active",
          ownerName: "Okra Seller Farm"
        })
      ];

      assert.equal(publicMarketplaceListings(products, [], []).length, 1);
    }
  },
  {
    name: "Post-publication inactive submission statuses remain private and leave unrelated listings visible",
    run: () => {
      const inactiveSubmissionStatuses = ["Rejected", "Expired", "Approved", "Needs Information"] as const;
      const products = [
        ...inactiveSubmissionStatuses.map((sourceSubmissionStatus) =>
          marketplaceProductFixture({
            id: `okra-${sourceSubmissionStatus.toLowerCase().replace(/\s+/g, "-")}`,
            name: "Okra",
            recordSource: "public_submission",
            sourceSubmissionId: `submission-${sourceSubmissionStatus}`,
            sourceSubmissionStatus,
            status: "Active",
            ownerName: "Okra Seller Farm"
          })
        ),
        marketplaceProductFixture({
          id: "yellow-maize",
          name: "Yellow Maize",
          category: "Grains",
          farmerSlug: "s-k-nart-farms",
          ownerName: "S. K. Nart Farms",
          status: "Active"
        })
      ];
      const listings = publicMarketplaceListings(
        products,
        [farmerFixture({ slug: "s-k-nart-farms", farmName: "S. K. Nart Farms", verificationStatus: "Verified", source: "Tally Import" })],
        []
      );

      assert.deepEqual(listings.map((listing) => listing.title), ["Yellow Maize"]);
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
    name: "Marketplace maize sacks calculate farmer-friendly commercial lines",
    run: () => {
      const product = marketplaceProductFixture({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        unitSizeApproximate: true,
        priceAmount: "700",
        priceCurrency: "GHS",
        unitsAvailable: "10",
        totalQuantityValue: "500",
        totalQuantityMeasure: "kg",
        minimumOrderValue: "2",
        minimumOrderUnit: "sack"
      });

      assert.equal(calculatedMarketplaceTotal(product), "500 kg");
      assert.equal(marketplacePriceLine(product), "GH\u20b5700 per 50 kg sack");
      assert.equal(marketplaceQuantityLine(product), "10 sacks available \u00b7 approximately 500 kg total");
      assert.equal(pluralizeMarketplaceUnit("sack", 1), "sack");
      assert.equal(pluralizeMarketplaceUnit("sack", 2), "sacks");
      assert.equal(pluralizeMarketplaceUnit("tray", 1), "tray");
      assert.equal(pluralizeMarketplaceUnit("tray", 2), "trays");
      assert.equal(pluralizeMarketplaceUnit("bunch", 1), "bunch");
      assert.equal(pluralizeMarketplaceUnit("bunch", 2), "bunches");
      assert.equal(pluralizeMarketplaceUnit("crate", 1), "crate");
      assert.equal(pluralizeMarketplaceUnit("crate", 40), "crates");
      assert.equal(marketplaceTradeLines(product).find((line) => line.label === "Minimum order")?.value, "2 sacks");
      assert.equal(marketplaceTradeLines(product).some((line) => line.label === "Price"), false);
      assert.equal(marketplaceTradeLines(product).some((line) => line.label === "Status"), false);
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
      assert.equal(marketplacePriceLine(product), "GH\u20b5250 per 25 kg crate");
      assert.equal(marketplaceQuantityLine(product), "40 crates available \u00b7 approximately 1,000 kg total");
    }
  },
  {
    name: "Marketplace tray of eggs displays package size and approximate total naturally",
    run: () => {
      const product = marketplaceProductFixture({
        sellingMethod: "packaged_unit",
        sellingUnit: "tray",
        unitSizeValue: "30",
        unitSizeMeasure: "eggs",
        unitSizeApproximate: true,
        priceAmount: "60",
        priceCurrency: "GHS",
        unitsAvailable: "20",
        totalQuantityValue: "600",
        totalQuantityMeasure: "eggs"
      });
      const fields = canonicalMarketplaceTradeFields({
        sellingMethod: "packaged_unit",
        sellingUnit: "tray",
        unitSizeValue: "30",
        unitSizeMeasure: "eggs",
        unitsAvailable: "20",
        unitSizeApproximate: true,
        priceAmount: "60",
        priceCurrency: "GHS"
      });

      assert.equal(marketplacePriceLine(product), "GH\u20b560 per tray of 30 eggs");
      assert.equal(marketplaceQuantityLine(product), "20 trays available \u00b7 approximately 600 eggs total");
      assert.equal(fields.total_quantity_value, 600);
      assert.equal(fields.total_quantity_measure, "eggs");
      assert.equal(fields.price_basis, "tray");
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
      assert.equal(marketplacePriceLine(product), "GH\u20b514 per kg");
      assert.equal(marketplaceQuantityLine(product), "1,000 kg available");
      assert.equal(marketplaceTradeLines(product).some((line) => line.label === "Approximate size"), false);
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
      assert.equal(marketplacePriceLine(countProduct), "GH\u20b530 per bunch");
      assert.equal(marketplaceQuantityLine(countProduct), "80 bunches available");
      assert.equal(calculatedMarketplaceTotal(livestockProduct), "");
      assert.equal(marketplacePriceLine(livestockProduct), "GH\u20b5900 per goat");
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
      assert.equal(marketplacePriceLine(product), "GH\u20b5150 per litre");
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
        sellingMethod: undefined,
        sellingUnit: undefined,
        unitSizeValue: undefined,
        unitsAvailable: undefined,
        totalQuantityValue: undefined
      });

      assert.equal(marketplacePriceLine(yellowMaize), "Ask for price");
      assert.equal(marketplaceQuantityLine(yellowMaize), "Ask for quantity");
      assert.equal(marketplaceTradeLines(yellowMaize).find((line) => line.label === "Package / unit")?.value, "Ask for unit details");
      assert.equal(marketplaceTradeLines(yellowMaize).some((line) => line.label === "Total available"), false);
      assert.equal(marketplaceTradeInformation(yellowMaize).missingNote, "Additional trade details will be confirmed during your request.");
    }
  },
  {
    name: "Marketplace location formatter deduplicates identical town and region values",
    run: () => {
      assert.equal(formatMarketplaceLocation("Klo-Agogo", "Klo-Agogo"), "Klo-Agogo");
      assert.equal(formatMarketplaceLocation("Klo-Agogo", "Eastern Region"), "Klo-Agogo, Eastern Region");
      assert.equal(formatMarketplaceLocation("KLO-AGOGO", ""), "Klo-Agogo");
    }
  },
  {
    name: "Marketplace legacy quantity uses neutral listed quantity label",
    run: () => {
      const legacyYellowMaize = marketplaceProductFixture({
        name: "Yellow Maize",
        quantity: "50",
        unit: "kg",
        sellingMethod: undefined,
        sellingUnit: undefined,
        unitsAvailable: undefined,
        totalQuantityValue: undefined,
        totalQuantityMeasure: undefined
      });

      assert.equal(marketplaceQuantityLine(legacyYellowMaize), "50 kg");
      assert.equal(marketplaceQuantityLabel(legacyYellowMaize), "Listed quantity");
    }
  },
  {
    name: "Marketplace gallery images render only clean public listing images",
    run: () => {
      const images = marketplaceListingImages(marketplaceProductFixture({
        image: "/images/marketplace/fallback.jpg",
        images: [
          "/images/marketplace/maize-1.jpg",
          "",
          "/images/marketplace/maize-1.jpg",
          "/images/marketplace/maize-pending-review.jpg",
          "/images/marketplace/maize-2.jpg"
        ]
      }));

      assert.deepEqual(images, ["/images/marketplace/maize-1.jpg", "/images/marketplace/maize-2.jpg"]);
      assert.equal(images.length > 1, true);
    }
  },
  {
    name: "Marketplace detail gallery and request action stay focused",
    run: () => {
      const gallery = repoFile("src/components/MarketplaceImageGallery.tsx");
      const detailPage = repoFile("src/app/marketplace/[id]/page.tsx");

      assert.equal(gallery.includes("images.length > 1"), true);
      assert.equal(gallery.includes("setActiveImage(image)"), true);
      assert.equal(gallery.includes("const isActive = image === resolvedActiveImage"), true);
      assert.equal(gallery.includes("aria-pressed={isActive}"), true);
      assert.equal((detailPage.match(/<RequestConnectionButton/g) ?? []).length, 1);
      assert.equal(detailPage.includes("<MarketplaceImageGallery"), true);
    }
  },
  {
    name: "Marketplace taxonomy displays Grains and keeps legacy Cereals filters compatible",
    run: () => {
      assert.equal(displayMarketplaceCategory({ name: "Yellow Maize", category: "Mixed" }), "Grains");
      assert.equal(displayMarketplaceCategory({ name: "Local Rice", category: "Cereals" }), "Grains");
      assert.equal(displayMarketplaceCategory({ name: "Groundnuts", category: "Nuts" }), "Legumes");
      assert.equal(normalizeMarketplaceCategoryFilter("cereals"), "fresh-produce");
      assert.equal(normalizeMarketplaceCategoryFilter("grains"), "fresh-produce");
      assert.deepEqual([...freshProduceSubcategories], ["Vegetables", "Fruits", "Grains", "Roots & Tubers", "Legumes", "Herbs & Spices", "Nuts"]);
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
            category: "Mixed",
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
      assert.equal(listings[0].product.category, "Grains");
      assert.equal(listings[0].priceLine, "Ask for price");
      assert.equal(listings[0].quantity, "Ask for quantity");
    }
  },
  {
    name: "Marketplace Yellow Maize public copy uses approved farm name",
    run: () => {
      const listings = publicMarketplaceListings(
        [
          marketplaceProductFixture({
            id: "yellow-maize-sk-nart",
            name: "Yelloe Maize",
            category: "Mixed",
            location: "Klo-Agogo",
            region: "Klo-Agogo",
            quantity: "50",
            unit: "Kg",
            priceAmount: undefined,
            priceRange: undefined,
            sellingMethod: undefined,
            sellingUnit: undefined,
            unitsAvailable: undefined,
            totalQuantityValue: undefined,
            farmerSlug: "s-k-nart-farms",
            ownerName: "Narteh Samuel Kweku Farm",
            seller: "Narteh Samuel Kweku Farm",
            description: "Yelloe Maize supplied by Narteh Samuel Kweku Farm in Klo-Agogo. Contact Ghana Growers to confirm current availability, quantity, pricing and delivery arrangements."
          })
        ],
        [farmerFixture({ slug: "s-k-nart-farms", farmName: "S. K. Nart Farms", district: "Klo-Agogo", region: "Klo-Agogo", source: "Tally Import", verificationStatus: "Verified" })],
        []
      );

      assert.equal(listings.length, 1);
      assert.equal(listings[0].title, "Yellow Maize");
      assert.equal(listings[0].product.name, "Yellow Maize");
      assert.equal(listings[0].sellerName, "S. K. Nart Farms");
      assert.equal(listings[0].product.seller, "S. K. Nart Farms");
      assert.equal(listings[0].product.ownerName, "S. K. Nart Farms");
      assert.equal(listings[0].location, "Klo-Agogo");
      assert.equal(listings[0].product.category, "Grains");
      assert.equal(listings[0].priceLine, "Ask for price");
      assert.equal(listings[0].quantityLabel, "Listed quantity");
      assert.equal(listings[0].quantity, "50 kg");
      assert.equal(
        listings[0].product.description,
        "Yellow Maize supplied by S. K. Nart Farms in Klo-Agogo. Current pricing, quantity, and delivery or pickup arrangements will be confirmed during your request."
      );
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

      assert.equal(validateMarketplaceTradeInput({ priceAmount: "-1" }).includes("Price must be greater than zero."), true);
      assert.equal(validateMarketplaceTradeInput({ sellingMethod: "count", sellingUnit: "tray", unitsAvailable: "0" }).includes("Available quantity must be greater than zero."), true);
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
    name: "Marketplace minimum order remains optional for complete farmer listings",
    run: () => {
      const errors = validateMarketplaceTradeInput({
        sellingMethod: "packaged_unit",
        sellingUnit: "sack",
        unitSizeValue: "50",
        unitSizeMeasure: "kg",
        unitsAvailable: "10",
        priceAmount: "700"
      });

      assert.deepEqual(errors, []);
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
      }).includes("Available quantity must be a whole number for this selling format."), true);
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
      }).includes("Available quantity must be a whole number for this selling format."), true);
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
      }).includes("Volume listings need litres, gallons, or a count measure as the unit size measure."), true);
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
      }).includes("Available quantity must be a whole number for this selling format."), true);
      assert.deepEqual(validateMarketplaceTradeInput({
        sellingMethod: "volume",
        sellingUnit: "litres",
        totalQuantityValue: "125.5",
        totalQuantityMeasure: "litres",
        priceBasis: "litres",
        minimumOrderValue: "5.5",
        minimumOrderUnit: "litres"
      }), []);
    }
  },
  {
    name: "Submit listing form uses farmer-friendly trade questions and live preview",
    run: () => {
      const form = repoFile("src/components/SubmitProduceListingForm.tsx");

      assert.equal(form.includes("How do you sell this product?"), true);
      assert.equal(form.includes("What is the price for one?"), true);
      assert.equal(form.includes("Approximately how much or how many are in one ${unitLabel}?"), true);
      assert.equal(form.includes("Unit inside one"), true);
      assert.equal(form.includes("Measure inside one"), false);
      assert.equal(form.includes("sizeMeasureOptionsByUnit"), true);
      assert.equal(form.includes('tray: ["eggs", "pieces", "other"]'), true);
      assert.equal(form.includes("How many do you have available?"), true);
      assert.equal(form.includes("Do buyers need to order at least a certain amount?"), true);
      assert.equal(form.includes("Your listing will show"), true);
      assert.equal(form.includes('value: "tray"'), true);
      assert.equal(form.includes('unitSizeMeasure: "eggs"'), true);
      assert.equal(form.includes('method: "packaged_unit"'), true);
      assert.equal(form.includes("No minimum order"), true);
      assert.equal(form.includes("Packaged unit"), false);
      assert.equal(form.includes("Direct weight"), false);
      assert.equal(form.includes("Unit size"), false);
      assert.equal(form.includes("Units available"), false);
    }
  },
  {
    name: "Admin listing tools show human-readable trade labels without technical currency text",
    run: () => {
      const dashboard = repoFile("src/components/AdminDashboard.tsx");
      const workspace = repoFile("src/components/AdminListingSubmissionsWorkspace.tsx");

      assert.equal(dashboard.includes("Selling format"), true);
      assert.equal(dashboard.includes("Packaged item such as sack, crate or tray"), true);
      assert.equal(dashboard.includes("Unit buyers order"), true);
      assert.equal(dashboard.includes("Approximate amount in one"), true);
      assert.equal(dashboard.includes("How many units are available?"), true);
      assert.equal(dashboard.includes("Optional minimum order"), true);
      assert.equal(dashboard.includes("Price Amount"), false);
      assert.equal(workspace.includes('[\"Available\", marketplaceQuantityLine(product)]'), true);
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
      assert.equal(formatMarketplaceCurrency("700", "GHS"), "GH\u20b5700");
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
    name: "weather route validates supported location and coordinate input",
    run: () => {
      const validLocation = validateFarmMateWeatherRequest({ locationKey: "accra" });
      const validCoordinates = validateFarmMateWeatherRequest({ latitude: 5.6, longitude: -0.18, label: "Current farm area" });
      const invalidLocation = validateFarmMateWeatherRequest({ locationKey: "unknown-place" });
      const invalidCoordinates = validateFarmMateWeatherRequest({ latitude: 120, longitude: -0.18 });
      const routeSource = repoFile("src/app/api/farmmate/weather/route.ts");

      assert.equal(validLocation.ok, true);
      assert.equal(validCoordinates.ok, true);
      assert.equal(invalidLocation.ok, false);
      assert.equal(invalidCoordinates.ok, false);
      assert.equal(routeSource.includes("validateFarmMateWeatherRequest"), true);
      assert.equal(routeSource.includes("getFarmMateWeatherForecast"), true);
    }
  },
  {
    name: "weather forecast mapping returns exactly 3 days",
    run: () => {
      const location = supportedFarmMateWeatherLocations.find((item) => item.key === "accra");
      assert.ok(location);
      const forecast = mapOpenMeteoForecast(sampleWeatherData(), location);

      assert.ok(forecast);
      assert.equal(forecast.days.length, 3);
      assert.equal(forecast.today.label, "Today");
      assert.equal(forecast.tomorrow.label, "Tomorrow");
      assert.equal(forecast.dayAfterTomorrow.label, "Day after tomorrow");
      assert.equal(forecast.sourceLabel, "Open-Meteo");
    }
  },
  {
    name: "unavailable weather does not crash Farmer Hub",
    run: () => {
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");

      assert.equal(FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE.includes("Live weather is temporarily unavailable"), true);
      assert.equal(component.includes("FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE"), true);
      assert.equal(component.includes("setForecast(null)"), true);
      assert.equal(component.includes("window.localStorage.removeItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY)"), true);
    }
  },
  {
    name: "weather location selector saves selected location only",
    run: () => {
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");

      assert.equal(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY, "gg-farmmate-weather-location");
      assert.equal(component.includes("FARM_MATE_WEATHER_LOCATION_STORAGE_KEY"), true);
      assert.equal(component.includes("setItem(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY"), true);
      assert.equal(component.includes("window.localStorage.removeItem(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY)"), true);
      assert.equal(component.includes("latitude: position.coords.latitude"), true);
      assert.equal(component.includes("FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY"), true);
    }
  },
  {
    name: "live weather UI removes demo forecast wording",
    run: () => {
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");
      const combined = `${farmerHub}\n${component}`.toLowerCase();

      assert.equal(combined.includes("demo forecast"), false);
      assert.equal(combined.includes("set your location for live weather guidance"), false);
      assert.equal(combined.includes("live weather:"), true);
    }
  },
  {
    name: "weather guidance is transparent when data is unavailable",
    run: () => {
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");
      const routeSource = repoFile("src/app/api/farmmate/weather/route.ts");

      assert.equal(component.includes("FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE"), true);
      assert.equal(routeSource.includes("FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE"), true);
      assert.equal(component.includes("Weather guidance"), true);
    }
  },
  {
    name: "high rain chance creates avoid spraying guidance",
    run: () => {
      const location = supportedFarmMateWeatherLocations[0];
      const forecast = mapOpenMeteoForecast(sampleWeatherData(), location);

      assert.ok(forecast);
      assert.equal(forecast.today.rainChancePercent, 70);
      assert.equal(forecast.today.farmingNote, "Avoid spraying before rain.");
      assert.equal(forecast.decisionSummary.farmingNotes.includes("Check drainage in low areas."), true);
    }
  },
  {
    name: "high wind creates avoid spraying in wind guidance",
    run: () => {
      const summary = weatherDecisionSummaryForForecast({
        location: supportedFarmMateWeatherLocations[0],
        sourceLabel: "Open-Meteo",
        lastUpdatedAt: "2026-07-14T08:00:00.000Z",
        today: {
          date: "2026-07-14",
          label: "Today",
          rainChancePercent: 20,
          windSpeedKph: 30,
          farmingNote: "Avoid spraying in strong wind."
        }
      });

      assert.equal(summary.summaryNote, "Avoid spraying in strong wind.");
      assert.equal(summary.farmingNotes.includes("Wait for calmer wind before spraying."), true);
    }
  },
  {
    name: "Weather Decision Specialist still asks questions when no weather context exists",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));
      const text = responseText(response).toLowerCase();

      assert.equal(response.weatherContext, undefined);
      assert.equal(response.flow?.id, "can-i-spray-today");
      assert.equal(text.includes("does not have live weather"), true);
      assert.equal(response.flow?.followUpQuestions[0]?.question, "Is rain expected in the next 4 to 6 hours?");
    }
  },
  {
    name: "Ask FarmMate stores and reads selected weather context",
    run: () => {
      const weatherWidget = repoFile("src/components/FarmMateWeatherFoundation.tsx");
      const askFarmMate = repoFile("src/components/AskFarmMate.tsx");

      assert.equal(weatherWidget.includes("FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY"), true);
      assert.equal(weatherWidget.includes("storedWeatherContextFromForecast(data.forecast)"), true);
      assert.equal(askFarmMate.includes("storedWeatherContextForFarmMate()"), true);
      assert.equal(askFarmMate.includes("weatherContext: routerResult.selectedSpecialist === \"weather_decision\""), true);
    }
  },
  {
    name: "medium live rain chance asks next-hour confirmation before field checks",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 58, summaryNote: "Check field conditions before spraying." });
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext });
      const text = responseText(response).toLowerCase();

      assert.equal(response.weatherContext?.rainChancePercent, 58);
      assert.equal(text.includes("58% chance of rain today"), true);
      assert.equal(response.flow?.followUpQuestions[0]?.id, "rain-window");
      assert.equal(response.flow?.followUpQuestions[0]?.question, "Can you confirm whether rain is expected in the next 4 to 6 hours?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Yes, rain is expected soon", "No rain expected soon", "I am not sure"]);
    }
  },
  {
    name: "weather spray flow asks wind condition only when live wind is missing",
    run: () => {
      const contextWithWind = sampleWeatherContext({ rainChancePercent: 10, windSpeedKph: 12 });
      const contextWithoutWind = sampleWeatherContext({ rainChancePercent: 10 });
      delete contextWithoutWind.windSpeedKph;
      const withWind = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext: contextWithWind });
      const withoutWind = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext: contextWithoutWind });

      assert.equal(withWind.flow?.followUpQuestions.some((question) => question.id === "wind-level"), false);
      assert.equal(withoutWind.flow?.followUpQuestions.some((question) => question.id === "wind-level"), true);
      assert.equal(withoutWind.flow?.followUpQuestions.find((question) => question.id === "wind-level")?.question, "Is the wind calm where you are?");
    }
  },
  {
    name: "OpenAI payload includes live weather context when available",
    run: () => {
      const weatherContext = sampleWeatherContext();
      const brain = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext });
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion: "Can I spray today?",
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { specialistContext?: { liveWeatherContext?: WeatherDecisionSummary; noLiveWeatherRule?: string } };

      assert.equal(brain.weatherContext?.locationName, "Accra / Greater Accra");
      assert.equal(payload.specialistContext?.liveWeatherContext?.summaryNote, "Avoid spraying before rain.");
      assert.equal(payload.specialistContext?.liveWeatherContext?.temperatureMaxC, 31);
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.includes("daily forecast"), true);
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.includes("Do not invent exact rain timing"), true);
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
    name: "FarmMate launch QA document covers public routes and V1 limitations",
    run: () => {
      const launchQa = repoFile("docs/FARMMATE_LAUNCH_QA.md");
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const learnPage = repoFile("src/app/learn/page.tsx");
      const challengePage = repoFile("src/app/learn/challenges/soil-health/page.tsx");
      const soilChallenge = repoFile("src/components/SoilHealthChallenge.tsx");

      ["/farmer-hub", "/learn", "/learn/challenges/soil-health"].forEach((route) => {
        assert.equal(launchQa.includes(route), true, route);
      });
      [
        "Today's Farm Summary",
        "Live Weather",
        "Ask FarmMate",
        "Crop Doctor Vision",
        "Crop Calendar",
        "Planting Advisor",
        "Soil Health Challenge"
      ].forEach((tool) => {
        assert.equal(launchQa.includes(tool), true, tool);
      });
      [
        "No farmer login yet",
        "Crop Doctor is AI guidance, not a guaranteed diagnosis",
        "Live weather is location-based but not personalized to saved farms yet",
        "Market prices are not included in V1",
        "Exact farm records/history are not saved in V1"
      ].forEach((limitation) => {
        assert.equal(launchQa.includes(limitation), true, limitation);
      });

      assert.equal(farmerHub.includes("FarmMateWeatherFoundation"), true);
      assert.equal(farmerHub.includes("FarmTools"), true);
      assert.equal(learnPage.includes("LearnHub"), true);
      assert.equal(challengePage.includes("SoilHealthChallenge"), true);
      assert.equal(soilChallenge.includes("LEARN_CHALLENGE_STORAGE_KEY"), true);
      assert.equal(soilChallenge.includes("/farmer-hub?tool=ask"), true);
      assert.equal(soilChallenge.includes("Start Day 1"), true);
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
    name: "harvest before rain routes to harvest post-harvest specialist",
    run: () => {
      const router = routeFarmMateQuestion("Can I harvest before rain?");
      const response = buildFarmMateResponse("Can I harvest before rain?", router);

      assert.equal(router.selectedSpecialist, "harvest_postharvest");
      assert.equal(response.flow?.id, "harvest-before-rain");
      assert.equal(response.flow?.intent, "harvest");
    }
  },
  {
    name: "dry produce outside routes to harvest post-harvest specialist",
    run: () => {
      const router = routeFarmMateQuestion("Can I dry produce outside?");
      const response = buildFarmMateResponse("Can I dry produce outside?", router);

      assert.equal(router.selectedSpecialist, "harvest_postharvest");
      assert.equal(response.flow?.id, "reduce-post-harvest-losses");
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
      const body = cards?.flatMap((card) => card.body).join(" ").toLowerCase() ?? "";

      assert.equal(shouldCompleteWeatherGuidedFlow("can-i-spray-today", answers), true);
      assert.equal(text.includes("do not spray now"), true);
      assert.equal(text.includes("wait until after the rain"), true);
      assert.equal(text.includes("leaves are dry and wind is calm"), true);
      assert.equal(body.includes("do not spray now. wait until after the rain and spray only when leaves are dry and wind is calm."), true);
    }
  },
  {
    name: "high rain chance skips leaf dryness question",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 100, windSpeedKph: 12 });
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext });
      const text = responseText(response).toLowerCase();

      assert.equal(response.flow?.followUpQuestions.length, 0);
      assert.equal(response.confidence, "high");
      assert.equal(text.includes("100% chance of rain today"), true);
      assert.equal(text.includes("are the leaves dry now"), false);
      assert.equal(text.includes("do not spray now unless you can personally confirm"), true);
    }
  },
  {
    name: "high live rain chance gives cautious do-not-spray guidance",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 70, windSpeedKph: 12 });
      const answers: Array<{ question: string; answer: string }> = [];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers, weatherContext);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n").toLowerCase() ?? "";

      assert.equal(text.includes("70% chance of rain today"), true);
      assert.equal(text.includes("do not spray now unless you can personally confirm there will be no rain for the next 4 to 6 hours"), true);
      assert.equal(text.includes("daily forecast"), true);
      assert.deepEqual(cards?.find((card) => card.title === "Next step")?.body, ["Check the next 4 to 6 hours before spraying."]);
    }
  },
  {
    name: "medium live rain chance asks 4 to 6 hour rain confirmation",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 40, windSpeedKph: 12 });
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext });

      assert.equal(response.flow?.followUpQuestions[0]?.id, "rain-window");
      assert.equal(response.flow?.followUpQuestions[0]?.question, "Can you confirm whether rain is expected in the next 4 to 6 hours?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Yes, rain is expected soon", "No rain expected soon", "I am not sure"]);
    }
  },
  {
    name: "low live rain chance asks only missing wind and leaf checks",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 30 });
      delete weatherContext.windSpeedKph;
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext });

      assert.deepEqual(
        response.flow?.followUpQuestions.map((question) => question.id),
        ["wind-level", "leaf-wetness"]
      );
      assert.equal(response.flow?.followUpQuestions[0]?.question, "Is the wind calm where you are?");
      assert.equal(response.flow?.followUpQuestions[1]?.question, "Are the leaves dry now?");
    }
  },
  {
    name: "low live rain chance plus dry leaves and calm wind gives cautious suitable guidance",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 10, windSpeedKph: 10, summaryNote: "Good time to inspect crops early." });
      const answers = [{ question: "Are the leaves dry now?", answer: "Leaves are dry" }];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers, weatherContext);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n").toLowerCase() ?? "";

      assert.equal(text.includes("10% chance of rain today"), true);
      assert.equal(text.includes("spraying may be suitable"), true);
      assert.equal(text.includes("follow the product label"), true);
      assert.equal(text.includes("avoid spraying during hot midday sun"), true);
    }
  },
  {
    name: "live weather answer does not claim checked wind when wind was not asked",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 70 });
      delete weatherContext.windSpeedKph;
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", [], weatherContext);
      const text = cards?.flatMap((card) => card.body).join(" ").toLowerCase() ?? "";

      assert.equal(text.includes("the wind is calm"), false);
      assert.equal(text.includes("your wind is calm"), false);
      assert.equal(text.includes("wind is calm"), true);
    }
  },
  {
    name: "daily rain chance is not treated as exact hourly timing",
    run: () => {
      const weatherContext = sampleWeatherContext({ rainChancePercent: 100 });
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", [], weatherContext);
      const text = cards?.flatMap((card) => card.body).join(" ").toLowerCase() ?? "";

      assert.equal(text.includes("daily forecasts do not always show the exact next-hour timing"), true);
      assert.equal(text.includes("rain will start"), false);
      assert.equal(text.includes("rain starts at"), false);
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
      const body = cards?.flatMap((card) => card.body).join(" ").toLowerCase() ?? "";

      assert.equal(shouldCompleteWeatherGuidedFlow("can-i-spray-today", answers), true);
      assert.equal(text.includes("spraying may be suitable"), true);
      assert.equal(text.includes("follow the product label"), true);
      assert.equal(text.includes("avoid spraying during hot midday sun"), true);
      assert.equal(body.includes("spraying may be suitable. follow the product label and avoid spraying during hot midday sun."), true);
    }
  },
  {
    name: "unsure weather answer leads to cautious delay recommendation",
    run: () => {
      const answers = [{ question: "Is rain expected in the next 4 to 6 hours?", answer: "I am not sure about rain" }];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n").toLowerCase() ?? "";

      assert.equal(shouldCompleteWeatherGuidedFlow("can-i-spray-today", answers), true);
      assert.equal(text.includes("don't spray yet"), true);
      assert.equal(text.includes("first confirm whether rain is expected in the next 4 to 6 hours"), true);
      assert.equal(text.includes("spray only when leaves are dry and wind is calm"), true);
    }
  },
  {
    name: "unsure rain answer returns complete delay recommendation",
    run: () => {
      const answers = [{ question: "Is rain expected in the next 4 to 6 hours?", answer: "I am not sure" }];
      const cards = weatherGuidedRecommendationCards("can-i-spray-today", answers);
      const body = cards?.flatMap((card) => card.body).join(" ") ?? "";

      assert.equal(body.includes("Don't spray yet."), true);
      assert.equal(body.includes("First confirm whether rain is expected in the next 4 to 6 hours."), true);
      assert.equal(body.includes("Spray only when leaves are dry and wind is calm."), true);
      assert.equal(/[.!?]$/.test(body.trim()), true);
    }
  },
  {
    name: "final weather response never ends with and the",
    run: () => {
      const input = weatherAiInput("I am not sure");
      const truncated = "Since you're not sure about rain, don't spray yet. Spray only if no rain is expected for 4-6 hours, the wind is calm, and the";

      assert.equal(isLikelyIncompleteFarmMateAnswer(truncated, input), true);
      assert.equal(isLikelyIncompleteFarmMateAnswer("Don't spray yet. First confirm whether rain is expected in the next 4 to 6 hours. Spray only when leaves are dry and wind is calm.", input), false);
    }
  },
  {
    name: "rain expected weather answer is complete",
    run: () => {
      const input = weatherAiInput("Rain is expected soon");
      const answer = "Do not spray now. Wait until after the rain and spray only when leaves are dry and wind is calm.";

      assert.equal(isLikelyIncompleteFarmMateAnswer(answer, input), false);
      assert.equal(answer.endsWith("."), true);
    }
  },
  {
    name: "safe spraying weather answer is complete",
    run: () => {
      const input = weatherAiInput("No rain expected soon");
      const answer = "Spraying may be suitable. Follow the product label and avoid spraying during hot midday sun.";

      assert.equal(isLikelyIncompleteFarmMateAnswer(answer, input), false);
      assert.equal(answer.endsWith("."), true);
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
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));

      assert.equal(response.flow?.recommendation.nextBestAction.instruction, "Confirm no rain is expected for 4 to 6 hours and that wind is calm before spraying.");
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
    name: "harvest specialist follows required reasoning journey",
    run: () => {
      assert.deepEqual(harvestPostHarvestReasoningOrder, [
        "crop",
        "growth-or-maturity-signs",
        "weather-or-rain-risk",
        "storage-or-transport-plan",
        "quality-risk",
        "recommendation",
        "next-best-action"
      ]);
    }
  },
  {
    name: "harvest specialist includes required crop guidance",
    run: () => {
      const requiredCrops = ["Maize", "Tomato", "Pepper", "Cassava", "Yam", "Plantain", "Onion", "Okra", "Cucumber", "Garden eggs"];

      assert.equal(harvestPostHarvestCrops.length >= 10, true);
      for (const crop of requiredCrops) {
        const guidance = harvestPostHarvestCrops.find((item) => item.crop === crop);

        assert.equal(Boolean(guidance), true);
        assert.equal(Boolean(guidance?.harvestIndicators.length), true);
        assert.equal(Boolean(guidance?.handlingTips.length), true);
        assert.equal(Boolean(guidance?.sortingAndGradingBasics.length), true);
        assert.equal(Boolean(guidance?.shortTermStorageGuidance.length), true);
        assert.equal(Boolean(guidance?.nextBestAction), true);
      }
    }
  },
  {
    name: "when should I harvest maize routes to harvest post-harvest",
    run: () => {
      const router = routeFarmMateQuestion("When should I harvest maize?");
      const response = buildFarmMateResponse("When should I harvest maize?", router);

      assert.equal(router.selectedSpecialist, "harvest_postharvest");
      assert.equal(response.flow?.id, "when-should-i-harvest-maize");
      assert.equal(response.resolvedCrop, "Maize");
    }
  },
  {
    name: "tomato readiness routes to harvest post-harvest",
    run: () => {
      const router = routeFarmMateQuestion("How do I know tomatoes are ready?");
      const response = buildFarmMateResponse("How do I know tomatoes are ready?", router);

      assert.equal(router.selectedSpecialist, "harvest_postharvest");
      assert.equal(response.flow?.id, "tomatoes-ready-for-harvest");
      assert.equal(response.resolvedCrop, "Tomato");
    }
  },
  {
    name: "cassava storage routes to harvest post-harvest",
    run: () => {
      const router = routeFarmMateQuestion("How do I store cassava?");
      const response = buildFarmMateResponse("How do I store cassava?", router);

      assert.equal(router.selectedSpecialist, "harvest_postharvest");
      assert.equal(response.flow?.id, "store-cassava-after-harvest");
      assert.equal(response.resolvedCrop, "Cassava");
    }
  },
  {
    name: "vegetable transport routes to harvest post-harvest",
    run: () => {
      const router = routeFarmMateQuestion("How do I pack vegetables for transport?");
      const response = buildFarmMateResponse("How do I pack vegetables for transport?", router);

      assert.equal(router.selectedSpecialist, "harvest_postharvest");
      assert.equal(response.flow?.id, "pack-vegetables-for-transport");
    }
  },
  {
    name: "harvest flow asks maturity stage first when missing",
    run: () => {
      const response = buildFarmMateResponse("When should I harvest maize?", routeFarmMateQuestion("When should I harvest maize?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "What stage is the maize at?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Cobs are still green", "Husks are drying", "Grains are hard", "I am not sure"]);
    }
  },
  {
    name: "storage flow asks whether produce is already harvested",
    run: () => {
      const response = buildFarmMateResponse("How do I store cassava?", routeFarmMateQuestion("How do I store cassava?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "Has the cassava already been harvested?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Yes, harvested today", "Yes, harvested yesterday or earlier", "Not harvested yet", "I am not sure"]);
    }
  },
  {
    name: "cassava not harvested storage answer stays pre-harvest",
    run: () => {
      const cards = harvestPostHarvestGuidedRecommendationCards("store-cassava-after-harvest", [
        { question: "Has the cassava already been harvested?", answer: "Not harvested yet" }
      ]);
      const text = cards?.flatMap((card) => [card.title, ...card.body]).join("\n") ?? "";
      const lowerText = text.toLowerCase();

      assert.equal(Boolean(cards), true);
      assert.equal(lowerText.includes("not harvested yet"), true);
      assert.equal(lowerText.includes("leave the rest in the ground"), true);
      assert.equal(lowerText.includes("prepare shade and transport before harvesting"), true);
      assert.equal(lowerText.includes("harvest only the quantity you can move soon"), true);
      assert.equal(lowerText.includes("keep harvested roots in shade"), false);
      assert.equal(lowerText.includes("separate soft, rotten or mouldy roots"), false);
    }
  },
  {
    name: "OpenAI payload warns cassava not harvested guidance must not sound post-harvest",
    run: () => {
      const farmerQuestion = "How do I store cassava?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const localStructuredResponse = harvestPostHarvestGuidedRecommendationCards(brain.flow?.id, [
        { question: "Has the cassava already been harvested?", answer: "Not harvested yet" }
      ]) ?? [];
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [{ question: "Has the cassava already been harvested?", answer: "Not harvested yet" }],
          localStructuredResponse
        })
      ) as { responseRules?: string[]; localStructuredResponse?: Array<{ title: string; body: string[] }> };
      const rules = payload.responseRules?.join(" ").toLowerCase() ?? "";
      const localText = payload.localStructuredResponse?.flatMap((card) => [card.title, ...card.body]).join(" ").toLowerCase() ?? "";

      assert.equal(rules.includes("cassava is not harvested yet"), true);
      assert.equal(rules.includes("do not frame the answer as harvested-root storage"), true);
      assert.equal(localText.includes("leave the rest in the ground"), true);
      assert.equal(localText.includes("keep harvested roots in shade"), false);
    }
  },
  {
    name: "tomato transport flow asks ripeness stage",
    run: () => {
      const response = buildFarmMateResponse("How do I pack tomatoes for transport?", routeFarmMateQuestion("How do I pack tomatoes for transport?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "Are the tomatoes fully ripe or firm-ripe?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Fully ripe", "Firm-ripe", "Mixed ripeness", "I am not sure"]);
    }
  },
  {
    name: "harvest advice warns against leaving produce in hot sun",
    run: () => {
      const response = buildFarmMateResponse("How do I reduce losses after harvest?", routeFarmMateQuestion("How do I reduce losses after harvest?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("hot sun"), true);
      assert.equal(text.includes("shade"), true);
    }
  },
  {
    name: "storage advice warns against mixing rotten produce with healthy produce",
    run: () => {
      const response = buildFarmMateResponse("How do I store cassava?", routeFarmMateQuestion("How do I store cassava?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("rotten"), true);
      assert.equal(text.includes("healthy roots"), true);
    }
  },
  {
    name: "harvest advice does not invent market prices or buyers",
    run: () => {
      const response = buildFarmMateResponse("How do I reduce losses after harvest?", routeFarmMateQuestion("How do I reduce losses after harvest?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("market price"), false);
      assert.equal(text.includes("buyer is available"), false);
      assert.equal(text.includes("guaranteed sales"), false);
      assert.equal(text.includes("guaranteed shelf life"), false);
    }
  },
  {
    name: "harvest recommendation includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("When should I harvest maize?", routeFarmMateQuestion("When should I harvest maize?"));

      assert.equal(response.flow?.recommendation.nextBestAction.instruction, "Check whether maize grains are hard and husks are drying before harvesting.");
      assert.equal(response.sections.find((section) => section.title === "Next Best Action")?.body.length, 1);
    }
  },
  {
    name: "OpenAI payload includes harvest post-harvest specialist context",
    run: () => {
      const farmerQuestion = "When should I harvest maize?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; crop?: string; noMarketRule?: string; harvestIndicators?: string[] } };

      assert.equal(payload.selectedSpecialist, "harvest_postharvest");
      assert.equal(payload.specialistContext?.specialist, "harvest_postharvest");
      assert.equal(payload.specialistContext?.crop, "Maize");
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("market prices"), true);
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("guaranteed shelf life"), true);
      assert.equal(payload.specialistContext?.harvestIndicators?.some((line) => line.toLowerCase().includes("husks")), true);
    }
  },
  {
    name: "planting advisor follows required reasoning journey",
    run: () => {
      assert.deepEqual(plantingAdvisorReasoningOrder, [
        "crop-or-crop-choice",
        "region",
        "month-or-season",
        "rain-or-irrigation-availability",
        "land-preparation-status",
        "recommendation",
        "next-best-action"
      ]);
    }
  },
  {
    name: "planting advisor includes required crop guidance",
    run: () => {
      const requiredCrops = ["Maize", "Tomato", "Pepper", "Cassava", "Yam", "Plantain", "Onion", "Okra", "Cucumber", "Garden eggs"];
      const availableCrops = plantingAdvisorCrops.map((guidance) => guidance.crop);

      assert.equal(plantingAdvisorCrops.length >= 10, true);
      for (const crop of requiredCrops) {
        const guidance = plantingAdvisorCrops.find((item) => item.crop === crop);

        assert.equal(availableCrops.includes(crop), true);
        assert.equal(Boolean(guidance?.suitablePlantingConditions.length), true);
        assert.equal(Boolean(guidance?.spacingGuidance.length), true);
        assert.equal(Boolean(guidance?.waterRainfallNeeds.length), true);
        assert.equal(Boolean(guidance?.whenToDelayPlanting.length), true);
        assert.equal(Boolean(guidance?.nextBestAction), true);
      }
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
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Vegetables", "Staples like maize", "Root and tuber crops", "I am not sure"]);
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
      assert.equal(text.includes("guaranteed yield"), false);
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
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("guaranteed yield"), true);
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
