/** Bounded, in-memory cache. Pending reads share work; failed reads are retriable. */
export class RequestCache {
  private entries = new Map<
    string,
    { expiresAt: number; value?: unknown; pending?: Promise<unknown> }
  >();

  private readonly capacity: number;
  private readonly now: () => number;

  constructor(capacity = 80, now = () => Date.now()) {
    this.capacity = capacity;
    this.now = now;
  }

  clear() {
    this.entries.clear();
  }

  read<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing?.pending) return existing.pending as Promise<T>;
    if (existing && existing.expiresAt > this.now()) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return Promise.resolve(existing.value as T);
    }

    const entry: {
      expiresAt: number;
      value?: unknown;
      pending?: Promise<unknown>;
    } = { expiresAt: 0 };
    // Defer the loader so a synchronous exception also follows the error path.
    const pending = Promise.resolve()
      .then(load)
      .then(
        (value) => {
          if (this.entries.get(key) === entry) {
            if (ttl > 0) {
              entry.value = value;
              entry.expiresAt = this.now() + ttl;
              delete entry.pending;
            } else this.entries.delete(key);
          }
          return value;
        },
        (error: unknown) => {
          if (this.entries.get(key) === entry) this.entries.delete(key);
          throw error;
        },
      );
    entry.pending = pending;
    this.entries.delete(key);
    this.entries.set(key, entry);
    while (this.entries.size > this.capacity)
      this.entries.delete(this.entries.keys().next().value!);
    return pending;
  }
}

/** Cancelling one reader must not cancel a request another component is using. */
export function withAbortSignal<T>(
  pending: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal) return pending;
  if (signal.aborted)
    return Promise.reject(
      signal.reason ?? new DOMException("Aborted", "AbortError"),
    );
  return new Promise<T>((resolve, reject) => {
    const abort = () =>
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    pending
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}
