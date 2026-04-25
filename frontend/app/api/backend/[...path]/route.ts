import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getBackendUrl } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

function buildTargetUrl(pathParts: string[], request: NextRequest) {
  const path = pathParts.join("/");
  const search = request.nextUrl.search;
  return `${getBackendUrl()}/${path}${search}`;
}

async function forwardRequest(request: NextRequest, pathParts: string[]) {
  const url = buildTargetUrl(pathParts, request);
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");

  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  const backendResponse = await fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  const payload = await backendResponse.arrayBuffer();
  return new NextResponse(payload, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}
