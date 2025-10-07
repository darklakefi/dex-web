export interface ServiceConfig {
  cache: {
    defaultTTL: number;
    maxSize: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: "error" | "warn" | "info" | "debug";
    enablePerformanceLogging: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage?: number;
  cacheHits?: number;
  cacheMisses?: number;
  errorCount?: number;
}

export interface HealthMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  errorRate: number;
}
