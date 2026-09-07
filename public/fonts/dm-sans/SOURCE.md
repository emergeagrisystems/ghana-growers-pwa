# DM Sans — P09-1 local foundation

Official source: https://github.com/googlefonts/dm-fonts/tree/d0520ba03bd780f5dccb3024854463d44f699b78/Sans
Pinned commit: d0520ba03bd780f5dccb3024854463d44f699b78

Downloaded 7 September 2026 from the official repository:
- Input: Sans/fonts/webfonts/DMSans[opsz,wght].woff2
- Output: dm-sans-roman.woff2 (filename change only; no byte conversion or subsetting)
- Source Git blob SHA-1: 2375279dbf5a47d05c9b3364961a1f2d768b78cc
- Input and final SHA-256: e80dcae1d6cec824ed44daa671795d742f5c9ad8d50f7774bd0418eb44bfd4e1
- Payload: 88,504 bytes. One normal variable font, no italic file.
- Axes inspected from fvar: weight 100–1000 (default 400); optical size 9–40 (default 9).
- Licence: SIL Open Font License 1.1; exact copyright/licence retained in OFL.txt.
- OFL.txt SHA-256: 9af36190332437f5ecd09974de43c1f7c77a310a996cdd8ceb25628b458840e1

No font installation, conversion, glyph deletion or new dependency. Retaining the official variable webfont avoids an unverified subset and preserves all upstream coverage. A narrower payload may be evaluated separately if justified.

## Coverage and limitations

Read-only WOFF2 Brotli/table/cmap inspection with existing Node runtime:
- Present: ƒ, Ŋ, ŋ, combining acute U+0301, grave U+0300, tilde U+0303, G and H.
- Missing from this DM Sans: Ɛ (U+0190), ɛ (U+025B), Ɔ (U+0186), ɔ (U+0254), Ƒ (U+0191), Ɣ (U+0194), ɣ (U+0263), ₵ (U+20B5).
- These characters use the approved system-ui → Segoe UI → Arial → sans-serif fallback.
- No claim of universal Ghanaian-language or translation readiness. Device-specific fallback/shaping remains an explicit review concern.
- The character specimen is not translated marketing copy.

Delivery uses scoped next/font/local, display swap and automatic optical sizing. The font is applied only to the foundation subtree. Runtime tests record loaded/blocked-font behaviour and reflow; this file does not imply universal zero layout shift.
