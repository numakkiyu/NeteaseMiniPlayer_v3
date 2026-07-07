import type { NMPv3PlusStore } from "../types";

export class NMPv3PlusMemoryStore implements NMPv3PlusStore {
  private readonly values = new Map<string, unknown>();
  private readonly subscribers = new Map<
    string,
    Set<(value: unknown, previous: unknown) => void>
  >();

  get<TValue>(key: string, fallback: TValue): TValue {
    return this.values.has(key) ? (this.values.get(key) as TValue) : fallback;
  }

  set<TValue>(key: string, value: TValue): void {
    const previous = this.values.get(key);
    this.values.set(key, value);
    this.notify(key, value, previous);
  }

  delete(key: string): void {
    const previous = this.values.get(key);
    this.values.delete(key);
    this.notify(key, undefined, previous);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  subscribe<TValue>(
    key: string,
    callback: (value: TValue | undefined, previous: TValue | undefined) => void,
  ): () => void {
    const subscribers = this.subscribers.get(key) ?? new Set();
    subscribers.add(callback as (value: unknown, previous: unknown) => void);
    this.subscribers.set(key, subscribers);

    return () => {
      subscribers.delete(
        callback as (value: unknown, previous: unknown) => void,
      );
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  clear(): void {
    for (const key of Array.from(this.values.keys())) {
      this.delete(key);
    }

    this.values.clear();
  }

  private notify(key: string, value: unknown, previous: unknown): void {
    this.subscribers.get(key)?.forEach((callback) => callback(value, previous));
  }
}
