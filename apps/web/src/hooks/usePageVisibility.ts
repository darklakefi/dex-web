"use client";

import { useEffect, useState } from "react";

/**
 * Hook to track whether the page is currently visible to the user.
 * Useful for pausing expensive operations (like polling) when the tab is hidden.
 *
 * @returns boolean - true if page is visible, false if hidden
 *
 * @example
 * const isVisible = usePageVisibility();
 * const refetchInterval = isVisible ? 5000 : false; // Pause polling when hidden
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.visibilityState === "visible";
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
