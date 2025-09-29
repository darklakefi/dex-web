"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

interface TrackEventOptions {
  [key: string]: unknown;
}

export function useAnalytics() {
  const posthog = usePostHog();

  const trackEvent = useCallback(
    (eventName: string, properties?: TrackEventOptions) => {
      if (posthog) {
        posthog.capture(eventName, properties);
      }
    },
    [posthog],
  );

  const trackSwap = useCallback(
    (properties: {
      fromToken: string;
      toToken: string;
      fromAmount: number;
      toAmount: number;
      transactionHash?: string;
      status: "initiated" | "signed" | "submitted" | "confirmed" | "failed";
    }) => {
      trackEvent("swap", properties);
    },
    [trackEvent],
  );

  const trackLiquidity = useCallback(
    (properties: {
      action: "add" | "remove";
      tokenA: string;
      tokenB: string;
      amountA: number;
      amountB: number;
      transactionHash?: string;
      status: "initiated" | "signed" | "submitted" | "confirmed" | "failed";
    }) => {
      trackEvent("liquidity", properties);
    },
    [trackEvent],
  );

  const trackWalletConnection = useCallback(
    (properties: { wallet: string; success: boolean; address?: string }) => {
      trackEvent("wallet_connected", properties);
    },
    [trackEvent],
  );

  const trackError = useCallback(
    (properties: { error: string; context: string; details?: unknown }) => {
      trackEvent("error", properties);
    },
    [trackEvent],
  );

  const trackPageView = useCallback(
    (properties?: { page?: string; referrer?: string }) => {
      trackEvent("$pageview", properties);
    },
    [trackEvent],
  );

  const identifyUser = useCallback(
    (userId: string, properties?: TrackEventOptions) => {
      if (posthog) {
        posthog.identify(userId, properties);
      }
    },
    [posthog],
  );

  const setUserProperties = useCallback(
    (properties: TrackEventOptions) => {
      if (posthog) {
        posthog.people.set(properties);
      }
    },
    [posthog],
  );

  return {
    identifyUser,
    setUserProperties,
    trackError,
    trackEvent,
    trackLiquidity,
    trackPageView,
    trackSwap,
    trackWalletConnection,
  };
}
