import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getBackendUrl, parseBackendError } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const validationResponse = await fetch(`${getBackendUrl()}/auth/validate-token`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!validationResponse.ok) {
    const detail = await parseBackendError(validationResponse);
    const response = NextResponse.json({ detail }, { status: validationResponse.status });
    if (validationResponse.status === 401 || validationResponse.status === 403) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
    return response;
  }

  const wsBase =
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.BACKEND_WS_URL ||
    getBackendUrl().replace(/^http/, "ws");

  return NextResponse.json({ token, wsUrl: `${wsBase}/ws?token=${token}` }, { status: 200 });
}
