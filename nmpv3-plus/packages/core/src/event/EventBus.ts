import type { NMPv3PlusEventHandler } from "../types";

/**
 * Lightweight pub-sub event bus. on/once return unregister callbacks and
 * preserve generic payload typing.
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
    const errors: unknown[] = [];

    for (const handler of this.listeners.get(event) ?? []) {
      try {
        handler(payload);
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    }

    if (errors.length > 1) {
      const error = new Error(
        `NMPv3+ event handlers failed: ${event}`,
      ) as Error & {
        errors?: unknown[];
      };
      error.errors = errors;
      throw error;
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}
