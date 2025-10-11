import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "en",

  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },

  // Always prefix paths with the locale (e.g., /en/...), so we don't
  // rely on middleware to rewrite default-locale routes.
  localePrefix: "always",
  locales: ["en", "fr"],
});
