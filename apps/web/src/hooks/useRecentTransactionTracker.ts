"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks recent transaction activity to enable aggressive polling.
 *
 * When a transaction completes:
 * 1. Sets hasRecentTransaction to true
 * 2. Starts a cooldown timer (default 30 seconds)
 * 3. After cooldown, returns to normal polling
 *
 * This enables faster updates immediately after transactions when data
 * is most likely to be stale, then returns to normal polling to save resources.
 *
 * @param cooldownMs - Milliseconds to maintain aggressive polling (default: 30000 = 30s)
 */
export function useRecentTransactionTracker(cooldownMs = 30000) {
  const [hasRecentTransaction, setHasRecentTransaction] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const markTransactionComplete = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    setHasRecentTransaction(true);

    cooldownTimerRef.current = setTimeout(() => {
      setHasRecentTransaction(false);
      cooldownTimerRef.current = null;
    }, cooldownMs);
  }, [cooldownMs]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  return {
    hasRecentTransaction,
    markTransactionComplete,
  };
}
