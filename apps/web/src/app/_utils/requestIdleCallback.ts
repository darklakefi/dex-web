/**
 * Type-safe wrapper for requestIdleCallback with fallback to setTimeout.
 * Uses the browser's idle time when available, otherwise uses a small delay.
 *
 * @param callback - Function to execute during idle time
 * @param fallbackDelay - Delay in ms for setTimeout fallback (default: 100ms)
 */
export function scheduleIdleTask(
  callback: () => void,
  fallbackDelay = 100,
): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback);
  } else {
    setTimeout(callback, fallbackDelay);
  }
}
