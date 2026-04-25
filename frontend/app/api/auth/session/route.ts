import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getBackendUrl, parseBackendError } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${getBackendUrl()}/auth/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await parseBackendError(response);
    const nextResponse = NextResponse.json({ detail }, { status: response.status });
    if (response.status === 401 || response.status === 403) {
      nextResponse.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
    return nextResponse;
  }

  const user = await response.json();
  return NextResponse.json(user, { status: 200 });
}
