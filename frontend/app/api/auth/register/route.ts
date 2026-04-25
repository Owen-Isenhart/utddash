import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getBackendUrl, parseBackendError } from "@/lib/backend";
import { NextResponse } from "next/server";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = await request.json();

  const registerResponse = await fetch(`${getBackendUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!registerResponse.ok) {
    const detail = await parseBackendError(registerResponse);
    return NextResponse.json({ detail }, { status: registerResponse.status });
  }

  const loginBody = new URLSearchParams();
  loginBody.set("username", body.email);
  loginBody.set("password", body.password);

  const loginResponse = await fetch(`${getBackendUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody,
    cache: "no-store",
  });

  if (!loginResponse.ok) {
    const detail = await parseBackendError(loginResponse);
    return NextResponse.json({ detail }, { status: loginResponse.status });
  }

  const tokenPayload = (await loginResponse.json()) as {
    access_token: string;
    token_type: string;
  };

  const meResponse = await fetch(`${getBackendUrl()}/auth/users/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    cache: "no-store",
  });

  if (!meResponse.ok) {
    const detail = await parseBackendError(meResponse);
    return NextResponse.json({ detail }, { status: meResponse.status });
  }

  const user = await meResponse.json();
  const response = NextResponse.json(user, { status: 201 });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: tokenPayload.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });

  return response;
}
