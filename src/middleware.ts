import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login 자체는 허용
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const expected = process.env.ADMIN_PASSWORD;
  const got = req.cookies.get(COOKIE)?.value;
  if (expected && got === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
