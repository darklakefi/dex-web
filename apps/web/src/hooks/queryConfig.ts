/**
 * Shared query configuration constants for consistent behavior across the app.
 * These values tune how aggressively queries refetch based on data importance.
 */

export const QUERY_STALE_TIMES = {
  /** Critical data: refetch very frequently (3s) */
  critical: 3_000,
  /** High priority: refetch frequently (7s) */
  high: 7_000,
  /** Low priority: refetch rarely (60s) */
  low: 60_000,
  /** Normal priority: refetch moderately (30s) */
  normal: 30_000,
} as const;

export const QUERY_REFETCH_INTERVALS = {
  /** Critical data: poll very frequently (5s) */
  critical: 5_000,
  /** High priority: poll frequently (10s) */
  high: 10_000,
  /** Low priority: poll rarely (60s) */
  low: 60_000,
  /** Normal priority: poll moderately (30s) */
  normal: 30_000,
} as const;

export type QueryPriority = keyof typeof QUERY_STALE_TIMES;
