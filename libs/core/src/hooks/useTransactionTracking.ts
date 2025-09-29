"use client";

import { useCallback } from "react";
import { 
  createSwapTracker, 
  createLiquidityTracker,
  standardizeErrorTracking,
  type SwapTrackingParams,
  type LiquidityTrackingParams,
  type TransactionTracker,
  type TransactionStatus,
} from "../utils/analyticsHelpers";

export interface UseSwapTrackingParams {
  trackSwap: (params: SwapTrackingParams & { status: TransactionStatus }) => void;
  trackError: (error: unknown, context?: Record<string, unknown>) => void;
}

export interface UseLiquidityTrackingParams {
  trackLiquidity: (params: LiquidityTrackingParams & { status: TransactionStatus }) => void;
  trackError: (error: unknown, context?: Record<string, unknown>) => void;
}

export interface UseSwapTrackingReturn {
  tracker: TransactionTracker<SwapTrackingParams>;
  trackError: (error: unknown, context?: Record<string, unknown>) => void;
  trackInitiated: (params: SwapTrackingParams) => void;
  trackSigned: (params: SwapTrackingParams) => void;
  trackSubmitted: (params: SwapTrackingParams) => void;
  trackConfirmed: (params: SwapTrackingParams) => void;
  trackFailed: (params: SwapTrackingParams) => void;
}

export interface UseLiquidityTrackingReturn {
  tracker: TransactionTracker<LiquidityTrackingParams>;
  trackError: (error: unknown, context?: Record<string, unknown>) => void;
  trackInitiated: (params: LiquidityTrackingParams) => void;
  trackSigned: (params: LiquidityTrackingParams) => void;
  trackSubmitted: (params: LiquidityTrackingParams) => void;
  trackConfirmed: (params: LiquidityTrackingParams) => void;
  trackFailed: (params: LiquidityTrackingParams) => void;
}

export const useSwapTracking = ({
  trackSwap,
  trackError: originalTrackError,
}: UseSwapTrackingParams): UseSwapTrackingReturn => {
  const tracker = createSwapTracker(trackSwap);
  const trackError = standardizeErrorTracking(originalTrackError, "swap_initiation");

  const trackInitiated = useCallback(
    (params: SwapTrackingParams) => {
      tracker.trackInitiated(params);
    },
    [tracker]
  );

  const trackSigned = useCallback(
    (params: SwapTrackingParams) => {
      tracker.trackSigned(params);
    },
    [tracker]
  );

  const trackSubmitted = useCallback(
    (params: SwapTrackingParams) => {
      tracker.trackSubmitted(params);
    },
    [tracker]
  );

  const trackConfirmed = useCallback(
    (params: SwapTrackingParams) => {
      tracker.trackConfirmed(params);
    },
    [tracker]
  );

  const trackFailed = useCallback(
    (params: SwapTrackingParams) => {
      tracker.trackFailed(params);
    },
    [tracker]
  );

  return {
    tracker,
    trackError,
    trackInitiated,
    trackSigned,
    trackSubmitted,
    trackConfirmed,
    trackFailed,
  };
};

export const useLiquidityTracking = ({
  trackLiquidity,
  trackError: originalTrackError,
}: UseLiquidityTrackingParams): UseLiquidityTrackingReturn => {
  const tracker = createLiquidityTracker(trackLiquidity);
  const trackError = standardizeErrorTracking(originalTrackError, "liquidity_add");

  const trackInitiated = useCallback(
    (params: LiquidityTrackingParams) => {
      tracker.trackInitiated(params);
    },
    [tracker]
  );

  const trackSigned = useCallback(
    (params: LiquidityTrackingParams) => {
      tracker.trackSigned(params);
    },
    [tracker]
  );

  const trackSubmitted = useCallback(
    (params: LiquidityTrackingParams) => {
      tracker.trackSubmitted(params);
    },
    [tracker]
  );

  const trackConfirmed = useCallback(
    (params: LiquidityTrackingParams) => {
      tracker.trackConfirmed(params);
    },
    [tracker]
  );

  const trackFailed = useCallback(
    (params: LiquidityTrackingParams) => {
      tracker.trackFailed(params);
    },
    [tracker]
  );

  return {
    tracker,
    trackError,
    trackInitiated,
    trackSigned,
    trackSubmitted,
    trackConfirmed,
    trackFailed,
  };
};