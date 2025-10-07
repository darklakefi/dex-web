import type { HealthMetrics, PerformanceMetrics } from "../types/ServiceTypes";

export class MetricsService {
  private static instance: MetricsService;
  private metrics = new Map<string, PerformanceMetrics[]>();
  private healthMetrics: HealthMetrics = {
    activeConnections: 0,
    cpuUsage: 0,
    errorRate: 0,
    memoryUsage: 0,
    uptime: 0,
  };
  private startTime = Date.now();
  private errorCount = 0;
  private totalRequests = 0;

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  recordOperation(metrics: PerformanceMetrics): void {
    const operation = metrics.operation;
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(metrics);

    if (operationMetrics.length > 1000) {
      operationMetrics.shift();
    }
  }

  recordRequest(success: boolean): void {
    this.totalRequests++;
    if (!success) {
      this.errorCount++;
    }
    this.updateHealthMetrics();
  }

  private updateHealthMetrics(): void {
    const memUsage = process.memoryUsage();
    this.healthMetrics = {
      activeConnections: this.getActiveConnections(),
      cpuUsage: process.cpuUsage().user / 1000000,
      errorRate:
        this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0,
      memoryUsage: memUsage.heapUsed,
      uptime: Date.now() - this.startTime,
    };
  }

  private getActiveConnections(): number {
    return 0;
  }

  getOperationMetrics(operation: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const operationMetrics = this.metrics.get(operation) || [];

    if (operationMetrics.length === 0) {
      return {
        averageDuration: 0,
        cacheHitRate: 0,
        count: 0,
        errorRate: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }

    const durations = operationMetrics.map((m) => m.duration);
    const errorCount = operationMetrics.filter(
      (m) => m.errorCount && m.errorCount > 0,
    ).length;
    const cacheHits = operationMetrics.reduce(
      (sum, m) => sum + (m.cacheHits || 0),
      0,
    );
    const cacheMisses = operationMetrics.reduce(
      (sum, m) => sum + (m.cacheMisses || 0),
      0,
    );
    const totalCacheOperations = cacheHits + cacheMisses;

    return {
      averageDuration:
        durations.reduce((sum, d) => sum + d, 0) / durations.length,
      cacheHitRate:
        totalCacheOperations > 0 ? cacheHits / totalCacheOperations : 0,
      count: operationMetrics.length,
      errorRate: errorCount / operationMetrics.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
    };
  }

  getAllMetrics(): Record<string, ReturnType<typeof this.getOperationMetrics>> {
    const result: Record<
      string,
      ReturnType<typeof this.getOperationMetrics>
    > = {};

    for (const operation of this.metrics.keys()) {
      result[operation] = this.getOperationMetrics(operation);
    }

    return result;
  }

  getHealthMetrics(): HealthMetrics {
    this.updateHealthMetrics();
    return { ...this.healthMetrics };
  }

  getTopSlowOperations(limit = 10): Array<{
    operation: string;
    averageDuration: number;
    count: number;
  }> {
    const allMetrics = this.getAllMetrics();

    return Object.entries(allMetrics)
      .map(([operation, metrics]) => ({
        averageDuration: metrics.averageDuration,
        count: metrics.count,
        operation,
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit);
  }

  getTopErrorOperations(limit = 10): Array<{
    operation: string;
    errorRate: number;
    count: number;
  }> {
    const allMetrics = this.getAllMetrics();

    return Object.entries(allMetrics)
      .map(([operation, metrics]) => ({
        count: metrics.count,
        errorRate: metrics.errorRate,
        operation,
      }))
      .filter((m) => m.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  reset(): void {
    this.metrics.clear();
    this.errorCount = 0;
    this.totalRequests = 0;
    this.startTime = Date.now();
  }
}
