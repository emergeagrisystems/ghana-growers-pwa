"use client";

import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { buyerRequests as fallbackBuyerRequests, buyerRequestsMeta, type BuyerRequest } from "@/data/buyerRequests";
import { products as fallbackMarketplaceProducts } from "@/data/products";
import { normalizeTrust } from "@/components/TrustIndicators";
import { trackWhatsAppLead } from "@/lib/whatsappLeadTracking";
import type { Product } from "@/types";

type FilterConfig = {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function buyerWhatsAppUrl(request: BuyerRequest) {
  const message = `Hello, I am responding to your Ghana Growers buyer request for ${request.quantityNeeded} of ${request.productName} in ${request.district}, ${request.region}.`;
  return `https://wa.me/${request.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

type BuyerRequestsBoardProps = {
  requests?: BuyerRequest[];
  marketplaceProducts?: Product[];
};

function relatedProductsForRequest(request: BuyerRequest, marketplaceProducts: Product[]) {
  const requestProduct = request.productName.toLowerCase();

  return marketplaceProducts
    .filter((product) => {
      const listingName = product.name.toLowerCase();
      return listingName.includes(requestProduct) || requestProduct.includes(listingName.replace("fresh ", "").replace("red ", "").replace("yellow ", "").replace("mature ", ""));
    })
    .slice(0, 3);
}

function SearchBox({
  searchTerm,
  setSearchTerm
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">Search</span>
      <span className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search buyer requests..."
          className="w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm outline-none transition focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
        />
      </span>
    </label>
  );
}

function FilterControls({ filters }: { filters: FilterConfig[] }) {
  return (
    <div className="grid gap-4">
      {filters.map((filter) => (
        <label key={filter.label} className="block">
          <span className="mb-2 block text-sm font-black text-ink">{filter.label}</span>
          <span className="relative block">
            <select
              value={filter.value}
              onChange={(event) => filter.setValue(event.target.value)}
              className="w-full appearance-none rounded-md border border-leaf-900/10 bg-white px-3 py-3 pr-9 text-sm text-ink/75 shadow-sm outline-none transition focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20"
            >
              <option value="All">All {filter.label.toLowerCase()}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          </span>
        </label>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: BuyerRequest["status"] }) {
  const className =
    status === "Urgent"
      ? "bg-earth-500 text-ink"
      : status === "Fulfilled"
        ? "bg-ink/10 text-ink/60"
        : "bg-leaf-50 text-leaf-700";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function BuyerTrustBadge({ status }: { status: string }) {
  if (status === "Verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified by Ghana Growers
      </span>
    );
  }

  return null;
}

function RequestCard({
  request,
  onViewDetails
}: {
  request: BuyerRequest;
  onViewDetails: (request: BuyerRequest) => void;
}) {
  const trust = normalizeTrust(request.trust);

  return (
    <article className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">{request.productName}</h2>
          <p className="mt-1 text-sm font-black text-leaf-700">{request.quantityNeeded}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="mt-4 grid gap-2.5 text-sm text-ink/62">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 shrink-0 text-leaf-600" size={16} aria-hidden="true" />
          <div>
            <dt className="font-black text-ink">Location</dt>
            <dd>{request.district}, {request.region}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <CalendarDays className="mt-0.5 shrink-0 text-leaf-600" size={16} aria-hidden="true" />
          <div>
            <dt className="font-black text-ink">Deadline</dt>
            <dd>{request.deadline}</dd>
          </div>
        </div>
      </dl>

      {trust.status === "Verified" ? (
        <div className="mt-4">
          <BuyerTrustBadge status={trust.status} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onViewDetails(request)}
          className="rounded-md bg-leaf-700 px-3 py-2.5 text-sm font-black text-white transition hover:bg-leaf-800 focus:outline-none focus:ring-2 focus:ring-leaf-600 focus:ring-offset-2"
        >
          Details
        </button>
        <a
          href={buyerWhatsAppUrl(request)}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackWhatsAppLead({
              sourceType: "Buyer Request",
              sourceId: request.id,
              sourceName: request.productName,
              phoneNumber: request.whatsappNumber
            })
          }
          className="inline-flex items-center justify-center gap-2 rounded-md border border-leaf-900/10 bg-white px-3 py-2.5 text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp Buyer
        </a>
      </div>
    </article>
  );
}

function RequestDetailsModal({
  request,
  marketplaceProducts,
  onClose
}: {
  request: BuyerRequest;
  marketplaceProducts: Product[];
  onClose: () => void;
}) {
  const trust = normalizeTrust(request.trust);
  const relatedProducts = relatedProductsForRequest(request, marketplaceProducts);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-md bg-white shadow-soft sm:rounded-md">
        <div className="flex items-center justify-between border-b border-leaf-900/10 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-earth-700">Buyer request</p>
            <h2 className="text-2xl font-black text-ink">{request.productName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close buyer request details"
            className="grid h-10 w-10 place-items-center rounded-md border border-leaf-900/10 text-ink/65 transition hover:bg-leaf-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={request.status} />
              <BuyerTrustBadge status={trust.status} />
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Product needed" value={request.productName} />
              <Detail label="Quantity" value={request.quantityNeeded} />
              <Detail label="Buyer" value={request.buyerName} />
              <Detail label="Buyer type" value={request.buyerType} />
              <Detail label="Region" value={request.region} />
              <Detail label="District" value={request.district} />
              <Detail label="Delivery / pickup" value={request.deliveryPreference} />
              <Detail label="Deadline" value={request.deadline} />
              <Detail label="Budget / price range" value={request.budgetRange ?? "Confirm with buyer"} />
              {trust.status === "Verified" ? <Detail label="Buyer verification" value="Verified by Ghana Growers" /> : null}
              {request.verificationDate && trust.status === "Verified" ? <Detail label="Verification date" value={request.verificationDate} /> : null}
            </div>
          </div>

          <aside className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <h3 className="font-black text-ink">Buyer notes</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">{request.notes}</p>
            <p className="mt-4 text-xs font-black uppercase tracking-wide text-ink/45">Posted {request.datePosted}</p>
            <a
              href={buyerWhatsAppUrl(request)}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackWhatsAppLead({
                  sourceType: "Buyer Request",
                  sourceId: request.id,
                  sourceName: request.productName,
                  phoneNumber: request.whatsappNumber
                })
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf-700 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-800"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Buyer
            </a>
          </aside>
        </div>
        {relatedProducts.length > 0 ? (
          <div className="border-t border-leaf-900/10 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Related marketplace products</p>
                <h3 className="mt-2 text-xl font-black text-ink">Available supply that may match this request</h3>
              </div>
              <Link href="/marketplace#marketplace-listings" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
                View Products
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {relatedProducts.map((product) => (
                <article key={product.id} className="rounded-md border border-leaf-900/10 bg-white p-4">
                  <h4 className="font-black text-ink">{product.name}</h4>
                  <p className="mt-1 text-sm font-black text-leaf-700">{product.quantity} {product.unit}</p>
                  <p className="mt-2 text-sm text-ink/58">{product.region}</p>
                  <Link href="/marketplace#marketplace-listings" className="mt-4 inline-flex w-full justify-center rounded-md bg-leaf-50 px-4 py-2.5 text-sm font-black text-leaf-800 ring-1 ring-leaf-900/10 transition hover:bg-white">
                    View Product
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-leaf-900/10 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-semibold leading-6 text-ink/78">{value}</p>
    </div>
  );
}

export function BuyerRequestsBoard({
  requests = fallbackBuyerRequests,
  marketplaceProducts = fallbackMarketplaceProducts
}: BuyerRequestsBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [product, setProduct] = useState("All");
  const [region, setRegion] = useState("All");
  const [buyerType, setBuyerType] = useState("All");
  const [status, setStatus] = useState("All");
  const [deadline, setDeadline] = useState("All");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BuyerRequest | null>(null);

  const products = useMemo(() => unique(requests.map((request) => request.productName)), [requests]);
  const regions = useMemo(() => unique(requests.map((request) => request.region)), [requests]);
  const buyerTypes = useMemo(() => unique(requests.map((request) => request.buyerType)), [requests]);
  const statuses = useMemo(() => unique(requests.map((request) => request.status)), [requests]);
  const deadlines = useMemo(() => unique(requests.map((request) => request.deadline)), [requests]);

  const filters: FilterConfig[] = [
    { label: "Product", value: product, setValue: setProduct, options: products },
    { label: "Region", value: region, setValue: setRegion, options: regions },
    { label: "Buyer Type", value: buyerType, setValue: setBuyerType, options: buyerTypes },
    { label: "Status", value: status, setValue: setStatus, options: statuses },
    { label: "Deadline", value: deadline, setValue: setDeadline, options: deadlines }
  ];

  function clearFilters() {
    setSearchTerm("");
    setProduct("All");
    setRegion("All");
    setBuyerType("All");
    setStatus("All");
    setDeadline("All");
  }

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          request.productName,
          request.quantityNeeded,
          request.region,
          request.district,
          request.buyerType,
          request.buyerName,
          request.status,
          request.notes
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesSearch &&
        (product === "All" || request.productName === product) &&
        (region === "All" || request.region === region) &&
        (buyerType === "All" || request.buyerType === buyerType) &&
        (status === "All" || request.status === status) &&
        (deadline === "All" || request.deadline === deadline)
      );
    });
  }, [buyerType, deadline, product, region, requests, searchTerm, status]);

  return (
    <>
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-earth-700">Active demand</p>
                <h2 className="mt-2 text-3xl font-black text-ink">Buyer Demand Board</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
                  Browse active requests from buyers across Ghana.
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-wide text-ink/45">
                  Last updated: {buyerRequestsMeta.lastUpdated}
                </p>
              </div>
              <p className="max-w-md rounded-md bg-white px-3 py-2 text-xs font-semibold leading-5 text-ink/55">
                {buyerRequestsMeta.note}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
                <h2 className="text-lg font-black text-ink">Find demand</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">Search and filter active buyer requests.</p>
                <div className="mt-5">
                  <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </div>
                <div className="mt-5">
                  <FilterControls filters={filters} />
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 w-full rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink/70 transition hover:border-leaf-700 hover:bg-white hover:text-leaf-800"
                >
                  Clear Filters
                </button>
              </div>
            </aside>

            <div>
              <div className="lg:hidden">
                <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters((value) => !value)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink transition hover:bg-leaf-50"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {showMobileFilters ? "Hide Filters" : "Show Filters"}
                  </button>

                  {showMobileFilters ? (
                    <div className="mt-4 border-t border-leaf-900/10 pt-4">
                      <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                      <div className="mt-5">
                        <FilterControls filters={filters} />
                      </div>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-5 w-full rounded-md border border-leaf-900/10 bg-white px-4 py-3 text-sm font-black text-ink/70 transition hover:border-leaf-700 hover:bg-white hover:text-leaf-800"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between lg:mt-0">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-earth-700">Buyer Demand Board</p>
                  <h2 className="mt-2 text-3xl font-black text-ink">Buyer Requests</h2>
                </div>
                <p className="text-sm font-semibold text-ink/55">
                  Showing {filteredRequests.length} of {requests.length} requests
                </p>
              </div>

              {filteredRequests.length > 0 ? (
                <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRequests.map((request) => (
                    <RequestCard key={request.id} request={request} onViewDetails={setSelectedRequest} />
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-md border border-dashed border-leaf-900/20 bg-leaf-50 p-8 text-center">
                  <ShoppingBasket className="mx-auto text-leaf-600" size={34} aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-black text-ink">No buyer requests found.</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">Try another search, product, region, buyer type, status, or deadline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedRequest ? (
        <RequestDetailsModal request={selectedRequest} marketplaceProducts={marketplaceProducts} onClose={() => setSelectedRequest(null)} />
      ) : null}
    </>
  );
}
