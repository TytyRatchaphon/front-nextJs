import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
let didWarnPublicFallback = false;

const warnPublicFallbackIfNeeded = () => {
  if (process.env.NODE_ENV !== "production" || didWarnPublicFallback) {
    return;
  }

  if (!process.env.API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL) {
    console.warn("[read-episode-proxy] Using NEXT_PUBLIC_API_BASE_URL fallback. Prefer server-only API_BASE_URL.");
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

export async function GET(request: NextRequest, context: RouteContext) {
  warnPublicFallbackIfNeeded();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "Server is missing API base url configuration" },
      { status: 500 },
    );
  }

  const { episodeId } = await resolveParams(context.params);
  const safeEpisodeId = encodeURIComponent(episodeId);
  const endpoint = `${BACKEND_URL.replace(/\/+$/, "")}/readep/${safeEpisodeId}`;

  const incomingAuthorization = normalizeToken(request.headers.get("authorization"));
  const cookieAuthorization = normalizeToken(request.cookies.get("token")?.value);
  const authorization = incomingAuthorization || cookieAuthorization;

  const headers = new Headers();
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const payload = await upstreamResponse.json();

    return NextResponse.json(payload, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch episode content" },
      { status: 502 },
    );
  }
}
