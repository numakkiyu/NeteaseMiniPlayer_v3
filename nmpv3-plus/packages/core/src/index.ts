export interface NMPv3PlusPlugin {
  name: string;
  version?: string;
  setup(
    ctx: NMPv3PlusPluginContext,
  ): void | (() => void) | Promise<void | (() => void)>;
}

export interface NMPv3PlusPluginContext {
  on(event: string, handler: (payload: unknown) => void): () => void;
  emit(event: string, payload?: unknown): void;
  logger: {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  };
}

export function defineNMPv3PlusPlugin(
  plugin: NMPv3PlusPlugin,
): NMPv3PlusPlugin {
  return plugin;
}
