import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (
    (process.env.NEXT_RUNTIME === "nodejs" ||
      process.env.NEXT_RUNTIME === "edge") &&
    process.env.SENTRY_DSN
  ) {
    Sentry.init({
      debug: false,
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
