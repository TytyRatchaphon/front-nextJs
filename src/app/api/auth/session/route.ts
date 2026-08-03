import { NextRequest, NextResponse } from "next/server";
import { decodeJwtClaims, validateJwtToken } from "@/utils/jwtParser";

const TOKEN_COOKIE_NAME = "token";
const LEGACY_TOKEN_COOKIE_NAME = "tk";
const DEFAULT_TOKEN_COOKIE_DAYS = 365;

const noStoreHeaders = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Surrogate-Control": "no-store",
};

const getConfiguredTokenCookieMaxAge = () => {
  const raw = Number(process.env.TOKEN_COOKIE_DAYS || process.env.NEXT_PUBLIC_TOKEN_COOKIE_DAYS);
  const days = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TOKEN_COOKIE_DAYS;
  return Math.floor(days * 24 * 60 * 60);
};

const getTokenCookieMaxAge = (token: string) => {
  const expiresAt = decodeJwtClaims(token)?.exp;
  const remainingLifetime = typeof expiresAt === 'number'
    ? Math.max(0, expiresAt - Math.floor(Date.now() / 1_000))
    : 0;
  return Math.min(getConfiguredTokenCookieMaxAge(), remainingLifetime);
};

const getTokenCookieDomain = () => {
  return (process.env.TOKEN_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_TOKEN_COOKIE_DOMAIN || "").trim() || undefined;
};

const shouldUseSecureCookie = (request: NextRequest) => {
  return process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:";
};

const applyExpiredCookie = (response: NextResponse, name: string, domain?: string) => {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
};

const clearAuthCookies = (response: NextResponse) => {
  const domain = getTokenCookieDomain();

  applyExpiredCookie(response, TOKEN_COOKIE_NAME);
  applyExpiredCookie(response, LEGACY_TOKEN_COOKIE_NAME);

  if (domain) {
    applyExpiredCookie(response, TOKEN_COOKIE_NAME, domain);
    applyExpiredCookie(response, LEGACY_TOKEN_COOKIE_NAME, domain);
  }
};

export async function GET(request: NextRequest) {
  const token = validateJwtToken(request.cookies.get(TOKEN_COOKIE_NAME)?.value);

  const response = NextResponse.json(
    {
      authenticated: Boolean(token),
      token: token || null,
    },
    { headers: noStoreHeaders },
  );
  if (!token) clearAuthCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = validateJwtToken(body?.token);

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const response = NextResponse.json(
    { success: true },
    { headers: noStoreHeaders },
  );
  clearAuthCookies(response);

  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: getTokenCookieMaxAge(token),
    ...(getTokenCookieDomain() ? { domain: getTokenCookieDomain() } : {}),
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { success: true },
    { headers: noStoreHeaders },
  );
  clearAuthCookies(response);
  return response;
}
