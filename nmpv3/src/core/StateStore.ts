import { getLocalStorage } from "../utils/env";

/**
 * 基于 localStorage 的键值存储
 * 用于持久化用户设置和播放进度
 *
 * 容错策略：
 * - localStorage 完全不可用（SSR / 隐私模式）时静默降级，读写不抛异常
 * - 写入被拒绝（quota 超限等）时把值降级存入内存镜像，本页生命周期内仍可读回，
 *   且后续写入会继续尝试 localStorage，一旦恢复（用户清理空间）即重新持久化
 */
export class StateStore {
  /** localStorage 写入失败时的内存兜底镜像 */
  private readonly fallback = new Map<string, string>();

  constructor(private readonly prefix = "nmpv3") {}

  get<T>(key: string, fallback: T): T {
    const storageKey = this.key(key);
    let raw: string | null = null;
    const storage = getLocalStorage();

    if (storage) {
      try {
        raw = storage.getItem(storageKey);
      } catch {
        raw = null;
      }
    }

    if (raw == null) {
      raw = this.fallback.get(storageKey) ?? null;
    }

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
    const storageKey = this.key(key);
    let serialized: string;

    try {
      serialized = JSON.stringify(value);
    } catch {
      return;
    }

    const storage = getLocalStorage();

    if (!storage) {
      this.fallback.set(storageKey, serialized);
      return;
    }

    try {
      storage.setItem(storageKey, serialized);
      this.fallback.delete(storageKey);
    } catch {
      // 写入被拒（quota 超限 / Safari 隐私模式）：降级内存，且不做永久熔断，
      // 下一次 set 仍会尝试 localStorage
      this.fallback.set(storageKey, serialized);
    }
  }

  /**
   * 删除单个条目
   * 用于清除已听完歌曲的进度记录（避免写入 0 值残留脏数据）
   */
  remove(key: string): void {
    const storageKey = this.key(key);
    this.fallback.delete(storageKey);
    const storage = getLocalStorage();

    if (!storage) {
      return;
    }

    try {
      storage.removeItem(storageKey);
    } catch {
      // 移除失败时内存镜像已清理，行为等价于"本页视为不存在"
    }
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }
}
