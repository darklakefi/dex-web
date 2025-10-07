export enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private circuits = new Map<
    string,
    {
      state: CircuitState;
      failureCount: number;
      lastFailureTime: number;
      successCount: number;
      options: CircuitBreakerOptions;
    }
  >();

  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    monitoringPeriod: 10000,
    recoveryTimeout: 60000,
  };

  static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  private getCircuit(name: string, options?: Partial<CircuitBreakerOptions>) {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        failureCount: 0,
        lastFailureTime: 0,
        options: { ...this.defaultOptions, ...options },
        state: CircuitState.CLOSED,
        successCount: 0,
      });
    }
    return this.circuits.get(name)!;
  }

  private canExecute(circuit: ReturnType<typeof this.getCircuit>): boolean {
    const now = Date.now();

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        if (now - circuit.lastFailureTime > circuit.options.recoveryTimeout) {
          circuit.state = CircuitState.HALF_OPEN;
          circuit.successCount = 0;
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private onSuccess(circuit: ReturnType<typeof this.getCircuit>): void {
    circuit.failureCount = 0;
    circuit.successCount++;

    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.successCount >= 3) {
        circuit.state = CircuitState.CLOSED;
        circuit.successCount = 0;
      }
    }
  }

  private onFailure(circuit: ReturnType<typeof this.getCircuit>): void {
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failureCount >= circuit.options.failureThreshold) {
      circuit.state = CircuitState.OPEN;
    }
  }

  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const circuit = this.getCircuit(name, options);

    if (!this.canExecute(circuit)) {
      throw new Error(`Circuit breaker '${name}' is open`);
    }

    try {
      const result = await operation();
      this.onSuccess(circuit);
      return result;
    } catch (error) {
      this.onFailure(circuit);
      throw error;
    }
  }

  getState(name: string): CircuitState | null {
    const circuit = this.circuits.get(name);
    return circuit ? circuit.state : null;
  }

  getStats(name: string): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } | null {
    const circuit = this.circuits.get(name);
    if (!circuit) return null;

    return {
      failureCount: circuit.failureCount,
      lastFailureTime: circuit.lastFailureTime,
      state: circuit.state,
      successCount: circuit.successCount,
    };
  }

  reset(name: string): void {
    const circuit = this.circuits.get(name);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.lastFailureTime = 0;
    }
  }

  resetAll(): void {
    this.circuits.clear();
  }
}
