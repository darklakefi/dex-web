"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PosthogProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const initPostHog = () => {
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
          autocapture: true,
          capture_pageleave: true,
          capture_pageview: true,
          disable_session_recording: false,
          loaded: (posthog) => {
            if (process.env.NODE_ENV === "development") {
              posthog.debug();
            }
          },
          session_recording: {
            maskAllInputs: true,
          },
        });
      }
    };

    if (document.readyState === 'complete') {
      initPostHog();
    } else {
      window.addEventListener('load', initPostHog);
      return () => window.removeEventListener('load', initPostHog);
    }
  }, []);

  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
