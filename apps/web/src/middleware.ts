import { geolocation } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const BLOCKED_COUNTRIES = [
  "CU",
  "IR",
  "IQ",
  "KP",
  "SY",
  "RU",
  "BY",
  "VE",
  "MM",
  "SD",
  "SS",
  "UA",
  "CF",
  "CD",
  "LY",
  "SO",
  "YE",
  "ZW",
];

const intlMiddleware = createMiddleware(routing);

const countryCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/rpc") ||
    pathname.startsWith("/orpc") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "";

  let country: string | undefined;
  const cached = countryCache.get(ip);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    country = cached.country;
  } else {
    try {
      const geoResult = geolocation(request);
      country = geoResult.country;
      if (country && ip) {
        countryCache.set(ip, { country, timestamp: Date.now() });
      }
    } catch {
      country = undefined;
    }
  }

  if (country && BLOCKED_COUNTRIES.includes(country)) {
    return new NextResponse(
      "Access denied. This service is not available in your region.",
      {
        headers: {
          "Content-Type": "text/plain",
        },
        status: 403,
      },
    );
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|rpc|orpc|_next|_vercel|.*\\..*).*)",
};
