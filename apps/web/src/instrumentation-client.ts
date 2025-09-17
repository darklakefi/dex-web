// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
    ...(typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    process.env.SENTRY_PROJECT_ID
      ? [
          posthog.sentryIntegration({
            organization: process.env.SENTRY_ORG || "darklake",
            projectId: parseInt(process.env.SENTRY_PROJECT_ID),
            severityAllowList: ["error", "info"],
          }),
        ]
      : []),
  ],
  replaysOnErrorSampleRate: 1.0,

  replaysSessionSampleRate: 0.1,

  tracesSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
