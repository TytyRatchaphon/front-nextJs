# 02 — Add the complete published-book and writer inventory

**What to build:** Extend the working root sitemap with every published book and one profile for each distinct writer, using the dedicated paginated catalog contract rather than homepage recommendation data.

**Blocked by:** 01 — Restore the root sitemap contract.

**Status:** done

- [x] The sitemap consumes a strict paginated published-book inventory and continues until pagination reports completion.
- [x] Homepage recommendation groups are not used as the source of catalog completeness.
- [x] Every valid published book appears exactly once using its stable numeric identifier.
- [x] Unpublished, malformed, or non-indexable book records are excluded.
- [x] Every writer represented by the included books appears exactly once using a stable writer identifier.
- [x] A valid book content-update timestamp is preserved; missing or invalid timestamps are omitted.
- [x] A failed book inventory request cannot turn a previously healthy cached inventory into a silently accepted empty inventory.
- [x] The HTTP-level sitemap test proves multi-page book pagination, book inclusion, writer deduplication, and graceful degradation.
- [x] The final combined sitemap remains below 50,000 unique URLs.

**Verification:** `src/services/api/sitemapBookApi.test.ts` passes the strict service contract. `e2e/sitemap.spec.ts` passes multi-page coverage, filtering, deduplication, timestamp, cold-failure, and later-page failure scenarios.
