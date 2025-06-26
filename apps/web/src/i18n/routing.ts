import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Used when no locale matches
  defaultLocale: "en",

  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },

  localePrefix: "as-needed",
  // A list of all locales that are supported
  locales: ["en", "fr"],
});
