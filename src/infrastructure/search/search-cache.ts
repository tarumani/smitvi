type CacheEntry<T> = { value: T; expiresAt: number };

const DEFAULT_TTL_MS = 2 * 60 * 1000;
const QUERY_TTL_MS = 5 * 60 * 1000;

export class SearchCache {
  private results = new Map<string, CacheEntry<unknown>>();
  private queries = new Map<string, CacheEntry<unknown>>();

  getResult<T>(key: string): T | null {
    return this.get(this.results, key) as T | null;
  }

  setResult<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
    this.set(this.results, key, value, ttlMs);
  }

  getQuery<T>(key: string): T | null {
    return this.get(this.queries, key) as T | null;
  }

  setQuery<T>(key: string, value: T, ttlMs = QUERY_TTL_MS): void {
    this.set(this.queries, key, value, ttlMs);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.results.keys()) {
      if (key.startsWith(prefix)) this.results.delete(key);
    }
  }

  private get(map: Map<string, CacheEntry<unknown>>, key: string) {
    const entry = map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return null;
    }
    return entry.value;
  }

  private set(
    map: Map<string, CacheEntry<unknown>>,
    key: string,
    value: unknown,
    ttlMs: number,
  ) {
    map.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (map.size > 500) {
      const first = map.keys().next().value;
      if (first) map.delete(first);
    }
  }
}

export const searchCache = new SearchCache();

export function cacheKey(parts: string[]): string {
  return parts.join("|").toLowerCase().slice(0, 200);
}
