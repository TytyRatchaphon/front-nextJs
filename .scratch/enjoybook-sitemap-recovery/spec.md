# EnjoyBook Sitemap Recovery Specification

**Status:** ready-for-agent

## Problem Statement

EnjoyBook currently tells search crawlers to load a sitemap URL that returns HTTP 404. The alternate generated sitemap endpoint returns valid XML but contains no URLs. As a result, crawlers cannot use the sitemap to discover or refresh canonical public pages, published books, articles, categories, or writer profiles.

The failure has two independent causes. First, the implementation uses the pre-Next.js-16 synchronous sitemap identifier contract, while the current framework supplies an asynchronous identifier. Second, the book collector uses a homepage response as though it were a complete flat book inventory, although that endpoint now returns grouped promotional homepage data.

The intended sitemap also contains a noindexed search page, gives most records a fabricated current modification time, and stops article discovery after the first 100 records. The existing audit command does not exercise the public HTTP contract and incorrectly reports the homepage as missing.

## Solution

EnjoyBook will publish one standards-compliant sitemap at `/sitemap.xml` and advertise that exact URL from `robots.txt`. A single sitemap is appropriate because the current published-book inventory is 1,732 records and the complete expected URL set is safely below the 50,000-URL protocol limit.

The sitemap will be assembled from independently recoverable inventory sources:

- a maintained allowlist of canonical, indexable static pages;
- every published article, read through all pagination pages;
- all public categories;
- every published book, read through a dedicated paginated inventory contract;
- one writer profile per distinct writer represented by the published-book inventory.

The generator will normalize and deduplicate absolute HTTPS URLs. It will include a modification time only when the source provides a valid timestamp representing a significant content update. It will omit `priority` and `changeFrequency`. Failure of a dynamic source will be observable but will not erase the valid static portion of the sitemap.

The primary verification seam will be the public HTTP contract: request `robots.txt`, follow its advertised sitemap URL, parse the XML, then assert the externally visible URL rules. This seam directly covers the production failure and avoids coupling tests to internal function structure.

## User Stories

1. As a search crawler, I want the sitemap URL advertised by `robots.txt` to return HTTP 200, so that I can discover the site's canonical pages.
2. As a search crawler, I want the advertised document to be valid sitemap XML, so that I can process it without errors.
3. As a search crawler, I want the sitemap to contain at least one URL, so that a successful but empty response is not mistaken for a healthy sitemap.
4. As a search crawler, I want all sitemap locations to be absolute HTTPS URLs on the EnjoyBook domain, so that I crawl the intended production resources.
5. As a search crawler, I want only canonical and indexable pages in the sitemap, so that the sitemap does not conflict with page-level indexing directives.
6. As a search crawler, I want the EnjoyBook homepage and important public informational pages included, so that foundational site pages remain discoverable even when a content API is degraded.
7. As a search crawler, I want every published article included, so that articles after the first API page remain discoverable.
8. As a search crawler, I want every public category included, so that category discovery does not depend only on internal navigation.
9. As a search crawler, I want every published book included exactly once, so that the complete catalog can be discovered without duplicate crawl hints.
10. As a search crawler, I want each relevant writer profile included exactly once, so that writer entities remain discoverable without duplication across book pages.
11. As a search crawler, I want modification timestamps to reflect real significant updates, so that recrawl hints are trustworthy.
12. As an SEO operator, I want upstream inventory failures to be visible, so that partial sitemap coverage is not silently accepted as complete.
13. As an SEO operator, I want one stable root sitemap URL, so that `robots.txt` and Search Console do not need to track generated chunk identifiers.
14. As an SEO operator, I want the sitemap generator to enforce the 50,000-URL limit, so that future catalog growth cannot silently produce an invalid sitemap.
15. As a developer, I want the sitemap to consume a documented paginated published-book contract, so that homepage presentation changes cannot break catalog discovery.
16. As a developer, I want source failures isolated from one another, so that an article or category outage does not remove static pages from the sitemap.
17. As a developer, I want sitemap URLs normalized and deduplicated centrally, so that repeated writers or overlapping source records do not produce duplicate entries.
18. As a developer, I want an automated HTTP-level regression test, so that framework routing changes cannot reintroduce a 404 or empty sitemap unnoticed.
19. As a developer, I want the local audit command to recognize the homepage correctly, so that audit output identifies real defects rather than parser false positives.
20. As a release owner, I want a deterministic verification command for a deployed base URL, so that a deployment can be checked before search engines are asked to recrawl it.

## Implementation Decisions

- Publish a single sitemap at the root `/sitemap.xml`; do not use generated sitemap identifiers while the complete canonical URL count remains below 50,000.
- Keep `robots.txt` as the discovery source and require it to advertise the exact root sitemap URL.
- Treat 50,000 URLs as a hard invariant. A future change to a sitemap index is required before the candidate inventory reaches that threshold.
- Introduce a sitemap-specific published-book inventory contract backed by the existing strict paginated books endpoint. The contract must expose stable book ID, writer ID, publication/indexability status, and optional content update time.
- Do not derive the catalog from homepage recommendation groups. They are curated presentation data, not a complete inventory.
- Fetch every inventory page until the pagination contract reports completion. Do not infer completeness from the size of the first response.
- Fetch every article page until the pagination contract reports completion.
- Derive writer URLs from the complete published-book inventory and deduplicate by stable writer ID.
- Maintain static sitemap candidates as an explicit allowlist. Exclude the search page because it is intentionally noindexed.
- Include only published, public, canonical candidates. Invalid IDs, unsupported protocols, cross-domain URLs, and duplicates are rejected before serialization.
- Use an actual valid content-update timestamp for articles and books when supplied. Omit modification time for static pages, categories, writers, or records without a reliable timestamp.
- Remove `priority` and `changeFrequency` from generated records.
- Isolate source failures: static routes must still be emitted if dynamic inventory retrieval fails. Dynamic failure must produce an actionable server-side diagnostic rather than being silently converted into an apparently complete result.
- Keep sitemap generation server-only and cache successful inventory reads for one hour. A failed or empty dynamic response must not overwrite a previously healthy cached inventory as a successful result.
- Use URL normalization and deduplication as one internal sitemap assembly boundary shared by all inventory sources.
- Do not add episode/reader URLs. The sitemap covers discovery pages and entity landing pages, not paid or session-sensitive reading routes.

## Testing Decisions

- The primary test seam is an HTTP-level Playwright request test against a running Next.js application, following the pattern already used by the existing smoke suite.
- The test starts at `robots.txt`, extracts the advertised sitemap URL, requests that URL, verifies HTTP 200 and XML content type, parses the XML, and asserts a non-zero URL count.
- The HTTP test uses deterministic mocked backend responses containing multiple article and book pages. This proves pagination rather than only testing a single response.
- The HTTP test asserts that the homepage, representative static page, article, category, book, and deduplicated writer URLs are present.
- The HTTP test asserts that `/search`, redirects, noindexed candidates, duplicate URLs, and cross-domain or non-HTTPS URLs are absent.
- The HTTP test asserts that modification time is present only for records with a valid source timestamp and is not the request time.
- The HTTP test asserts graceful degradation: when a dynamic source fails, the sitemap still returns valid XML containing the static routes and emits an observable diagnostic.
- Add focused service-level tests only where needed to lock the paginated inventory contract and distinguish a complete response from malformed homepage-shaped data. These tests should verify public return values and request pagination, not internal helper functions.
- Extend the existing sitemap audit command rather than creating a second overlapping audit script. Its root-route handling must be covered by a regression fixture.
- Provide a base-URL-driven verification mode so the same HTTP contract can run against local development, test, or production without changing assertions.

## Out of Scope

- Creating or changing the backend books API; this specification consumes the existing paginated published-books contract.
- Adding episode, reader, cart, checkout, account, wallet, authentication, or other private/session-sensitive URLs.
- Deciding whether campaign detail, promotion block, profile collection, review, or other currently ambiguous dynamic routes should be indexable.
- Fixing page-level canonical metadata unrelated to the sitemap recovery.
- Creating image, video, or news sitemap extensions.
- Migrating to a sitemap index before the candidate URL count approaches 50,000.
- Submitting the repaired sitemap to Google Search Console or analyzing Search Console index coverage.
- Changing site navigation, page content, schema markup, or ranking strategy.

## Further Notes

- Production evidence captured on 2026-08-13 showed `/sitemap.xml` returning 404 and `/sitemap/0.xml` returning a valid empty URL set.
- The public books endpoint reported 1,732 published-book candidates during specification work, confirming that one sitemap is sufficient for the current catalog.
- The implementation should preserve valid static discovery during transient API outages, but an operator must still be able to distinguish a degraded sitemap from complete coverage.
- If the inventory approaches 45,000 candidate URLs, create follow-up work for a sitemap index before reaching the protocol limit.
- The originating evidence and detailed findings are recorded in `VALIDATION-REPORT.md`.
