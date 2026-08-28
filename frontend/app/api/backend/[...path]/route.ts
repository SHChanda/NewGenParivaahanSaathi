import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie", "idempotency-key", "x-request-id"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition", "set-cookie", "retry-after", "x-request-id", "etag"];

function apiError(status: number, code: string, message: string, requestId?: string) {
  return Response.json({ error: { code, message, ...(requestId ? { requestId } : {}) } }, { status });
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const baseUrl = process.env.SARATHI_API_BASE_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) {
    return apiError(503, "API_NOT_CONFIGURED", "The Sarathi API server has not been configured for this deployment.", requestId);
  }

  if (MUTATING_METHODS.has(request.method) && !isSameOrigin(request)) {
    return apiError(403, "ORIGIN_NOT_ALLOWED", "This request must originate from the Sarathi Next website.", requestId);
  }

  const { path } = await context.params;
  const safePath = (path || []).map(segment => encodeURIComponent(decodeURIComponent(segment))).join("/");
  const upstreamUrl = `${baseUrl}/${safePath}${request.nextUrl.search}`;
  const headers = new Headers();
  FORWARDED_REQUEST_HEADERS.forEach(name => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  headers.set("x-request-id", requestId);
  if (process.env.SARATHI_API_KEY) headers.set("authorization", `Bearer ${process.env.SARATHI_API_KEY}`);

  const timeout = Number(process.env.SARATHI_API_TIMEOUT_MS || 12000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeout) ? timeout : 12000);

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    const responseHeaders = new Headers();
    FORWARDED_RESPONSE_HEADERS.forEach(name => {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    });
    responseHeaders.set("cache-control", "no-store");
    responseHeaders.set("x-request-id", response.headers.get("x-request-id") || requestId);
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return apiError(timedOut ? 504 : 502, timedOut ? "API_TIMEOUT" : "API_UNAVAILABLE", timedOut ? "The API server took too long to respond." : "The API server could not be reached.", requestId);
  } finally {
    clearTimeout(timer);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

