# 03 — Harden sitemap audit and release verification

**What to build:** Turn the existing sitemap audit into a reliable release guard that verifies the same public HTTP contract locally or against a deployed base URL and reports actionable coverage failures without homepage false positives.

**Blocked by:** 02 — Add the complete published-book and writer inventory.

**Status:** done

- [x] The audit recognizes the existing homepage route and no longer reports `/` as missing.
- [x] The audit reads the sitemap location from `robots.txt` rather than assuming an endpoint.
- [x] The audit fails when the advertised sitemap is non-200, malformed XML, empty, duplicated, over 50,000 URLs, or contains a non-HTTPS/cross-origin location.
- [x] The audit flags sitemap entries that are redirected, noindexed, non-canonical, or non-200 when sampled or fully checked.
- [x] The audit can run against a configurable local, test, or production base URL without source changes.
- [x] Output distinguishes complete coverage, degraded dynamic-source coverage, and hard protocol failure.
- [x] Deterministic tests cover the homepage regression and the critical production symptoms from the validation report.
- [x] The repository exposes one documented command suitable for pre-release or post-deploy verification.

**Verification:** `node --test scripts/audit-sitemap-metadata.test.mjs` passes the public HTTP contract scenarios. Scoped ESLint passes. The full Vitest run has seven unrelated failures in the pre-existing dirty worktree; typechecking remains blocked by the pre-existing missing `node_modules/@types/crypto-js/index.d.ts`.
