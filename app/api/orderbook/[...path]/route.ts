import { type NextRequest } from "next/server";

import { DEFAULT_ORDERBOOK_BASE_URL } from "../../../orderbook/client";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ path?: string[] }>>;
}>;

const proxyMethods = ["GET", "POST", "HEAD", "DELETE"] as const;
const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyOrderbookRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyOrderbookRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyOrderbookRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyOrderbookRequest(request, context);
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

async function proxyOrderbookRequest(request: NextRequest, context: RouteContext) {
  if (!isProxyMethod(request.method)) {
    return new Response("Method not allowed.", { status: 405 });
  }

  const upstreamUrl = await buildUpstreamUrl(request, context);
  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers: getForwardHeaders(request),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });

  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: getResponseHeaders(response),
  });
}

async function buildUpstreamUrl(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const path = params.path ?? [];
  const upstreamUrl = new URL(path.map(encodeURIComponent).join("/"), `${DEFAULT_ORDERBOOK_BASE_URL}/`);
  upstreamUrl.search = request.nextUrl.search;
  return upstreamUrl;
}

function getForwardHeaders(request: NextRequest) {
  const headers = new Headers();

  for (const [key, value] of request.headers) {
    const normalizedKey = key.toLowerCase();
    if (hopByHopHeaders.has(normalizedKey) || normalizedKey === "host" || normalizedKey === "origin") {
      continue;
    }
    headers.set(key, value);
  }

  return headers;
}

function getResponseHeaders(response: Response) {
  const headers = new Headers();

  for (const [key, value] of response.headers) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return headers;
}

function isProxyMethod(method: string): method is (typeof proxyMethods)[number] {
  return proxyMethods.some((proxyMethod) => proxyMethod === method);
}
