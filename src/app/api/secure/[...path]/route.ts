import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || process.env.NEXT_PUBLIC_ACCESS_TOKEN || "";
let didWarnPublicFallback = false;

const warnPublicFallbackIfNeeded = () => {
  if (process.env.NODE_ENV !== "production" || didWarnPublicFallback) {
    return;
  }

  if (!process.env.API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL) {
    console.warn("[secure-proxy] Using NEXT_PUBLIC_API_BASE_URL fallback. Prefer server-only API_BASE_URL.");
  }
  if (!process.env.ACCESS_TOKEN && process.env.NEXT_PUBLIC_ACCESS_TOKEN) {
    console.warn("[secure-proxy] Using NEXT_PUBLIC_ACCESS_TOKEN fallback. Prefer server-only ACCESS_TOKEN.");
  }
  didWarnPublicFallback = true;
};

const ALLOWED_PATHS: RegExp[] = [
  /^category$/i,
  /^user\/mybook-permissions$/i,
  /^user\/mybook$/i,
  /^user\/mybook\/[^/]+$/i,
  /^user\/mybook\/ep$/i,
  /^user\/mybook\/ep\/update$/i,
  /^user\/mybook\/ep\/[^/]+$/i,
  /^user\/image_text_editor$/i,
];

const normalizeToken = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const withoutBearer = trimmed.replace(/^Bearer\s+/i, "");
  const withoutQuotes = withoutBearer.replace(/^['"]+|['"]+$/g, "");
  return withoutQuotes || null;
};

const buildTargetPath = (segments: string[] | undefined): string => {
  if (!Array.isArray(segments)) return "";
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
};

const isAllowedPath = (path: string): boolean => {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
};

const proxyRequest = async (request: NextRequest, paramsPath: string[] | undefined) => {
  warnPublicFallbackIfNeeded();

  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "Server is missing API base url configuration" },
      { status: 500 },
    );
  }

  if (!ACCESS_TOKEN) {
    return NextResponse.json(
      { message: "Server is missing access token configuration" },
      { status: 500 },
    );
  }

  const targetPath = buildTargetPath(paramsPath);
  if (!targetPath || !isAllowedPath(targetPath)) {
    return NextResponse.json({ message: "Path is not allowed" }, { status: 403 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(
    `${BACKEND_URL.replace(/\/+$/, "")}/${targetPath}${incomingUrl.search}`,
  );

  const headers = new Headers();
  headers.set("X-API-Key", Buffer.from(ACCESS_TOKEN).toString("base64"));

  const incomingAuthorization = normalizeToken(request.headers.get("authorization"));
  const cookieAuthorization = normalizeToken(request.cookies.get("token")?.value);
  const authorization = incomingAuthorization || cookieAuthorization;
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      init.body = await request.formData();
    } else {
      const rawBody = await request.text();
      if (rawBody) {
        init.body = rawBody;
      }
      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    }
  }

  try {
    const upstreamResponse = await fetch(targetUrl, init);
    const responseType = upstreamResponse.headers.get("content-type") || "application/json";
    const responseText = await upstreamResponse.text();

    return new NextResponse(responseText, {
      status: upstreamResponse.status,
      headers: {
        "content-type": responseType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Secure proxy request failed" },
      { status: 502 },
    );
  }
};

type RouteContext = {
  params:
    | {
        path?: string[];
      }
    | Promise<{
        path?: string[];
      }>;
};

const resolveParams = async <T>(value: T | Promise<T>): Promise<T> => Promise.resolve(value);

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await resolveParams(context.params);
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await resolveParams(context.params);
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await resolveParams(context.params);
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await resolveParams(context.params);
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await resolveParams(context.params);
  return proxyRequest(request, path);
}
