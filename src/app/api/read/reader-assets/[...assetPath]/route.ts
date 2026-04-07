import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
let didWarnPublicFallback = false;

const warnPublicFallbackIfNeeded = () => {
  if (process.env.NODE_ENV !== "production" || didWarnPublicFallback) {
    return;
  }

  if (!process.env.API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL) {
    console.warn("[read-reader-assets-proxy] Using NEXT_PUBLIC_API_BASE_URL fallback. Prefer server-only API_BASE_URL.");
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
      { status: 500 },
    );
  }

  const { assetPath } = await resolveParams(context.params);
  const segments = Array.isArray(assetPath) ? assetPath.filter(Boolean) : [];
  if (segments.length === 0) {
    return NextResponse.json({ message: "Asset path is required" }, { status: 400 });
  }

  const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
  const endpoint = `${BACKEND_URL.replace(/\/+$/, "")}/reader-assets/${encodedPath}`;

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
    });

    const headers = new Headers();
    const passthroughHeaders = [
      "content-type",
      "cache-control",
      "etag",
      "last-modified",
      "content-length",
      "accept-ranges",
      "content-encoding",
      "vary",
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
      { status: 502 },
    );
  }
}
