import type { NMPv3PlusStore } from "../types";

export class NMPv3PlusMemoryStore implements NMPv3PlusStore {
  private readonly values = new Map<string, unknown>();

  get<TValue>(key: string, fallback: TValue): TValue {
    return this.values.has(key) ? (this.values.get(key) as TValue) : fallback;
  }

  set<TValue>(key: string, value: TValue): void {
    this.values.set(key, value);
  }

  delete(key: string): void {
    this.values.delete(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  clear(): void {
    this.values.clear();
  }
}
