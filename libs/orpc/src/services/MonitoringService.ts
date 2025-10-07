import { LoggerService } from "./LoggerService";

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}
interface AlertThreshold {
  metric: string;
  threshold: number;
  operator: "gt" | "lt" | "eq";
  severity: "low" | "medium" | "high" | "critical";
}
class MonitoringService {
  private static instance: MonitoringService;
  private metrics: MetricData[] = [];
  private alerts: AlertThreshold[] = [];
  private logger = LoggerService.getInstance();
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    const metric: MetricData = {
      name,
      tags,
      timestamp: Date.now(),
      value,
    };
    this.metrics.push(metric);
    this.checkAlerts(metric);
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }
  recordLatency(
    operation: string,
    duration: number,
    tags?: Record<string, string>,
  ): void {
    this.recordMetric(`${operation}.latency`, duration, tags);
  }
  recordError(
    operation: string,
    errorCode: string,
    tags?: Record<string, string>,
  ): void {
    this.recordMetric(`${operation}.errors`, 1, { ...tags, errorCode });
  }
  recordSuccess(operation: string, tags?: Record<string, string>): void {
    this.recordMetric(`${operation}.success`, 1, tags);
  }
  recordRateLimit(operation: string, identifier: string): void {
    this.recordMetric(`${operation}.rate_limited`, 1, { identifier });
  }
  private checkAlerts(metric: MetricData): void {
    for (const alert of this.alerts) {
      if (metric.name === alert.metric) {
        let triggered = false;
        switch (alert.operator) {
          case "gt":
            triggered = metric.value > alert.threshold;
            break;
          case "lt":
            triggered = metric.value < alert.threshold;
            break;
          case "eq":
            triggered = metric.value === alert.threshold;
            break;
        }
        if (triggered) {
          this.logger.warn(`Alert triggered: ${alert.metric}`, {
            severity: alert.severity,
            tags: metric.tags,
            threshold: alert.threshold,
            value: metric.value,
          });
        }
      }
    }
  }
  addAlert(alert: AlertThreshold): void {
    this.alerts.push(alert);
  }
  getMetrics(name?: string): MetricData[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }
  getAverageLatency(operation: string, timeWindowMs = 300000): number {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(
      (m) => m.name === `${operation}.latency` && (m.timestamp || 0) > cutoff,
    );
    if (recentMetrics.length === 0) return 0;
    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / recentMetrics.length;
  }
  getErrorRate(operation: string, timeWindowMs = 300000): number {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(
      (m) =>
        (m.timestamp || 0) > cutoff &&
        (m.name === `${operation}.errors` || m.name === `${operation}.success`),
    );
    const errors = recentMetrics.filter(
      (m) => m.name === `${operation}.errors`,
    ).length;
    const total = recentMetrics.length;
    return total > 0 ? errors / total : 0;
  }
  setupDefaultAlerts(): void {
    this.addAlert({
      metric: "addLiquidity.latency",
      operator: "gt",
      severity: "medium",
      threshold: 5000,
    });
    this.addAlert({
      metric: "getAllPools.latency",
      operator: "gt",
      severity: "high",
      threshold: 10000,
    });
    this.addAlert({
      metric: "addLiquidity.errors",
      operator: "gt",
      severity: "high",
      threshold: 0.1,
    });
  }
}
export { MonitoringService };
