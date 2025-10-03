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

  const trackSwap = (properties: {
    fromToken: string;
    toToken: string;
    fromAmount: number;
    toAmount: number;
    transactionHash?: string;
    status: "initiated" | "signed" | "submitted" | "confirmed" | "failed";
  }) => {
    trackEvent("swap", properties);
  };

  const trackLiquidity = (properties: {
    action: "add" | "remove";
    tokenA: string;
    tokenB: string;
    amountA: number;
    amountB: number;
    transactionHash?: string;
    status: "initiated" | "signed" | "submitted" | "confirmed" | "failed";
  }) => {
    trackEvent("liquidity", properties);
  };

  const trackWalletConnection = (properties: {
    wallet: string;
    success: boolean;
    address?: string;
  }) => {
    trackEvent("wallet_connected", properties);
  };

  const trackError = (properties: {
    error: string;
    context: string;
    details?: unknown;
  }) => {
    trackEvent("error", properties);
  };

  const trackPageView = (properties?: { page?: string; referrer?: string }) => {
    trackEvent("$pageview", properties);
  };

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
