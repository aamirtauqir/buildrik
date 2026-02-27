/**
 * AICache - Simple TTL-based cache for AI requests
 * @module services/ai/AICache
 * @license BSD-3-Clause
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class AICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor(maxSize = 100, defaultTTL = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  generateKey(endpoint: string, body: Record<string, unknown>): string {
    return `${endpoint}:${JSON.stringify(body)}`;
  }

  get<T>(endpoint: string, body: Record<string, unknown>): T | null {
    const key = this.generateKey(endpoint, body);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(endpoint: string, body: Record<string, unknown>, data: T, ttl = this.defaultTTL): void {
    const key = this.generateKey(endpoint, body);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// Global instance
export const aiCache = new AICache();
