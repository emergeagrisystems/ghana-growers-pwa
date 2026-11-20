# Buyer first replies in Today’s work

Only a signed-in, entitled staff member can read the overview. The server reads the existing `staff_today` RPC once for the selected instant. Its SQL aggregates every unanswered receipt and excludes cases with the database’s qualifying first-buyer-reply event. The server checks the response timestamp and joins every returned receipt by ID and received time to the complete staff buyer queue. It reads the queue in stable ID order until an empty page, including when the server caps a page below the requested size. Failed pages, duplicate or unmatched receipts, malformed responses, missing tracking configuration and uncovered deadlines produce an unavailable message. A successful empty result produces zero.

The first total includes waiting, attention soon and overdue. The last two are disjoint subsets. History to review is separate. A single match opens its case. Multiple matches open their filtered queue. Receipt status, including Contacted, Completed or Lost, does not excuse an unrecorded reply. Keep closed cases visible pending any separate founder status-policy decision.

The existing confirmed buyer-contact command records the first qualifying buyer reply. Claiming, notes, seller contact, opening WhatsApp, saving a generic buyer contact and completing a follow-up leave the requirement outstanding. A pre-tracking receipt without qualifying evidence stays historical. Its individual case uses the same distinction. No backfill is needed.

## Ghana operating calendar

Edition **GH-2026-H2.1**, checked **20 November 2026**, covers **1 July through 31 December 2026**, inclusive. Observed holidays in this window are 3 July, 21 September, 4 December, 25 December and 28 December. The 3 July and 28 December observances substitute for Republic Day and Boxing Day respectively. Saturdays and Sundays are excluded. The receipt’s Ghana calendar day is day zero. The reminder starts at 09:00 GMT on business day one. The request becomes overdue strictly after 17:00 GMT on business day two.

- [Ministry’s 2026 statutory calendar](https://mint.gov.gh/documents/statutory-holidays-commemorative-days-in-the-republic-of-ghana-for-the-year-2026)
- [July observance](https://mint.gov.gh/media/press-releases/declaration-of-friday-3rd-july-2026-as-a-public-holiday-2)
- [September observance](https://mint.gov.gh/media/press-releases/declaration-of-monday-21st-september-2026-as-a-statutory-public-holiday)
- [Ministry notices for later declarations](https://mint.gov.gh/media/press-releases)

Proposed owner for founder review: the staff operations lead, with the founder covering until assignment. Review official notices weekly, on receipt of a new declaration and before release. Extend coverage before a two-business-day deadline can cross the year boundary. Update the dated edition, sources and boundary tests together. An unknown deadline stays unavailable.

## Tracking start and release

The isolated staging project uses the fictional inclusive boundary **2026-11-08T00:00:00Z**. Production requires a separately approved server-only **STAFF_REPLY_EVIDENCE_START_UTC**. Record the exact UTC instant when reliable staff recording is operational and staff begin using it. Never copy the staging date or infer a date from the earliest historical event. With no valid active Production start the overview reports that tracking is unavailable. Confirm the date, owner and closed-case policy at the release gate. No schema, grant, Auth, notification or intake change is required by this feature.
