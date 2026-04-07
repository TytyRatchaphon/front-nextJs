# Security Best Practices Report

## Executive summary
From this repository review (Next.js + React + TypeScript), the highest-risk issues are around HTML rendering paths that do not sanitize untrusted content, and secret-like values exposed to client code via `NEXT_PUBLIC_*`. These can lead to stored XSS and credential/API-key leakage if the backend currently trusts those values.

## Critical

### SEC-001: Untrusted HTML is rendered without robust sanitization (stored XSS risk)
- Severity: Critical
- Impact: An attacker who can control review/thread/book/article HTML content can run JavaScript in other users' browsers (account takeover/token theft/session abuse).
- Evidence:
  - `parse((review.content || '').replace(...))` in [src/components/modal/ReviewModal.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/modal/ReviewModal.tsx:336)
  - `dangerouslySetInnerHTML={{ __html: thread.detail }}` in [src/features/book/threadDetail.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/book/threadDetail.tsx:168)
  - `dangerouslySetInnerHTML={{ __html: bookDetail.des }}` in [src/components/bookdetail/BookAboutTab.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/bookdetail/BookAboutTab.tsx:78)
  - Other CMS/settings HTML render paths with direct `dangerouslySetInnerHTML`:
    - [src/features/about/AboutUsContent.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/about/AboutUsContent.tsx:38)
    - [src/features/payment/HowPaymentContent.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/payment/HowPaymentContent.tsx:38)
    - [src/features/policy/PrivacyPolicyContent.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/policy/PrivacyPolicyContent.tsx:38)
- Recommended fix:
  - Centralize a strict sanitizer (prefer `DOMPurify`) and enforce it for every HTML render path.
  - Replace `parse(...)` and raw `dangerouslySetInnerHTML` with a shared `SafeHtml` component.
  - Keep CSP as defense-in-depth, not as primary protection.
- False-positive note:
  - If backend already sanitizes these exact fields strongly, severity may reduce; confirm with backend contracts/tests.

## High

### SEC-002: Secret-like values are exposed in client bundle via `NEXT_PUBLIC_*`
- Severity: High
- Impact: If backend treats these as confidential credentials, anyone can extract and abuse them from browser-delivered JS.
- Evidence:
  - `NEXT_PUBLIC_ACCESS_TOKEN` used client-side and sent as `X-API-Key` in:
    - [src/components/editor/editor_api.ts](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/components/editor/editor_api.ts:16)
    - [src/features/mybook/Newbook.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/mybook/Newbook.tsx:111)
    - [src/features/mybook/EditBook.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/mybook/EditBook.tsx:139)
    - [src/features/mybook/NewEpisode.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/mybook/NewEpisode.tsx:41)
  - `NEXT_PUBLIC_SECRET_KEY` used for decryption in client context:
    - [src/utils/securityUtils.ts](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/utils/securityUtils.ts:6)
- Recommended fix:
  - Move any real secret to server-only env vars (no `NEXT_PUBLIC_` prefix).
  - Perform privileged calls/decryption on server/BFF and return only allowed data to client.
- False-positive note:
  - If these are intentionally public identifiers (not secrets), rename to avoid misleading security assumptions.

## Medium

### SEC-003: Auth token is stored in JS-readable cookie
- Severity: Medium
- Impact: Any XSS can exfiltrate token immediately (cookie is readable from JS, not `HttpOnly`).
- Evidence:
  - `Cookies.set('token', cleaned, ...)` in [src/stores/authStore.ts](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/stores/authStore.ts:100)
  - repeated in [src/stores/authStore.ts](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/stores/authStore.ts:129)
- Recommended fix:
  - Prefer server-managed session with `HttpOnly` cookie.
  - If bearer token must remain client-side, reduce lifetime and harden XSS controls aggressively.

### SEC-004: Production proxy logs full URL query + IP + user-agent
- Severity: Medium
- Impact: Sensitive query values (e.g., token-like params such as `tk`) can leak into logs and observability systems.
- Evidence:
  - `console.log(... ${pathname}${search} - IP: ${ip} - UA: ${userAgent})` in [src/proxy.ts](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/proxy.ts:20)
- Recommended fix:
  - Redact query strings or allowlist safe params only.
  - Avoid logging full IP/UA unless required by policy.

### SEC-005: External link is used without URL validation and without `rel` on `_blank`
- Severity: Medium
- Impact: Backend-controlled link field can be abused for phishing/open redirect and reverse-tabnabbing behavior.
- Evidence:
  - `href = data` in [src/features/article/ArticleDetail.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/article/ArticleDetail.tsx:210)
  - `<Link ... target={type === 'link' ? '_blank' : undefined}>` in [src/features/article/ArticleDetail.tsx](/C:/Users/MyPc/Documents/GitHub/front-nextJs/src/features/article/ArticleDetail.tsx:214)
- Recommended fix:
  - Validate URL with shared safe-url utility before rendering.
  - For `_blank`, add `rel="noopener noreferrer"`.

## Low

### SEC-006: App-level security headers are not visible in repository config
- Severity: Low
- Impact: Reduced defense-in-depth against XSS/clickjacking/content sniffing if not configured at edge.
- Evidence:
  - No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` config found in app code.
  - [next.config.ts](/C:/Users/MyPc/Documents/GitHub/front-nextJs/next.config.ts:1) currently has no `headers()` policy block.
- Recommended fix:
  - Configure headers either in Next.js `headers()` or CDN/edge layer and verify at runtime.
- False-positive note:
  - If these are already set by reverse proxy/CDN, keep app code docs aligned with infra config.

## Suggested priority order for fixes
1. SEC-001 (XSS render paths)
2. SEC-002 (public secret-like env usage)
3. SEC-003 (token storage model)
4. SEC-004/SEC-005 (logging and link hardening)
5. SEC-006 (headers hardening)
