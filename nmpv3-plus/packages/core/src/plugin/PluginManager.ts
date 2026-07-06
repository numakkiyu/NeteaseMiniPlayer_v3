import type {
  NMPv3PlusLogger,
  NMPv3PlusPlugin,
  NMPv3PlusPluginContext,
} from "../types";

export interface NMPv3PlusInstalledPlugin {
  plugin: NMPv3PlusPlugin;
  status: "ready" | "error";
  error?: unknown;
}

interface PluginRecord extends NMPv3PlusInstalledPlugin {
  cleanup?: () => void;
}

/**
 * 插件生命周期管理器
 * install 时调用 plugin.setup()，记录 cleanup 函数用于卸载时执行
 */
export class NMPv3PlusPluginManager {
  private readonly plugins = new Map<string, PluginRecord>();

  constructor(
    private readonly createContext: () => NMPv3PlusPluginContext,
    private readonly logger: NMPv3PlusLogger,
  ) {}

  async install(plugin: NMPv3PlusPlugin): Promise<NMPv3PlusInstalledPlugin> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`NMPv3+ plugin already installed: ${plugin.name}`);
    }

    const record: PluginRecord = {
      plugin,
      status: "ready",
    };
    this.plugins.set(plugin.name, record);

    try {
      const cleanup = await plugin.setup(this.createContext());
      if (cleanup) {
        record.cleanup = cleanup;
      }
      return record;
    } catch (error) {
      record.status = "error";
      record.error = error;
      this.logger.error(`Plugin setup failed: ${plugin.name}`, error);
      throw error;
    }
  }

  uninstall(name: string): boolean {
    const record = this.plugins.get(name);

    if (!record) {
      return false;
    }

    record.cleanup?.();
    this.plugins.delete(name);
    return true;
  }

  get(name: string): NMPv3PlusInstalledPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): NMPv3PlusInstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  clear(): void {
    for (const name of Array.from(this.plugins.keys())) {
      this.uninstall(name);
    }
  }
}

export function defineNMPv3PlusPlugin(
  plugin: NMPv3PlusPlugin,
): NMPv3PlusPlugin {
  return plugin;
}
