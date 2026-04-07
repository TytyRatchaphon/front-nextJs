---
name: nextjs-test-automation
description: Create, update, and repair automated tests in Next.js apps. Use when Codex needs to add Playwright end-to-end coverage, write or fix Vitest unit and integration tests, mock Next.js App Router APIs, add test setup or config files, debug flaky tests, or choose the right test layer for a Next.js repository.
---

# Next.js Test Automation

## Overview

Add automated tests to a Next.js codebase with the smallest tool change that covers the user's risk. Preserve the repo's existing test stack when possible, prefer browser E2E tests for route-level behavior, and use focused Vitest tests for pure logic, stores, API helpers, and server-safe modules.

## Quick Start

1. Inspect `package.json`, lockfiles, and existing test configs before choosing a framework.
2. Preserve the current stack if `playwright.config.*`, `cypress.config.*`, `vitest.config.*`, `jest.config.*`, or matching dependencies already exist.
3. Choose the lowest-cost test type that still proves the behavior:
   - Use Playwright for navigation, forms, auth, redirects, route changes, responsive checks, and multi-step user journeys.
   - Use Vitest for utilities, stores, mappers, request helpers, schemas, and server-only modules.
   - Add rendered component tests only when the repo already supports DOM testing or the user explicitly asks for it.
4. Keep tests close to the behavior they protect and run the smallest relevant test command first.
5. Report what changed, what command ran, and what coverage gaps remain.

## Workflow

### 1. Map the current test surface

Inspect:
- `package.json` scripts and dependencies
- lockfiles such as `bun.lock`, `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock`
- `playwright.config.*`, `cypress.config.*`, `vitest.config.*`, and `jest.config.*`
- existing `*.test.*`, `*.spec.*`, `e2e/`, `tests/`, and CI workflows

If the repo shows mixed package managers, follow the commands that are already used for install, build, and test instead of normalizing the whole repo.

### 2. Choose the test layer

- Read [references/playwright-e2e.md](references/playwright-e2e.md) when the repo already has Playwright or the user asks for browser or E2E automation.
- Read [references/vitest-unit-integration.md](references/vitest-unit-integration.md) when the target is logic, data transformation, stores, API clients, or non-browser behavior.
- Treat rendered component tests as a separate choice. If `vitest` is configured with `environment: 'node'`, do not write DOM assertions until the config or per-file environment is updated.

### 3. Implement the smallest reliable change

- Reuse existing setup files, fixtures, helpers, and test folders before adding new structure.
- Prefer accessible locators and stable labels. Add test IDs only when semantic selectors are not reliable.
- Mock network boundaries and third-party SDKs in unit tests. Do not mock the same browser behavior an E2E test is meant to prove.
- For App Router code, isolate framework hooks such as `next/navigation`, `cookies`, and `headers` behind small seams when practical.
- Add the smallest number of tests that proves the behavior, then expand only if the user asks for broader coverage.

### 4. Verify in layers

- Run the most targeted command first, such as a single Vitest file or a single Playwright spec.
- Run the broader suite only after the focused check passes.
- If a new dependency or browser binary is required, explain the install step and request approval when sandbox or network rules require it.
- If the environment cannot run browser tests, still prepare the config and specs, then clearly call out what remains unverified.

### 5. Close out clearly

- Summarize which behavior is covered by E2E versus unit or integration tests.
- List the commands that were added or run.
- Note any remaining gaps such as live API dependencies, missing fixtures, or uninstalled browser tooling.

## Guardrails

- Do not introduce a second test framework unless the coverage gap is real and the change is worth the maintenance cost.
- Do not lock tests to CSS classes, fragile timing, or implementation details when user-visible behavior is enough.
- Do not over-mock Next.js internals in browser tests.
- Do not change the repo's package manager or broad test architecture unless the user asks or the current setup is clearly broken.
- Do not hide uncertainty. Call out when a test is written but not executed.

## References

- Browser flows and Playwright setup: [references/playwright-e2e.md](references/playwright-e2e.md)
- Logic and integration coverage with Vitest: [references/vitest-unit-integration.md](references/vitest-unit-integration.md)
