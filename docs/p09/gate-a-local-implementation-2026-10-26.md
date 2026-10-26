# Ghana Growers — P09 Gate A local implementation record

Date: 2026-10-26  
Status: local implementation complete; Gate B/C not started  
Branch: `codex/p09-stage1-gate-a`  
Baseline and rollback: `68b234655d8204c4029f3df6b859b456c17238f9`

## Authority and protected boundary

Gate A implements the founder-approved Stage 1 Homepage and bounded public-surface containment. It does not activate staging, deploy Preview, merge `main`, deploy Production, change Supabase, change schema, migrate data, alter Auth, or send external notifications.

The implementation preserves Directory/Profile publication rules, admin architecture and queues, Mama G behavior and accounting, Learn, and the deferred Marketplace business system.

## Design mapping

Figma file `Xfg7973wsLKi5e82o8ETFb` remains the design authority:

- 1440: `1487:1293`
- 768: `1518:1630`
- 390: `1518:1930`
- 320: `1518:2221`

The implemented order is Hero, Stage 1 gateways, Directory, Mama G, registration, circular categories, How It Works, and the shared footer. Learn remains deferred. Market is absent from public navigation. The Marketplace URLs are truthfully contained without deleting their underlying implementation.

## Media receipt and derivatives

The ChatGPT Library entry was readable, but its download action did not return archive bytes within 120 seconds. The existing transferred archive was therefore used after re-verifying SHA-256 `885CEE95300D506AE164F7A55F1CF6752C05F5016515B638B16602759A049864`.

Seven locked image sources produced 16 responsive WebP derivatives. No source PNG is present under `public/`. The approved How It Works MP4 is the only additional public media file. Full source hashes, generation IDs, derivative hashes, sizes, crop authority and claim boundaries are recorded in `gate-a-media-provenance.json`.

The original PNGs retain the Higgsfield `hf-job-id` marker. WebP conversion did not retain that metadata. No replacement credential was invented. The nonvisual generated-media disclosure hook is present; visible wording and placement remain pending founder approval.

## Stage 1 containment and privacy

- Public navigation exposes Ask Mama G and Farms & Suppliers, not Market or Learn.
- Farmer registration, supplier registration, managed buyer enquiries and listing submissions use one server-owned, independently keyed, default-closed workflow authority.
- Closed workflows use factual availability copy and do not render public submission forms.
- Public supplier DTOs do not include website links.
- Public Marketplace DTOs strip WhatsApp numbers and internal operations notes for every source type.
- Legacy Marketplace routes show a Stage 2 notice and do not fetch public listing data.

## Notification foundation

The existing Resend supplier-registration path was not reused because it sends private registration details and needs live credentials. Gate A adds a provider-neutral admin-queue notification adapter for `enquiries@ghana-growers.com` with deterministic workflow identity, duplicate protection, minimal payloads and recoverable delivery-failure records.

No provider, credential or external send is configured. Durable queue records remain authoritative. Live provider selection and any durable delivery-state integration require a later explicit gate.

## Local verification

- TypeScript: pass.
- ESLint: pass, no warnings.
- Production build: pass with Next.js 14.2.35.
- Automated tests: 503 pass (449 regression plus 54 focused registration, admin, enquiry, HQ-count, notification and Gate A tests).
- Responsive browser checks: pass at 1440, 768, 390 and 320; no horizontal page overflow.
- Mobile navigation: pass for open, Escape close and focus restoration.
- Touch targets: primary controls meet at least 44px height.
- How It Works: muted, inline, non-looping playback; final frame holds; Replay restarts playback.
- Public media: 16 WebP files, 0 PNG originals, 1 approved MP4.
- Supabase and migrations: no changed files.

Public Directory loaders showed truthful unavailable/empty states in the local environment because no staging credentials were used, as required by Gate A.

## Gate B/C proposal only

Gate B should validate the committed branch in a protected, read-only Preview against the four Figma frames, responsive asset selection, browser/accessibility behavior, public serialization boundaries and truthful containment. It must keep all workflow writes disabled.

Gate C should require founder visual approval, explicit Preview/staging authority if needed, notification-provider and delivery-state decisions, approved visible generated-media disclosure wording/placement, and a rollback check before any activation. Production, `main`, schemas and staging writes remain closed until separately authorised.
