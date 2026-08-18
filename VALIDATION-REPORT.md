# Sitemap Validation Report — EnjoyBook

**Analyzed:** 2026-08-13 10:52 ICT  
**Production domain:** `https://enjoybook.co`  
**Implementation:** `src/app/sitemap.ts`, `src/app/robots.ts`  
**Overall status:** Critical failure — search engines are not being given a usable sitemap

## Executive summary

Production `robots.txt` advertises `https://enjoybook.co/sitemap.xml`, but that URL returns HTTP 404. The generated endpoint at `https://enjoybook.co/sitemap/0.xml` returns valid XML with zero URLs. Two independent implementation defects explain the empty result:

1. The project uses Next.js 16, where the generated sitemap `id` is a `Promise<string>`, while the implementation treats it as a synchronous number.
2. `fetchBookTrans()` expects `/getAllBookHome` to return an array in `data`, while the live API now returns an object containing `popup`, `slides`, and `groupBookHome`; the function therefore always returns an empty array.

## Production validation

| Check | Result | Severity |
|---|---|---|
| `https://enjoybook.co/robots.txt` | 200; advertises `/sitemap.xml` | — |
| `https://enjoybook.co/sitemap.xml` | 404 | Critical |
| `https://enjoybook.co/sitemap/0.xml` | 200, valid XML, **0 URLs** | Critical |
| `https://enjoybook.co/sitemap/1.xml` | 404 | Expected while only ID 0 is generated |
| Intended static URLs | 25/25 sampled URLs return 200 | Pass |
| Noindexed URLs | `/search` is intended for the sitemap but emits `noindex, follow` | High |
| HTTPS | All intended URLs use HTTPS | Pass |
| Deprecated sitemap tags | `priority` and `changeFrequency` are emitted | Informational |

## Findings

### Critical — advertised sitemap URL does not exist

`src/app/robots.ts` advertises `/sitemap.xml`, but using `generateSitemaps()` makes the generated files available at `/sitemap/[id].xml`. There is no sitemap index at `/sitemap.xml`, so crawlers following `robots.txt` receive a 404.

**Fix:** If the site remains below 50,000 canonical URLs, remove `generateSitemaps()` and publish one root `/sitemap.xml`. If multiple files are required, publish a real sitemap index and advertise its URL in `robots.txt`.

### Critical — Next.js 16 async sitemap ID is not awaited

`src/app/sitemap.ts` accepts `{ id: number }`, compares `id === 0`, and multiplies `id` for the slice boundaries. Next.js 16 passes `id` as `Promise<string>`. Consequently, the first-sitemap block is skipped and the book slice is empty.

**Fix:** Accept `id: Promise<string>`, await it, validate it, and convert it with `Number()` before calculating offsets. See the official Next.js 16 migration and `generateSitemaps` documentation.

### Critical — live book API contract no longer matches `fetchBookTrans()`

`fetchBookTrans()` checks whether `response.data` is an array and returns `[]` otherwise. The live `/getAllBookHome` response currently has object-shaped `data` with 32 `groupBookHome` groups. Thus `generateSitemaps()` always calculates one empty book chunk, and no book or writer URLs can be generated from this source.

**Fix:** Use a dedicated paginated endpoint that returns every indexable book with stable ID and actual modification timestamp. Do not build a complete sitemap from homepage recommendation groups, because they are curated subsets and can contain duplicates.

### High — `/search` is noindexed but is intended for inclusion

The static route list includes `/search`, while the page metadata explicitly emits `noindex, follow`. A sitemap must contain only canonical, indexable URLs.

**Fix:** Remove `/search` from the sitemap.

### Medium — fabricated `lastModified` timestamps

Static pages, categories, books, and writers use `new Date()` on every regeneration. This tells crawlers that all of these pages changed every hour even when they did not. Article timestamps correctly use `article.update_at`.

**Fix:** Use persisted content update timestamps. Omit `<lastmod>` when no reliable timestamp exists.

### Medium — article coverage is capped at the first 100 records

The implementation fetches only page 1 with a limit of 100. Production currently has 11 articles, so coverage is complete today, but it will silently become incomplete after article 100.

**Fix:** paginate through all published/indexable articles or use a dedicated sitemap feed.

### Informational — `priority` and `changeFrequency`

These fields do not help Google and add noise. They can be removed; this is not a blocking defect.

### Audit-tool false positive — homepage route

`scripts/audit-sitemap-metadata.mjs` reports that `/` is missing even though the root page exists and the static sitemap list contains the empty route. This is a bug in the audit script's root-route normalization, not a site-route problem.

## Recommended repair order

1. Decide between one sitemap (<50,000 canonical URLs) and a real sitemap index.
2. Correct the Next.js 16 async `id` contract or remove `generateSitemaps()`.
3. Replace the homepage API with a complete, paginated inventory source.
4. Remove `/search` and any other noindexed, redirected, or non-canonical URLs.
5. Use accurate modification dates and paginate articles.
6. Add an automated production check asserting that the advertised sitemap returns 200, parses as XML, and contains a non-zero URL count.

## Verification criteria after repair

- Every sitemap URL advertised in `robots.txt` returns HTTP 200.
- XML parses against the sitemap protocol and each file contains 1–50,000 unique URLs.
- Sampled sitemap URLs return 200, are indexable, and use self-referential canonicals.
- No redirects, `noindex` pages, HTTP URLs, or duplicates are present.
- `<lastmod>` is accurate or omitted.
- The sitemap contains all published books and articles, not only homepage subsets or the first API page.

## Limitations

- Google Search Console index coverage was not available, so submitted/discovered/indexed counts could not be compared.
- Because the live generated sitemap contains zero URLs, per-URL sitemap sampling was performed against the 25 intended static routes in source rather than sitemap entries.
- Dynamic campaign, promotion, profile, review, and collection routes require a product decision about indexability before inclusion.

## Sources

- Google Search Central sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Next.js sitemap convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js `generateSitemaps`: https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
- Next.js 16 migration guide: https://nextjs.org/docs/app/guides/upgrading/version-16
