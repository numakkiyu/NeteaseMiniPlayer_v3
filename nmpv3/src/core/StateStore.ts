import { getLocalStorage } from "../utils/env";

/**
 * 基于 localStorage 的键值存储
 * 用于持久化用户设置和播放进度
 */
export class StateStore {
  constructor(private readonly prefix = "nmpv3") {}

  get<T>(key: string, fallback: T): T {
    const storage = getLocalStorage();

    if (!storage) {
      return fallback;
    }

    const raw = storage.getItem(this.key(key));

    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    const storage = getLocalStorage();

    if (!storage) {
      return;
    }

    storage.setItem(this.key(key), JSON.stringify(value));
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }
}
