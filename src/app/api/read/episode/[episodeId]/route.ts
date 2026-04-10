import { NextRequest, NextResponse } from "next/server";
import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_URL = process.env.API_URL || process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
let didWarnPublicFallback = false;

const buildNoStoreHeaders = () => {
  const headers = new Headers();
  headers.set("Cache-Control", "private, no-store, no-cache, max-age=0, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("X-Accel-Expires", "0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Surrogate-Control", "no-store");
  // Auth-sensitive response: prevent proxy/CDN serving mixed user state.
  headers.set("Vary", "Authorization, Cookie, Accept-Encoding");
  return headers;
};

const warnPublicFallbackIfNeeded = () => {
  if (process.env.NODE_ENV !== "production" || didWarnPublicFallback) {
    return;
  }

  if (!process.env.API_URL && !process.env.API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL) {
    console.warn("[read-episode-proxy] Using NEXT_PUBLIC_API_BASE_URL fallback. Prefer server-only API_URL/API_BASE_URL.");
  }
  didWarnPublicFallback = true;
};

const normalizeToken = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const withoutBearer = trimmed.replace(/^Bearer\s+/i, "");
  const withoutQuotes = withoutBearer.replace(/^['"]+|['"]+$/g, "");
  return withoutQuotes || null;
};

const getReadEpisodeSecretKey = () => {
  return process.env.SECRET_KEY || process.env.NEXT_PUBLIC_SECRET_KEY || "";
};

const resolveEpisodePayload = (payload: unknown): unknown => {
  if (payload && typeof payload === "object") {
    return payload;
  }

  if (typeof payload !== "string") {
    return payload;
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    return payload;
  }

  // If backend already returns a JSON string, parse directly.
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return payload;
    }
  }

  const secretKey = getReadEpisodeSecretKey();
  if (!secretKey) {
    return payload;
  }

  try {
    const bytes = AES.decrypt(trimmed, secretKey);
    const decrypted = bytes.toString(encUtf8);
    if (!decrypted) {
      return payload;
    }

    const parsed = JSON.parse(decrypted);
    return parsed && typeof parsed === "object" ? parsed : payload;
  } catch {
    return payload;
  }
};

type RouteContext = {
  params:
    | {
        episodeId: string;
      }
    | Promise<{
        episodeId: string;
      }>;
};

const resolveParams = async <T>(value: T | Promise<T>): Promise<T> => Promise.resolve(value);

const buildUpstreamAuthHeaders = (token: string | null) => {
  const headers = new Headers();
  if (!token) return headers;

  // Use Bearer in Authorization for gateways/proxies that only parse RFC auth format.
  headers.set("Authorization", `Bearer ${token}`);
  // Keep raw token in legacy headers for services that still read non-bearer token fields.
  headers.set("x-auth-token", token);
  headers.set("x-access-token", token);

  return headers;
};

export async function GET(request: NextRequest, context: RouteContext) {
  warnPublicFallbackIfNeeded();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "Server is missing API base url configuration" },
      { status: 500, headers: buildNoStoreHeaders() },
    );
  }

  const { episodeId } = await resolveParams(context.params);
  const safeEpisodeId = encodeURIComponent(episodeId);
  const endpoint = `${BACKEND_URL.replace(/\/+$/, "")}/readep/${safeEpisodeId}`;

  const incomingAuthorization = normalizeToken(request.headers.get("authorization"));
  const cookieAuthorization = normalizeToken(request.cookies.get("token")?.value);
  const legacyCookieAuthorization = normalizeToken(request.cookies.get("tk")?.value);
  const authorization = incomingAuthorization || cookieAuthorization || legacyCookieAuthorization;
  const headers = buildUpstreamAuthHeaders(authorization);

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const payload = await upstreamResponse.json();
    const resolvedData = resolveEpisodePayload(payload?.data);
    const normalizedPayload =
      payload && typeof payload === "object"
        ? { ...payload, data: resolvedData }
        : payload;

    return NextResponse.json(normalizedPayload, {
      status: upstreamResponse.status,
      headers: buildNoStoreHeaders(),
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch episode content" },
      { status: 502, headers: buildNoStoreHeaders() },
    );
  }
}
