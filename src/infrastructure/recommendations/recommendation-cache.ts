const TTL_MS = 5 * 60 * 1000;

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

export const recommendationCache = {
  get<T>(userId: string): T | null {
    const e = store.get(userId);
    if (!e || Date.now() > e.expiresAt) {
      store.delete(userId);
      return null;
    }
    return e.value as T;
  },

  set<T>(userId: string, value: T): void {
    store.set(userId, { value, expiresAt: Date.now() + TTL_MS });
  },

  invalidate(userId: string): void {
    store.delete(userId);
  },
};
