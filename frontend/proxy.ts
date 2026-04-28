import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/orders",
  "/messages",
  "/notifications",
  "/ratings",
  "/profile",
];

const authPages = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPages.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/orders/:path*", "/messages/:path*", "/notifications/:path*", "/ratings/:path*", "/profile/:path*", "/login", "/register"],
};
