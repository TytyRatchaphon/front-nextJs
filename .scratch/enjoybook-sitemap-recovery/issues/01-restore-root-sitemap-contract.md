# 01 — Restore the root sitemap contract

**What to build:** Restore a usable end-to-end discovery path from `robots.txt` to a root sitemap containing canonical static pages, all public categories, and all published articles. The sitemap must remain useful when a dynamic content source is unavailable.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `robots.txt` advertises the root `/sitemap.xml` URL and that URL returns HTTP 200 with sitemap XML.
- [x] The sitemap contains the homepage, the approved indexable static allowlist, all public categories, and every published article across all pagination pages.
- [x] The intentionally noindexed search page is absent.
- [x] All emitted locations are unique, absolute HTTPS URLs on the configured EnjoyBook origin.
- [x] `priority` and `changeFrequency` are not emitted.
- [x] Modification time is emitted only when a valid source update timestamp exists; request-time timestamps are not fabricated.
- [x] If articles or categories fail to load, the endpoint still returns valid XML containing the static routes and records an actionable diagnostic.
- [x] An HTTP-level test starts at `robots.txt`, follows the advertised sitemap, parses it, and proves the contract with deterministic multi-page article fixtures.
- [x] The complete candidate count is guarded below 50,000 URLs.

**Verification:** `src/app/sitemapInventory.test.ts`, `src/services/api/articleApi.test.ts`, and `e2e/sitemap.spec.ts` pass. Scoped ESLint passes. The full Vitest run has seven unrelated failures in the pre-existing dirty worktree.
