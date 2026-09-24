# RC1 isolation and release gates

Protected Preview only; `main` and Production remain locked. Baseline `091f6b664a250500dea57837a6c152774119a22b` on `codex/p09-1-homepage-foundations`; candidate `codex/p09-rc1`.

## Verified configuration

- Restored the existing project identified as Ghana Growers — Staging, ref `ecluxmyxqofkbzcyurlf`. Supabase reports ACTIVE_HEALTHY.
- Production ref `bfasogvmesswweribsji` is not substituted or modified.
- Vercel project `prj_28xQX5ElvcwvjqoUobNBpOxLPjWW`, team `team_tLWIetXY7UKAroNJ8Nu3nSBz`. Existing SSO protection `all_except_custom_domains` remains enabled.
- Created19 encrypted overrides scoped only to Preview and branch `codex/p09-rc1`. Checked every returned override against its expected value without printing secrets. All non-RC1 environment metadata remained identical during configuration.
- Browser anon-key JWT ref and URL match staging. Shared REST/storage/auth/browser helpers reject a non-staging URL in Preview. The browser Preview flag is also set by the build configuration whenever VERCEL_ENV is preview.
- Middleware refuses a Preview until both staging URL and RC1_STAGING_READY are valid. The image optimizer's Preview allowlist only permits staging Supabase storage.
- The protected `/api/rc1-readiness` endpoint reports actual runtime environment/commit/ref and booleans for configured keys, never their values. It returns404 outside RC1 Preview.

## Exact blockers and effects

The recovered staging configuration deliberately has no server service-role key or OpenAI key. RC1 overrides preserve those blanks rather than inherit Production credentials. Google Sheets, Kindwise and Resend credentials are also blank. Consequently: real public loaders and durable usage checks remain unavailable; live model/photo evaluations and write-capable staging journeys are NOT RUN. No fallback to Production is permitted. Founder must provide staging-only server credentials and an approved Preview AI credential, then redeploy and repeat these dependent checks.

All unowned public intake routes are closed. No operational receiver or tested receipt/failure chain was established. No staging form records, uploaded photos, notifications, email, Sheets rows or AI-provider calls were intentionally created. Malformed deployed requests test the closed intake gates only; they are not receipt tests. Farmer Hub rendering requests default Accra weather through the existing read-only weather service; these reads are the external-service effect, not an AI call or a user-location submission. Staging reactivation is the infrastructure effect; it remains running and can incur normal plan charges. No migrations or Production data copies were performed.

## Separate gates

1. Candidate engineering: complete deployed verification after final commit; preserve explicit cross-instance replay limitations and the observed crop-health/weather routing mismatch.
2. Founder: review the actual Protected Preview on real devices, including visual fidelity, disabled actions, navigation, tools, disclosure readability and failures. Automated browser tests do not close this gate.
3. Agronomy: REVIEWER NOT YET IDENTIFIED / AGRONOMIC REVIEW PENDING. Qualified Ghana review of the evidence packet must precede public Ask Mama G release. No external reviewer contacted.
4. Operations/public release: staging keys, live tests, independent Production readiness, receiver/receipt evidence for any reopened workflow and explicit founder release authority. Passing Preview tests does not authorize merge or Production deployment.

## Rollback and deferrals

Prior candidate deployment: `dpl_AwSsEMXtPgxDtyWe8h3LKpZhpdsF` at the baseline. Production stays `dpl_5QT2U2YjrC36d3H51ch2EEueq3NW`, commit `a008a17f90013ce5fd98dd79058e2aa5c452d906`. RC1 can be abandoned or reversed on its own branch without a Production rollback or schema reversal. Do not promote the old candidate as a substitute for public-release approval. Reversing code does not automatically undo staging reactivation or the branch-scoped environment entries.

Deferred: All Crops; unowned intake/enquiries/feedback and human-support activation; exact social destinations and social hover/pressed authority; prior Marketplace transfer-fidelity gate; Learn redesign/content expansion; new AI/RAG architecture; new authentication/payments/logistics; migrations; Production rollout. Agronomic approval is a pre-release blocker, not an item to postpone beyond public Mama G launch.
