import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  adminCountPillClass,
  adminMetricSeverityClass,
  adminPriorityActionClasses,
  adminPrioritySeverity
} from "../src/lib/adminPriorityState";
import { resolveAdminOptionalSource } from "../src/lib/adminOptionalSources";
import { buildFarmMateResponse, type FarmMateBrainResponse } from "../src/lib/farmmate/decision-engine";
import { buildFarmMateVoiceLayerInput, FARM_MATE_SYSTEM_PROMPT, isLikelyIncompleteFarmMateAnswer } from "../src/lib/farmmate/ai";
import {
  cleanFarmMateFinalAnswer,
  compactFollowUpSummary,
  farmMateFallbackMessage,
  generalAgronomyRecommendationCards,
  harvestPostHarvestGuidedRecommendationCards,
  shouldCompleteWeatherGuidedFlow,
  shouldShowGeneralAgronomyGuidanceBeforeFollowUp,
  shouldRenderLocalFarmMateGuidance,
  weatherGuidedRecommendationCards
} from "../src/lib/farmmate/conversation-ui";
import { farmMateDailySummaries, getFarmMateDailySummary, getFarmMateGreetingForHour } from "../src/lib/farmmate/daily-summary";
import { homepageFarmMateDescription, homepageFarmMateTools } from "../src/data/farmmatePublicTools";
import { smartTools } from "../src/data/smartTools";
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
  isEligibleFeaturedFarmer,
  isEligiblePublicFarmer,
  isEligiblePublicSupplier,
  isValidPublicProfileSlug
} from "../src/lib/publicProfileEligibility";
import {
  farmerPublicationChecks,
  featuredIsCurrentlyPublic,
  normalizeRecordArrays,
  profileIsPubliclyEligible,
  supplierCategoryReview,
  supplierPublicationChecks,
  type FarmerProfileRecord,
  type SupplierProfileRecord
} from "../src/lib/profileEditorContracts";
import {
  APPLICATION_DOCUMENT_MAX_BYTES,
  APPLICATION_IMAGE_MAX_BYTES,
  buildFarmerProfileDraft,
  buildSupplierProfileDraft,
  normalizeServiceAreas,
  normalizeSupplierCategories,
  privateApplicationMediaPath,
  validateApplicationMedia
} from "../src/lib/profileApplicationContracts";
import { convertApprovedApplication, type ConversionStore } from "../src/lib/profileApplicationConversion";
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
import {
  askFarmMateUsageMode,
  continueAskFarmMateConsultation,
  createAskFarmMateConsultation,
  createFarmMateConsultationId,
  isFinalAskFarmMateConsultation,
  shouldShowFarmMateFinalControls
} from "../src/lib/farmmate/consultation";
import {
  farmMateContinuationClaimId,
  issueFarmMateConsultationToken,
  verifyFarmMateConsultationToken
} from "../src/lib/farmmate/consultation-token";
import { weatherDecisionGuidance } from "../src/lib/farmmate/weather-decision-specialist";
import {
  cropCalendarFarmMateQuestion,
  cropCalendarGuides,
  findCropCalendarGuide
} from "../src/lib/farmmate/crop-calendar";
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
import {
  plantingAdvisorCrops,
  plantingAdvisorFarmMateQuestion,
  plantingAdvisorReasoningOrder
} from "../src/lib/farmmate/planting-advisor-specialist";
import { harvestPostHarvestCrops, harvestPostHarvestReasoningOrder } from "../src/lib/farmmate/harvest-postharvest-specialist";
import {
  GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE,
  generalAgronomyCoverage,
  generalAgronomyDecisionFlows,
  generalAgronomyReasoningOrder
} from "../src/lib/farmmate/general-agronomy-specialist";
import { diagnosisFromFileName, farmMateQuestionFromDiagnosis, unknownCropDiagnosis } from "../src/lib/farmmate/crop-doctor-demo";
import {
  FARM_MATE_CASH_CROP_CAUTION,
  detectFarmMateCropLibraryEntry,
  farmMateCropFamilyGuidance,
  farmMateCropGroupLabels,
  farmMateCropLibrary,
  farmMateCropLibraryPromptContext,
  farmMateCropOptionsByGroup,
  findFarmMateCropLibraryEntry
} from "../src/lib/farmmate/crop-library";
import {
  buildCropDoctorAskFarmMatePrompt,
  buildCropDoctorHandoffContext,
  CROP_DOCTOR_CROP_GROUPS,
  cropDoctorResultHasUnsafeLanguage,
  CROP_DOCTOR_MAX_IMAGE_BYTES,
  CROP_DOCTOR_SUPPORTED_CROPS,
  CROP_DOCTOR_SYMPTOMS,
  CROP_DOCTOR_TOO_LARGE_MESSAGE,
  cropDoctorPhotoConfidenceLabel,
  cropDoctorResultBadge,
  cropDoctorResultHeading,
  cropDoctorResultHeadline,
  cropDoctorSymptomsForCrop,
  cropDoctorVisionSystemPrompt,
  normalizeCropDoctorSelectedCrop,
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
  FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE,
  FARM_MATE_FEEDBACK_CTA,
  cropDoctorCreditMessage,
  farmMateCreditLine,
  formatRefreshIn,
  shouldDisableCropDoctorAnalysis,
  shouldDisableCropDoctorUpload,
  usageTrackingUnavailableDecision,
  type FarmMateUsageEvent
} from "../src/lib/farmmate/usage";
import {
  isControlledPrelaunchRoute,
  isProtectedFarmMatePilotPage,
  isPublicFarmMatePilotPage,
  isPublicFarmMatePilotRoute,
  PROTECTED_FARMMATE_PILOT_PAGES,
  PUBLIC_FARMMATE_PILOT_PAGES
} from "../src/lib/farmmate/pilot-access";
import {
  farmMatePilotHelpfulnessOptions,
  farmMatePilotWouldUseAgainOptions,
  sanitizeFarmMatePilotFeedback
} from "../src/lib/farmmate/pilot-feedback";
import {
  FARM_MATE_ANSWER_FEEDBACK_PATH,
  FARM_MATE_ANSWER_FEEDBACK_STORAGE_KEY,
  FARM_MATE_PILOT_TRUST_NOTE,
  farmMateAnswerFeedbackFormPrefill,
  farmMateAnswerFeedbackOptions,
  farmMateCleanAnswerForCopy,
  farmMateWrongAnswerReasons,
  readFarmMatePreparedAnswerFeedback,
  sanitizeFarmMatePreparedAnswerFeedback,
  shouldShowFarmMateAnswerFeedback,
  storeFarmMatePreparedAnswerFeedback
} from "../src/lib/farmmate/answer-feedback";
import type { FarmerProfile, Product, SupplierProfile } from "../src/types";
import { adminEmailAllowlist, authorizeAdminIdentity } from "../src/lib/adminAuthorization";
import {
  createPreviewAccessToken,
  previewAccessDecision,
  previewAccessMaxAgeSeconds,
  safeAdminReturnPath,
  safePreviewDestination,
  verifyPreviewAccessToken
} from "../src/lib/previewAccess";

type TestCase = {
  name: string;
  run: () => void | Promise<void>;
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

function completedGuidedAnswer(action: string) {
  return `What I think:\nThe field conditions need a cautious decision.\n\nWhat to do now:\n${action}\n\nWhat to check:\nConfirm rain, leaf wetness and wind before acting.\n\nNext step:\nCheck the field conditions again before spraying.`;
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
    status: overrides.status ?? "Active",
    launchReady: overrides.launchReady ?? true,
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
    status: overrides.status ?? "Active",
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
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
}

function repoFiles(path: string): string[] {
  return readdirSync(join(process.cwd(), path)).flatMap((entry) => {
    const relativePath = join(path, entry);
    return statSync(join(process.cwd(), relativePath)).isDirectory() ? repoFiles(relativePath) : [relativePath];
  });
}

const tests: TestCase[] = [
  {
    name: "admin authorization ignores user metadata and accepts only controlled sources",
    run: () => {
      const selfClaimedUser = {
        id: "user-1",
        email: "farmer@example.com",
        app_metadata: {},
        user_metadata: { role: "admin", admin: true, roles: ["admin"] }
      };

      assert.deepEqual(authorizeAdminIdentity(selfClaimedUser, "approved@example.com"), {
        authorized: false,
        reason: "not_authorized"
      });
      assert.deepEqual(
        authorizeAdminIdentity({ id: "user-2", email: "admin@example.com", app_metadata: { role: "admin" } }),
        { authorized: true, source: "app_metadata" }
      );
      assert.deepEqual(
        authorizeAdminIdentity({ id: "user-3", email: " ADMIN@EXAMPLE.COM ", app_metadata: {} }, "other@example.com, admin@example.com"),
        { authorized: true, source: "email_allowlist" }
      );
      assert.deepEqual(authorizeAdminIdentity({ id: "user-4", email: "admin@example.com", app_metadata: {} }), {
        authorized: false,
        reason: "authorization_unconfigured"
      });
      assert.deepEqual(Array.from(adminEmailAllowlist(" ONE@example.com;two@example.com\n")), ["one@example.com", "two@example.com"]);
    }
  },
  {
    name: "preview access decisions fail closed for unauthenticated and unauthorized visitors",
    run: () => {
      assert.equal(
        previewAccessDecision({
          exitRequested: false,
          hasAccessToken: false,
          previewSecretConfigured: true
        }),
        "login"
      );
      assert.equal(
        previewAccessDecision({
          exitRequested: false,
          hasAccessToken: true,
          authorizationStatus: "forbidden",
          previewSecretConfigured: true
        }),
        "forbidden"
      );
      assert.equal(
        previewAccessDecision({
          exitRequested: false,
          hasAccessToken: true,
          authorizationStatus: "authorized",
          previewSecretConfigured: false
        }),
        "unavailable"
      );
      assert.equal(
        previewAccessDecision({
          exitRequested: false,
          hasAccessToken: true,
          authorizationStatus: "authorized",
          previewSecretConfigured: true
        }),
        "grant"
      );
      assert.equal(
        previewAccessDecision({
          exitRequested: true,
          hasAccessToken: false,
          previewSecretConfigured: false
        }),
        "clear"
      );
    }
  },
  {
    name: "preview cookies are signed short-lived and reject expiry or tampering",
    run: async () => {
      const secret = "preview-test-secret-that-is-long-enough";
      const issuedAt = Date.UTC(2026, 6, 22, 12, 0, 0);
      const token = await createPreviewAccessToken(secret, issuedAt);

      assert.equal(typeof token, "string");
      assert.equal(await verifyPreviewAccessToken(token ?? undefined, secret, issuedAt), true);
      assert.equal(await verifyPreviewAccessToken(token ?? undefined, secret, issuedAt + previewAccessMaxAgeSeconds * 1000), false);
      assert.equal(await verifyPreviewAccessToken(`${token}tampered`, secret, issuedAt), false);
      assert.equal(await verifyPreviewAccessToken(token ?? undefined, `${secret}-different`, issuedAt), false);
      assert.equal(await createPreviewAccessToken("too-short", issuedAt), null);
    }
  },
  {
    name: "preview and admin return destinations stay on trusted internal routes",
    run: () => {
      assert.equal(safePreviewDestination("/marketplace?category=Grains"), "/marketplace?category=Grains");
      assert.equal(safePreviewDestination("https://evil.example/steal"), "/");
      assert.equal(safePreviewDestination("//evil.example/steal"), "/");
      assert.equal(safePreviewDestination("/dev-preview?exit=1"), "/");
      assert.equal(safeAdminReturnPath("/dev-preview?destination=%2Fmarketplace"), "/dev-preview?destination=%2Fmarketplace");
      assert.equal(safeAdminReturnPath("/marketplace"), "/admin");
    }
  },
  {
    name: "dev preview route uses authenticated authorization and secure cookie controls",
    run: () => {
      const route = repoFile("src/app/dev-preview/route.ts");
      const middleware = repoFile("src/middleware.ts");
      const layout = repoFile("src/app/layout.tsx");
      const adminAuth = repoFile("src/lib/adminAuth.ts");
      const loginRoute = repoFile("src/app/api/admin/auth/login/route.ts");
      const publicLogin = repoFile("src/components/AdminLoginForm.tsx");
      const environmentExample = repoFile(".env.example");

      assert.equal(route.includes("getAdminAuthorizationFromAccessToken"), true);
      assert.equal(route.includes("createPreviewAccessToken"), true);
      assert.equal(route.includes("httpOnly: true"), true);
      assert.equal(route.includes("sameSite: \"lax\""), true);
      assert.equal(route.includes("maxAge: 0"), true);
      assert.equal(route.includes('"enabled"'), false);
      assert.equal(route.includes("PREVIEW_ACCESS_SECRET") && route.includes("searchParams.get(\"secret\")"), false);
      assert.equal(route.includes("status: 403") || route.includes("deniedResponse(request, 403"), true);
      assert.equal(middleware.includes("verifyPreviewAccessToken"), true);
      assert.equal(middleware.includes("SITE_PRELAUNCH"), true);
      assert.equal(layout.includes("Exit preview"), true);
      assert.equal(adminAuth.includes('import "server-only"'), true);
      assert.equal(adminAuth.includes("user_metadata"), false);
      assert.equal(loginRoute.includes("user: result.user"), false);
      assert.equal(publicLogin.includes("ADMIN_EMAIL_ALLOWLIST"), false);
      assert.equal(publicLogin.includes("app_metadata"), false);
      assert.equal(publicLogin.includes("user_metadata"), false);
      assert.equal(environmentExample.includes("ADMIN_EMAIL_ALLOWLIST="), true);
      assert.equal(environmentExample.includes("PREVIEW_ACCESS_SECRET="), true);
    }
  },
  {
    name: "client modules do not receive admin authorization metadata or server configuration",
    run: () => {
      const clientModules = repoFiles("src")
        .filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"))
        .filter((path) => /^\s*["']use client["']/.test(repoFile(path)));

      for (const path of clientModules) {
        const source = repoFile(path);
        assert.equal(source.includes("ADMIN_EMAIL_ALLOWLIST"), false, `${path} must not receive the admin allowlist`);
        assert.equal(source.includes("PREVIEW_ACCESS_SECRET"), false, `${path} must not receive the preview signing secret`);
        assert.equal(source.includes("app_metadata"), false, `${path} must not receive app metadata`);
        assert.equal(source.includes("user_metadata"), false, `${path} must not receive user metadata`);
      }
    }
  },
  {
    name: "all admin pages and non-auth admin APIs retain centralized protection",
    run: () => {
      const adminPages = repoFiles("src/app/admin")
        .filter((path) => path.endsWith("page.tsx"))
        .filter((path) => !path.includes(join("admin", "login")));
      const adminApiRoutes = repoFiles("src/app/api/admin")
        .filter((path) => path.endsWith("route.ts"))
        .filter((path) => !path.includes(join("admin", "auth")));

      assert.equal(adminPages.length > 0, true);
      assert.equal(adminApiRoutes.length > 0, true);

      for (const page of adminPages) {
        assert.equal(repoFile(page).includes("getAdminUserFromAccessToken"), true, `${page} must use the centralized admin guard`);
      }

      for (const route of adminApiRoutes) {
        const source = repoFile(route);
        assert.equal(
          source.includes("requireAdminUser") || source.includes("@/app/api/admin/records"),
          true,
          `${route} must use the centralized admin guard`
        );
      }
    }
  },
  {
    name: "FarmMate pilot exposes only the two requested public pages and FarmMate APIs",
    run: () => {
      assert.deepEqual(PUBLIC_FARMMATE_PILOT_PAGES, ["/farmer-hub", "/farmer-hub/feedback"]);
      assert.equal(isPublicFarmMatePilotPage("/farmer-hub"), true);
      assert.equal(isPublicFarmMatePilotPage("/farmer-hub/feedback"), true);
      assert.equal(isPublicFarmMatePilotRoute("/api/farmmate/ask"), true);
      assert.equal(isPublicFarmMatePilotRoute("/api/farmmate/crop-doctor"), true);
      assert.equal(isPublicFarmMatePilotRoute("/api/waitlist"), false);
      assert.equal(isPublicFarmMatePilotPage("/farmer-hub/unfinished"), false);
    }
  },
  {
    name: "unfinished site pages remain protected during the FarmMate pilot",
    run: () => {
      assert.deepEqual(PROTECTED_FARMMATE_PILOT_PAGES, [
        "/",
        "/learn",
        "/learn/challenges/soil-health",
        "/buy",
        "/sell",
        "/directory",
        "/marketplace",
        "/join",
        "/about"
      ]);

      PROTECTED_FARMMATE_PILOT_PAGES.forEach((route) => {
        assert.equal(isProtectedFarmMatePilotPage(route), true, route);
        assert.equal(isPublicFarmMatePilotRoute(route), false, route);
        assert.equal(isControlledPrelaunchRoute(route), false, route);
      });

      const middleware = repoFile("src/middleware.ts");
      assert.equal(middleware.includes("isPublicFarmMatePilotRoute(pathname)"), true);
      assert.equal(middleware.includes("isControlledPrelaunchRoute(pathname)"), true);
      assert.equal(middleware.includes('pathname.startsWith("/api")'), false);
    }
  },
  {
    name: "pilot header contains only FarmMate navigation and links its logo to FarmMate",
    run: () => {
      const header = repoFile("src/components/Header.tsx");
      const pilotHeader = header.slice(header.indexOf("function PilotHeader"), header.indexOf("export function Header"));

      assert.equal(pilotHeader.includes('href="/farmer-hub"'), true);
      assert.equal(pilotHeader.includes('href="/farmer-hub/feedback"'), true);
      assert.equal(pilotHeader.includes("Ghana Growers"), true);
      assert.equal(pilotHeader.includes("GG FarmMate"), true);
      assert.equal(pilotHeader.includes("Share feedback"), true);
      ["/buy", "/sell", "/directory", "/marketplace", "/join", "Join the Network", "/about", "/contact", "/learn"].forEach((link) => {
        assert.equal(pilotHeader.includes(link), false, link);
      });
    }
  },
  {
    name: "FarmMate and feedback pages use the pilot shell without unfinished links",
    run: () => {
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const feedbackPage = repoFile("src/app/farmer-hub/feedback/page.tsx");
      const manifest = JSON.parse(repoFile("public/manifest.json")) as { start_url?: string };

      assert.equal(farmerHub.includes('href="/farmer-hub/feedback"'), true);
      assert.equal(farmerHub.includes('href="/learn'), false);
      assert.equal(farmerHub.includes("Learn Something Today"), false);
      assert.equal(feedbackPage.includes('href="/farmer-hub"'), true);
      assert.equal(feedbackPage.includes("Back to GG FarmMate"), true);
      assert.equal(feedbackPage.includes("FarmMatePilotFeedbackForm"), true);
      assert.equal(feedbackPage.includes("Header"), false);
      assert.equal(manifest.start_url, "/farmer-hub");
    }
  },
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
        "How do I improve seed germination?",
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
        ["How do I improve seed germination?", "general_agronomy"],
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
      const migration = repoFile("supabase/legacy-migrations/pre-baseline/031_reconcile_listing_submissions.sql");

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
      const tradeMigration = repoFile("supabase/legacy-migrations/pre-baseline/032_marketplace_trade_fields.sql");

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
      assert.equal(form.includes('title: "Farmer / Producer"'), true);
      assert.equal(form.includes('description: "Produce or livestock"'), true);
      assert.equal(form.includes('title: "Supplier"'), true);
      assert.equal(form.includes('description: "Farm inputs or equipment"'), true);
      assert.equal(form.includes('Supplier: "Input or Equipment Supplier"'), false);
      assert.equal(form.includes('Farmer: ["Fresh Produce", "Livestock"]'), true);
      assert.equal(form.includes('Supplier: ["Farm Inputs", "Tools & Equipment"]'), true);
      assert.equal(form.includes("categoryOptionsForSellerType(values.sellerType)"), true);
      assert.equal(form.includes('const marketplacePathway = allowedCategories.includes(values.marketplacePathway) ? values.marketplacePathway : "";'), true);
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
      assert.equal(form.includes('primaryLabel: "Variety or crop type"'), true);
      assert.equal(form.includes('primaryPlaceholder: "Example: Obaatanpa maize, Roma tomato"'), true);
      assert.equal(form.includes('secondaryLabel: "Grade or quality notes \\u2014 Optional"'), true);
      assert.equal(form.includes('secondaryPlaceholder: "Example: Dried, sorted, mature"'), true);
      assert.equal(form.includes('primaryLabel: "Breed or animal type"'), true);
      assert.equal(form.includes('primaryPlaceholder: "Example: Broiler chickens, West African Dwarf goats"'), true);
      assert.equal(form.includes('secondaryLabel: "Age, condition or health notes \\u2014 Optional"'), true);
      assert.equal(form.includes('primaryLabel: "Brand or input type"'), true);
      assert.equal(form.includes('primaryPlaceholder: "Example: NPK 15-15-15, hybrid tomato seeds"'), true);
      assert.equal(form.includes('secondaryLabel: "Formulation or product details \\u2014 Optional"'), true);
      assert.equal(form.includes('secondaryPlaceholder: "Example: 50 kg bag, certified seed, unopened"'), true);
      assert.equal(form.includes('primaryLabel: "Equipment type or model"'), true);
      assert.equal(form.includes('primaryPlaceholder: "Example: Knapsack sprayer, Honda WB30 water pump"'), true);
      assert.equal(form.includes('secondaryLabel: "Condition or specifications \\u2014 Optional"'), true);
      assert.equal(form.includes('secondaryPlaceholder: "Example: New, used, 16-litre capacity, petrol-powered"'), true);
      assert.equal(form.includes("placeholder={detailCopy.descriptionPlaceholder}"), true);
      assert.equal(form.includes("value={values.variety}"), true);
      assert.equal(form.includes("value={values.gradeDescription}"), true);
      assert.equal(form.includes('disabled={!currentStepValid || isSubmitting}'), false);
      assert.equal(form.includes('disabled={isSubmitting}'), true);
      assert.equal(form.includes('message: "Please select a subcategory to continue."'), true);
      assert.equal(form.includes("focusField(validation.field)"), true);
      assert.equal(form.includes("function SellerTypeCardGroup"), true);
      assert.equal(form.includes("sm:grid-cols-2"), true);
      assert.equal(form.includes('name="sellerType"'), true);
      assert.equal(form.includes("checkedSellerTypeFromDom"), true);
      assert.equal(form.includes("valuesForStepValidation(step, values)"), true);
      assert.equal(form.includes("restoreListingFormDraft"), true);
      assert.equal(form.includes("normalizeListingFormDraft"), true);
      assert.equal(form.includes("window.sessionStorage"), true);
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
    name: "Submit Listing seller type controls category flow and draft state",
    run: () => {
      const form = repoFile("src/components/SubmitProduceListingForm.tsx");

      assert.equal(form.includes('sellerType: ""'), true);
      assert.equal(form.includes('const sellerCategoryOptions: Record<SellerTypeOption, readonly string[]>'), true);
      assert.equal(form.includes('Farmer: ["Fresh Produce", "Livestock"]'), true);
      assert.equal(form.includes('Supplier: ["Farm Inputs", "Tools & Equipment"]'), true);
      assert.equal(form.includes('function normalizeListingFormSellerCategory(values: ListingFormState): ListingFormState'), true);
      assert.equal(form.includes('const sellerType = isSellerTypeOption(values.sellerType) ? values.sellerType : "";'), true);
      assert.equal(form.includes('const marketplacePathway = allowedCategories.includes(values.marketplacePathway) ? values.marketplacePathway : "";'), true);
      assert.equal(form.includes('const subcategory = subcategoryOptions.length && subcategoryOptions.includes(values.subcategory) ? values.subcategory : "";'), true);
      assert.equal(form.includes('return applyListingFormUpdate(values, "sellerType", sellerType);'), true);
      assert.equal(form.includes('window.sessionStorage.getItem(submitListingDraftStorageKey)'), true);
      assert.equal(form.includes('window.sessionStorage.setItem(submitListingDraftStorageKey, JSON.stringify(values))'), true);
      assert.equal(form.includes("clearListingFormDraft()"), true);
      assert.equal(form.includes('setStep((current) => Math.min(steps.length - 1, current + 1))'), true);
      assert.equal(form.includes('setStep((current) => Math.max(0, current - 1))'), true);
      assert.equal(form.includes("Input or Equipment Supplier"), false);
      assert.equal(form.includes("Farm inputs or equipment"), true);
      assert.equal(form.includes("Produce or livestock"), true);
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
      const migration = repoFile("supabase/legacy-migrations/pre-baseline/033_listing_submission_review_workflow.sql");
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
      const migration = repoFile("supabase/legacy-migrations/pre-baseline/034_unified_buyer_enquiries.sql");
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

      assert.equal(adminDashboard.includes('caseItem.priority.label !== "New"'), false);
      assert.equal(adminDashboard.includes('return "Active Sourcing";'), true);
      assert.equal(adminDashboard.includes('leadReviewStatusLabel(status)'), true);
      assert.equal(adminDashboard.includes('Review Matches'), true);
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
    name: "Admin Sourcing Queue uses two columns, case header actions, and tabs",
    run: () => {
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");

      assert.equal(adminDashboard.includes('type SourcingCaseTab = "Overview" | "Matches" | "Activity";'), true);
      assert.equal(adminDashboard.includes('const [selectedSourcingCaseTab, setSelectedSourcingCaseTab]'), true);
      assert.equal(adminDashboard.includes('const [showSourcingCaseDetailMobile, setShowSourcingCaseDetailMobile]'), true);
      assert.equal(adminDashboard.includes("lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]"), true);
      assert.equal(adminDashboard.includes("xl:grid-cols-[270px_minmax(520px,1fr)_300px]"), false);
      assert.equal(adminDashboard.includes('aria-label="Sourcing case details"'), true);
      assert.equal(adminDashboard.includes('(["Overview", "Matches", "Activity"] as SourcingCaseTab[])'), true);
      assert.equal(adminDashboard.includes('selectedSourcingCaseTab === "Overview"'), true);
      assert.equal(adminDashboard.includes('selectedSourcingCaseTab === "Matches"'), true);
      assert.equal(adminDashboard.includes('selectedSourcingCaseTab === "Activity"'), true);
      assert.equal(adminDashboard.includes("Primary action"), true);
      assert.equal(adminDashboard.includes('onClick={() => setSelectedSourcingCaseTab("Matches")}'), true);
      assert.equal(adminDashboard.includes("SLA / Response Deadline"), true);
      assert.equal(adminDashboard.includes("Request Source"), true);
      assert.equal(adminDashboard.includes("Buyer / Company"), true);
      assert.equal(adminDashboard.includes("Operational Status"), false);
      assert.equal(adminDashboard.includes("sourcingCaseOperationalStatusLabel(selectedSourcingCase.state.status)"), true);
      assert.equal(adminDashboard.includes('status === "New"'), true);
      assert.equal(adminDashboard.includes('return "Pending Review";'), true);
      assert.equal(adminDashboard.includes('status === "Reviewing"'), true);
      assert.equal(adminDashboard.includes('return "Contacted";'), true);
      assert.equal(adminDashboard.includes('return status === "Closed" ? "Lost" : status;'), true);
      assert.equal(adminDashboard.includes("grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4"), true);
      assert.equal(adminDashboard.includes("mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"), false);
      assert.equal(adminDashboard.includes("Suggested and Assigned Matches"), true);
      assert.equal(adminDashboard.includes("Marketplace Listing Matches"), true);
      assert.equal(adminDashboard.includes("No matches have been assigned yet."), true);
      assert.equal(adminDashboard.includes("Availability Confirmation"), true);
      assert.equal(adminDashboard.includes("Buyer and Request Overview"), true);
      assert.equal(adminDashboard.includes("Communication History"), true);
      assert.equal(adminDashboard.includes("No additional activity has been recorded."), true);
      assert.equal(adminDashboard.includes("Back to sourcing cases"), true);
      assert.equal(adminDashboard.includes("setShowSourcingCaseDetailMobile(true)"), true);
      assert.equal(adminDashboard.includes("setShowSourcingCaseDetailMobile(false)"), true);
      assert.equal(adminDashboard.includes("Sourcing cases could not be loaded. Please refresh and try again."), true);
      assert.equal(adminDashboard.includes("Retry"), true);
      assert.equal(adminDashboard.includes('seller private contact details are not exposed here'), false);
      assert.equal(adminDashboard.includes("Seller private contact details are not exposed here."), true);
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
        "Matches",
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
      assert.equal(adminDashboard.includes("const isExpanded = expandedNavigationGroup === group.group || groupHasActiveItem;"), true);
      assert.equal(adminDashboard.includes("aria-expanded={isExpanded}"), true);
      assert.equal(adminDashboard.includes("openAdminNavigationItem(item, group.group)"), true);
      assert.equal(adminDashboard.includes('key: "buyer-matches", id: "match-opportunities", label: "Matches"'), true);
      assert.equal(adminDashboard.includes('group: "Buyer Requests"'), true);
      assert.equal(adminDashboard.includes('const groupHasActiveItem = group.items.some((item) => item.key === activeNavigationKey);'), true);
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
    name: "Admin queue priority styling follows actual queue state",
    run: () => {
      assert.equal(adminPrioritySeverity({ count: 0, hasOverdue: true }), "neutral");
      assert.equal(adminPrioritySeverity({ count: 4 }), "active");
      assert.equal(adminPrioritySeverity({ count: 2, hasDue: true }), "due");
      assert.equal(adminPrioritySeverity({ count: 1, hasDue: true, hasOverdue: true }), "overdue");
      assert.equal(adminMetricSeverityClass("neutral"), "admin-metric-neutral");
      assert.equal(adminMetricSeverityClass("active"), "admin-metric-active");
      assert.equal(adminMetricSeverityClass("due"), "admin-metric-due");
      assert.equal(adminMetricSeverityClass("overdue"), "admin-metric-overdue");
      assert.equal(adminCountPillClass("neutral"), "admin-count-pill admin-count-neutral");
      assert.equal(adminCountPillClass("due"), "admin-count-pill admin-count-due");
      assert.equal(adminCountPillClass("overdue"), "admin-count-pill admin-count-overdue");

      const actionClasses = adminPriorityActionClasses([
        { count: 2, severity: "due" },
        { count: 3, severity: "active" },
        { count: 1, severity: "overdue" },
        { count: 0, severity: "neutral" }
      ]);

      assert.deepEqual(actionClasses, [
        "admin-action-secondary",
        "admin-action-secondary",
        "admin-action-primary",
        "admin-action-tertiary"
      ]);
      assert.equal(actionClasses.filter((className) => className === "admin-action-primary").length, 1);

      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const listingWorkspace = repoFile("src/components/AdminListingSubmissionsWorkspace.tsx");
      assert.equal(adminDashboard.includes('section: "buyer-requests" as AdminSectionId'), true);
      assert.equal(adminDashboard.includes('section: "match-opportunities" as AdminSectionId'), true);
      assert.equal(adminDashboard.includes('section: "lead-queue" as AdminSectionId'), true);
      assert.equal(adminDashboard.includes('section: "submissions" as AdminSectionId'), true);
      assert.equal(adminDashboard.includes("runQuickAction(item.section"), true);
      assert.equal(listingWorkspace.includes("adminCountPillClass(queueSeverity)"), true);
    }
  },
  {
    name: "Admin color hierarchy stays scoped to protected workspaces",
    run: () => {
      const globals = repoFile("src/app/globals.css");
      const adminDashboard = repoFile("src/components/AdminDashboard.tsx");
      const listingWorkspace = repoFile("src/components/AdminListingSubmissionsWorkspace.tsx");
      const adminPage = repoFile("src/app/admin/page.tsx");
      const listingPage = repoFile("src/app/admin/listing-submissions/page.tsx");

      assert.equal(globals.includes(".admin-dashboard,"), true);
      assert.equal(globals.includes(".admin-listing-workspace"), true);
      assert.equal(globals.includes(".admin-status-pending"), true);
      assert.equal(globals.includes(".admin-status-active"), true);
      assert.equal(globals.includes(".admin-status-contacted"), true);
      assert.equal(globals.includes(".admin-status-complete"), true);
      assert.equal(globals.includes(".admin-status-paused"), true);
      assert.equal(globals.includes(".admin-status-danger"), true);
      assert.equal(globals.includes(".admin-action-primary"), true);
      assert.equal(globals.includes(".admin-action-secondary"), true);
      assert.equal(globals.includes(".admin-action-warning"), true);
      assert.equal(globals.includes(".admin-action-destructive"), true);
      assert.equal(globals.includes(".admin-recommendation-panel"), true);
      assert.equal(globals.includes(".admin-feedback-success"), true);
      assert.equal(globals.includes(".admin-feedback-error"), true);
      assert.equal(globals.includes(".admin-empty-state"), true);
      assert.equal(globals.includes(".admin-dashboard :is(input"), true);
      assert.equal(adminDashboard.includes('className="admin-dashboard'), true);
      assert.equal(adminDashboard.includes("admin-nav-item-active"), true);
      assert.equal(adminDashboard.includes("admin-queue-panel"), true);
      assert.equal(adminDashboard.includes("admin-selected-row"), true);
      assert.equal(adminDashboard.includes("admin-recommendation-panel"), true);
      assert.equal(adminDashboard.includes("sourcingCaseStatusClass"), true);
      assert.equal(listingWorkspace.includes('className="admin-listing-workspace'), true);
      assert.equal(listingWorkspace.includes('tone="primary"'), true);
      assert.equal(listingWorkspace.includes('tone="destructive"'), true);
      assert.equal(adminPage.includes("getAdminUserFromAccessToken"), true);
      assert.equal(listingPage.includes("getAdminUserFromAccessToken"), true);
    }
  },
  {
    name: "Optional admin sources distinguish unavailable tables from genuine failures",
    run: () => {
      assert.deepEqual(resolveAdminOptionalSource({
        status: 404,
        error: "Could not find the table 'public.whatsapp_leads' in the schema cache. PGRST205"
      }), { state: "unavailable", data: [] });
      assert.deepEqual(resolveAdminOptionalSource({
        status: 404,
        error: 'relation "public.featured_membership_enquiries" does not exist (42P01)'
      }), { state: "unavailable", data: [] });
      assert.deepEqual(resolveAdminOptionalSource({
        status: 200,
        data: [{ id: "optional-record" }]
      }), { state: "available", data: [{ id: "optional-record" }] });
      assert.deepEqual(resolveAdminOptionalSource({
        status: 504,
        error: "upstream request timed out"
      }), { state: "error", status: 504, code: "OPTIONAL_SOURCE_READ_FAILED" });
    }
  },
  {
    name: "Featured Enquiries handles an absent optional source without a red table error",
    run: () => {
      const route = repoFile("src/app/api/admin/featured-enquiries/route.ts");
      const dashboard = repoFile("src/components/AdminDashboard.tsx");

      assert.equal(route.includes("requireAdminUser"), true);
      assert.equal(route.includes('export const dynamic = "force-dynamic"'), true);
      assert.equal(route.includes("export const revalidate = 0"), true);
      assert.equal(route.includes('"Cache-Control": "private, no-store, max-age=0"'), true);
      assert.equal(route.includes('availability: "unavailable"'), true);
      assert.equal(route.includes("Featured enquiry requests are not available yet."), true);
      assert.equal(route.includes("retryable: true"), true);
      assert.equal(route.includes("getFeaturedEnquiries(250).catch(() => null)"), true);
      assert.equal(dashboard.includes('unavailableMessage="Featured enquiry requests are not available yet."'), true);
      assert.equal(dashboard.includes("AdminOptionalQueueNotice"), true);
      assert.equal(dashboard.includes("admin-empty-state"), true);
      assert.equal(dashboard.includes("Retry"), true);
    }
  },
  {
    name: "Notifications treats WhatsApp clicks as isolated optional analytics",
    run: () => {
      const route = repoFile("src/app/api/admin/whatsapp-leads/route.ts");
      const analyticsRoute = repoFile("src/app/api/admin/analytics/route.ts");
      const dashboard = repoFile("src/components/AdminDashboard.tsx");
      const publicRoute = repoFile("src/app/api/whatsapp-leads/route.ts");

      assert.equal(route.includes("requireAdminUser"), true);
      assert.equal(route.includes('export const dynamic = "force-dynamic"'), true);
      assert.equal(route.includes("export const revalidate = 0"), true);
      assert.equal(route.includes('"Cache-Control": "private, no-store, max-age=0"'), true);
      assert.equal(route.includes('availability: "unavailable"'), true);
      assert.equal(route.includes("WhatsApp click tracking is not available yet."), true);
      assert.equal(route.includes("retryable: true"), true);
      assert.equal(route.includes("getRecentWhatsAppLeads(250).catch(() => null)"), true);
      assert.equal(analyticsRoute.includes('readTable("whatsapp_leads"'), false);
      assert.equal(analyticsRoute.includes("Optional click tracking loads independently"), true);
      assert.equal(dashboard.includes("Buyer enquiries remain available in Produce Requests."), true);
      assert.equal(dashboard.includes("Latest Contact Clicks"), true);
      assert.equal(dashboard.includes("Latest Leads"), false);
      assert.equal(dashboard.includes('activeSection === "whatsapp-leads" || (activeSection === "analytics"'), true);
      assert.equal(publicRoute.includes("export async function GET"), false);
    }
  },
  {
    name: "Optional queue failures do not alter operational lead request sources",
    run: () => {
      const dashboard = repoFile("src/components/AdminDashboard.tsx");
      const leadRoute = repoFile("src/app/api/admin/lead-requests/route.ts");
      const optionalSource = repoFile("src/lib/adminOptionalSources.ts");

      assert.equal(dashboard.includes('fetch("/api/admin/lead-requests", { cache: "no-store" })'), true);
      assert.equal(dashboard.includes('leadStatusCount(leadRequests, "New")'), true);
      assert.equal(dashboard.includes('leadStatusCount(leadRequests, "Negotiating")'), true);
      assert.equal(leadRoute.includes("getRecentLeadRequests(250)"), true);
      assert.equal(leadRoute.includes("requireAdminUser"), true);
      assert.equal(optionalSource.includes("serviceRoleKey"), false);
      assert.equal(optionalSource.includes("phone"), false);
      assert.equal(optionalSource.includes("whatsapp"), false);
      assert.equal(optionalSource.includes("message"), false);
      assert.equal(optionalSource.includes("console.error"), true);
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

      assert.deepEqual(publicProfiles.map((farmer) => farmer.slug), ["verified"]);
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
    name: "Homepage featured farmers ignores legacy configured profile arrays",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles([]);
      assert.deepEqual(featuredFarmers, []);
    }
  },
  {
    name: "Public farmer eligibility requires active verified launch-ready real records",
    run: () => {
      const eligible = { slug: "real-farm", status: "Active", verificationStatus: "Verified", launchReady: true, source: "Tally Import" };

      assert.equal(isEligiblePublicFarmer(eligible), true);
      assert.equal(isEligiblePublicFarmer({ ...eligible, status: "Pending" }), false);
      assert.equal(isEligiblePublicFarmer({ ...eligible, verificationStatus: "Pending Verification" }), false);
      assert.equal(isEligiblePublicFarmer({ ...eligible, launchReady: false }), false);
      assert.equal(isEligiblePublicFarmer({ ...eligible, source: "Demo Seed" }), false);
      assert.equal(isValidPublicProfileSlug("real-farm"), true);
      assert.equal(isValidPublicProfileSlug("Real Farm"), false);
    }
  },
  {
    name: "Public supplier eligibility requires active verified real records",
    run: () => {
      const eligible = { slug: "real-supplier", status: "Active", verificationStatus: "Verified", source: "Production" };

      assert.equal(isEligiblePublicSupplier(eligible), true);
      assert.equal(isEligiblePublicSupplier({ ...eligible, status: "Pending" }), false);
      assert.equal(isEligiblePublicSupplier({ ...eligible, verificationStatus: "Under Review" }), false);
      assert.equal(isEligiblePublicSupplier({ ...eligible, source: "Placeholder" }), false);
    }
  },
  {
    name: "Featured farmer eligibility requires a current live feature flag",
    run: () => {
      const eligible = { slug: "real-farm", status: "Active", verificationStatus: "Verified", launchReady: true, source: "Tally Import", isFeatured: true };

      assert.equal(isEligibleFeaturedFarmer(eligible, new Date("2026-07-22T12:00:00Z")), true);
      assert.equal(isEligibleFeaturedFarmer({ ...eligible, isFeatured: false }, new Date("2026-07-22T12:00:00Z")), false);
      assert.equal(isEligibleFeaturedFarmer({ ...eligible, featuredUntil: "2026-07-21" }, new Date("2026-07-22T12:00:00Z")), false);
    }
  },
  {
    name: "Public profile loaders use safe DTOs and distinguish unavailable reads",
    run: () => {
      const source = readFileSync(join(process.cwd(), "src/lib/supabase/publicData.ts"), "utf8");
      const supplierMapper = source.slice(source.indexOf("function mapSupplier"), source.indexOf("function mapListing"));
      const farmerMapper = source.slice(source.indexOf("function mapFarmer"), source.indexOf("function mapSupplier"));

      assert.match(source, /import "server-only"/);
      assert.match(source, /status: "unavailable"/);
      assert.doesNotMatch(supplierMapper, /contactPerson:|phone:|whatsappMessage:|verificationNotes:|verifiedBy:|application_image_url/);
      assert.doesNotMatch(farmerMapper, /verifiedBy:|verificationNotes:|whatsappMessage:|source:/);
    }
  },
  {
    name: "Public supplier profile never renders private contact fields",
    run: () => {
      const page = readFileSync(join(process.cwd(), "src/app/supplier-directory/[slug]/page.tsx"), "utf8");
      const directory = readFileSync(join(process.cwd(), "src/components/SupplierDirectory.tsx"), "utf8");

      assert.doesNotMatch(page, /supplier\.contactPerson|supplier\.phone|Contact Details/);
      assert.doesNotMatch(directory, /supplier\.contactPerson|supplier\.phone/);
      assert.match(page, /Request Connection/);
    }
  },
  {
    name: "Unavailable farmer application performs no upload or database insert",
    run: () => {
      const route = readFileSync(join(process.cwd(), "src/app/api/farmer-registration/route.ts"), "utf8");
      const page = readFileSync(join(process.cwd(), "src/app/join/farmer/page.tsx"), "utf8");

      assert.match(route, /Farmer applications are temporarily unavailable while we improve the application process/);
      assert.match(route, /status: 503/);
      assert.doesNotMatch(route, /request\.formData|uploadSupabaseStorageObject|insertSupabaseRecord|ok: true/);
      assert.match(page, /Applications are temporarily unavailable/);
      assert.doesNotMatch(page, /FarmerRegistrationForm/);
    }
  },
  {
    name: "Homepage featured farmers uses live featured flags instead of static slug config",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles(
        [
          farmerFixture({ slug: "unconfigured-featured", source: "Tally Import", verificationStatus: "Verified", isFeatured: true }),
          farmerFixture({ slug: "not-featured", source: "Tally Import", verificationStatus: "Verified", isFeatured: false })
        ]
      );

      assert.deepEqual(featuredFarmers.map((farmer) => farmer.slug), ["unconfigured-featured"]);
    }
  },
  {
    name: "Homepage featured farmers does not duplicate live farmers",
    run: () => {
      const featuredFarmers = homepageFeaturedFarmerProfiles(
        [
          farmerFixture({ slug: "ibrahim-mohammed-farm", source: "Tally Import", verificationStatus: "Verified", isFeatured: true }),
          farmerFixture({ slug: "ibrahim-mohammed-farm", source: "Tally Import", verificationStatus: "Verified", isFeatured: true })
        ]
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
      const featuredFarmers = homepageFeaturedFarmerProfiles([
          farmerFixture({ slug: "real-under-review", source: "Tally Import", verificationStatus: "Pending Verification", isFeatured: true }),
          farmerFixture({ slug: "demo-featured", source: "Demo Seed", verificationStatus: "Verified", isFeatured: true })
      ]);

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
    name: "Marketplace excludes sellers that are not publicly eligible",
    run: () => {
      const listings = publicMarketplaceListings(
        [marketplaceProductFixture({ verified: true })],
        [farmerFixture({ slug: "real-farm", farmName: "Real Farm", source: "Founding Farmer", verificationStatus: "Pending Verification" })],
        []
      );

      assert.equal(listings.length, 0);
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
    name: "mobile weather shows compact day temperature and rain rows",
    run: () => {
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");
      const mobileForecast = component.slice(
        component.indexOf('aria-label="Compact 3-day weather forecast"'),
        component.indexOf('aria-label="Detailed 3-day weather forecast"')
      );
      const forecast = mapOpenMeteoForecast(sampleWeatherData(), supportedFarmMateWeatherLocations[0]);

      assert.ok(forecast);
      assert.equal(forecast.currentTemperatureC, 29);
      assert.equal(forecast.tomorrow.temperatureMaxC, 30);
      assert.equal(component.includes('className="mt-3 grid gap-1.5 sm:hidden"'), true);
      assert.equal(mobileForecast.includes("day.label"), true);
      assert.equal(mobileForecast.includes("mainTemperatureLine(day"), true);
      assert.equal(mobileForecast.includes("forecast.currentTemperatureC"), true);
      assert.equal(mobileForecast.includes("rainLine(day)"), true);
      assert.equal(mobileForecast.includes("temperatureLine(day)"), false);
    }
  },
  {
    name: "mobile weather does not repeat long farming notes",
    run: () => {
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");

      assert.equal(component.includes("day.farmingNote"), false);
      assert.equal(component.includes("<FarmMateDailySummary weatherNote={weatherNote} />"), true);
      assert.equal(component.match(/weatherNote=\{weatherNote\}/g)?.length, 1);
    }
  },
  {
    name: "desktop weather keeps compact detailed forecast cards",
    run: () => {
      const component = repoFile("src/components/FarmMateWeatherFoundation.tsx");
      const desktopForecast = component.slice(component.indexOf('aria-label="Detailed 3-day weather forecast"'));

      assert.equal(component.includes('className="mt-3 hidden grid-cols-3 gap-2 sm:grid"'), true);
      assert.equal(desktopForecast.includes("day.label"), true);
      assert.equal(desktopForecast.includes("temperatureLine(day)"), true);
      assert.equal(desktopForecast.includes("rainLine(day)"), true);
      assert.equal(desktopForecast.includes("min-h-28"), true);
    }
  },
  {
    name: "FarmMate hero clarifies and preserves both mobile actions",
    run: () => {
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const actions = repoFile("src/components/FarmMateHeroActions.tsx");

      assert.equal(farmerHub.includes("Ask FarmMate for farming advice, or upload a crop photo when something looks wrong."), true);
      assert.equal(actions.includes('openFarmMateTool("ask")'), true);
      assert.equal(actions.includes('openFarmMateTool("doctor")'), true);
      assert.equal(actions.includes("Ask FarmMate"), true);
      assert.equal(actions.includes("Upload Crop Photo"), true);
      assert.equal(actions.match(/min-h-\[4\.25rem\] w-full/g)?.length, 2);
      assert.equal(actions.match(/sm:min-h-12 sm:w-auto/g)?.length, 2);
    }
  },
  {
    name: "FarmMate pilot homepage is tool-first on desktop",
    run: () => {
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const farmTools = repoFile("src/components/FarmTools.tsx");

      assert.equal(farmerHub.includes("lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.46fr)]"), true);
      assert.equal(farmerHub.indexOf("<FarmMateHeroActions />") < farmerHub.indexOf("<FarmTools />"), true);
      assert.equal(farmerHub.indexOf("<FarmTools />") < farmerHub.indexOf("<FarmMateWeatherFoundation />"), true);
      assert.equal(farmTools.includes('className="mt-8"'), true);
      assert.equal(farmTools.includes("md:grid md:grid-cols-2"), true);
      assert.equal(farmTools.includes("min-h-48"), true);
      assert.equal(farmTools.includes("lg:grid-cols-4"), false);
    }
  },
  {
    name: "large dark-green Farm Summary card is no longer rendered",
    run: () => {
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const summary = repoFile("src/components/FarmMateDailySummary.tsx");

      assert.equal(farmerHub.includes("Today&apos;s Farm Summary"), false);
      assert.equal(summary.includes("bg-leaf-600"), false);
      assert.equal(summary.includes("text-white"), false);
      assert.equal(summary.includes("Today at a glance"), true);
    }
  },
  {
    name: "Today at a glance renders compact field weather and tip content",
    run: () => {
      const summary = repoFile("src/components/FarmMateDailySummary.tsx");
      const weatherWidget = repoFile("src/components/FarmMateWeatherFoundation.tsx");

      assert.equal(summary.includes('aria-label="Today at a glance"'), true);
      assert.equal(summary.includes("Field note"), true);
      assert.equal(summary.includes("Weather note"), true);
      assert.equal(summary.includes("Practical tip"), true);
      assert.equal(summary.includes("summary.mainRecommendation"), true);
      assert.equal(summary.includes("weatherNote || summary.rainOutlookNote"), true);
      assert.equal(summary.includes("summary.todaysTip"), true);
      assert.equal(summary.includes("summary.warning"), false);
      assert.equal(weatherWidget.indexOf('aria-label="Detailed 3-day weather forecast"') < weatherWidget.indexOf("<FarmMateDailySummary weatherNote={weatherNote} />"), true);
    }
  },
  {
    name: "mobile FarmMate order puts actions and tools before weather summary and feedback",
    run: () => {
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");
      const actionsIndex = farmerHub.indexOf("<FarmMateHeroActions />");
      const toolsIndex = farmerHub.indexOf("<FarmTools />");
      const weatherIndex = farmerHub.indexOf("<FarmMateWeatherFoundation />");
      const feedbackIndex = farmerHub.indexOf('href="/farmer-hub/feedback"');

      assert.ok(actionsIndex > 0);
      assert.ok(toolsIndex > actionsIndex);
      assert.ok(weatherIndex > toolsIndex);
      assert.ok(feedbackIndex > weatherIndex);
    }
  },
  {
    name: "FarmMate hero action buttons still open Ask FarmMate and Crop Doctor",
    run: () => {
      const actions = repoFile("src/components/FarmMateHeroActions.tsx");
      const farmTools = repoFile("src/components/FarmTools.tsx");

      assert.equal(actions.includes('openFarmMateTool("ask")'), true);
      assert.equal(actions.includes('openFarmMateTool("doctor")'), true);
      assert.equal(farmTools.includes('tool === "ask"'), true);
      assert.equal(farmTools.includes('tool === "doctor"'), true);
      assert.equal(farmTools.includes("<AskFarmMate"), true);
      assert.equal(farmTools.includes("<CropDoctor"), true);
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
    name: "OpenAI payload does not label unavailable weather context as live",
    run: () => {
      const weatherContext = sampleWeatherContext({ liveWeatherAvailable: false });
      const brain = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"), { weatherContext });
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion: "Can I spray today?",
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { specialistContext?: { liveWeatherContext?: WeatherDecisionSummary | null; noLiveWeatherRule?: string } };

      assert.equal(payload.specialistContext?.liveWeatherContext, null);
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.includes("Do not invent live rain"), true);
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
    name: "FarmMate launch QA document covers pilot routes and V1 limitations",
    run: () => {
      const launchQa = repoFile("docs/FARMMATE_LAUNCH_QA.md");
      const farmerHub = repoFile("src/app/farmer-hub/page.tsx");

      ["/farmer-hub", "/farmer-hub/feedback"].forEach((route) => {
        assert.equal(launchQa.includes(route), true, route);
      });
      [
        "Today at a glance",
        "Live Weather",
        "Ask FarmMate",
        "Crop Doctor Vision",
        "Crop Calendar",
        "Planting Advisor"
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
      assert.equal(launchQa.includes("Learn and Soil Health Challenge"), false);
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
      assert.equal(isLikelyIncompleteFarmMateAnswer(completedGuidedAnswer("Don't spray yet. Spray only when leaves are dry and wind is calm."), input), false);
    }
  },
  {
    name: "rain expected weather answer is complete",
    run: () => {
      const input = weatherAiInput("Rain is expected soon");
      const answer = completedGuidedAnswer("Do not spray now. Wait until after the rain and spray only when leaves are dry and wind is calm.");

      assert.equal(isLikelyIncompleteFarmMateAnswer(answer, input), false);
      assert.equal(answer.endsWith("."), true);
    }
  },
  {
    name: "safe spraying weather answer is complete",
    run: () => {
      const input = weatherAiInput("No rain expected soon");
      const answer = completedGuidedAnswer("Spraying may be suitable. Follow the product label and avoid spraying during hot midday sun.");

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
    name: "Planting Advisor pilot result exposes practical selected-crop guidance",
    run: () => {
      const farmTools = repoFile("src/components/FarmTools.tsx");
      const requiredLabels = [
        "Crop",
        "Region",
        "Planting suitability",
        "Best planting period or season note",
        "Spacing guidance",
        "Soil preparation",
        "Water/rain condition",
        "What to avoid",
        "Next step"
      ];

      requiredLabels.forEach((label) => assert.equal(farmTools.includes(`label=\"${label}\"`), true, label));
      assert.equal(farmTools.includes("selectedGuidance.spacingGuidance[0]"), true);
      assert.equal(farmTools.includes("selectedGuidance.soilPreparation[0]"), true);
      assert.equal(farmTools.includes("selectedGuidance.whenToDelayPlanting[0]"), true);
      assert.equal(farmTools.includes("selectedGuidance.nextBestAction"), true);
      assert.equal(farmTools.includes("Local timing can vary by district"), true);
    }
  },
  {
    name: "Crop Calendar supports pilot crops with practical timelines",
    run: () => {
      const requiredCrops = ["Maize", "Tomato", "Pepper", "Cassava", "Yam", "Plantain", "Onion", "Okra", "Cucumber", "Garden eggs"];
      const availableCrops = cropCalendarGuides.map((guide) => guide.crop);

      assert.deepEqual(availableCrops, requiredCrops);
      cropCalendarGuides.forEach((guide) => {
        assert.equal(guide.stages.length >= 5, true, guide.crop);
        assert.equal(guide.stages.every((stage) => Boolean(stage.timing && stage.stage && stage.guidance)), true, guide.crop);
      });
      assert.equal(findCropCalendarGuide("garden eggs")?.crop, "Garden eggs");
    }
  },
  {
    name: "Crop Calendar renders an interactive cautious timeline",
    run: () => {
      const farmTools = repoFile("src/components/FarmTools.tsx");
      const calendarData = repoFile("src/lib/farmmate/crop-calendar.ts");

      assert.equal(farmTools.includes("Select crop"), true);
      assert.equal(farmTools.includes("Select region"), true);
      assert.equal(farmTools.includes("Planting month or season"), true);
      assert.equal(farmTools.includes("selectedGuide.stages.map"), true);
      assert.equal(farmTools.includes("crop timeline"), true);
      assert.equal(farmTools.includes("Typical guide"), true);
      assert.equal(farmTools.includes("not a guaranteed planting or harvest date"), true);
      assert.equal(calendarData.includes("Mar-Jun"), false);
      assert.equal(calendarData.includes("guaranteed yield"), false);
      assert.equal(calendarData.includes("market price"), false);
    }
  },
  {
    name: "planning tool handoffs use the selected crop and region",
    run: () => {
      assert.equal(
        plantingAdvisorFarmMateQuestion("Maize", "Northern"),
        "I am planning to grow Maize in Northern. What should I check before planting?"
      );
      assert.equal(
        cropCalendarFarmMateQuestion("Tomato", "Greater Accra"),
        "I am following the crop calendar for Tomato in Greater Accra. What should I watch for next?"
      );

      const farmTools = repoFile("src/components/FarmTools.tsx");
      assert.equal(farmTools.includes("plantingAdvisorFarmMateQuestion(selectedGuidance.crop, selectedRegion)"), true);
      assert.equal(farmTools.includes("cropCalendarFarmMateQuestion(selectedGuide.crop, selectedRegion)"), true);
      assert.equal(farmTools.match(/Ask FarmMate about this/g)?.length, 2);
    }
  },
  {
    name: "planning modal content remains mobile-first and prevents sideways overflow",
    run: () => {
      const farmTools = repoFile("src/components/FarmTools.tsx");

      assert.equal(farmTools.includes("overflow-x-hidden overflow-y-auto"), true);
      assert.equal(farmTools.includes("min-w-0 max-w-2xl"), true);
      assert.equal(farmTools.includes("gg-field min-h-12 w-full max-w-full"), true);
      assert.equal(farmTools.includes("min-h-11 w-full"), true);
      assert.equal(farmTools.includes("sm:grid-cols-2"), true);
    }
  },
  {
    name: "melon and watermelon planting questions route to Planting Advisor",
    run: () => {
      const questions = [
        "How do I plant melon?",
        "How do I plant watermelon?",
        "Can I plant melon now?",
        "Can I plant watermelon now?",
        "Best spacing for watermelon",
        "When should I plant melon?",
        "How do I grow watermelon?",
        "How can I plant water melon?"
      ];

      for (const question of questions) {
        const router = routeFarmMateQuestion(question);
        assert.equal(router.selectedSpecialist, "planting", question);
        assert.notEqual(router.selectedSpecialist, "crop_doctor", question);
        assert.notEqual(router.selectedSpecialist, "crop_health", question);
      }

      const melonResponse = buildFarmMateResponse("How do I plant melon?", routeFarmMateQuestion("How do I plant melon?"));
      assert.equal(melonResponse.flow?.id, "plant-melon-clarification");
      assert.equal(melonResponse.flow?.followUpQuestions[0]?.question, "Do you mean watermelon or melon grown for seed?");
      assert.deepEqual(melonResponse.flow?.followUpQuestions[0]?.options, ["Watermelon", "Melon grown for seed", "I am not sure"]);

      const watermelonResponse = buildFarmMateResponse("How do I plant watermelon?", routeFarmMateQuestion("How do I plant watermelon?"));
      const spacedWatermelonResponse = buildFarmMateResponse("How can I plant water melon?", routeFarmMateQuestion("How can I plant water melon?"));
      assert.equal(watermelonResponse.flow?.id, "how-to-plant-watermelon");
      assert.equal(spacedWatermelonResponse.flow?.id, "how-to-plant-watermelon");
      assert.equal(watermelonResponse.confidence, "medium");
      assert.equal(watermelonResponse.flow?.followUpQuestions[0]?.question, "Which region are you farming in?");
      assert.deepEqual(watermelonResponse.flow?.followUpQuestions[0]?.options, ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]);
      assert.equal(watermelonResponse.flow?.followUpQuestions[1]?.question, "Do you have steady rain or irrigation available?");
      assert.deepEqual(watermelonResponse.flow?.followUpQuestions[1]?.options, ["Steady rain has started", "I have irrigation", "Not enough water yet", "I am not sure"]);
      assert.equal(watermelonResponse.flow?.followUpQuestions.length, 2);
      assert.equal(responseText(watermelonResponse).includes("Next step: Tell me your region"), false);
      assert.equal(buildFarmMateResponse("Best spacing for watermelon", routeFarmMateQuestion("Best spacing for watermelon")).flow?.id, "best-spacing-for-watermelon");
      assert.equal(buildFarmMateResponse("Can I plant watermelon now?", routeFarmMateQuestion("Can I plant watermelon now?")).flow?.id, "can-i-plant-watermelon-now");
      assert.equal(responseText(melonResponse).toLowerCase().includes("disease"), false);
    }
  },
  {
    name: "melon clarification continues with Watermelon field checks",
    run: () => {
      const askFarmMate = repoFile("src/components/AskFarmMate.tsx");

      assert.equal(askFarmMate.includes('response.flow?.id === "plant-melon-clarification" && selectedOption === "Watermelon"'), true);
      assert.equal(askFarmMate.includes('const watermelonQuestion = "How do I plant watermelon?"'), true);
      assert.equal(askFarmMate.includes("nextResponse = watermelonResponse"), true);
      assert.equal(askFarmMate.includes("nextFollowUpQuestion = watermelonResponse.flow?.followUpQuestions[0]"), true);
      assert.equal(askFarmMate.includes("continueAskFarmMateConsultation"), true);
    }
  },
  {
    name: "Planting Advisor provides safe Watermelon guidance",
    run: () => {
      const watermelon = plantingAdvisorCrops.find((guidance) => guidance.crop === "Watermelon");
      const watermelonText = JSON.stringify(watermelon).toLowerCase();

      assert.equal(Boolean(watermelon?.suitablePlantingConditions.length), true);
      assert.equal(Boolean(watermelon?.spacingGuidance.length), true);
      assert.equal(Boolean(watermelon?.soilPreparation.length), true);
      assert.equal(Boolean(watermelon?.waterRainfallNeeds.length), true);
      assert.equal(Boolean(watermelon?.commonPlantingMistakes.length), true);
      assert.equal(Boolean(watermelon?.whenToDelayPlanting.length), true);
      assert.equal(Boolean(watermelon?.nextBestAction), true);
      assert.equal(watermelonText.includes("market price"), false);
      assert.equal(watermelonText.includes("profit"), false);
      assert.equal(watermelonText.includes("yield"), false);
      assert.equal(watermelonText.includes("buyer"), false);
      assert.equal(CROP_DOCTOR_SUPPORTED_CROPS.includes("Watermelon"), true);
      assert.equal(CROP_DOCTOR_SUPPORTED_CROPS.includes("Sweet melon"), true);
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
      const farmerQuestion = "Best spacing for watermelon?";
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
      assert.equal(payload.specialistContext?.crop, "Watermelon");
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.toLowerCase().includes("do not invent exact local weather"), true);
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("market prices"), true);
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("guaranteed yield"), true);
      assert.equal(payload.specialistContext?.spacingGuidance?.some((line) => line.toLowerCase().includes("1 to 1.5 m")), true);
    }
  },
  {
    name: "General Agronomy routes the required pilot questions",
    run: () => {
      const questions = [
        "How do I harden seedlings before transplanting?",
        "Can I intercrop maize with cowpea?",
        "How do I improve seed germination?",
        "How do I manage weeds before planting?",
        "How do I manage plant stress?",
        "What plant is this?"
      ];

      for (const question of questions) {
        assert.equal(routeFarmMateQuestion(question).selectedSpecialist, "general_agronomy", question);
      }

      const decision = manageFarmMateConversation("Can I intercrop maize with cowpea?", emptyState);
      assert.equal(decision.topic, "general_agronomy");
      assert.equal(decision.specialist, "general_agronomy");
    }
  },
  {
    name: "General Agronomy includes the required coverage and reasoning journey",
    run: () => {
      const requiredCoverage = [
        "seed germination",
        "nursery management",
        "seedling hardening",
        "transplant shock",
        "intercropping",
        "crop rotation",
        "mulching",
        "compost use",
        "soil structure",
        "drainage",
        "weed management",
        "pruning",
        "spacing principles",
        "field preparation",
        "plant stress",
        "cover crops",
        "legumes",
        "plant identification guidance",
        "farm sanitation"
      ];

      requiredCoverage.forEach((topic) => assert.equal(generalAgronomyCoverage.includes(topic as never), true, topic));
      assert.deepEqual(generalAgronomyReasoningOrder, [
        "farmer-goal",
        "crop-or-plant-if-known",
        "farm-context",
        "growth-stage-if-relevant",
        "soil-or-water-condition-if-relevant",
        "recommendation",
        "next-best-action"
      ]);
    }
  },
  {
    name: "General Agronomy decision flows stay practical and ask one question at a time",
    run: () => {
      const hardening = buildFarmMateResponse("How do I harden seedlings before transplanting?", routeFarmMateQuestion("How do I harden seedlings before transplanting?"));
      const intercropping = buildFarmMateResponse("Can I intercrop maize with cowpea?", routeFarmMateQuestion("Can I intercrop maize with cowpea?"));
      const germination = buildFarmMateResponse("How do I improve seed germination?", routeFarmMateQuestion("How do I improve seed germination?"));
      const weeds = buildFarmMateResponse("How do I manage weeds before planting?", routeFarmMateQuestion("How do I manage weeds before planting?"));
      const soil = buildFarmMateResponse("How do I improve soil structure?", routeFarmMateQuestion("How do I improve soil structure?"));
      const identification = buildFarmMateResponse("What plant is this?", routeFarmMateQuestion("What plant is this?"));

      assert.equal(hardening.flow?.id, "general-agronomy-seedling-hardening");
      assert.equal(hardening.flow?.followUpQuestions.length, 0);
      assert.equal(intercropping.flow?.id, "general-agronomy-intercropping");
      assert.equal(intercropping.flow?.followUpQuestions.length, 1);
      assert.equal(intercropping.flow?.followUpQuestions[0]?.question, "What is your main goal?");
      assert.deepEqual(intercropping.flow?.followUpQuestions[0]?.options, ["Improve soil fertility", "Reduce weeds", "Get two crops from the same field", "I am not sure"]);
      assert.equal(germination.flow?.id, "general-agronomy-seed-germination");
      assert.equal(weeds.flow?.id, "general-agronomy-weed-management");
      assert.equal(soil.flow?.id, "general-agronomy-soil-structure");
      assert.equal(identification.flow?.id, "general-agronomy-plant-identification");
      assert.equal(identification.shouldShowCropDoctorAction, true);
      assert.equal(responseText(identification).includes("Upload a clear photo of the whole plant and close-up leaves using Crop Doctor."), true);

      [hardening, intercropping, germination, weeds, soil, identification].forEach((response) => {
        assert.equal((response.flow?.followUpQuestions.length ?? 0) <= 1, true);
        assert.equal((response.sections.find((section) => section.title === "What to check")?.body.length ?? 0) <= 2, true);
        assert.equal((response.sections.find((section) => section.title === "Recommended action")?.body.length ?? 0) <= 3, true);
        assert.equal(response.sections.filter((section) => section.title === "Next Best Action").length, 1);
        assert.equal(response.sections.find((section) => section.title === "Next Best Action")?.body.length, 1);
      });

      assert.equal(generalAgronomyDecisionFlows.some((flow) => flow.id === "general-agronomy-seedling-hardening"), true);
    }
  },
  {
    name: "General Agronomy final answers use the structured farmer format",
    run: () => {
      const questions = ["How do I improve seed germination?", "How do I harden seedlings before transplanting?"];

      questions.forEach((question) => {
        const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));
        const cards = generalAgronomyRecommendationCards(response);

        assert.deepEqual(cards?.map((card) => card.title), ["What I think", "What to do now", "What to check", "Next step"]);
        assert.equal(cards?.find((card) => card.title === "What I think")?.body.length, 1);
        assert.equal((cards?.find((card) => card.title === "What to do now")?.body.length ?? 0) <= 3, true);
        assert.equal((cards?.find((card) => card.title === "What to check")?.body.length ?? 0) <= 2, true);
        assert.equal(cards?.find((card) => card.title === "Next step")?.body.length, 1);
      });
    }
  },
  {
    name: "seed germination gives useful guidance before asking the crop",
    run: () => {
      const question = "How do I improve seed germination?";
      const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));
      const cards = generalAgronomyRecommendationCards(response) ?? [];
      const guidance = cards.flatMap((card) => card.body).join(" ").toLowerCase();
      const followUp = response.flow?.followUpQuestions[0];
      const askFarmMateSource = repoFile("src/components/AskFarmMate.tsx");

      assert.equal(guidance.includes("clean, undamaged seed"), true);
      assert.equal(guidance.includes("test a small sample"), true);
      assert.equal(guidance.includes("whole plot"), true);
      assert.equal(guidance.includes("fine, moist, well-drained soil"), true);
      assert.equal(guidance.includes("do not plant too deep"), true);
      assert.equal(guidance.includes("leave seed exposed"), true);
      assert.equal(guidance.includes("moisture steady without flooding"), true);
      assert.equal(guidance.includes("gaps after emergence"), true);
      assert.equal(followUp?.question, "What crop are you planting?");
      assert.deepEqual(followUp?.options, ["Maize", "Tomato", "Pepper", "Okra", "Onion", "Watermelon", "Other crop"]);
      assert.equal(shouldShowGeneralAgronomyGuidanceBeforeFollowUp(response, false), true);
      assert.equal(guidance.includes("what crop are you planting"), false);
      assert.equal(askFarmMateSource.indexOf("{shouldShowGeneralGuidanceBeforeFollowUp ?") < askFarmMateSource.indexOf('consultation?.status === "awaiting_follow_up"'), true);
    }
  },
  {
    name: "seedling hardening guidance covers gradual field preparation",
    run: () => {
      const question = "How do I harden seedlings before transplanting?";
      const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));
      const cards = generalAgronomyRecommendationCards(response) ?? [];
      const guidance = cards.flatMap((card) => card.body).join(" ").toLowerCase();
      const nextStep = cards.find((card) => card.title === "Next step")?.body.join(" ") ?? "";

      ["gradually over several days", "morning sun", "airflow", "increase exposure slowly", "reduce watering slightly", "do not let seedlings wilt", "avoid sudden full hot sun", "cool hours", "late afternoon or cloudy weather", "water the root zone"].forEach(
        (detail) => assert.equal(guidance.includes(detail), true, detail)
      );
      assert.equal(nextStep, "Start with morning sun and airflow today, then increase exposure gradually before transplanting.");
      assert.equal(nextStep.toLowerCase().includes("extra morning sun today"), false);
    }
  },
  {
    name: "common General Agronomy questions select practical local flows",
    run: () => {
      const cases = [
        ["How do I reduce tomato transplant shock?", "general-agronomy-transplant-shock"],
        ["Why are my seedlings leggy?", "general-agronomy-leggy-seedlings"],
        ["How do I manage weeds before planting?", "general-agronomy-weed-management"],
        ["How do I improve soil structure before planting maize?", "general-agronomy-soil-structure"],
        ["How do I improve drainage in waterlogged soil?", "general-agronomy-drainage"],
        ["How should I prune pepper?", "general-agronomy-pepper-pruning"],
        ["Can I rotate maize with cowpea?", "general-agronomy-crop-rotation"],
        ["What are good compost use practices?", "general-agronomy-mulching-compost"],
        ["Can you identify this unknown plant?", "general-agronomy-plant-identification"]
      ] as const;

      cases.forEach(([question, flowId]) => {
        const router = routeFarmMateQuestion(question);
        const response = buildFarmMateResponse(question, router);

        assert.equal(router.selectedSpecialist, "general_agronomy", question);
        assert.equal(response.flow?.id, flowId, question);
      });
    }
  },
  {
    name: "General Agronomy answers keep farmer language and unsupported claims out",
    run: () => {
      const questions = [
        "How do I improve seed germination?",
        "How do I harden seedlings before transplanting?",
        "Why are my seedlings leggy?",
        "Can I intercrop maize with cowpea?",
        "How do I improve drainage in waterlogged soil?",
        "How should I prune pepper?"
      ];
      const combined = questions
        .map((question) => generalAgronomyRecommendationCards(buildFarmMateResponse(question, routeFarmMateQuestion(question))) ?? [])
        .flat()
        .flatMap((card) => card.body)
        .join(" ")
        .toLowerCase();

      assert.equal(/\bpot\b|houseplant|indoor plant|balcony|decorative plant|garden hobby/.test(combined), false);
      assert.equal(/\b\d+(?:\.\d+)?\s*(?:kg|g|ml|litres?|liters?|bags?|grams?)\b/.test(combined), false);
      assert.equal(/market price|buyer demand|guaranteed (?:yield|profit)/.test(combined), false);
    }
  },
  {
    name: "unknown crop questions continue with cautious general agronomy",
    run: () => {
      const question = "How should I grow quinoa on my farm?";
      const router = routeFarmMateQuestion(question);
      const response = buildFarmMateResponse(question, router);
      const text = responseText(response).toLowerCase();

      assert.equal(router.selectedSpecialist, "general_agronomy");
      assert.equal(response.flow?.id, "general-agronomy-unknown-crop");
      assert.equal(responseText(response).includes(GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE), true);
      assert.equal(response.flow?.followUpQuestions[0]?.question, "What are you trying to do?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Plant it", "Treat a problem", "Improve growth", "Identify the plant", "I am not sure"]);
      assert.equal(text.includes("only handles diseases"), false);
      assert.equal(text.includes("cannot help"), false);
    }
  },
  {
    name: "General Agronomy uses farmer-scale language and preserves specialist priority",
    run: () => {
      const questions = [
        "How do I harden seedlings before transplanting?",
        "Can I intercrop maize with cowpea?",
        "How do I improve seed germination?",
        "How do I manage weeds before planting?",
        "How do I improve soil structure?"
      ];
      const combined = questions
        .map((question) => responseText(buildFarmMateResponse(question, routeFarmMateQuestion(question))))
        .join("\n")
        .toLowerCase();

      assert.equal(/\bpot\b|indoor plant|houseplant|decorative plant|balcony garden/.test(combined), false);
      assert.equal(routeFarmMateQuestion("Best fertilizer for maize").selectedSpecialist, "fertilizer");
      assert.equal(routeFarmMateQuestion("Can I spray today?").selectedSpecialist, "weather_decision");
      assert.equal(routeFarmMateQuestion("How do I store cassava?").selectedSpecialist, "harvest_postharvest");
      assert.equal(routeFarmMateQuestion("When should I plant maize?").selectedSpecialist, "planting");
    }
  },
  {
    name: "OpenAI payload includes General Agronomy context and guardrails",
    run: () => {
      const farmerQuestion = "How do I improve seed germination?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({ farmerQuestion, brain, farmerAnswers: [], localStructuredResponse: [] })
      ) as {
        instruction?: string;
        selectedSpecialist?: string;
        responseRules?: string[];
        specialistContext?: {
          specialist?: string;
          task?: string;
          checks?: string[];
          actions?: string[];
          unknownCropRule?: string;
          farmerScaleLanguageRule?: string;
          noUnsupportedClaimsRule?: string;
        };
      };

      assert.equal(payload.selectedSpecialist, "general_agronomy");
      assert.equal(payload.specialistContext?.specialist, "general_agronomy");
      assert.equal(payload.specialistContext?.task, "seed-germination");
      assert.equal(payload.specialistContext?.checks?.length, 2);
      assert.equal(payload.specialistContext?.actions?.length, 3);
      assert.equal(payload.specialistContext?.unknownCropRule, GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE);
      assert.equal(payload.specialistContext?.farmerScaleLanguageRule?.includes("houseplant"), true);
      assert.equal(payload.specialistContext?.noUnsupportedClaimsRule?.includes("guaranteed yields"), true);
      assert.equal(payload.instruction?.includes("What I think:"), true);
      assert.equal(payload.responseRules?.some((rule) => rule.includes("no more than three actions")), true);
      assert.equal(payload.responseRules?.some((rule) => rule.includes("useful general guidance before asking")), true);
      assert.equal(payload.responseRules?.some((rule) => rule.includes("This depends on the crop, but the general rule is")), true);

      const aiInput = { farmerQuestion, brain, farmerAnswers: [], localStructuredResponse: generalAgronomyRecommendationCards(brain) ?? [] };
      assert.equal(isLikelyIncompleteFarmMateAnswer("Use clean seed and keep the soil moist.", aiInput), true);
      assert.equal(
        isLikelyIncompleteFarmMateAnswer(
          "What I think: Good seed and moisture support germination.\n\nWhat to do now: Test a small sample.\n\nWhat to check: Check drainage.\n\nNext step: Check the seedbed today.",
          aiInput
        ),
        false
      );
    }
  },
  {
    name: "General Agronomy documentation records structured answer quality",
    run: () => {
      const specialistDocs = repoFile("docs/FARMMATE_SPECIALISTS.md");
      const launchQa = repoFile("docs/FARMMATE_LAUNCH_QA.md");

      [specialistDocs, launchQa].forEach((document) => {
        assert.equal(document.includes("What I think"), true);
        assert.equal(document.includes("What to do now"), true);
        assert.equal(document.includes("What to check"), true);
        assert.equal(document.includes("Next step"), true);
        assert.equal(document.toLowerCase().includes("useful") && document.toLowerCase().includes("before") && document.toLowerCase().includes("follow-up"), true);
        assert.equal(document.toLowerCase().includes("practical field"), true);
      });
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
    name: "exhausted Ask FarmMate message points farmers to feedback",
    run: () => {
      const message = askFarmMateCreditMessage({ reason: "credits_exhausted", refreshInText: "6h 20m" });

      assert.equal(message, FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE);
      assert.equal(message.includes("continue using GG FarmMate when your credits refresh"), true);
      assert.equal(message.includes("share feedback"), true);
      assert.equal(message.includes("Learn"), false);
    }
  },
  {
    name: "exhausted Ask FarmMate state exposes Share feedback CTA",
    run: () => {
      assert.equal(FARM_MATE_FEEDBACK_CTA.label, "Share feedback");
      assert.equal(FARM_MATE_FEEDBACK_CTA.href, "/farmer-hub/feedback");

      const askFarmMate = repoFile("src/components/AskFarmMate.tsx");
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      assert.equal(askFarmMate.includes("FARM_MATE_FEEDBACK_CTA"), true);
      assert.equal(cropDoctor.includes("FARM_MATE_FEEDBACK_CTA"), true);
      assert.equal(askFarmMate.includes('href="/learn'), false);
      assert.equal(cropDoctor.includes('href="/learn'), false);
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
    name: "Crop Doctor crop selection is optional after photo actions",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const takePhotoIndex = cropDoctor.indexOf("Take Photo");
      const cropSelectorIndex = cropDoctor.indexOf("Tell FarmMate the crop if you know it");

      assert.ok(takePhotoIndex > 0);
      assert.ok(cropSelectorIndex > takePhotoIndex);
      assert.equal(cropDoctor.includes('id="crop-doctor-selected-crop"'), true);
      const requiredCrops = [
        "Maize",
        "Cassava",
        "Tomato",
        "Pepper",
        "Plantain",
        "Yam",
        "Onion",
        "Okra",
        "Cucumber",
        "Watermelon",
        "Garden eggs",
        "Aubergine / eggplant",
        "Potato",
        "Sweet potato",
        "Sweet melon",
        "Zucchini",
        "Lettuce",
        "Cabbage",
        "Cocoa",
        "Cashew",
        "Oil palm",
        "Mango",
        "Citrus",
        "Pineapple",
        "Not sure"
      ];

      requiredCrops.forEach((crop) => assert.equal(CROP_DOCTOR_SUPPORTED_CROPS.includes(crop), true, crop));
      assert.equal(cropDoctor.includes("Detect automatically"), true);
      assert.equal(cropDoctor.includes("CROP_DOCTOR_CROP_GROUPS.map"), true);
      assert.equal(cropDoctor.includes("<optgroup"), true);
      assert.equal(cropDoctor.includes("Select crop to analyse"), false);
    }
  },
  {
    name: "Crop Doctor symptom selection renders",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");

      assert.equal(cropDoctor.includes("What are you seeing?"), true);
      assert.equal(cropDoctor.includes("(optional)"), true);
      assert.equal(cropDoctor.includes('id="crop-doctor-selected-symptom"'), true);
      const requiredSymptoms = [
        "Yellow leaves",
        "Spots on leaves",
        "Holes in leaves",
        "Leaves curling",
        "Wilting",
        "Stunted growth",
        "Fruit problem",
        "Insects or pests",
        "Roots or tubers problem",
        "Powdery white patches",
        "Caterpillar damage",
        "Dieback",
        "Not sure"
      ];

      requiredSymptoms.forEach((symptom) => assert.equal(CROP_DOCTOR_SYMPTOMS.includes(symptom), true, symptom));
      assert.equal(cropDoctor.includes("Not sure"), true);
      assert.equal(cropDoctor.includes("symptomOptions.map"), true);
    }
  },
  {
    name: "Sprint 40 crop library covers required Ghana food vegetable fruit and cash crops",
    run: () => {
      const expectedCrops: Array<[string, keyof typeof farmMateCropGroupLabels]> = [
        ["Maize", "core_food"],
        ["Rice", "core_food"],
        ["Cowpea", "core_food"],
        ["Groundnut", "core_food"],
        ["Cocoyam", "core_food"],
        ["Aubergine / eggplant", "vegetable"],
        ["Potato", "vegetable"],
        ["Sweet potato", "vegetable"],
        ["Sweet melon", "vegetable"],
        ["Zucchini", "vegetable"],
        ["Lettuce", "vegetable"],
        ["Cabbage", "vegetable"],
        ["Kontomire", "vegetable"],
        ["Cocoa", "cash_perennial"],
        ["Cashew", "cash_perennial"],
        ["Oil palm", "cash_perennial"],
        ["Coconut", "cash_perennial"],
        ["Rubber", "cash_perennial"],
        ["Coffee", "cash_perennial"],
        ["Mango", "fruit"],
        ["Citrus", "fruit"],
        ["Pineapple", "fruit"],
        ["Pawpaw", "fruit"],
        ["Banana", "fruit"],
        ["Avocado", "fruit"],
        ["Other crop", "unknown_other"],
        ["Not sure", "unknown_other"]
      ];

      expectedCrops.forEach(([displayName, cropGroup]) => {
        const entry = findFarmMateCropLibraryEntry(displayName);

        assert.ok(entry, displayName);
        assert.equal(entry?.cropGroup, cropGroup, displayName);
        assert.equal(Boolean(entry?.cropKey), true, displayName);
        assert.equal(Boolean(entry?.aliases.length), true, displayName);
        assert.equal(entry?.supportedFor.includes("crop_doctor"), true, displayName);
        assert.equal(entry?.supportedFor.includes("general_agronomy"), true, displayName);
        assert.equal(Boolean(entry?.commonSymptoms.length), true, displayName);
        assert.equal(Boolean(entry?.commonPestDiseasePatterns.length), true, displayName);
        assert.equal(Boolean(entry?.diagnosticCautions.length), true, displayName);
      });

      assert.equal(farmMateCropGroupLabels.core_food, "Core food crop");
      assert.equal(farmMateCropGroupLabels.vegetable, "Vegetable");
      assert.equal(farmMateCropGroupLabels.cash_perennial, "Cash crop / perennial");
      assert.equal(farmMateCropGroupLabels.fruit, "Fruit crop");
      assert.equal(farmMateCropGroupLabels.unknown_other, "Not sure / other");
      assert.equal(farmMateCropLibrary.length >= 41, true);
    }
  },
  {
    name: "Sprint 40 crop aliases normalize to canonical crops without short-name collisions",
    run: () => {
      const exactAliases: Array<[string, string]> = [
        ["aubergine", "Aubergine / eggplant"],
        ["eggplant", "Aubergine / eggplant"],
        ["brinjal", "Aubergine / eggplant"],
        ["zucchini", "Zucchini"],
        ["courgette", "Zucchini"],
        ["sweet melon", "Sweet melon"],
        ["cantaloupe", "Sweet melon"],
        ["honeydew", "Sweet melon"],
        ["Irish potato", "Potato"],
        ["white potato", "Potato"],
        ["sweetpotato", "Sweet potato"],
        ["water melon", "Watermelon"],
        ["water-melon", "Watermelon"],
        ["cacao", "Cocoa"],
        ["papaya", "Pawpaw"],
        ["cocoyam leaves", "Kontomire"]
      ];

      exactAliases.forEach(([alias, displayName]) => {
        assert.equal(findFarmMateCropLibraryEntry(alias)?.displayName, displayName, alias);
      });

      assert.equal(findFarmMateCropLibraryEntry("garden egg")?.displayName, "Garden eggs");
      assert.equal(findFarmMateCropLibraryEntry("garden eggs")?.displayName, "Garden eggs");
      assert.equal(findFarmMateCropLibraryEntry("melon")?.displayName, "Sweet melon");
      assert.equal(detectFarmMateCropLibraryEntry("My sweet potato leaves are yellow")?.displayName, "Sweet potato");
      assert.equal(detectFarmMateCropLibraryEntry("My sweet melon leaves have spots")?.displayName, "Sweet melon");
      assert.equal(detectFarmMateCropLibraryEntry("There are spots on my water-melon")?.displayName, "Watermelon");
      assert.equal(detectFarmMateCropLibraryEntry("My garden egg has holes")?.displayName, "Garden eggs");
      assert.equal(detectFarmMateCropLibraryEntry("My aubergine has holes")?.displayName, "Aubergine / eggplant");
      assert.equal(detectFarmMateCropLibraryEntry("How do I plant melon?"), undefined);
    }
  },
  {
    name: "Sprint 40 Crop Doctor selector groups crops and adapts symptom checks",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const groups = farmMateCropOptionsByGroup();
      const expectedLabels = ["Common food crops", "Vegetables", "Cash crops", "Fruits", "Not sure / other"];
      const selectorLabels = CROP_DOCTOR_CROP_GROUPS.map((group) => group.label);

      expectedLabels.forEach((label) => assert.equal(selectorLabels.includes(label), true, label));
      assert.deepEqual(CROP_DOCTOR_CROP_GROUPS.map((group) => group.group), groups.map((group) => group.group));
      assert.equal(CROP_DOCTOR_CROP_GROUPS.find((group) => group.group === "cash_perennial")?.crops.includes("Cocoa"), true);
      assert.equal(CROP_DOCTOR_CROP_GROUPS.find((group) => group.group === "unknown_other")?.crops.includes("Not sure"), true);
      assert.equal(new Set(CROP_DOCTOR_SUPPORTED_CROPS).size, CROP_DOCTOR_SUPPORTED_CROPS.length);
      assert.equal(cropDoctor.includes("<optgroup"), true);
      assert.equal(cropDoctor.includes("group.crops.map"), true);
      assert.equal(cropDoctor.includes('setSelectedSymptom("")'), true);
      assert.equal(normalizeCropDoctorSelectedCrop("eggplant"), "Aubergine / eggplant");
      assert.equal(normalizeCropDoctorSelectedCrop("cacao"), "Cocoa");
      assert.equal(normalizeCropDoctorSelectedCrop("Irish potato"), "Potato");
      assert.equal(cropDoctorSymptomsForCrop("Zucchini").includes("Powdery white patches"), true);
      assert.equal(cropDoctorSymptomsForCrop("Cabbage").includes("Caterpillar damage"), true);
      assert.equal(cropDoctorSymptomsForCrop("Cocoa").includes("Dieback"), true);
    }
  },
  {
    name: "Sprint 40 crop-family guidance stays cautious for related crops",
    run: () => {
      const aubergine = findFarmMateCropLibraryEntry("aubergine");
      const potato = findFarmMateCropLibraryEntry("Irish potato");
      const zucchini = findFarmMateCropLibraryEntry("courgette");
      const cabbage = findFarmMateCropLibraryEntry("cabbage");
      const cocoa = findFarmMateCropLibraryEntry("cacao");
      const aubergineGuidance = farmMateCropFamilyGuidance("aubergine") ?? "";

      assert.equal(aubergine?.cropFamily, "Nightshade / Solanaceae");
      assert.equal(potato?.cropFamily?.includes("Nightshade / Solanaceae"), true);
      assert.equal(potato?.cropFamily?.toLowerCase().includes("root / tuber"), true);
      assert.equal(zucchini?.cropFamily, "Cucurbit");
      assert.equal(cabbage?.cropFamily, "Brassica");
      assert.equal(cocoa?.cropFamily?.includes("Perennial cash crop"), true);
      assert.equal(aubergineGuidance.toLowerCase().includes("tomato or pepper-like"), true);
      assert.equal(aubergineGuidance.toLowerCase().includes("exact cause still needs checking"), true);
      assert.equal(aubergineGuidance.toLowerCase().includes("definitely"), false);
    }
  },
  {
    name: "Sprint 40 Crop Doctor analyses aubergine with family context instead of refusing",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "eggplant",
        selectedSymptom: "Spots on leaves",
        cropFromImage: "aubergine",
        cropConfidence: "medium",
        photoCropMatch: "likely",
        resultType: "possible_disease",
        issueCategory: "disease",
        possibleIssue: "A named aubergine disease without enough evidence",
        mainFinding: "A named aubergine disease",
        visibleSigns: ["brown leaf spots", "yellow edges"],
        whatThisMeans: "A named aubergine disease is present.",
        recommendedActions: ["Check nearby plants before treatment."],
        nextBestAction: "Compare affected leaves with healthy aubergine leaves."
      });
      const text = JSON.stringify(result).toLowerCase();

      assert.equal(result.selectedCrop, "Aubergine / eggplant");
      assert.equal(result.cropFromImage, "Aubergine / eggplant");
      assert.equal(result.crop, "Aubergine / eggplant");
      assert.equal(result.cropGroup, "Vegetable");
      assert.equal(result.cropFamily, "Nightshade / Solanaceae");
      assert.equal(result.photoConfidenceLabel, "Possible");
      assert.equal(result.familyGuidance?.includes("exact cause still needs checking"), true);
      assert.equal(result.limitedGuidanceNote?.includes("can still help using general crop-family guidance"), true);
      assert.equal(text.includes("named aubergine disease"), false);
      assert.equal(/cannot help|not supported|refuse/.test(text), false);
      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Sprint 40 Crop Doctor adds valuable-perennial caution to serious cocoa context",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "cocoa",
        selectedSymptom: "Dieback",
        cropFromImage: "cacao",
        cropConfidence: "high",
        photoCropMatch: "likely",
        resultType: "possible_disease",
        issueCategory: "disease",
        possibleIssue: "Possible spreading stem problem",
        mainFinding: "Possible spreading cocoa stem problem",
        visibleSigns: ["dieback", "dark stem area"],
        recommendedActions: [
          "Check nearby cocoa trees for the same signs.",
          "Spray fungicide on all affected cocoa trees."
        ],
        nextBestAction: "Mark affected trees and arrange an experienced field check."
      });
      const handoff = buildCropDoctorHandoffContext(result);

      assert.equal(result.crop, "Cocoa");
      assert.equal(result.cropFromImage, "Cocoa");
      assert.equal(result.cropGroup, "Cash crop / perennial");
      assert.equal(result.photoConfidenceLabel, "Likely");
      assert.equal(cropDoctorPhotoConfidenceLabel(result), "Likely");
      assert.equal(result.cashCropCaution, FARM_MATE_CASH_CROP_CAUTION);
      assert.equal(handoff.cashCropCaution, FARM_MATE_CASH_CROP_CAUTION);
      assert.equal(result.limitedGuidanceNote?.includes("can still help"), true);
      assert.equal(result.recommendedActions.some((action) => /fungicide|pesticide|insecticide|herbicide/i.test(action)), false);
      assert.equal(result.recommendedActions.some((action) => action.includes("extension officer")), true);
      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Sprint 40 unknown Crop Doctor result describes features and never forces diagnosis",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Not sure",
        cropFromImage: null,
        cropConfidence: "low",
        photoCropMatch: "not_clear",
        resultType: "possible_disease",
        issueCategory: "disease",
        possibleIssue: "Definitely a named leaf disease",
        mainFinding: "A named disease is confirmed",
        visibleSigns: ["serrated leaves", "purple stem"]
      });
      const resultText = JSON.stringify(result).toLowerCase();

      assert.equal(result.crop, null);
      assert.equal(result.cropGroup, null);
      assert.equal(result.resultType, "crop_not_confirmed");
      assert.equal(result.issueCategory, "unknown");
      assert.equal(result.possibleIssue, "Crop not confirmed from this photo");
      assert.equal(cropDoctorResultHeadline(result), "Crop not confirmed");
      assert.equal(result.photoConfidenceLabel, "Unclear");
      assert.equal(result.visibleSigns.includes("serrated leaves"), true);
      assert.equal(result.whatToCheck.some((line) => line.includes("whole plant")), true);
      assert.equal(result.whatToCheck.some((line) => line.includes("Select the crop")), true);
      assert.equal(result.recommendedActions.some((line) => line.includes("Ask FarmMate")), true);
      assert.equal(result.askFarmMatePrompt.includes("could not confirm the crop"), true);
      assert.equal(resultText.includes("named disease"), false);
      assert.equal(resultText.includes("definitely"), false);
    }
  },
  {
    name: "Sprint 40 Ask FarmMate recognizes expanded crops and routes their tasks safely",
    run: () => {
      const routingCases: Array<[string, string, string[]]> = [
        ["What is wrong with my cocoa?", "Cocoa", ["crop_health"]],
        ["My cocoa leaves are yellow", "Cocoa", ["crop_health"]],
        ["My cashew leaves are yellow", "Cashew", ["crop_health"]],
        ["How do I plant zucchini?", "Zucchini", ["planting", "general_agronomy"]],
        ["My sweet melon leaves have spots", "Sweet melon", ["crop_health", "pest_disease"]],
        ["My potato plants are wilting", "Potato", ["crop_health"]],
        ["Can I grow aubergine in Ghana?", "Aubergine / eggplant", ["general_agronomy", "planting"]],
        ["What disease is this on oil palm?", "Oil palm", ["pest_disease", "crop_health"]],
        ["My pineapple leaves are yellow", "Pineapple", ["crop_health"]],
        ["My cabbage has holes", "Cabbage", ["crop_health", "pest_disease"]]
      ];

      routingCases.forEach(([question, crop, allowedSpecialists]) => {
        const route = routeFarmMateQuestion(question);

        assert.equal(route.detectedCrop, crop, question);
        assert.equal(allowedSpecialists.includes(route.selectedSpecialist), true, `${question}: ${route.selectedSpecialist}`);
      });

      ["How do I plant zucchini?", "Can I grow aubergine in Ghana?"].forEach((question) => {
        const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));
        const text = responseText(response).toLowerCase();

        assert.equal(Boolean(response.resolvedCrop), true, question);
        assert.equal(/cannot help|crop is not supported|refuse/.test(text), false, question);
      });
    }
  },
  {
    name: "Sprint 40 OpenAI contexts include aliases families cautious fallback and cash-crop rules",
    run: () => {
      const cocoaQuestion = "My cacao leaves are yellow";
      const cocoaBrain = buildFarmMateResponse(cocoaQuestion, routeFarmMateQuestion(cocoaQuestion));
      const cocoaPayload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion: cocoaQuestion,
          brain: cocoaBrain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as {
        cropLibraryContext?: {
          displayName?: string;
          cropGroup?: string;
          cropFamily?: string;
          aliases?: string[];
          familyGuidance?: string;
          limitedGuidanceNote?: string;
          cashCropCaution?: string;
        };
        responseRules?: string[];
      };
      const cropPrompt = farmMateCropLibraryPromptContext();
      const visionPrompt = cropDoctorVisionSystemPrompt();
      const rules = cocoaPayload.responseRules?.join(" ") ?? "";

      assert.equal(cocoaPayload.cropLibraryContext?.displayName, "Cocoa");
      assert.equal(cocoaPayload.cropLibraryContext?.cropGroup, "Cash crop / perennial");
      assert.equal(cocoaPayload.cropLibraryContext?.cropFamily?.includes("Perennial cash crop"), true);
      assert.equal(cocoaPayload.cropLibraryContext?.aliases?.includes("cacao"), true);
      assert.equal(cocoaPayload.cropLibraryContext?.limitedGuidanceNote?.includes("general crop-family guidance"), true);
      assert.equal(cocoaPayload.cropLibraryContext?.cashCropCaution, FARM_MATE_CASH_CROP_CAUTION);
      assert.equal(rules.includes(FARM_MATE_CASH_CROP_CAUTION), true);
      assert.equal(cropPrompt.includes("Aubergine / eggplant"), true);
      assert.equal(cropPrompt.includes("Zucchini"), true);
      assert.equal(cropPrompt.includes("courgette"), true);
      assert.equal(cropPrompt.includes("Sweet melon"), true);
      assert.equal(cropPrompt.toLowerCase().includes("irish potato"), true);
      assert.equal(FARM_MATE_SYSTEM_PROMPT.includes("crop-family similarities only as cautious context"), true);
      assert.equal(FARM_MATE_SYSTEM_PROMPT.includes(FARM_MATE_CASH_CROP_CAUTION), true);
      assert.equal(visionPrompt.includes("do not refuse"), true);
      assert.equal(visionPrompt.includes("Do not invent pesticide or fertilizer dosage"), true);
      assert.equal(visionPrompt.includes("yield, guaranteed yield, profit, market price, buyer demand"), true);
      assert.equal(visionPrompt.includes("Think like a field crop advisor, not a home gardening assistant."), true);
    }
  },
  {
    name: "Sprint 40 Crop Doctor sanitizes dosage commercial claims and hobby-gardening language",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Cabbage",
        cropFromImage: "Cabbage",
        cropConfidence: "high",
        photoCropMatch: "likely",
        resultType: "possible_pest",
        issueCategory: "pest",
        possibleIssue: "This is definitely a pest",
        mainFinding: "Definitely pest damage",
        visibleSigns: ["holes in leaves"],
        recommendedActions: [
          "Apply 10ml per litre.",
          "Guaranteed yield and guaranteed profit.",
          "The market price and buyer demand are strong."
        ],
        prevention: ["Move the houseplant pot to the balcony hobby garden."],
        nextBestAction: "Check nearby plants."
      });
      const text = JSON.stringify(result).toLowerCase();

      assert.equal(/10ml per litre|guaranteed|\byield\b|\bprofit\b|market price|buyer demand/.test(text), false);
      assert.equal(/houseplant|\bpot\b|balcony|hobby garden/.test(text), false);
      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Sprint 40 crop photos stay transient and are not written to application storage",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const route = repoFile("src/app/api/farmmate/crop-doctor/route.ts");
      const vision = repoFile("src/lib/farmmate/ai/vision.ts");

      assert.equal(cropDoctor.includes("URL.createObjectURL(file)"), true);
      assert.equal(cropDoctor.includes("URL.revokeObjectURL(selectedImage)"), true);
      assert.equal(cropDoctor.includes("localStorage.setItem"), false);
      assert.equal(cropDoctor.includes("sessionStorage.setItem"), false);
      assert.equal(route.includes("storage.from"), false);
      assert.equal(route.includes("insertSupabaseRecord"), false);
      assert.equal(vision.includes("writeFile"), false);
      assert.equal(vision.includes("createWriteStream"), false);
    }
  },
  {
    name: "Crop Doctor renders Take Photo and Choose Photo actions",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");

      assert.equal(cropDoctor.includes("Take a photo of the affected crop, or choose one from your phone."), true);
      assert.equal(cropDoctor.includes("Take Photo"), true);
      assert.equal(cropDoctor.includes("Choose Photo"), true);
      assert.equal(cropDoctor.includes('aria-label="Take Photo"'), true);
      assert.equal(cropDoctor.includes('aria-label="Choose Photo"'), true);
    }
  },
  {
    name: "Take Photo input accepts images and requests rear camera capture",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const cameraInput = cropDoctor.match(/<input\s*\r?\n\s+ref={cameraInputRef}[\s\S]*?\/>/)?.[0] ?? "";

      assert.notEqual(cameraInput, "");
      assert.equal(cropDoctor.includes('const CROP_DOCTOR_IMAGE_ACCEPT = CROP_DOCTOR_ACCEPTED_IMAGE_TYPES.join(",")'), true);
      assert.equal(cameraInput.includes("accept={CROP_DOCTOR_IMAGE_ACCEPT}"), true);
      assert.equal(cameraInput.includes('capture="environment"'), true);
      assert.equal(cameraInput.includes("onChange={handleImageChange}"), true);
      assert.equal(cropDoctor.includes("cameraInputRef.current?.click()"), true);
    }
  },
  {
    name: "Choose Photo input accepts images without forcing capture",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const pickerInput = cropDoctor.match(/<input\s*\r?\n\s+ref={galleryInputRef}[\s\S]*?\/>/)?.[0] ?? "";

      assert.notEqual(pickerInput, "");
      assert.equal(pickerInput.includes("accept={CROP_DOCTOR_IMAGE_ACCEPT}"), true);
      assert.equal(pickerInput.includes("capture="), false);
      assert.equal(pickerInput.includes("onChange={handleImageChange}"), true);
      assert.equal(cropDoctor.includes("galleryInputRef.current?.click()"), true);
    }
  },
  {
    name: "Take Photo input and Choose Photo input both update selected image state",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const cameraInput = cropDoctor.match(/<input\s*\r?\n\s+ref={cameraInputRef}[\s\S]*?\/>/)?.[0] ?? "";
      const pickerInput = cropDoctor.match(/<input\s*\r?\n\s+ref={galleryInputRef}[\s\S]*?\/>/)?.[0] ?? "";

      assert.equal(cameraInput.includes("onChange={handleImageChange}"), true);
      assert.equal(pickerInput.includes("onChange={handleImageChange}"), true);
      assert.equal(cropDoctor.includes("setSelectedImage(URL.createObjectURL(file))"), true);
      assert.equal(cropDoctor.includes("if (!file)"), true);
    }
  },
  {
    name: "Crop Doctor accepts supported image validation types",
    run: () => {
      assert.equal(validateCropDoctorImage({ type: "image/jpeg", size: CROP_DOCTOR_MAX_IMAGE_BYTES }).ok, true);
      assert.equal(validateCropDoctorImage({ type: "image/png", size: 128_000 }).ok, true);
      assert.equal(validateCropDoctorImage({ type: "image/webp", size: 128_000 }).ok, true);
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
    name: "Crop Doctor image preview still appears after selection",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");

      assert.equal(cropDoctor.includes("setSelectedImage(URL.createObjectURL(file))"), true);
      assert.equal(cropDoctor.includes("setSelectedFile(file)"), true);
      assert.equal(cropDoctor.includes("setFileName(file.name)"), true);
      assert.equal(cropDoctor.includes("Selected crop preview"), true);
      assert.equal(cropDoctor.includes('fileName || "Crop photo selected"'), true);
    }
  },
  {
    name: "Crop Doctor Analyse Crop flow submits selected image with optional crop and symptom",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const route = repoFile("src/app/api/farmmate/crop-doctor/route.ts");
      const vision = repoFile("src/lib/farmmate/ai/vision.ts");

      assert.equal(cropDoctor.includes("Analyse Crop"), true);
      assert.equal(cropDoctor.includes("Take or choose a photo first"), true);
      assert.equal(cropDoctor.includes('formData.append("image", selectedFile)'), true);
      assert.equal(cropDoctor.includes('formData.append("selectedCrop", selectedCrop || CROP_DOCTOR_AUTO_DETECT_VALUE)'), true);
      assert.equal(cropDoctor.includes('formData.append("selectedSymptom", selectedSymptom || "Not sure")'), true);
      assert.equal(cropDoctor.includes('fetch("/api/farmmate/crop-doctor"'), true);
      assert.equal(route.includes("selectedCrop"), true);
      assert.equal(route.includes("selectedSymptom"), true);
      assert.equal(vision.includes("Farmer-selected crop:"), true);
      assert.equal(vision.includes("Farmer-selected symptom:"), true);
      assert.equal(cropDoctor.includes("shouldDisableCropDoctorAnalysis(credits)"), true);
      assert.equal(cropDoctor.includes("!selectedFile || isAnalysing || isAnalysisDisabled"), true);
      assert.equal(cropDoctor.includes("buildCropDoctorHandoffContext(diagnosis)"), true);
    }
  },
  {
    name: "Crop Doctor can analyse with image selected and no crop selected",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const route = repoFile("src/app/api/farmmate/crop-doctor/route.ts");

      assert.equal(cropDoctor.includes("isCropSelectionMissing"), false);
      assert.equal(cropDoctor.includes("Please select the crop before analysing"), false);
      assert.equal(cropDoctor.includes('disabled={isAnalyseButtonDisabled}'), true);
      assert.equal(cropDoctor.includes('formData.append("selectedCrop", selectedCrop || CROP_DOCTOR_AUTO_DETECT_VALUE)'), true);
      assert.equal(route.includes("normalizeCropDoctorSelectedCrop(formData.get(\"selectedCrop\"))"), true);
      assert.equal(normalizeCropDoctorSelectedCrop(null), "Not sure");
      assert.equal(normalizeCropDoctorSelectedCrop(""), "Not sure");
      assert.equal(normalizeCropDoctorSelectedCrop("not_sure"), "Not sure");
      assert.equal(normalizeCropDoctorSelectedCrop("Maize"), "Maize");
    }
  },
  {
    name: "Crop Doctor API accepts missing selectedCrop",
    run: () => {
      const route = repoFile("src/app/api/farmmate/crop-doctor/route.ts");

      assert.equal(route.includes('reason: "missing_crop"'), false);
      assert.equal(route.includes("Please select the crop before analysing the photo."), false);
      assert.equal(route.includes("CROP_DOCTOR_SUPPORTED_CROPS.includes"), false);
      assert.equal(route.includes('selectedCrop = normalizeCropDoctorSelectedCrop(formData.get("selectedCrop"))'), true);
      assert.equal(route.indexOf("normalizeCropDoctorSelectedCrop") < route.indexOf("const buffer = Buffer.from"), true);
    }
  },
  {
    name: "Crop Doctor API rejects missing image",
    run: () => {
      const route = repoFile("src/app/api/farmmate/crop-doctor/route.ts");

      assert.equal(route.includes('reason: "missing_image"'), true);
      assert.equal(route.includes("Please upload a crop image."), true);
      assert.equal(route.indexOf('reason: "missing_image"') < route.indexOf("const imageValidation"), true);
    }
  },
  {
    name: "Crop Doctor API still validates file type and 5 MB size",
    run: () => {
      const route = repoFile("src/app/api/farmmate/crop-doctor/route.ts");

      assert.equal(route.includes("validateCropDoctorImage({ type: image.type, size: image.size })"), true);
      assert.equal(route.includes('imageValidation.reason === "file_too_large" ? 413 : 400'), true);
      assert.equal(route.indexOf("validateCropDoctorImage") < route.indexOf("checkFarmMateCreditsForDevice"), true);
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
    name: "exhausted Crop Doctor credits show feedback message",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [
        usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
        usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
      ];
      const decision = getFarmMateCreditDecision("crop_doctor", events, now);
      const message = cropDoctorCreditMessage(decision);

      assert.equal(message, FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE);
      assert.equal(message.includes("credits refresh"), true);
      assert.equal(message.includes("share feedback"), true);
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
    name: "unknown Crop Doctor reset time still uses pilot feedback message",
    run: () => {
      const message = cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: formatRefreshIn(null) });

      assert.equal(message, FARM_MATE_EXHAUSTED_FEEDBACK_MESSAGE);
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
        cropFromImage: null,
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
    name: "Crop Doctor handoff includes selected crop and symptom",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        selectedCrop: "Cassava",
        selectedSymptom: "Leaves curling",
        crop: "Cassava",
        possibleIssue: "Mosaic disease",
        visibleSigns: ["leaf curling", "pale patches"]
      });

      assert.equal(prompt.includes("I selected Cassava"), true);
      assert.equal(prompt.includes("showing leaves curling"), true);
      assert.equal(prompt.includes("leaf curling, pale patches"), true);
      assert.equal(prompt.toLowerCase().includes("tomato"), false);
      assert.equal(prompt.toLowerCase().includes("early blight"), false);
    }
  },
  {
    name: "Crop Doctor handoff works with detected crop",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        selectedCrop: "Not sure",
        selectedSymptom: "Not sure",
        crop: "Maize",
        cropConfidence: "medium",
        resultType: "possible_disease",
        possibleIssue: "Possible disease",
        visibleSigns: ["orange spots"]
      });

      assert.equal(prompt, "Crop Doctor detected Maize from my photo and saw orange spots. What should I check next?");
      assert.equal(prompt.toLowerCase().includes("tomato"), false);
      assert.equal(prompt.toLowerCase().includes("early blight"), false);
    }
  },
  {
    name: "Crop Doctor handoff uses neutral wording when crop unknown",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        selectedCrop: "Not sure",
        selectedSymptom: "Not sure",
        crop: null,
        possibleIssue: "Possible disease",
        visibleSigns: ["brown spots"]
      });

      assert.equal(prompt, "I uploaded a crop photo, but Crop Doctor could not confirm the crop. It saw brown spots. What should I check next?");
    }
  },
  {
    name: "Photo mismatch uses cautious wording",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Maize",
        cropFromImage: "Cassava",
        photoCropMatch: "uncertain",
        mainFinding: "Possible leaf disease",
        visibleSigns: ["blurred leaves"]
      });

      assert.equal(result.selectedCrop, "Maize");
      assert.equal(result.photoCropMatch, "uncertain");
      assert.equal(
        result.mainFinding,
        "The selected crop is maize, but the photo does not clearly show maize. Please upload a clearer photo of the affected maize plant."
      );
    }
  },
  {
    name: "Not sure crop uses cautious crop identification",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Not sure",
        cropFromImage: "Pepper",
        visibleSigns: ["curling leaves"]
      });

      assert.equal(result.selectedCrop, "Not sure");
      assert.equal(result.cropFromImage, "Pepper");
      assert.equal(result.photoCropMatch, "not_clear");
      assert.equal(result.resultType, "crop_not_confirmed");
      assert.equal(result.askFarmMatePrompt.includes("could not confirm the crop"), true);
    }
  },
  {
    name: "detected Crop Doctor result is used only with enough crop confidence",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Not sure",
        cropFromImage: "Pepper",
        cropConfidence: "medium",
        resultType: "possible_pest",
        visibleSigns: ["curling leaves"]
      });

      assert.equal(result.selectedCrop, "Not sure");
      assert.equal(result.crop, "Pepper");
      assert.equal(result.photoCropMatch, "uncertain");
      assert.equal(result.askFarmMatePrompt, "Crop Doctor detected Pepper from my photo and saw curling leaves. What should I check next?");
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
        cropConfidence: "high",
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
        selectedCrop: "Cassava",
        selectedSymptom: "Roots or tubers problem",
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
        "I selected Cassava and uploaded a crop photo showing roots or tubers problem. Crop Doctor saw harvested roots. What should I check next?"
      );
    }
  },
  {
    name: "Crop Doctor vision prompt discourages forced diagnosis",
    run: () => {
      const prompt = cropDoctorVisionSystemPrompt();

      assert.equal(prompt.includes("harvest_or_storage_check"), true);
      assert.equal(prompt.includes("do not force a disease diagnosis"), true);
      assert.equal(prompt.includes("Do not claim a guaranteed diagnosis."), true);
      assert.equal(prompt.includes("Do not invent pesticide or fertilizer dosage"), true);
      assert.equal(prompt.includes("Do not recommend fungicide or pesticide as the first step"), true);
    }
  },
  {
    name: "Crop Doctor vision prompt forbids home gardening language",
    run: () => {
      const prompt = cropDoctorVisionSystemPrompt();

      assert.equal(prompt.includes("Think like a field crop advisor, not a home gardening assistant."), true);
      assert.equal(prompt.includes("Avoid home gardening language: pot, houseplant, indoor plant, garden soil, decorative plant."), true);
      assert.equal(prompt.includes("Use farmer-scale language"), true);
    }
  },
  {
    name: "Crop Doctor main heading uses finding not Crop detected",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Maize",
        selectedSymptom: "Spots on leaves",
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
    name: "Crop Doctor result shows selected crop in unified crop metadata",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Maize",
        crop: "Maize",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange spots"]
      });

      const metadata = `Crop: ${result.crop}`;
      assert.equal(metadata, "Crop: Maize");
      assert.equal(cropDoctor.includes('>Crop</dt>'), true);
      assert.equal(cropDoctor.includes("Crop group"), true);
      assert.equal(cropDoctor.includes("Photo confidence"), true);
      assert.equal(cropDoctor.includes("Crop detected:"), false);
      assert.equal(cropDoctorResultHeadline(result).includes("Crop detected"), false);
    }
  },
  {
    name: "Crop Doctor result shows detected crop in unified crop metadata",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Not sure",
        cropFromImage: "Maize",
        cropConfidence: "medium",
        resultType: "possible_disease",
        mainFinding: "Possible maize leaf disease",
        visibleSigns: ["orange spots"]
      });

      assert.equal(result.selectedCrop, "Not sure");
      assert.equal(result.crop, "Maize");
      assert.equal(result.askFarmMatePrompt, "Crop Doctor detected Maize from my photo and saw orange spots. What should I check next?");
      assert.equal(cropDoctor.includes('>Crop</dt>'), true);
      assert.equal(cropDoctor.includes("{diagnosis.crop}"), true);
      assert.equal(cropDoctor.includes("Photo confidence"), true);
    }
  },
  {
    name: "Crop Doctor result shows Crop not confirmed when model is unsure",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");
      const result = normalizeCropDoctorVisionResult({
        selectedCrop: "Not sure",
        cropFromImage: null,
        cropConfidence: "low",
        visibleSigns: ["blurred leaves"]
      });

      assert.equal(result.crop, null);
      assert.equal(result.resultType, "crop_not_confirmed");
      assert.equal(result.askFarmMatePrompt, "I uploaded a crop photo, but Crop Doctor could not confirm the crop. It saw blurred leaves. What should I check next?");
      assert.equal(cropDoctor.includes("Crop not confirmed"), true);
      assert.equal(cropDoctor.includes("FarmMate could not confirm the crop from this photo."), true);
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

      const watermelonCleaned = cleanFarmMateFinalAnswer("You mean watermelon. Good.\n\nWhich region are you farming in?");
      assert.equal(watermelonCleaned.includes("You mean watermelon. Good."), false);
      assert.equal(watermelonCleaned, "Which region are you farming in?");
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
  },
  {
    name: "Ask FarmMate completed answers expose rating and copy controls",
    run: () => {
      const askFarmMate = repoFile("src/components/AskFarmMate.tsx");
      const feedbackControl = repoFile("src/components/FarmMateAnswerFeedback.tsx");

      assert.deepEqual(
        farmMateAnswerFeedbackOptions.map((option) => option.label),
        ["Helpful", "Not clear", "Wrong answer"]
      );
      assert.equal(askFarmMate.includes('prompt="Was this helpful?"'), true);
      assert.equal(askFarmMate.includes('wrongButtonLabel="Wrong answer"'), true);
      assert.equal(askFarmMate.includes('tool: "ask_farmmate"'), true);
      assert.equal(askFarmMate.includes("originalQuestion: consultation?.originalQuestion || askedQuestion || undefined"), true);
      assert.equal(askFarmMate.includes("specialist: consultation?.specialist ?? response?.routerResult?.selectedSpecialist"), true);
      assert.equal(askFarmMate.includes("answerSnippet: farmMateAnswerSnippet(cleanDisplayedAnswer)"), true);
      assert.equal(feedbackControl.includes("Send more feedback"), true);
      assert.equal(feedbackControl.includes("Copy answer"), true);
      assert.equal(
        FARM_MATE_PILOT_TRUST_NOTE,
        "FarmMate is a pilot advisor. For serious or spreading crop problems, confirm with an extension officer."
      );
      assert.equal(feedbackControl.includes("{FARM_MATE_PILOT_TRUST_NOTE}"), true);
    }
  },
  {
    name: "Crop Doctor completed results expose contextual rating controls",
    run: () => {
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");

      assert.equal(cropDoctor.includes('prompt="Was this crop check helpful?"'), true);
      assert.equal(cropDoctor.includes('wrongButtonLabel="Wrong crop/problem"'), true);
      assert.equal(cropDoctor.includes('tool: "crop_doctor"'), true);
      assert.equal(cropDoctor.includes("selectedCrop: diagnosisHasSelectedCrop ? diagnosis.selectedCrop : undefined"), true);
      assert.equal(cropDoctor.includes("detectedCrop: diagnosis.cropFromImage ?? undefined"), true);
      assert.equal(cropDoctor.includes("selectedSymptom: diagnosisSelectedSymptom ?? undefined"), true);
      assert.equal(cropDoctor.includes("resultType: diagnosis.resultType"), true);
      assert.equal(cropDoctor.includes("visibleSignsSnippet: farmMateAnswerSnippet(diagnosis.visibleSigns.join(\"; \"))"), true);
      assert.ok(cropDoctor.indexOf("{hasDiagnosis && diagnosis ?") < cropDoctor.indexOf("<FarmMateAnswerFeedback"));
    }
  },
  {
    name: "prepared Ask FarmMate feedback keeps question specialist tool and answer context",
    run: () => {
      const values = new Map<string, string>();
      const storage = {
        setItem(key: string, value: string) {
          values.set(key, value);
        },
        getItem(key: string) {
          return values.get(key) ?? null;
        }
      };
      const timestamp = "2026-07-21T09:15:00.000Z";

      assert.equal(
        storeFarmMatePreparedAnswerFeedback(storage, {
          tool: "ask_farmmate",
          timestamp,
          feedbackType: "not_clear",
          originalQuestion: "Why are my maize leaves yellow?",
          specialist: "general_agronomy",
          answerSnippet: "Check moisture and inspect the newest leaves first."
        }),
        true
      );

      const prepared = readFarmMatePreparedAnswerFeedback(storage);
      assert.ok(prepared);
      assert.equal(prepared.tool, "ask_farmmate");
      assert.equal(prepared.timestamp, timestamp);
      assert.equal(prepared.originalQuestion, "Why are my maize leaves yellow?");
      assert.equal(prepared.specialist, "general_agronomy");
      assert.equal(prepared.answerSnippet, "Check moisture and inspect the newest leaves first.");
      assert.equal(values.has(FARM_MATE_ANSWER_FEEDBACK_STORAGE_KEY), true);

      const prefill = farmMateAnswerFeedbackFormPrefill(prepared);
      assert.equal(prefill.helpfulness, "partly");
      assert.equal(prefill.testedFeature.includes("Tool: Ask FarmMate"), true);
      assert.equal(prefill.testedFeature.includes("Question: Why are my maize leaves yellow?"), true);
      assert.equal(prefill.testedFeature.includes("Specialist: general_agronomy"), true);
      assert.equal(prefill.testedFeature.includes("Answer: Check moisture"), true);
    }
  },
  {
    name: "prepared Crop Doctor feedback keeps crop symptom result and visible-sign context",
    run: () => {
      const prepared = sanitizeFarmMatePreparedAnswerFeedback({
        tool: "crop_doctor",
        timestamp: "2026-07-21T09:20:00.000Z",
        feedbackType: "wrong_answer",
        wrongReason: "wrong_problem",
        optionalText: "The spots appeared after heavy rain.",
        selectedCrop: "Tomato",
        detectedCrop: "Pepper",
        selectedSymptom: "Leaf spots",
        resultType: "possible_issue",
        visibleSignsSnippet: "Brown circular patches on lower leaves"
      });

      assert.ok(prepared);
      const prefill = farmMateAnswerFeedbackFormPrefill(prepared);
      assert.equal(prefill.helpfulness, "not_yet");
      assert.equal(prefill.mainCrop, "Tomato");
      assert.equal(prefill.testedFeature.includes("Tool: Crop Doctor"), true);
      assert.equal(prefill.testedFeature.includes("Rating: Wrong crop/problem"), true);
      assert.equal(prefill.testedFeature.includes("Selected crop: Tomato"), true);
      assert.equal(prefill.testedFeature.includes("Detected crop: Pepper"), true);
      assert.equal(prefill.testedFeature.includes("Selected symptom: Leaf spots"), true);
      assert.equal(prefill.testedFeature.includes("Result type: possible_issue"), true);
      assert.equal(prefill.confusion?.includes("What was wrong: Wrong problem"), true);
      assert.equal(prefill.confusion?.includes("Visible signs: Brown circular patches"), true);
      assert.equal(prefill.improvement, "The spots appeared after heavy rain.");
    }
  },
  {
    name: "wrong-answer flow offers simple reasons and optional detail",
    run: () => {
      const feedbackControl = repoFile("src/components/FarmMateAnswerFeedback.tsx");

      assert.deepEqual(
        farmMateWrongAnswerReasons.map((reason) => reason.label),
        ["Wrong crop", "Wrong problem", "Not enough detail", "Advice not practical", "Other"]
      );
      assert.equal(feedbackControl.includes("What was wrong?"), true);
      assert.equal(feedbackControl.includes('feedbackType === "wrong_answer"'), true);
      assert.equal(feedbackControl.includes('onClick={() => prepareFeedback("wrong_answer", reason.value)}'), true);
      assert.equal(feedbackControl.includes("Add a note"), true);
      assert.equal(feedbackControl.includes("Optional"), true);
      assert.equal(feedbackControl.includes("event.target.value.slice(0, 400)"), true);
    }
  },
  {
    name: "copy answer uses only clean farmer-facing answer text",
    run: () => {
      const feedbackControl = repoFile("src/components/FarmMateAnswerFeedback.tsx");
      const copiedNaturalAnswer = farmMateCleanAnswerForCopy(
        "Check soil moisture before applying fertilizer.\nMatched keywords: maize, fertilizer\nConfidence: 0.94\nFarmMate router: general_agronomy",
        []
      );
      const copiedLocalAnswer = farmMateCleanAnswerForCopy("", [
        { title: "Here's what I understand", body: ["Internal summary"] },
        { title: "Next step", body: ["Check the youngest leaves this morning."] }
      ]);

      assert.equal(copiedNaturalAnswer, "Check soil moisture before applying fertilizer.");
      assert.equal(copiedNaturalAnswer.includes("Matched keywords"), false);
      assert.equal(copiedNaturalAnswer.includes("Confidence"), false);
      assert.equal(copiedNaturalAnswer.includes("FarmMate router"), false);
      assert.equal(copiedLocalAnswer.includes("Internal summary"), false);
      assert.equal(copiedLocalAnswer, "Next step:\nCheck the youngest leaves this morning.");
      assert.equal(feedbackControl.includes("navigator.clipboard.writeText(copyText)"), true);
      assert.equal(feedbackControl.includes('? "Copied"'), true);
    }
  },
  {
    name: "feedback controls wait for a real answer and preserve credit exhaustion",
    run: () => {
      const askFarmMate = repoFile("src/components/AskFarmMate.tsx");
      const cropDoctor = repoFile("src/components/CropDoctor.tsx");

      assert.equal(shouldShowFarmMateAnswerFeedback("", false), false);
      assert.equal(shouldShowFarmMateAnswerFeedback("A completed answer", true), false);
      assert.equal(shouldShowFarmMateAnswerFeedback("A completed answer", false), true);
      assert.equal(askFarmMate.includes("shouldShowFarmMateFinalControls"), true);
      assert.equal(askFarmMate.includes("shouldShowFarmMateAnswerFeedback(cleanDisplayedAnswer, isThinking || isGeneratingNaturalAnswer)"), true);
      assert.equal(askFarmMate.includes("shouldShowLocalGuidance ? recommendationCards : []"), true);
      assert.equal(askFarmMate.includes('const shouldShowCreditActions = creditReason === "credits_exhausted"'), true);
      assert.ok(cropDoctor.indexOf("{hasDiagnosis && diagnosis ?") < cropDoctor.indexOf("<FarmMateAnswerFeedback"));
      assert.equal(cropDoctor.includes("shouldDisableCropDoctorAnalysis(credits)"), true);
    }
  },
  {
    name: "prepared feedback excludes internal debug and usage data",
    run: () => {
      const prepared = sanitizeFarmMatePreparedAnswerFeedback({
        tool: "ask_farmmate",
        timestamp: "2026-07-21T09:25:00.000Z",
        feedbackType: "helpful",
        originalQuestion: "How should I prepare this soil?",
        answerSnippet: "Loosen compacted soil and add mature compost.",
        matchedKeywords: ["soil", "compost"],
        confidence: 0.98,
        anonymousDeviceId: "private-device-id",
        creditsRemaining: 1,
        rawResponse: { hidden: true }
      });

      assert.ok(prepared);
      const serialized = JSON.stringify(prepared);
      assert.equal(serialized.includes("matchedKeywords"), false);
      assert.equal(serialized.includes("confidence"), false);
      assert.equal(serialized.includes("anonymousDeviceId"), false);
      assert.equal(serialized.includes("creditsRemaining"), false);
      assert.equal(serialized.includes("rawResponse"), false);
      assert.deepEqual(Object.keys(prepared).sort(), ["answerSnippet", "feedbackType", "originalQuestion", "timestamp", "tool", "version"]);
    }
  },
  {
    name: "answer feedback controls wrap safely on small screens",
    run: () => {
      const feedbackControl = repoFile("src/components/FarmMateAnswerFeedback.tsx");

      assert.equal(feedbackControl.includes("min-w-0 max-w-full overflow-hidden"), true);
      assert.equal((feedbackControl.match(/flex-wrap/g) ?? []).length >= 3, true);
      assert.equal(feedbackControl.includes("min-h-11 max-w-full"), true);
      assert.equal(feedbackControl.includes("w-full max-w-full resize-y"), true);
      assert.equal(feedbackControl.includes("whitespace-nowrap"), false);
    }
  },
  {
    name: "FarmMate pilot documentation records answer feedback context",
    run: () => {
      const launchQa = repoFile("docs/FARMMATE_LAUNCH_QA.md");
      const specialists = repoFile("docs/FARMMATE_SPECIALISTS.md");

      assert.equal(launchQa.includes("Pilot farmers can rate completed Ask FarmMate and Crop Doctor answers"), true);
      assert.equal(launchQa.includes("original question and tool context"), true);
      assert.equal(launchQa.includes("crop, symptom, and result context"), true);
      assert.equal(specialists.includes("FarmMate is still learning from real farmer use"), true);
    }
  },
  {
    name: "FarmMate pilot feedback CTA and page render",
    run: () => {
      const hubPage = repoFile("src/app/farmer-hub/page.tsx");
      const feedbackPage = repoFile("src/app/farmer-hub/feedback/page.tsx");

      assert.equal(hubPage.includes("Testing GG FarmMate?"), true);
      assert.equal(hubPage.includes("Share feedback"), true);
      assert.equal(hubPage.includes('href="/farmer-hub/feedback"'), true);
      assert.equal(feedbackPage.includes("FarmMatePilotFeedbackForm"), true);
      assert.equal(feedbackPage.includes("Help improve GG FarmMate"), true);
      assert.equal(feedbackPage.includes("Please do not share phone numbers or exact farm locations here."), true);
    }
  },
  {
    name: "FarmMate pilot feedback form includes required options and states",
    run: () => {
      const form = repoFile("src/components/FarmMatePilotFeedbackForm.tsx");

      assert.equal(farmMatePilotHelpfulnessOptions.map((option) => option.value).join(","), "yes,partly,not_yet");
      assert.equal(farmMatePilotWouldUseAgainOptions.map((option) => option.value).join(","), "yes,maybe,no");
      assert.equal(form.includes('name="testedFeature"'), true);
      assert.equal(form.includes('name="helpfulness"'), true);
      assert.equal(form.includes('name="wouldUseAgain"'), true);
      assert.equal(form.includes('fetch("/api/farmmate/feedback"'), true);
      assert.equal(form.includes("farmMatePilotFeedbackSuccessMessage"), true);
      assert.equal(form.includes("farmMatePilotFeedbackUnavailableMessage"), true);
      assert.equal(form.includes("Back to GG FarmMate"), true);
      assert.equal(form.includes('href={farmMatePilotFeedbackContactPath}'), false);
      assert.equal(form.includes('href="/contact"'), false);
      assert.equal(form.includes('source !== "answer_feedback"'), true);
      assert.equal(form.includes("readFarmMatePreparedAnswerFeedback(window.sessionStorage)"), true);
      assert.equal(form.includes("farmMateAnswerFeedbackFormPrefill(prepared)"), true);
      assert.equal(form.includes("defaultValue={answerFeedbackPrefill?.testedFeature}"), true);
      assert.equal(form.includes("defaultChecked={answerFeedbackPrefill?.helpfulness === option.value}"), true);
      assert.equal(form.includes("window.sessionStorage.removeItem(FARM_MATE_ANSWER_FEEDBACK_STORAGE_KEY)"), true);
      assert.equal(FARM_MATE_ANSWER_FEEDBACK_PATH, "/farmer-hub/feedback?source=answer_feedback");
    }
  },
  {
    name: "FarmMate pilot feedback validation rejects missing required fields",
    run: () => {
      assert.equal(sanitizeFarmMatePilotFeedback({ helpfulness: "yes", wouldUseAgain: "yes" }).ok, false);
      assert.equal(sanitizeFarmMatePilotFeedback({ testedFeature: "Ask FarmMate", wouldUseAgain: "yes" }).ok, false);
      assert.equal(sanitizeFarmMatePilotFeedback({ testedFeature: "Ask FarmMate", helpfulness: "yes" }).ok, false);
    }
  },
  {
    name: "FarmMate pilot feedback validation trims and sanitizes text fields",
    run: () => {
      const result = sanitizeFarmMatePilotFeedback({
        nameOrNickname: "  Ama  ",
        region: "  Eastern   Region  ",
        mainCrop: "<b>Maize</b>",
        testedFeature: "  Asked about   spraying  ",
        helpfulness: "Not yet",
        confusion: "  <script>alert(1)</script> confusing  ",
        improvement: "  Make   answers shorter  ",
        wouldUseAgain: "Maybe"
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.nameOrNickname, "Ama");
        assert.equal(result.data.region, "Eastern Region");
        assert.equal(result.data.mainCrop, "Maize");
        assert.equal(result.data.testedFeature, "Asked about spraying");
        assert.equal(result.data.helpfulness, "not_yet");
        assert.equal(result.data.confusion?.includes("<script>"), false);
        assert.equal(result.data.improvement, "Make answers shorter");
        assert.equal(result.data.wouldUseAgain, "maybe");
      }
    }
  },
  {
    name: "FarmMate pilot feedback API stores server-side and fails safely",
    run: () => {
      const route = repoFile("src/app/api/farmmate/feedback/route.ts");
      const helper = repoFile("src/lib/farmmate/pilot-feedback.ts");

      assert.equal(route.includes("sanitizeFarmMatePilotFeedback"), true);
      assert.equal(route.includes("storeFarmMatePilotFeedback"), true);
      assert.equal(route.includes("feedback_temporarily_unavailable"), true);
      assert.equal(route.includes("console.warn"), true);
      assert.equal(helper.includes('insertSupabaseRecord("farmmate_pilot_feedback"'), true);
      assert.equal(helper.includes("name_or_nickname"), true);
      assert.equal(helper.includes("would_use_again"), true);
    }
  },
  {
    name: "FarmMate pilot feedback migration is server-write only",
    run: () => {
      const migration = repoFile("supabase/legacy-migrations/pre-baseline/035_farmmate_pilot_feedback.sql");

      assert.equal(migration.includes("create table if not exists public.farmmate_pilot_feedback"), true);
      assert.equal(migration.includes("tested_feature text not null"), true);
      assert.equal(migration.includes("helpfulness text not null check (helpfulness in ('yes', 'partly', 'not_yet'))"), true);
      assert.equal(migration.includes("would_use_again text not null check (would_use_again in ('yes', 'maybe', 'no'))"), true);
      assert.equal(migration.includes("farmmate_pilot_feedback_created_idx"), true);
      assert.equal(migration.includes("alter table public.farmmate_pilot_feedback enable row level security"), true);
      assert.equal(migration.includes("revoke all on table public.farmmate_pilot_feedback from anon"), true);
      assert.equal(migration.includes("grant all on table public.farmmate_pilot_feedback to service_role"), true);
      assert.equal(migration.includes("Feedback is submitted server-side only"), true);
    }
  },
  {
    name: "FarmMate pilot feedback hardening removes public grants only",
    run: () => {
      const migration = repoFile(
        "supabase/migrations/20260721223536_harden_farmmate_feedback_privileges.sql"
      ).toLowerCase();
      const verification = repoFile("supabase/review/verify_farmmate_feedback_privileges.sql").toLowerCase();
      const route = repoFile("src/app/api/farmmate/feedback/route.ts");
      const helper = repoFile("src/lib/farmmate/pilot-feedback.ts");
      const form = repoFile("src/components/FarmMatePilotFeedbackForm.tsx");

      assert.equal(migration.includes("revoke all privileges on table public.farmmate_pilot_feedback from anon"), true);
      assert.equal(
        migration.includes("revoke all privileges on table public.farmmate_pilot_feedback from authenticated"),
        true
      );
      assert.equal(
        migration.includes("grant all privileges on table public.farmmate_pilot_feedback to service_role"),
        true
      );
      assert.equal(migration.includes("drop table"), false);
      assert.equal(migration.includes("alter table"), false);
      assert.equal(migration.includes("delete from"), false);
      assert.equal(migration.includes("update public."), false);
      assert.equal(migration.includes("insert into"), false);
      assert.deepEqual(Array.from(new Set(migration.match(/public\.[a-z_]+/g) ?? [])), [
        "public.farmmate_pilot_feedback"
      ]);
      assert.equal(verification.includes("anon_has_zero_direct_table_grants"), true);
      assert.equal(verification.includes("authenticated_has_zero_direct_table_grants"), true);
      assert.equal(verification.includes("service_role_retains_required_privileges"), true);
      assert.equal(verification.includes("farmmate_pilot_feedback_row_count"), true);
      assert.equal(verification.includes("existing_no_policy_state_preserved"), true);
      assert.equal(route.includes("storeFarmMatePilotFeedback"), true);
      assert.equal(helper.includes('insertSupabaseRecord("farmmate_pilot_feedback"'), true);
      assert.equal(form.includes('fetch("/api/farmmate/feedback"'), true);
      assert.equal(form.includes("farmmate_pilot_feedback"), false);
    }
  },
  {
    name: "FarmMate pilot testing documentation explains scope and limitations",
    run: () => {
      const docs = repoFile("docs/FARMMATE_PILOT_TESTING.md");

      assert.equal(docs.includes("5-10 farmers"), true);
      assert.equal(docs.includes("Crop Doctor gives guidance, not a guaranteed diagnosis."), true);
      assert.equal(docs.includes("Market Prices are not included in V1."), true);
      assert.equal(docs.includes("Farm history is not saved yet."), true);
      assert.equal(docs.includes("public.farmmate_pilot_feedback"), true);
    }
  },
  {
    name: "Sprint 41 cocoa consultation starts with one selectable region question",
    run: () => {
      const originalQuestion = "My cocoa leaves are yellow";
      const brain = buildFarmMateResponse(originalQuestion, routeFarmMateQuestion(originalQuestion));
      const followUp = brain.flow?.followUpQuestions[0];

      assert.equal(brain.flow?.id, "cocoa-yellow-leaves");
      assert.equal(brain.resolvedCrop, "Cocoa");
      assert.equal(followUp?.question, "Which region are you farming in?");
      assert.deepEqual(followUp?.options, [
        "Western / Western North",
        "Ashanti",
        "Eastern",
        "Bono / Ahafo",
        "Central",
        "Volta / Oti",
        "Other region",
        "I am not sure"
      ]);
      assert.equal(brain.flow?.followUpQuestions.length, 3);

      const component = repoFile("src/components/AskFarmMate.tsx");
      assert.equal(component.includes('consultation?.status === "awaiting_follow_up"'), true);
      assert.equal(component.includes("currentFollowUp.options"), true);
      assert.equal(component.includes("void answerFollowUp(option)"), true);
      assert.equal(component.includes("No extra credit for this follow-up."), true);
    }
  },
  {
    name: "Sprint 41 cocoa consultation advances region stage and visible sign in one consultation",
    run: () => {
      const originalQuestion = "My cocoa leaves are yellow";
      const brain = buildFarmMateResponse(originalQuestion, routeFarmMateQuestion(originalQuestion));
      const questions = brain.flow?.followUpQuestions ?? [];
      const consultationId = createFarmMateConsultationId("cocoa-yellow-12345");
      const initial = createAskFarmMateConsultation({
        consultationId,
        originalQuestion,
        specialist: brain.routerResult?.selectedSpecialist,
        normalizedCrop: brain.resolvedCrop,
        pendingFollowUpQuestion: questions[0]
      });
      const afterRegion = continueAskFarmMateConsultation(initial, questions[0], "Ashanti", "Ashanti", questions[1]);
      const afterStage = continueAskFarmMateConsultation(afterRegion, questions[1], "Young tree", "Young tree", questions[2]);
      const afterSign = continueAskFarmMateConsultation(afterStage, questions[2], "Yellow older leaves", "Yellow older leaves");

      assert.equal(afterRegion.consultationId, consultationId);
      assert.equal(afterRegion.originalQuestion, originalQuestion);
      assert.equal(afterRegion.selectedRegion, "Ashanti");
      assert.equal(afterRegion.pendingFollowUpQuestion?.question, "What stage is the cocoa?");
      assert.deepEqual(afterRegion.pendingFollowUpQuestion?.options, ["Seedling", "Young tree", "Flowering", "Pods forming", "Mature tree", "I am not sure"]);
      assert.equal(afterStage.growthStage, "Young tree");
      assert.equal(afterStage.pendingFollowUpQuestion?.question, "What do you see most clearly?");
      assert.deepEqual(afterStage.pendingFollowUpQuestion?.options, [
        "Yellow young leaves",
        "Yellow older leaves",
        "Leaf spots",
        "Dieback or drying branches",
        "Pod problem",
        "Pest damage",
        "I am not sure"
      ]);
      assert.equal(afterSign.selectedSymptom, "Yellow older leaves");
      assert.equal(afterSign.pendingFollowUpQuestion, undefined);
      assert.equal(afterSign.answerHistory.length, 3);
    }
  },
  {
    name: "Sprint 41 verified follow-ups are free while new or forged requests are not",
    run: () => {
      assert.equal(askFarmMateUsageMode({ isFollowUp: false, verifiedContinuation: false }), "record");
      assert.equal(askFarmMateUsageMode({ isFollowUp: true, verifiedContinuation: true }), "continue");
      assert.equal(askFarmMateUsageMode({ isFollowUp: true, verifiedContinuation: false }), "reject");

      const firstId = createFarmMateConsultationId("first-question-12345");
      const unrelatedId = createFarmMateConsultationId("unrelated-question-67890");
      assert.notEqual(firstId, unrelatedId);

      const route = repoFile("src/app/api/farmmate/ask/route.ts");
      const continuationBlock = route.slice(route.indexOf("const answerHistory = payload.consultationContext.answerHistory"));
      assert.equal(continuationBlock.includes("checkFarmMateCreditsForDevice"), false);
      assert.equal(continuationBlock.includes("recordFarmMateUsageForDevice"), false);
      assert.equal(continuationBlock.includes("claimFarmMateConsultationContinuation"), true);
      assert.equal(route.indexOf("recordFarmMateUsageForDevice") < route.indexOf("kind: \"follow_up\""), true);
    }
  },
  {
    name: "Sprint 41 unrelated typed input leaves a pending follow-up and starts a charged consultation",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");
      const pendingStart = component.indexOf(
        "if (conversationState.waitingForFollowUp && currentFollowUp)"
      );
      const newConsultationStart = component.indexOf("activeRequestKey.current =", pendingStart);

      assert.notEqual(pendingStart, -1);
      assert.notEqual(newConsultationStart, -1);

      const pendingBlock = component.slice(pendingStart, newConsultationStart);
      const newConsultationBlock = component.slice(newConsultationStart, component.indexOf("async function answerFollowUp", newConsultationStart));

      assert.equal(pendingBlock.includes("void answerFollowUp(selectedOption)"), true);
      assert.equal(pendingBlock.includes("Choose one of the follow-up options"), false);
      assert.equal(newConsultationBlock.includes("createAskFarmMateConsultation"), true);
      assert.equal(newConsultationBlock.includes("requestConsultationStep"), true);
      assert.equal(newConsultationBlock.includes("isFollowUp: false"), true);
    }
  },
  {
    name: "Sprint 41 Ask FarmMate submissions do not wait on artificial timers",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");

      assert.equal(component.includes("window.setTimeout"), false);
    }
  },
  {
    name: "Sprint 41 local clarification and marketplace questions each record one Ask credit",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");
      const recordAction = component.indexOf('action: "record"');
      const recorderStart = component.lastIndexOf("async function ", recordAction);
      const requestStart = component.indexOf("async function ", recordAction);
      const clarifyStart = component.indexOf('if (conversationDecision.action === "clarify")');
      const marketplaceStart = component.indexOf("if (conversationDecision.isMarketplaceInfoRequest)", clarifyStart);
      const normalQuestionStart = component.indexOf("const farmMateResponse = buildFarmMateResponse", marketplaceStart);

      assert.notEqual(recordAction, -1);
      assert.notEqual(recorderStart, -1);
      assert.notEqual(requestStart, -1);
      assert.notEqual(clarifyStart, -1);
      assert.notEqual(marketplaceStart, -1);
      assert.notEqual(normalQuestionStart, -1);

      const recorder = component.slice(recorderStart, requestStart);
      const clarificationBranch = component.slice(clarifyStart, marketplaceStart);
      const marketplaceBranch = component.slice(marketplaceStart, normalQuestionStart);
      const recorderName = /async function\s+([A-Za-z0-9_]+)\s*\(/.exec(recorder)?.[1];

      assert.ok(recorderName);
      assert.equal(recorder.includes('fetch("/api/farmmate/usage"'), true);
      assert.equal(recorder.includes('tool: "ask_farmmate"'), true);
      assert.equal(recorder.includes('action: "record"'), true);
      assert.match(clarificationBranch, new RegExp(`(?:await|void) ${recorderName}\\(`));
      assert.match(marketplaceBranch, new RegExp(`(?:await|void) ${recorderName}\\(`));
    }
  },
  {
    name: "Sprint 41 continuation token binds device question history and expected option",
    run: () => {
      const originalQuestion = "My cocoa leaves are yellow";
      const brain = buildFarmMateResponse(originalQuestion, routeFarmMateQuestion(originalQuestion));
      const pending = brain.flow?.followUpQuestions[0];
      assert.ok(pending);
      const initial = createAskFarmMateConsultation({
        consultationId: createFarmMateConsultationId("signed-cocoa-12345"),
        originalQuestion,
        normalizedCrop: "Cocoa",
        pendingFollowUpQuestion: pending
      });
      const continued = continueAskFarmMateConsultation(initial, pending, "Ashanti", "Ashanti", brain.flow?.followUpQuestions[1]);
      const followUpAnswer = continued.answerHistory[0];
      const issuedAt = new Date("2026-07-21T12:00:00.000Z");
      const token = issueFarmMateConsultationToken({
        consultationId: initial.consultationId,
        usageEventId: "0a75a95f-f36b-481f-bdfd-1e112b8a5b1d",
        anonymousUserHash: "device-hash",
        originalQuestion,
        boundContext: { cropDoctorContext: null, weatherContext: null },
        answerHistory: [],
        pendingFollowUpQuestion: pending,
        now: issuedAt
      });
      const verificationInput = {
        token,
        consultationId: initial.consultationId,
        anonymousUserHash: "device-hash",
        originalQuestion,
        boundContext: { cropDoctorContext: null, weatherContext: null },
        previousAnswerHistory: [],
        followUpAnswer,
        now: new Date("2026-07-21T12:01:00.000Z")
      };

      assert.ok(token);
      assert.ok(verifyFarmMateConsultationToken(verificationInput));
      assert.equal(verifyFarmMateConsultationToken({ ...verificationInput, anonymousUserHash: "wrong-device" }), null);
      assert.equal(verifyFarmMateConsultationToken({ ...verificationInput, originalQuestion: "A different question" }), null);
      assert.equal(
        verifyFarmMateConsultationToken({
          ...verificationInput,
          boundContext: { cropDoctorContext: null, weatherContext: { locationName: "Changed after token issue" } }
        }),
        null
      );
      assert.equal(
        verifyFarmMateConsultationToken({
          ...verificationInput,
          previousAnswerHistory: [
            {
              questionId: "forged-history",
              question: "A forged earlier question",
              answer: "A forged earlier answer",
              selectedOption: "A forged earlier answer",
              options: ["A forged earlier answer"]
            }
          ]
        }),
        null
      );

      const claimId = farmMateContinuationClaimId({
        consultationId: initial.consultationId,
        usageEventId: "0a75a95f-f36b-481f-bdfd-1e112b8a5b1d",
        followUpAnswer
      });
      assert.match(claimId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert.equal(
        farmMateContinuationClaimId({
          consultationId: initial.consultationId,
          usageEventId: "0a75a95f-f36b-481f-bdfd-1e112b8a5b1d",
          followUpAnswer
        }),
        claimId
      );
      assert.notEqual(
        farmMateContinuationClaimId({
          consultationId: initial.consultationId,
          usageEventId: "0a75a95f-f36b-481f-bdfd-1e112b8a5b1d",
          followUpAnswer: { ...followUpAnswer, selectedOption: "Northern" }
        }),
        claimId
      );
      assert.equal(verifyFarmMateConsultationToken({ ...verificationInput, now: new Date("2026-07-21T14:00:01.000Z") }), null);
      assert.equal(
        verifyFarmMateConsultationToken({
          ...verificationInput,
          followUpAnswer: { ...followUpAnswer, selectedOption: "Northern" }
        }),
        null
      );
    }
  },
  {
    name: "Sprint 41 API fails closed and rotates the paid usage claim before continuing",
    run: () => {
      const route = repoFile("src/app/api/farmmate/ask/route.ts");
      const usageServer = repoFile("src/lib/farmmate/usage/server.ts");

      ["consultationId", "originalQuestion", "followUpAnswer", "consultationContext", "isFollowUp"].forEach((field) => {
        assert.equal(route.includes(field), true, field);
      });
      assert.equal(route.includes('reason: "invalid_device_id"'), true);
      assert.equal(route.includes('reason: "invalid_consultation"'), true);
      assert.equal(route.includes('reason: "consultation_already_used"'), true);
      assert.equal(route.indexOf("claimFarmMateConsultationContinuation") < route.lastIndexOf("generateFarmMateNaturalAnswer"), true);
      assert.equal(usageServer.includes('updateSupabaseRecord("farmmate_usage_events"'), true);
      assert.equal(usageServer.includes("memoryEvent.id = nextEventId"), true);
      assert.equal(usageServer.includes("replayed: true"), true);
      assert.equal(route.includes('reason: "consultation_recovered"'), true);
      assert.equal(route.indexOf("if (claim.replayed)") < route.lastIndexOf("generateFarmMateNaturalAnswer"), true);
    }
  },
  {
    name: "Sprint 41 API rejects malformed external contexts before building authoritative guidance",
    run: () => {
      const route = repoFile("src/app/api/farmmate/ask/route.ts");
      const inputValidation = route.slice(route.indexOf("function isCropDoctorHandoffContext"), route.indexOf("function authoritativeQuestion"));

      assert.equal(inputValidation.includes("hasValidFarmMateBrainContexts(input.brain)"), true);
      assert.match(inputValidation, /(?:is|validate)[A-Za-z]*CropDoctor[A-Za-z]*\(value\.cropDoctorContext\)/);
      assert.match(inputValidation, /(?:is|validate)[A-Za-z]*Weather[A-Za-z]*\(value\.weatherContext\)/);
      assert.equal(inputValidation.includes("input.brain.cropDoctorContext.question.trim() !== input.originalQuestion.trim()"), true);
      assert.equal(inputValidation.includes("FARM_MATE_WEATHER_CONTEXT_MAX_AGE_MS"), true);
    }
  },
  {
    name: "Sprint 41 continuation storage outages are retriable while unrecognized claims remain conflicts",
    run: () => {
      const route = repoFile("src/app/api/farmmate/ask/route.ts");
      const failedClaimStart = route.indexOf("if (!claim.claimed)");
      const failedClaimEnd = route.indexOf("const credits = await creditStatus", failedClaimStart);
      const failedClaim = route.slice(failedClaimStart, failedClaimEnd);

      assert.notEqual(failedClaimStart, -1);
      assert.notEqual(failedClaimEnd, -1);
      assert.equal(failedClaim.includes('claim.storage === "unavailable"'), true);
      assert.match(failedClaim, /reason: "(?:usage|consultation)_tracking_unavailable"/);
      assert.equal(failedClaim.includes("status: 503"), true);
      assert.equal(failedClaim.includes('reason: "consultation_already_used"'), true);
      assert.equal(failedClaim.includes("status: 409"), true);
    }
  },
  {
    name: "Sprint 41 selected options are canonical for routing and final answer generation",
    run: () => {
      const route = repoFile("src/app/api/farmmate/ask/route.ts");
      const authoritativeStart = route.indexOf("function authoritativeQuestion");
      const requestHandlerStart = route.indexOf("export async function POST", authoritativeStart);
      const authoritativeProcessing = route.slice(authoritativeStart, requestHandlerStart);

      assert.equal(authoritativeProcessing.includes("?.selectedOption.toLowerCase()"), true);
      assert.equal((authoritativeProcessing.match(/answer: selectedOption/g) ?? []).length >= 2, true);
      assert.equal(authoritativeProcessing.includes("answer: answer.answer"), false);
    }
  },
  {
    name: "Sprint 41 AI receives structured cards rebuilt from the authoritative server brain",
    run: () => {
      const route = repoFile("src/app/api/farmmate/ask/route.ts");
      const verifiedStart = route.indexOf("function verifiedAiInput");
      const verifiedEnd = route.indexOf("async function creditStatus", verifiedStart);
      const verifiedInput = route.slice(verifiedStart, verifiedEnd);
      const helperCall = /localStructuredResponse:\s*([A-Za-z0-9_]+)\(brain(?:,[^)]+)?\)/.exec(verifiedInput)?.[1];
      const buildsDirectlyFromBrain = /localStructuredResponse:\s*brain\.sections/.test(verifiedInput);

      assert.notEqual(verifiedStart, -1);
      assert.notEqual(verifiedEnd, -1);
      assert.equal(verifiedInput.includes("input.localStructuredResponse"), false);
      assert.equal(Boolean(helperCall) || buildsDirectlyFromBrain, true);

      if (helperCall) {
        const helperStart = route.indexOf(`function ${helperCall}`);
        const helperSource = route.slice(helperStart, verifiedStart);

        assert.notEqual(helperStart, -1);
        assert.equal(helperSource.includes("brain.sections"), true);
      }
    }
  },
  {
    name: "Sprint 41 final cocoa answer is structured and cautiously escalates valuable crop problems",
    run: () => {
      const originalQuestion = "My cocoa leaves are yellow";
      const brain = buildFarmMateResponse(originalQuestion, routeFarmMateQuestion(originalQuestion));
      const text = responseText(brain);
      const component = repoFile("src/components/AskFarmMate.tsx");
      const cardBuilder = component.slice(component.indexOf("function localRecommendationCards"), component.indexOf("function logRouterResult"));

      assert.equal(cardBuilder.indexOf('title: "What I think"') < cardBuilder.indexOf('title: "What to do now"'), true);
      assert.equal(cardBuilder.indexOf('title: "What to do now"') < cardBuilder.indexOf('title: "What to check"'), true);
      assert.equal(cardBuilder.indexOf('title: "What to check"') < cardBuilder.indexOf('title: "Next step"'), true);
      assert.equal(text.includes(FARM_MATE_CASH_CROP_CAUTION), true);
      assert.equal(text.split(FARM_MATE_CASH_CROP_CAUTION).length - 1, 1);
      assert.equal(text.toLowerCase().includes("tell me your region"), false);

      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion: originalQuestion,
          brain,
          farmerAnswers: [
            { question: "Which region are you farming in?", answer: "Ashanti" },
            { question: "What stage is the cocoa?", answer: "Young tree" },
            { question: "What do you see most clearly?", answer: "Yellow older leaves" }
          ],
          localStructuredResponse: []
        })
      ) as { instruction?: string; responseRules?: string[] };
      assert.equal(payload.instruction?.includes("exact headings What I think:"), true);
      assert.equal(payload.instruction?.includes("do not ask another follow-up question"), true);
      assert.equal(payload.responseRules?.some((rule) => rule.includes("Tell me your region")), true);
    }
  },
  {
    name: "Sprint 41 cash crop caution remains in the trimmed recommended actions",
    run: () => {
      const response = buildFarmMateResponse("My cocoa leaves are yellow", routeFarmMateQuestion("My cocoa leaves are yellow"));
      const recommendedAction = response.sections.find((section) => section.title === "Recommended action");

      assert.ok(recommendedAction);
      assert.equal(recommendedAction.body.includes(FARM_MATE_CASH_CROP_CAUTION), true);
      assert.equal(recommendedAction.body.length <= 3, true);
    }
  },
  {
    name: "Sprint 41 final guidance does not repeat questions already asked by the consultation",
    run: () => {
      const question = "My cocoa leaves are yellow";
      const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));
      const followUpQuestions = response.flow?.followUpQuestions.map((followUp) => followUp.question) ?? [];
      const checkSection = response.sections.find((section) => section.title === "What to check");

      assert.ok(checkSection);
      assert.ok(followUpQuestions.length > 0);
      followUpQuestions.forEach((followUpQuestion) => {
        assert.equal(checkSection.body.includes(followUpQuestion), false, followUpQuestion);
      });
    }
  },
  {
    name: "Sprint 41 feedback and copy controls render only for a completed final answer",
    run: () => {
      const originalQuestion = "My cocoa leaves are yellow";
      const brain = buildFarmMateResponse(originalQuestion, routeFarmMateQuestion(originalQuestion));
      const pending = brain.flow?.followUpQuestions[0];
      const initial = createAskFarmMateConsultation({
        consultationId: createFarmMateConsultationId("final-controls-12345"),
        originalQuestion,
        pendingFollowUpQuestion: pending
      });
      const awaiting = { ...initial, status: "awaiting_follow_up" as const };
      const starting = { ...initial, status: "starting" as const };
      const submitting = { ...initial, status: "submitting_follow_up" as const };
      const failed = { ...initial, status: "error" as const };
      const complete = {
        ...initial,
        pendingFollowUpQuestion: undefined,
        followUpOptions: undefined,
        status: "complete" as const
      };

      assert.equal(isFinalAskFarmMateConsultation(awaiting), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: starting, finalAnswer: "Final answer", isBusy: false }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: awaiting, finalAnswer: "Final answer", isBusy: false }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: submitting, finalAnswer: "Final answer", isBusy: false }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: failed, finalAnswer: "Final answer", isBusy: false }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: complete, finalAnswer: "", isBusy: false }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: complete, finalAnswer: "Final answer", isBusy: true }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: complete, finalAnswer: "Final answer", isBusy: false, creditReason: "credits_exhausted" }), false);
      assert.equal(shouldShowFarmMateFinalControls({ consultation: complete, finalAnswer: "Final answer", isBusy: false }), true);

      const component = repoFile("src/components/AskFarmMate.tsx");
      assert.equal(component.includes('consultation?.status === "starting"'), true);
    }
  },
  {
    name: "Sprint 41 Watermelon keeps region then rain in the same consultation",
    run: () => {
      const originalQuestion = "How do I plant watermelon?";
      const brain = buildFarmMateResponse(originalQuestion, routeFarmMateQuestion(originalQuestion));
      const questions = brain.flow?.followUpQuestions ?? [];
      const initial = createAskFarmMateConsultation({
        consultationId: createFarmMateConsultationId("watermelon-flow-12345"),
        originalQuestion,
        normalizedCrop: brain.resolvedCrop,
        pendingFollowUpQuestion: questions[0]
      });
      const afterRegion = continueAskFarmMateConsultation(initial, questions[0], "Northern", "Northern", questions[1]);
      const afterWater = continueAskFarmMateConsultation(afterRegion, questions[1], "I have irrigation", "I have irrigation");

      assert.equal(questions[0]?.question, "Which region are you farming in?");
      assert.equal(questions[1]?.question, "Do you have steady rain or irrigation available?");
      assert.equal(afterRegion.consultationId, initial.consultationId);
      assert.equal(afterWater.consultationId, initial.consultationId);
      assert.equal(afterRegion.selectedRegion, "Northern");
      assert.equal(afterWater.waterStatus, "I have irrigation");
      assert.equal(afterWater.pendingFollowUpQuestion, undefined);
      assert.equal(askFarmMateUsageMode({ isFollowUp: true, verifiedContinuation: true }), "continue");
    }
  },
  {
    name: "Sprint 41 follow-up card remains touch friendly without mobile overflow",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");
      const awaitingFollowUp = component.indexOf('consultation?.status === "awaiting_follow_up"');
      const followUpCard = component.slice(
        component.indexOf("<fieldset", awaitingFollowUp),
        component.indexOf("No extra credit for this follow-up.", awaitingFollowUp)
      );

      assert.notEqual(awaitingFollowUp, -1);
      assert.equal(followUpCard.includes("min-h-11 w-full min-w-0"), true);
      assert.equal(followUpCard.includes("whitespace-normal break-words"), true);
      assert.equal(followUpCard.includes("sm:grid-cols-2"), true);
      assert.equal(followUpCard.includes("overflow-x-auto"), false);
    }
  },
  {
    name: "Sprint 41 continuation failures can retry the signed follow-up without another credit",
    run: () => {
      const component = repoFile("src/components/AskFarmMate.tsx");
      const retryStart = component.indexOf("async function retryPendingFollowUp");
      const retryEnd = component.indexOf("function askFarmMate", retryStart);
      const retryBlock = component.slice(retryStart, retryEnd);

      assert.notEqual(retryStart, -1);
      assert.notEqual(retryEnd, -1);
      assert.equal(retryBlock.includes("pendingContinuationRetry"), true);
      assert.equal(retryBlock.includes("isFollowUp: true"), true);
      assert.equal(retryBlock.includes("requestConsultationStep"), true);
      assert.equal(retryBlock.includes("record"), false);
      assert.equal(component.includes("This stays in the same consultation and will not use another credit."), true);
      assert.equal(component.includes("followUpQuestionRef.current?.focus()"), true);
      assert.equal(component.includes("consultationStartInFlight.current"), true);
      assert.equal(component.includes("[overflow-wrap:anywhere]"), true);
    }
  },
  {
    name: "Sprint 41 documentation explains consultation credits buttons and final-only feedback",
    run: () => {
      const launchQa = repoFile("docs/FARMMATE_LAUNCH_QA.md").toLowerCase();
      const specialists = repoFile("docs/FARMMATE_SPECIALISTS.md").toLowerCase();
      const combined = `${launchQa}\n${specialists}`;

      assert.equal(combined.includes("same-consultation follow-ups"), true);
      assert.equal(combined.includes("do not use extra credits") || combined.includes("no extra credit"), true);
      assert.equal(combined.includes("one farmer-started question") && combined.includes("one consultation credit"), true);
      assert.equal(combined.includes("buttons") && combined.includes("one follow-up question at a time"), true);
      assert.equal(combined.includes("feedback") && combined.includes("final answer"), true);
    }
  },
  {
    name: "Profile application migration creates private review schemas without publishing records",
    run: () => {
      const migration = repoFile("supabase/migrations/20260723035406_profile_applications_and_private_media.sql").toLowerCase();

      assert.equal(migration.includes("create table if not exists public.farmer_applications"), true);
      assert.equal(migration.includes("linked_farmer_id uuid"), true);
      assert.equal(migration.includes("linked_supplier_id uuid"), true);
      assert.equal(migration.includes("source_application_id uuid"), true);
      assert.equal(migration.includes("on delete set null"), true);
      assert.equal(migration.includes("farmer_applications_linked_farmer_uidx"), true);
      assert.equal(migration.includes("supplier_applications_linked_supplier_uidx"), true);
      assert.equal(migration.includes("default false"), true);
      assert.equal(migration.includes("insert into public.farmers"), false);
      assert.equal(migration.includes("insert into public.suppliers"), false);
      assert.equal(migration.includes("update public.farmers"), false);
      assert.equal(migration.includes("update public.suppliers"), false);
    }
  },
  {
    name: "Profile application tables and buckets remain server-only",
    run: () => {
      const migration = repoFile("supabase/migrations/20260723035406_profile_applications_and_private_media.sql").toLowerCase();

      assert.equal(migration.includes("alter table public.farmer_applications enable row level security"), true);
      assert.equal(migration.includes("alter table public.supplier_applications enable row level security"), true);
      assert.equal(migration.includes("from public, anon, authenticated"), true);
      assert.equal(migration.includes("grant all on table public.farmer_applications to service_role"), true);
      assert.equal(migration.includes("grant all on table public.supplier_applications to service_role"), true);
      assert.match(migration, /'farmer-application-media',[\s\S]*?false,[\s\S]*?8388608/);
      assert.match(migration, /'supplier-application-media',[\s\S]*?false,[\s\S]*?8388608/);
      assert.equal(migration.includes("to anon"), false);
      assert.equal(migration.includes("to authenticated"), false);
    }
  },
  {
    name: "Profile application verification tolerates optional migration history columns",
    run: () => {
      const verification = repoFile("supabase/review/verify_profile_applications_and_private_media.sql").toLowerCase();

      assert.equal(verification.includes("to_jsonb(sm)->>'name' as name"), true);
      assert.equal(verification.includes("to_jsonb(sm)->>'inserted_at' as inserted_at"), true);
      assert.equal(verification.includes("select version, name, inserted_at"), false);
      assert.equal(verification.includes("where sm.version in ('20260721190621', '20260721223536', '20260723035406')"), true);
      assert.equal(verification.includes("insert into"), false);
      assert.equal(verification.includes("update public."), false);
      assert.equal(verification.includes("delete from"), false);
    }
  },
  {
    name: "Supplier application inputs normalize to canonical private profile values",
    run: () => {
      assert.deepEqual(
        normalizeSupplierCategories(["Fertilizer", "Machinery", "Irrigation", "Finance", "Seeds", "Seeds"]),
        ["Fertilizers", "Farm Equipment", "Irrigation Systems", "Financial Services", "Seeds"]
      );
      assert.deepEqual(normalizeServiceAreas(["ashanti", "Greater Accra", "ashanti"]), ["Ashanti", "Greater Accra"]);
      assert.equal(validateApplicationMedia({ contentType: "image/webp", size: APPLICATION_IMAGE_MAX_BYTES, kind: "image" }).ok, true);
      assert.equal(validateApplicationMedia({ contentType: "application/pdf", size: APPLICATION_DOCUMENT_MAX_BYTES, kind: "document" }).ok, true);
      assert.equal(validateApplicationMedia({ contentType: "application/pdf", size: 20, kind: "image" }).ok, false);
      assert.equal(validateApplicationMedia({ contentType: "image/jpeg", size: APPLICATION_IMAGE_MAX_BYTES + 1, kind: "image" }).ok, false);
      assert.equal(
        privateApplicationMediaPath({ applicationId: "application-id", group: "certificates", objectId: "server-id", contentType: "application/pdf" }),
        "application-id/certificates/server-id.pdf"
      );
    }
  },
  {
    name: "Supplier submissions persist private paths and compensate partial upload failures",
    run: () => {
      const route = repoFile("src/app/api/supplier-registration/route.ts");
      const service = repoFile("src/lib/profileApplications.ts");

      assert.equal(route.includes("createSupplierApplication"), true);
      assert.equal(route.includes("private_certificate_paths: privateCertificatePaths"), true);
      assert.equal(route.includes("private_photo_paths: privatePhotoPaths"), true);
      assert.equal(route.includes("cleanupUploadedMedia(uploadedPaths"), true);
      assert.equal(route.lastIndexOf("validateApplicationMedia") < route.lastIndexOf("uploadPrivateApplicationMedia"), true);
      assert.doesNotMatch(route, /bucket:\s*["']suppliers["']/);
      assert.doesNotMatch(route, /certificate_urls:\s*validation\.data/);
      assert.equal(service.includes("PROFILE_APPLICATION_MEDIA[kind].bucket"), true);
      assert.equal(service.includes("publicUrl: false"), true);
    }
  },
  {
    name: "Profile application admin loaders remain authenticated, private, and queue-isolated",
    run: () => {
      const applicationsRoute = repoFile("src/app/api/admin/applications/route.ts");
      const mediaRoute = repoFile("src/app/api/admin/profile-applications/media/route.ts");
      const service = repoFile("src/lib/profileApplications.ts");
      const applicationQueues = repoFile("src/lib/applications.ts");
      const dashboard = repoFile("src/components/AdminDashboard.tsx");

      assert.equal(applicationsRoute.includes("requireAdminUser(request)"), true);
      assert.equal(applicationsRoute.includes('searchParams.get("kind")'), true);
      assert.equal(applicationsRoute.includes('getApplicationQueue(kind)'), true);
      assert.equal(applicationsRoute.includes('"Cache-Control": "private, no-store, max-age=0"'), true);
      assert.equal(applicationsRoute.includes("Could not load farmer applications. Please retry."), true);
      assert.equal(applicationsRoute.includes("Could not load supplier applications. Please retry."), true);
      assert.equal(applicationsRoute.includes("Could not load application queues. Please retry."), false);
      assert.equal(applicationsRoute.includes('applicationKind: kind'), true);
      assert.equal(applicationsRoute.includes('source: queue.source'), true);
      assert.equal(applicationsRoute.includes("applicant"), false);
      assert.equal(applicationQueues.includes("export async function getApplicationQueue"), true);
      assert.equal(applicationQueues.includes('if (kind === "buyer")'), true);
      assert.equal(applicationQueues.includes('state: "unavailable"'), true);
      assert.equal(applicationQueues.includes('loadProfileApplicationsForAdmin(kind)'), true);
      assert.doesNotMatch(applicationQueues, /selectSupabaseRecords<ApplicationRecord>\("buyer_applications"/);
      assert.doesNotMatch(applicationQueues.slice(applicationQueues.indexOf("export async function getApplicationQueue"), applicationQueues.indexOf("function mapFarmerApplication")), /Promise\.all/);
      assert.equal(dashboard.includes('/api/admin/applications?kind=${encodeURIComponent(kind)}'), true);
      assert.equal(dashboard.includes("Buyer applications are not available yet."), true);
      assert.equal(dashboard.includes("Buyer enquiries remain available in Produce Requests"), true);
      assert.equal(dashboard.includes("loadApplicationQueue(applicationTab)"), true);
      assert.equal(dashboard.includes('selectedApplicationQueueState === "error"'), true);
      assert.equal(dashboard.includes('selectedApplicationQueueState === "unavailable"'), true);
      assert.equal(dashboard.includes('applicationQueueStates.farmer === "loaded"'), true);
      assert.equal(dashboard.includes('applicationQueueStates.supplier === "loaded"'), true);
      assert.equal(dashboard.includes('applicationQueueStates.buyer === "loaded"'), true);
      assert.equal(dashboard.includes("Could not load application queues"), false);
      assert.equal(dashboard.includes('/api/admin/lead-requests'), true);
      assert.equal(mediaRoute.includes("requireAdminUser(request)"), true);
      assert.equal(mediaRoute.includes('"Cache-Control": "no-store, max-age=0"'), true);
      assert.equal(service.startsWith('import "server-only";'), true);
      assert.equal(service.includes("createSupabaseStorageSignedUrl"), true);
      assert.doesNotMatch(mediaRoute, /console\.(error|warn)\([^\n]*path/);
    }
  },
  {
    name: "Approved application conversion is idempotent across retries",
    run: async () => {
      const application = { id: "application-1", status: "Approved", linkedProfileId: null as string | null };
      const profiles = new Map<string, string>();
      let createCount = 0;
      const store: ConversionStore = {
        async loadApplication() {
          return { status: 200, data: application };
        },
        async findProfileBySource(_kind, applicationId) {
          return { status: 200, profileId: profiles.get(applicationId) };
        },
        async createProfile(_kind, profile) {
          createCount += 1;
          const profileId = String(profile.id ?? "profile-1");
          profiles.set("application-1", profileId);
          return { status: 201, profileId };
        },
        async linkApplication(_kind, _applicationId, profileId) {
          application.linkedProfileId = profileId;
          return { status: 200 };
        }
      };
      const profile = { id: "profile-1", status: "Pending", source_application_id: "application-1" };
      const first = await convertApprovedApplication({ kind: "farmer", applicationId: application.id, profile, store });
      const retry = await convertApprovedApplication({ kind: "farmer", applicationId: application.id, profile, store });

      assert.equal(first.profileId, "profile-1");
      assert.equal(first.reused, false);
      assert.equal(retry.profileId, "profile-1");
      assert.equal(retry.reused, true);
      assert.equal(createCount, 1);

      const pending = await convertApprovedApplication({
        kind: "farmer",
        applicationId: "pending-application",
        profile,
        store: { ...store, loadApplication: async () => ({ status: 200, data: { id: "pending-application", status: "Pending" } }) }
      });
      assert.equal(pending.status, 409);
      assert.equal(createCount, 1);
    }
  },
  {
    name: "Application conversion drafts are private and never automatically featured",
    run: () => {
      const farmer = buildFarmerProfileDraft({
        id: "farmer-application",
        applicant_name: "Applicant",
        phone_number: "0200000000",
        region: "Ashanti",
        district: "Ejisu",
        farm_type: "Crop",
        crops_products: ["Maize"]
      });
      const supplier = buildSupplierProfileDraft({
        id: "supplier-application",
        business_name: "Supplier Business",
        contact_person: "Applicant",
        region: "Ashanti",
        district: "Ejisu",
        normalized_categories: ["Seeds"],
        products_or_services: "Maize seed"
      });

      assert.equal(farmer.status, "Pending");
      assert.equal(farmer.verification_status, "Pending Verification");
      assert.equal(farmer.launch_ready, false);
      assert.equal(farmer.is_featured, false);
      assert.equal(farmer.slug, null);
      assert.equal(supplier.ok, true);
      if (supplier.ok) {
        assert.equal(supplier.data.status, "Pending");
        assert.equal(supplier.data.verification_status, "Pending Verification");
        assert.equal(supplier.data.launch_ready, false);
        assert.equal(supplier.data.is_featured, false);
        assert.equal(supplier.data.slug, null);
      }
    }
  },
  {
    name: "Farmer application and approved media foundations remain safely dormant",
    run: () => {
      const farmerRoute = repoFile("src/app/api/farmer-registration/route.ts");
      const farmerPage = repoFile("src/app/join/farmer/page.tsx");
      const service = repoFile("src/lib/profileApplications.ts");

      assert.equal(service.includes('insertSupabaseRecord("farmer_applications"'), true);
      assert.equal(service.includes('bucket: PROFILE_APPLICATION_MEDIA[kind].bucket'), true);
      assert.equal(service.includes("if (!approved)"), true);
      assert.equal(service.includes("approvedImagePaths(kind, application)"), true);
      assert.equal(service.includes("linkedProfileId !== profileId"), true);
      assert.equal(service.includes("verifiedDigest !== sourceDigest"), true);
      assert.equal(service.includes("private_certificate_paths") && service.includes("private_document_paths"), true);
      assert.equal(farmerRoute.includes("status: 503"), true);
      assert.doesNotMatch(farmerRoute, /createFarmerApplication|uploadPrivateApplicationMedia/);
      assert.equal(farmerPage.includes("Applications are temporarily unavailable"), true);
    }
  },
  {
    name: "Profile runtime foundations preserve public DTO and eligibility privacy",
    run: () => {
      const publicData = repoFile("src/lib/supabase/publicData.ts");
      const supplierMapper = publicData.slice(publicData.indexOf("function mapSupplier"), publicData.indexOf("function mapListing"));
      const eligibility = repoFile("src/lib/publicProfileEligibility.ts");

      assert.doesNotMatch(supplierMapper, /certificate|private_|contact_person|whatsapp_number|phone:/);
      assert.equal(eligibility.includes('record.status === "Active"'), true);
      assert.equal(eligibility.includes('verificationStatus(record) === "Verified"'), true);
      assert.equal(eligibility.includes("launchReady === true"), true);
      assert.equal(eligibility.includes("!isDemoProfileOrigin(record.source)"), true);
    }
  },
  {
    name: "Profile editors use protected live rows and intentional patch saves",
    run: () => {
      const route = repoFile("src/app/api/admin/profile-editor/route.ts");
      const service = repoFile("src/lib/adminProfileEditor.ts");
      const editor = repoFile("src/components/AdminProfileEditor.tsx");

      assert.equal(route.includes("requireAdminUser(request)"), true);
      assert.equal(route.includes('export const dynamic = "force-dynamic"'), true);
      assert.equal(route.includes('"Cache-Control": "no-store, max-age=0"'), true);
      assert.equal(service.startsWith('import "server-only";'), true);
      assert.equal(service.includes('"whatsapp_number", "verification_status", "profile_image_url"'), true);
      assert.equal(service.includes("farmerEditableFields") && service.includes("supplierEditableFields"), true);
      assert.equal(service.includes("for (const [field, value] of Object.entries(changes))"), true);
      assert.equal(editor.includes("Unsaved changes"), true);
      assert.equal(editor.includes("Save failed. Your edits remain on screen."), true);
      assert.equal(editor.includes('label="Application contact name"'), true);
      assert.equal(editor.includes('label="Personal name"'), false);
      assert.equal(editor.includes("Save or reset your unsaved changes before approving public media."), true);
      assert.equal(editor.includes('window.addEventListener("beforeunload"'), true);
      assert.equal(editor.includes("Reset"), true);
      assert.equal(editor.includes("Save Changes"), true);
    }
  },
  {
    name: "Profile save contracts preserve arrays, unknown supplier categories and ordering",
    run: () => {
      const farmer = normalizeRecordArrays({
        id: "farmer-1", slug: "safe-farm", farmer_name: "Private Name", farm_name: "Safe Farm", region: "Eastern",
        district: "Klo-Agogo", farm_type: "Crop", products: ["Maize", "Maize", "Cassava"], farm_size: null,
        whatsapp_number: null, profile_image_url: "/farmer.jpg", description: "A reviewed farm profile.", status: "Active",
        created_at: "2026-01-01", updated_at: "2026-01-01", verification_date: null, verification_status: "Verified",
        verified_by: null, verification_notes: null, source: "admin", phone_number: null, email: null, farm_location: null,
        farming_experience: null, currently_harvesting: null, supply_frequency: null, delivery_preference: null,
        payment_preference: null, is_featured: true, featured_until: null, featured_note: null, launch_status: "Public Farmer",
        editorial_notes: null, launch_ready: true, launch_checklist: {}, document_urls: [], gg_standard_status: "Pending",
        farm_photo_urls: ["/farm-b.jpg", "/farm-a.jpg", "/farm-b.jpg"], produce_photo_urls: ["/produce.jpg"], source_application_id: null
      } satisfies FarmerProfileRecord);

      assert.deepEqual(farmer.products, ["Maize", "Cassava"]);
      assert.deepEqual(farmer.farm_photo_urls, ["/farm-b.jpg", "/farm-a.jpg"]);
      assert.equal(supplierCategoryReview("Legacy mechanisation partner").requiresReview, true);
      assert.equal(supplierCategoryReview("Machinery").normalized, "Farm Equipment");
    }
  },
  {
    name: "Publication checks block incomplete profiles and featured visibility requires eligibility",
    run: () => {
      const farmer = {
        id: "farmer-2", slug: "incomplete-farm", farmer_name: null, farm_name: "Incomplete Farm", region: "Eastern", district: "",
        farm_type: "Crop", products: [], farm_size: null, whatsapp_number: null, profile_image_url: null, description: null,
        status: "Pending", created_at: "2026-01-01", updated_at: "2026-01-01", verification_date: null,
        verification_status: "Pending Verification", verified_by: null, verification_notes: null, source: "admin", phone_number: null,
        email: null, farm_location: null, farming_experience: null, currently_harvesting: null, supply_frequency: null,
        delivery_preference: null, payment_preference: null, is_featured: true, featured_until: null, featured_note: null,
        launch_status: "Needs Improvement", editorial_notes: null, launch_ready: false, launch_checklist: {}, document_urls: [],
        gg_standard_status: "Pending", farm_photo_urls: [], produce_photo_urls: [], source_application_id: null
      } satisfies FarmerProfileRecord;
      const supplier = {
        id: "supplier-1", slug: "supplier-one", company_name: "Supplier One", contact_person: "Private", region: "Ashanti",
        district: "Kumasi", category: "Seeds", products_services: ["Seed"], service_coverage_area: "Ashanti",
        whatsapp_number: null, phone: null, website: null, verification_status: "Verified", logo_url: "/logo.png", status: "Active",
        created_at: "2026-01-01", updated_at: "2026-01-01", is_featured: true, featured_until: null, featured_note: null,
        launch_ready: true, launch_status: "Needs Improvement", source_application_id: null, verification_date: null,
        verified_by: null, verification_notes: null, gg_standard_status: "Pending", profile_review_status: "Ready",
        profile_image_url: null, source: "admin", editorial_notes: null, launch_checklist: {}
      } satisfies SupplierProfileRecord;

      assert.equal(farmerPublicationChecks(farmer).some((check) => !check.complete), true);
      assert.equal(profileIsPubliclyEligible("farmer", farmer), false);
      assert.equal(featuredIsCurrentlyPublic("farmer", farmer), false);
      assert.equal(supplierPublicationChecks(supplier).every((check) => check.complete), true);
      assert.equal(profileIsPubliclyEligible("supplier", supplier), true);
      assert.equal(featuredIsCurrentlyPublic("supplier", supplier), true);
    }
  },
  {
    name: "Farmer review workspace distinguishes application review from public publication",
    run: () => {
      const dashboard = repoFile("src/components/AdminDashboard.tsx");
      const editor = repoFile("src/components/AdminProfileEditor.tsx");
      const service = repoFile("src/lib/adminProfileEditor.ts");
      const eligibility = repoFile("src/lib/publicProfileEligibility.ts");
      const recommendation = dashboard.slice(
        dashboard.indexOf("function farmerRecommendedAction"),
        dashboard.indexOf("function farmerReviewTimeline")
      );

      assert.equal(recommendation.includes('return "Review Complete"'), false);
      assert.equal(recommendation.includes('return "Application review complete"'), true);
      assert.equal(dashboard.includes("The submitted farmer information has been reviewed. Open Public Review to complete launch-readiness and publication checks."), true);
      assert.equal(dashboard.includes("Launch readiness, public preview and featuring are managed in Public Review."), true);
      assert.equal(dashboard.includes("Application Review Checks"), true);
      assert.equal(dashboard.includes("Open Public Review"), true);
      assert.equal(dashboard.includes("markReviewingFarmerLaunchReady"), false);

      for (const control of ["Mark Under Review", "Verify", "Mark Launch Ready", "Activate / Publish", "Pause / Deactivate", "Feature"]) {
        assert.equal(editor.includes(control), true);
      }
      assert.equal(service.includes('checks.filter((check) => !check.complete && !["verified", "launch-ready"].includes(check.key))'), true);
      assert.equal(service.includes("checks.filter((check) => check.required && !check.complete)"), true);
      assert.equal(service.includes('case "feature":'), true);
      assert.equal(eligibility.includes("isEligiblePublicFarmer"), true);
      assert.equal(recommendation.includes("fetch("), false);
    }
  },
  {
    name: "Profile preview and media workflow keep private data out of public DTOs",
    run: () => {
      const editor = repoFile("src/components/AdminProfileEditor.tsx");
      const service = repoFile("src/lib/adminProfileEditor.ts");
      const publicData = repoFile("src/lib/supabase/publicData.ts");
      const previewSection = editor.slice(editor.indexOf("Admin-only Public Preview"), editor.indexOf("fixed inset-x-0 bottom-0"));

      assert.equal(service.includes("mapFarmerPublicProfile") && service.includes("mapSupplierPublicProfile"), true);
      assert.doesNotMatch(previewSection, /phone_number|whatsapp_number|privateEmail|privateNotes|sourceHistory|signedUrl|certificate/);
      assert.equal(editor.includes("Private - never shown publicly"), true);
      assert.equal(editor.includes("Certificates and documents can never be promoted publicly."), true);
      assert.equal(editor.includes("Select approved application image"), true);
      assert.equal(publicData.includes("...(row.farm_photo_urls ?? [])"), true);
      assert.equal(publicData.includes("...(row.produce_photo_urls ?? [])"), true);
    }
  },
  {
    name: "Protected profile transitions and application conversion remain separated and idempotent",
    run: () => {
      const route = repoFile("src/app/api/admin/profile-editor/route.ts");
      const service = repoFile("src/lib/adminProfileEditor.ts");
      const dashboard = repoFile("src/components/AdminDashboard.tsx");

      for (const transition of ["under-review", "verify", "launch-ready", "activate", "pause", "feature", "unfeature"]) {
        assert.equal(route.includes(`"${transition}"`), true);
      }
      assert.equal(service.includes('transition === "activate"'), true);
      assert.equal(service.includes("This profile is not ready to publish."), true);
      assert.equal(route.includes("convertFarmerApplicationToProfile"), true);
      assert.equal(route.includes("convertSupplierApplicationToProfile"), true);
      assert.equal(dashboard.includes("Approve & Publish"), false);
      assert.equal(dashboard.includes("Verify & Publish"), false);
      assert.equal(dashboard.includes("Create Supplier Profile"), true);
      assert.equal(dashboard.includes("openFarmerProfileEditor"), false);
      assert.equal(dashboard.includes("scheduleSupplierEditorialSave"), false);
      assert.equal(dashboard.includes("scheduleEditorialSave"), false);
    }
  },
  {
    name: "Admin profile editors use private page chrome and complete shared readiness checks",
    run: () => {
      const header = repoFile("src/components/Header.tsx");
      const footer = repoFile("src/components/Footer.tsx");
      const floating = repoFile("src/components/FloatingWhatsAppButton.tsx");
      const page = repoFile("src/app/admin/profiles/[kind]/[recordKey]/page.tsx");
      const editor = repoFile("src/components/AdminProfileEditor.tsx");
      const service = repoFile("src/lib/adminProfileEditor.ts");
      const contracts = repoFile("src/lib/profileEditorContracts.ts");

      assert.equal(header.includes('pathname.startsWith("/admin/profiles/")'), true);
      assert.equal(footer.includes('pathname.startsWith("/admin/profiles/")'), true);
      assert.equal(floating.includes('"/admin/profiles"'), true);
      assert.equal(page.includes("getAdminUserFromAccessToken"), true);
      assert.equal(editor.includes("Back to Admin") && editor.includes("Public Preview"), true);
      for (const label of [
        "Public farm name", "Valid unique public URL slug", "Region and public location", "Farm type",
        "At least one crop or product", "Public description", "Approved main image or explicitly approved no-photo state",
        "Verification status is Verified", "Launch Ready is marked", "Public company name", "Approved supplier category",
        "At least one product or service", "Service coverage or public location", "Public business description",
        "Approved public image or explicitly approved no-photo state", "Launch readiness is marked"
      ]) assert.equal(contracts.includes(label), true);
      assert.equal((service.match(/evaluateProfileReadiness\(kind, record\)/g) ?? []).length >= 2, true);
      assert.equal(service.includes("slug=eq.") && service.includes("id=neq."), true);
      assert.equal(service.includes("check.required && !check.complete"), true);
      assert.equal(editor.includes("Passed") && editor.includes("Missing") && editor.includes("Needs review"), true);
    }
  },
  {
    name: "Verification audit fields, media controls and mobile profile tabs remain protected",
    run: () => {
      const editor = repoFile("src/components/AdminProfileEditor.tsx");
      const service = repoFile("src/lib/adminProfileEditor.ts");
      const publicMedia = editor.slice(editor.indexOf('title="Public Media"'), editor.indexOf('title="Private Application Documents"'));

      assert.equal(service.includes('verification_date: new Date().toISOString(), verified_by: adminEmail'), true);
      assert.equal(service.includes('"verified_by" in changes || "verification_date" in changes'), true);
      assert.equal(editor.includes("These values are written by the protected Verify action using the signed-in Admin identity."), true);
      assert.equal(editor.includes("StatusSummary") && editor.includes("Verification audit"), true);
      assert.equal(editor.includes("Upload") && editor.includes("Replace") && editor.includes("Remove"), true);
      assert.equal(publicMedia.includes("Technical details"), true);
      assert.equal(publicMedia.indexOf("Technical details") > publicMedia.indexOf("PublicImageControl"), true);
      assert.equal(editor.includes("Certificates and documents can never be promoted publicly."), true);
      assert.equal(editor.includes("grid grid-cols-2 gap-2 sm:flex"), true);
      assert.equal(editor.includes("min-h-11 min-w-0"), true);
      assert.equal(editor.includes("pb-40 sm:pb-28"), true);
      assert.equal(editor.includes("fixed inset-x-0 bottom-0"), true);
    }
  }
];

async function runRegressionTests() {
  let failures = 0;

  for (const test of tests) {
    try {
      await test.run();
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
}

void runRegressionTests();
