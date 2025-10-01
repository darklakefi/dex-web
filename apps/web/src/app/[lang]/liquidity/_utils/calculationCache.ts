interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  enableHitTracking: boolean;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enableHitTracking: config.enableHitTracking ?? true,
      maxSize: config.maxSize ?? 100,
      ttlMs: config.ttlMs ?? 30000,
    };
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      hits: 0,
      timestamp: Date.now(),
      value,
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return undefined;
    }

    if (this.config.enableHitTracking) {
      entry.hits++;
    }
    this.accessOrder.set(key, ++this.accessCounter);

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.accessOrder.delete(key);
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttlMs) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
  }

  getStats() {
    return {
      hitRatio: this.calculateHitRatio(),
      maxSize: this.config.maxSize,
      oldestEntry: this.getOldestEntryAge(),
      size: this.cache.size,
    };
  }

  private calculateHitRatio(): number {
    if (!this.config.enableHitTracking) return 0;

    const totalHits = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.hits,
      0,
    );
    return this.cache.size > 0 ? totalHits / this.cache.size : 0;
  }

  private getOldestEntryAge(): number {
    const now = Date.now();
    let oldestAge = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > oldestAge) {
        oldestAge = age;
      }
    }

    return oldestAge;
  }
}

export const priceCalculationCache = new LRUCache<string>({
  maxSize: 50,
  ttlMs: 10000,
});

export const balanceValidationCache = new LRUCache<{
  isValid: boolean;
  error?: string;
}>({
  maxSize: 30,
  ttlMs: 5000,
});

export const tokenAmountCache = new LRUCache<string>({
  maxSize: 100,
  ttlMs: 15000,
});

export const poolRatioCache = new LRUCache<{
  tokenXToY: string;
  tokenYToX: string;
}>({
  maxSize: 20,
  ttlMs: 30000,
});

export function createPriceCalculationKey(
  inputAmount: string,
  price: string,
): string {
  return `price:${inputAmount}:${price}`;
}

export function createBalanceValidationKey(
  inputAmount: string,
  maxBalance: number,
  decimals: number,
  symbol: string,
): string {
  return `balance:${inputAmount}:${maxBalance}:${decimals}:${symbol}`;
}

export function createTokenAmountKey(
  inputAmount: string,
  poolReserveX: number,
  poolReserveY: number,
  inputType: "tokenX" | "tokenY",
): string {
  return `amount:${inputAmount}:${poolReserveX}:${poolReserveY}:${inputType}`;
}

export function createPoolRatioKey(
  tokenXMint: string,
  tokenYMint: string,
): string {
  return `ratio:${tokenXMint}:${tokenYMint}`;
}

export function startCacheCleanup(intervalMs: number = 60000): () => void {
  const interval = setInterval(() => {
    priceCalculationCache.cleanup();
    balanceValidationCache.cleanup();
    tokenAmountCache.cleanup();
    poolRatioCache.cleanup();
  }, intervalMs);

  return () => clearInterval(interval);
}

export function getAllCacheStats() {
  return {
    balanceValidation: balanceValidationCache.getStats(),
    poolRatio: poolRatioCache.getStats(),
    priceCalculation: priceCalculationCache.getStats(),
    tokenAmount: tokenAmountCache.getStats(),
  };
}
