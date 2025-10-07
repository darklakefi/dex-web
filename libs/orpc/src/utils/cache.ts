type CacheEntry<T> = {
  data: T;
  timestamp: number;
};
export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;
  constructor(ttlMs: number = 30_000) {
    this.ttl = ttlMs;
  }
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  clear(): void {
    this.cache.clear();
  }
  invalidate(key: string): void {
    this.cache.delete(key);
  }
}
