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

export default function middleware(request: NextRequest) {
  // Get user's country from geolocation
  const { country } = geolocation(request);

  // Check if the country is blocked
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

  // Continue with next-intl middleware if not blocked
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/orpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|rpc|orpc|_next|_vercel|.*\\..*).*)",
};
