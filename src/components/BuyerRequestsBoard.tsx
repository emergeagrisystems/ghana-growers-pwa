"use client";

import { CalendarDays, MapPin, ShoppingBasket } from "lucide-react";
import { useMemo, useState } from "react";
import { buyerRequests, buyerRequestsMeta } from "@/data/buyerRequests";
import { normalizeTrust, TrustScoreCard, TrustSummary } from "@/components/TrustIndicators";
import { WhatsAppButton } from "@/components/WhatsAppButton";

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

export function BuyerRequestsBoard() {
  const [product, setProduct] = useState("All");
  const [region, setRegion] = useState("All");
  const [buyerType, setBuyerType] = useState("All");

  const products = useMemo(() => unique(buyerRequests.map((request) => request.productName)), []);
  const regions = useMemo(() => unique(buyerRequests.map((request) => request.region)), []);
  const buyerTypes = useMemo(() => unique(buyerRequests.map((request) => request.buyerType)), []);

  const filteredRequests = buyerRequests.filter((request) => {
    return (
      (product === "All" || request.productName === product) &&
      (region === "All" || request.region === region) &&
      (buyerType === "All" || request.buyerType === buyerType)
    );
  });

  const filters = [
    { label: "Product", value: product, setValue: setProduct, options: products },
    { label: "Region", value: region, setValue: setRegion, options: regions },
    { label: "Buyer Type", value: buyerType, setValue: setBuyerType, options: buyerTypes }
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-earth-700">Live demand board</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Find buyers looking for farm produce</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Filter buyer demand by crop, region, or buyer type. Farmers should confirm price, quality, timing,
                transport, and payment before committing produce.
              </p>
              <p className="mt-2 text-xs font-black uppercase text-ink/50">Last updated: {buyerRequestsMeta.lastUpdated}</p>
            </div>
            <p className="rounded-md bg-white px-4 py-3 text-sm font-bold text-ink/70">{buyerRequestsMeta.note}</p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {filters.map((filter) => (
              <label key={filter.label} className="grid gap-2 text-sm font-bold text-ink/75">
                {filter.label}
                <select
                  className="focus-ring rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal"
                  value={filter.value}
                  onChange={(event) => filter.setValue(event.target.value)}
                >
                  <option value="All">All {filter.label.toLowerCase()}</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRequests.map((request) => (
            <article key={request.id} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
              {(() => {
                const trust = normalizeTrust(request.trust);

                return (
                  <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-earth-700">{request.buyerType}</p>
                  <h3 className="mt-1 text-2xl font-black text-ink">{request.productName}</h3>
                  <p className="mt-2 text-sm font-bold text-leaf-700">{request.quantityNeeded}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-leaf-600 text-white">
                  <ShoppingBasket size={22} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4">
                <TrustSummary kind="buyer" trust={trust} />
              </div>

              <dl className="mt-5 grid gap-3 text-sm text-ink/70">
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 shrink-0 text-leaf-600" size={17} aria-hidden="true" />
                  <div>
                    <dt className="font-black text-ink">Location</dt>
                    <dd>{request.district}, {request.region}</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CalendarDays className="mt-0.5 shrink-0 text-leaf-600" size={17} aria-hidden="true" />
                  <div>
                    <dt className="font-black text-ink">Deadline</dt>
                    <dd>{request.deadline}</dd>
                  </div>
                </div>
                <div>
                  <dt className="font-black text-ink">Contact Method</dt>
                  <dd>{request.contactMethod}</dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Date Posted</dt>
                  <dd>{request.datePosted}</dd>
                </div>
              </dl>

              <div className="mt-5">
                <TrustScoreCard score={trust.score} />
              </div>

              <WhatsAppButton
                message={`Hello Ghana Growers, I am a farmer interested in the buyer request for ${request.quantityNeeded} of ${request.productName} in ${request.district}, ${request.region}.`}
                className="mt-5 w-full"
              />
                  </>
                );
              })()}
            </article>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <p className="mt-8 rounded-md bg-leaf-50 p-5 text-sm font-bold text-ink/70">
            No buyer requests match these filters. Try a different product, region, or buyer type.
          </p>
        ) : null}
      </div>
    </section>
  );
}
