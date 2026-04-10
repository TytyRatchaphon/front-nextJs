import { NextRequest, NextResponse } from "next/server";

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
  // Keep parity with episode route for auth-sensitive read assets.
  headers.set("Vary", "Authorization, Cookie, Accept-Encoding");
  return headers;
};

const warnPublicFallbackIfNeeded = () => {
  if (process.env.NODE_ENV !== "production" || didWarnPublicFallback) {
    return;
  }

  if (!process.env.API_URL && !process.env.API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL) {
    console.warn("[read-reader-assets-proxy] Using NEXT_PUBLIC_API_BASE_URL fallback. Prefer server-only API_URL/API_BASE_URL.");
  }
  didWarnPublicFallback = true;
};

type RouteContext = {
  params:
    | {
        assetPath: string[];
      }
    | Promise<{
        assetPath: string[];
      }>;
};

const resolveParams = async <T>(value: T | Promise<T>): Promise<T> => Promise.resolve(value);

export async function GET(_request: NextRequest, context: RouteContext) {
  warnPublicFallbackIfNeeded();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "Server is missing API base url configuration" },
      { status: 500, headers: buildNoStoreHeaders() },
    );
  }

  const { assetPath } = await resolveParams(context.params);
  const segments = Array.isArray(assetPath) ? assetPath.filter(Boolean) : [];
  if (segments.length === 0) {
    return NextResponse.json(
      { message: "Asset path is required" },
      { status: 400, headers: buildNoStoreHeaders() },
    );
  }

  const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
  const endpoint = `${BACKEND_URL.replace(/\/+$/, "")}/reader-assets/${encodedPath}`;

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
    });

    const headers = buildNoStoreHeaders();
    const passthroughHeaders = [
      "content-type",
      "accept-ranges",
      "content-length",
      "content-disposition",
    ];

    passthroughHeaders.forEach((header) => {
      const value = upstreamResponse.headers.get(header);
      if (value) headers.set(header, value);
    });

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch reader asset" },
      { status: 502, headers: buildNoStoreHeaders() },
    );
  }
}
