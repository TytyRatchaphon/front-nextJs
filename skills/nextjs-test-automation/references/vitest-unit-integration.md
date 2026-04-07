# Vitest Unit And Integration

## When To Read

Read this file when the target behavior lives in utilities, stores, request helpers, schema logic, server-only modules, or non-browser integrations that do not need a full browser session.

## Test Selection

- Prefer plain unit tests for pure functions, mappers, formatters, and validators.
- Prefer integration-style Vitest tests for stores, request wrappers, and modules with a few controlled dependencies.
- Avoid rendered component tests unless the repo already has a DOM test harness or the user explicitly asks for one.

## Setup Rules

- Preserve the repo's current `vitest.config.*` before changing environments or globals.
- If the config uses `environment: 'node'`, keep tests focused on non-DOM behavior.
- Add `jsdom` and a shared setup file only when the repository truly needs component rendering tests.
- Keep test files near the source they protect unless the repo already centralizes tests elsewhere.

## Mocking Patterns

Mock framework boundaries instead of the code under test.

For App Router hooks:

```ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/books',
  useSearchParams: () => new URLSearchParams('page=1'),
}))
```

For environment variables:

```ts
const original = process.env.NEXT_PUBLIC_API_URL

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'https://example.test'
})

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = original
})
```

For async helpers:

```ts
import { describe, expect, it, vi } from 'vitest'

describe('fetchBooks', () => {
  it('maps the API payload into UI data', async () => {
    const api = vi.fn().mockResolvedValue([{ id: 1, title: 'Demo' }])

    const result = await fetchBooks({ api })

    expect(api).toHaveBeenCalledOnce()
    expect(result).toEqual([{ id: 1, title: 'Demo' }])
  })
})
```

## Next.js Notes

- Test transformation and state logic more aggressively than thin view wrappers.
- Pull complex logic out of pages and components when that makes tests simpler and less brittle.
- Reset singleton or store state between tests.
- Mock network clients and third-party SDKs at the boundary where your code calls them.
- Do not assert framework internals when a public return value or state change is enough.
