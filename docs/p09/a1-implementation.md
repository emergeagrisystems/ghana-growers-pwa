# P09-RC1-A1 — bounded agronomy expansion

Status: candidate for founder product-quality review, NOT agronomic approval or public release.

## Receiving check and protected baseline

Baseline: `f200b2c642c3f85fdf83a1262f68d6487b0aebaf`. Remote RC1 matched; no later correction needed reconciliation. Before-state Protected Preview: `dpl_aLFVXFfrBhgz9t5WdS7NkbCbHHPW`, `ghana-growers-jgj5ui4t8-emergeagrisystems-projects.vercel.app`. Main: `a008a17f90013ce5fd98dd79058e2aa5c452d906`.

Next.js/React implementation, structured provider request work, browser/mobile checks, GitHub, Vercel and read-only staging Supabase were available on 09. Browser readiness confirmed Preview, staging `ecluxmyxqofkbzcyurlf`, server/client isolation and both server keys configured. Staging Auth: two users. No new credentials requested or exposed. Authoritative public-source browsing worked; some full pages failed to open and are explicitly identified as indexed-only evidence in the source register.

Skills used: Supabase safety, Next.js, Protected Preview deployment, React quality review, end-to-end verification and Ghana Growers UX review. These are technical/UX skills, NOT Ghana agronomic qualifications. No dedicated Ghana-qualified agronomy skill or reviewer is confirmed.

## Architecture and authority

`agronomy-sources.ts` is the single controlled source register and crop/topic coverage matrix. `agronomy-evidence.ts` contains bounded authored cards, source IDs, conditional alternatives, selectable evidence questions and provisional actions. The existing decision engine selects these cards; the existing specialist router remains in place. Its fertilizer vocabulary now includes the verbs fertilize/fertilise.

The server rebuilds the assessment from the original question and signed answer history. Client-supplied advice/source claims never govern the server response. Only declared question/option pairs affect advice. Questions advance one at a time. Unknown options do not inject knowledge. The existing token, continuation claim, reservation, settlement, timeout and retry accounting remain unchanged.

The OpenAI text layer receives the bounded assessment, source scope/geography/exclusions, already-held tool/weather context and a concise rendering contract. No browsing, external retrieval, RAG, new model or new provider was added. Source links are ordinary optional reference links, not runtime retrieval.

Crop Doctor retains the existing provider settings, categories, JSON parsing, timeout and idempotent usage path. Its prompt now separates observable signs, possibilities, unconfirmed cause and differentiating evidence. Unknown crop identity no longer erases an otherwise useful cautious explanation/check. Unusable-photo handling remains. Generic removal was removed from fallback actions. An additional output check rejects numeric rates and affirmative safety/guarantee claims through the existing failure path. The UI explicitly separates crop certainty, visible-problem confidence and unconfirmed cause/food safety.

## Scope and honest limits

This is focused depth, not full expertise across every target crop. New decision cases cover decline, maize yellowing/nutrients/maturity, tomato rot, white insects, pepper transplanting, yam mounds, tomato support, cassava establishment, waterlogging, grain storage, fresh surplus, roots/tubers and unfamiliar-crop evidence collection. All target crop groups are reconciled in the coverage matrix. Cash/perennial crops have evidence-collection/referral coverage, not new fermentation or processing protocols.

Planting dates, pesticide/rate advice and broad crop calendars were not expanded. Existing nursery/mulch/rotation/pruning content outside these new cards remains baseline content, not newly source-validated by this package. A qualified reviewer must assess inherited guidance too before release. More complete Ghana crop-specific methods, disease differentials and post-harvest protocols remain knowledge gaps, not technical access blockers.

## Safety and data

No migration, schema, bucket, RLS, Auth or quota change. No Production operation. No main merge. No business records seeded. Test interactions may create the normal staging usage events only.

Explicit hazardous dose/mixture refusals remain first. A new pre-reservation refusal also handles requested rates and high-risk food/feed/toxin/processing safety claims. It provides no numeric rates or thresholds and consumes no Ask credit. Mould/heating stops the ordinary storage path. No guaranteed yield, price, sale or shelf life is authorized. Numeric safety thresholds, formulations, chemical preservation, storage pesticides, fermentation safety and cassava toxicity processing remain outside this candidate's recommendations.

Sources vary in age and geography. Old guides' chemical recipes and rates were explicitly excluded. A cited guide is not permission to transfer a non-Ghana treatment to Ghana. No copyrighted manual was copied into the application.

## Evaluation and reproduction

Compile the existing FarmMate test configuration; run `farmmate-regression.test.js` and `agronomy-a1.test.js` in `.farmmate-test-dist/tests`. Run TypeScript and the Next production build. Run `scripts/rc1-a1-evidence.cjs` with an output directory to generate the fixed evaluation, provenance and coverage package from that commit's compiled modules. The script does not contact providers/databases and uses no credits.

The evaluation register labels simulated field scenarios separately from actual live provider answers. Negative tests cover guessed rates, fabricated weather/guarantees, false diagnosis, unknown-crop local-authority claims, unsafe storage, invalid options and unknown photo identity. Passing these tests is not proof that every possible model answer is agronomically correct.

## Recovery and next gate

Rollback: redeploy the prior protected RC1 deployment/commit. No database rollback is needed because this task changes no schema or accounting persistence. Normal test usage events remain as evidence and must not be deleted to make counts look unchanged.

Founder gate: P09-RC1-A1 RETURN FOR FOUNDER PRODUCT-QUALITY REVIEW. Then obtain qualified Ghana agronomic/post-harvest review against the exact new commit and deployment, including all changed advice and geographic transfers. Reviewer not identified on this Work; founder must appoint/confirm one. No reviewer contacted.

Production remains locked. A later release requires separate founder authority and a Production readiness preflight with a fresh Production-grade backup/recovery and rollback plan. Staging evidence cannot satisfy that requirement.
