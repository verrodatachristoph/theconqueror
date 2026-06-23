import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken, safeEqual } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  if (token && secret) {
    const expected = await sessionToken(secret);
    if (safeEqual(token, expected)) return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Protect everything except the login page, the public share route (/s/...),
// Next internals and static assets.
export const config = {
  matcher: [
    "/((?!login|s/|opengraph-image|twitter-image|manifest.webmanifest|apple-icon|_next/static|_next/image|favicon.ico|favicon-light.svg|favicon-dark.svg|robots.txt).*)",
  ],
};
