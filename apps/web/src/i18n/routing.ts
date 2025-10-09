import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "en",

  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },

  localePrefix: "as-needed",
  locales: ["en", "fr"],
});
