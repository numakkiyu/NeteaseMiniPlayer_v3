import type { NMPv3PlusEventHandler } from "../types";

/**
 * 轻量级发布订阅事件总线
 * on/once 返回注销函数，支持泛型 payload 类型推断
 */
export class NMPv3PlusEventBus {
  private readonly listeners = new Map<string, Set<NMPv3PlusEventHandler>>();

  on<TPayload = unknown>(
    event: string,
    handler: NMPv3PlusEventHandler<TPayload>,
  ): () => void {
    const handlers = this.listeners.get(event) ?? new Set();
    handlers.add(handler as NMPv3PlusEventHandler);
    this.listeners.set(event, handlers);

    return () => this.off(event, handler);
  }

  once<TPayload = unknown>(
    event: string,
    handler: NMPv3PlusEventHandler<TPayload>,
  ): () => void {
    const dispose = this.on<TPayload>(event, (payload) => {
      dispose();
      handler(payload);
    });

    return dispose;
  }

  off<TPayload = unknown>(
    event: string,
    handler: NMPv3PlusEventHandler<TPayload>,
  ): void {
    const handlers = this.listeners.get(event);
    handlers?.delete(handler as NMPv3PlusEventHandler);

    if (handlers?.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit(event: string, payload?: unknown): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(payload);
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}
