/**
 * Small in-memory cache with:
 *  - TTL-based expiry
 *  - in-flight request de-dupe (two identical concurrent calls share one promise)
 * Deliberately NOT persisted to disk/localStorage — documented as a scoping
 * cut in the README rather than silently omitted.
 */
export class RequestCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private inFlight = new Map<string, Promise<unknown>>();
  private ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.store.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = fn()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        this.inFlight.delete(key);
        return value;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }
}
