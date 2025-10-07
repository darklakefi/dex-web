export enum HealthStatus {
  HEALTHY = "healthy",
  UNHEALTHY = "unhealthy",
  DEGRADED = "degraded",
}

export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  timeout?: number;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private checks = new Map<string, HealthCheck>();
  private cache = new Map<
    string,
    { result: HealthCheckResult; timestamp: number }
  >();
  private readonly CACHE_TTL = 30000;

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  async runCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      return {
        message: `Health check '${name}' not found`,
        status: HealthStatus.UNHEALTHY,
        timestamp: Date.now(),
      };
    }

    const cached = this.cache.get(name);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    try {
      const timeout = check.timeout || 5000;
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), timeout),
        ),
      ]);

      this.cache.set(name, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        message: error instanceof Error ? error.message : "Unknown error",
        status: HealthStatus.UNHEALTHY,
        timestamp: Date.now(),
      };

      this.cache.set(name, { result, timestamp: Date.now() });
      return result;
    }
  }

  async runAllChecks(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};

    const promises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.runCheck(name);
      results[name] = result;
    });

    await Promise.allSettled(promises);
    return results;
  }

  async getOverallHealth(): Promise<{
    status: HealthStatus;
    checks: Record<string, HealthCheckResult>;
    timestamp: number;
  }> {
    const checks = await this.runAllChecks();
    const results = Object.values(checks);

    const unhealthyCount = results.filter(
      (r) => r.status === HealthStatus.UNHEALTHY,
    ).length;
    const degradedCount = results.filter(
      (r) => r.status === HealthStatus.DEGRADED,
    ).length;

    let overallStatus: HealthStatus;
    if (unhealthyCount > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (degradedCount > 0) {
      overallStatus = HealthStatus.DEGRADED;
    } else {
      overallStatus = HealthStatus.HEALTHY;
    }

    return {
      checks,
      status: overallStatus,
      timestamp: Date.now(),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  unregisterCheck(name: string): boolean {
    return this.checks.delete(name);
  }
}
