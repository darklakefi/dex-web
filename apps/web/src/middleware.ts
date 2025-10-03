import { geolocation } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// List of blocked countries (ISO 3166-1 alpha-2 country codes)
const BLOCKED_COUNTRIES = [
  "CU", // Cuba
  "IR", // Iran
  "IQ", // Iraq
  "KP", // North Korea (Democratic People's Republic of Korea)
  "SY", // Syria
  "RU", // Russia
  "BY", // Belarus
  "VE", // Venezuela
  "MM", // Myanmar
  "SD", // Sudan
  "SS", // South Sudan
  "UA", // Ukraine
  "CF", // Central African Republic
  "CD", // Democratic Republic of Congo
  "LY", // Libya
  "SO", // Somalia
  "YE", // Yemen
  "ZW", // Zimbabwe
];

const intlMiddleware = createMiddleware(routing);

const countryCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export default function middleware(request: NextRequest) {
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
  // Match all pathnames except for
  // - … if they start with `/api`, `/orpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|rpc|orpc|_next|_vercel|.*\\..*).*)",
};
