interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 30000;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.defaultTTL);

    this.cache.set(key, {
      createdAt: now,
      expiresAt,
      value,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  getStats(): {
    size: number;
    entries: Array<{
      key: string;
      age: number;
      ttl: number;
      isExpired: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      age: now - entry.createdAt,
      isExpired: this.isExpired(entry),
      key,
      ttl: entry.expiresAt - now,
    }));

    return {
      entries,
      size: this.cache.size,
    };
  }

  cleanup(): number {
    const _now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}
