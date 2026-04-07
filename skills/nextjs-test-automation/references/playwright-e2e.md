# Playwright E2E

## When To Read

Read this file when the repo already uses Playwright or the user asks for browser automation, end-to-end coverage, route-level checks, auth flows, or user journeys that cross multiple pages.

## Setup Checklist

1. Preserve the repo's package manager and script style.
2. Install `@playwright/test` only if it is missing.
3. Install browser binaries only when they are actually needed and approvals allow it.
4. Add `playwright.config.ts` only if the repo does not already have one.
5. Prefer `e2e/` or the repo's existing browser test folder instead of inventing a new layout.

Use config values close to this shape:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

Adjust the command for `bun`, `pnpm`, or `yarn` when the repo already uses one of them.

## Authoring Rules

- Prefer `getByRole`, `getByLabel`, `getByPlaceholder`, and visible text before test IDs.
- Keep each spec focused on one user outcome.
- Seed auth with API calls, cookies, or storage state when possible. Reserve full UI login for a small number of smoke tests.
- Prefer stable fixtures or mocked endpoints when live backend data is noisy.
- Assert meaningful page state after navigation, not internal Next.js mechanics.
- Use `expect.poll` or network-idle waits sparingly. Prefer direct UI assertions.

## Minimal Spec Shape

```ts
import { test, expect } from '@playwright/test'

test('reader can open a book detail page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /book/i }).first().click()

  await expect(page).toHaveURL(/book/)
  await expect(page.getByRole('heading')).toBeVisible()
})
```

## Next.js Notes

- Treat redirects, middleware behavior, and route guards as high-value E2E targets.
- Cover one happy path before adding edge cases.
- Prefer browser tests for forms, navigation, search filters, and responsive menus.
- Keep API contract validation out of Playwright unless the user specifically wants end-to-end API assertions.
