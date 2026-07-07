import type {
  NMPv3PlusLogger,
  NMPv3PlusPlugin,
  NMPv3PlusPluginCleanup,
  NMPv3PlusPluginContext,
} from "../types";

export interface NMPv3PlusInstalledPlugin {
  plugin: NMPv3PlusPlugin;
  status: "ready" | "error";
  error?: unknown;
}

interface PluginRecord extends NMPv3PlusInstalledPlugin {
  cleanup?: NMPv3PlusPluginCleanup;
}

/**
 * Plugin lifecycle manager. install() runs plugin.setup() and records any
 * cleanup callback for uninstall().
 */
export class NMPv3PlusPluginManager {
  private readonly plugins = new Map<string, PluginRecord>();

  constructor(
    private readonly createContext: () => NMPv3PlusPluginContext,
    private readonly logger: NMPv3PlusLogger,
  ) {}

  async installAll(
    plugins: NMPv3PlusPlugin[],
  ): Promise<NMPv3PlusInstalledPlugin[]> {
    const sortedPlugins = sortPluginsByDependencies(plugins);
    const installed: NMPv3PlusInstalledPlugin[] = [];
    let currentPlugin: NMPv3PlusPlugin | null = null;

    try {
      for (const plugin of sortedPlugins) {
        currentPlugin = plugin;
        installed.push(await this.install(plugin));
        currentPlugin = null;
      }
    } catch (error) {
      await this.rollbackInstallAll(installed, currentPlugin);
      throw error;
    }

    return installed;
  }

  async install(plugin: NMPv3PlusPlugin): Promise<NMPv3PlusInstalledPlugin> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`NMPv3+ plugin already installed: ${plugin.name}`);
    }

    this.assertDependencies(plugin);

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

  async uninstall(name: string): Promise<boolean> {
    const record = this.plugins.get(name);

    if (!record) {
      return false;
    }

    try {
      await record.cleanup?.();
    } catch (error) {
      this.logger.error(`Plugin cleanup failed: ${name}`, error);
      throw error;
    } finally {
      this.plugins.delete(name);
    }

    return true;
  }

  get(name: string): NMPv3PlusInstalledPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): NMPv3PlusInstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  async clear(): Promise<void> {
    for (const name of Array.from(this.plugins.keys()).reverse()) {
      try {
        await this.uninstall(name);
      } catch (error) {
        this.logger.error(`Plugin cleanup failed during clear: ${name}`, error);
      }
    }
  }

  private assertDependencies(plugin: NMPv3PlusPlugin): void {
    for (const [name, range] of Object.entries(plugin.dependencies ?? {})) {
      const dependency = this.plugins.get(name);

      if (!dependency) {
        throw new Error(
          `NMPv3+ plugin dependency not installed: ${plugin.name} requires ${name}@${range}`,
        );
      }

      if (dependency.status !== "ready") {
        throw new Error(
          `NMPv3+ plugin dependency is not ready: ${plugin.name} requires ${name}@${range}`,
        );
      }

      if (!satisfiesVersion(dependency.plugin.version, range)) {
        throw new Error(
          `NMPv3+ plugin dependency version mismatch: ${plugin.name} requires ${name}@${range}, installed ${dependency.plugin.version ?? "unknown"}`,
        );
      }
    }
  }

  private async rollbackInstallAll(
    installed: NMPv3PlusInstalledPlugin[],
    failedPlugin: NMPv3PlusPlugin | null,
  ): Promise<void> {
    if (failedPlugin) {
      const failedRecord = this.plugins.get(failedPlugin.name);

      if (
        failedRecord?.plugin === failedPlugin &&
        failedRecord.status === "error"
      ) {
        this.plugins.delete(failedPlugin.name);
      }
    }

    for (const { plugin } of installed.slice().reverse()) {
      try {
        await this.uninstall(plugin.name);
      } catch (error) {
        this.logger.error(
          `Plugin rollback cleanup failed: ${plugin.name}`,
          error,
        );
      }
    }
  }
}

export function defineNMPv3PlusPlugin(
  plugin: NMPv3PlusPlugin,
): NMPv3PlusPlugin {
  return plugin;
}

export function sortPluginsByDependencies(
  plugins: NMPv3PlusPlugin[],
): NMPv3PlusPlugin[] {
  const byName = new Map<string, NMPv3PlusPlugin>();

  for (const plugin of plugins) {
    if (byName.has(plugin.name)) {
      throw new Error(`NMPv3+ plugin already declared: ${plugin.name}`);
    }

    byName.set(plugin.name, plugin);
  }

  const sorted: NMPv3PlusPlugin[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(plugin: NMPv3PlusPlugin): void {
    if (visited.has(plugin.name)) {
      return;
    }

    if (visiting.has(plugin.name)) {
      throw new Error(`NMPv3+ plugin dependency cycle: ${plugin.name}`);
    }

    visiting.add(plugin.name);

    for (const [dependencyName, range] of Object.entries(
      plugin.dependencies ?? {},
    )) {
      const dependency = byName.get(dependencyName);

      if (!dependency) {
        throw new Error(
          `NMPv3+ plugin dependency missing from install set: ${plugin.name} requires ${dependencyName}@${range}`,
        );
      }

      if (!satisfiesVersion(dependency.version, range)) {
        throw new Error(
          `NMPv3+ plugin dependency version mismatch: ${plugin.name} requires ${dependencyName}@${range}, declared ${dependency.version ?? "unknown"}`,
        );
      }

      visit(dependency);
    }

    visiting.delete(plugin.name);
    visited.add(plugin.name);
    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin);
  }

  return sorted;
}

function satisfiesVersion(version: string | undefined, range: string): boolean {
  const normalizedRange = range.trim();

  if (!normalizedRange || normalizedRange === "*") {
    return true;
  }

  if (!version) {
    return false;
  }

  if (normalizedRange.startsWith(">=")) {
    return compareSemver(version, normalizedRange.slice(2).trim()) >= 0;
  }

  if (normalizedRange.startsWith("^")) {
    return satisfiesCaretRange(version, normalizedRange.slice(1).trim());
  }

  if (normalizedRange.startsWith("~")) {
    return satisfiesTildeRange(version, normalizedRange.slice(1).trim());
  }

  return version === normalizedRange;
}

function satisfiesCaretRange(version: string, minimum: string): boolean {
  const versionParts = semverParts(version);
  const minimumParts = semverParts(minimum);

  if (compareSemver(version, minimum) < 0) {
    return false;
  }

  if (minimumParts[0] > 0) {
    return versionParts[0] === minimumParts[0];
  }

  if (minimumParts[1] > 0) {
    return versionParts[0] === 0 && versionParts[1] === minimumParts[1];
  }

  return (
    versionParts[0] === 0 &&
    versionParts[1] === 0 &&
    versionParts[2] === minimumParts[2]
  );
}

function satisfiesTildeRange(version: string, minimum: string): boolean {
  const versionParts = semverParts(version);
  const minimumParts = semverParts(minimum);

  return (
    compareSemver(version, minimum) >= 0 &&
    versionParts[0] === minimumParts[0] &&
    versionParts[1] === minimumParts[1]
  );
}

function compareSemver(left: string, right: string): number {
  const leftParts = semverParts(left);
  const rightParts = semverParts(right);

  for (let index = 0; index < 3; index += 1) {
    const diff = leftParts[index] - rightParts[index];

    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function semverParts(version: string): [number, number, number] {
  const [major = "0", minor = "0", patch = "0"] = version
    .replace(/^[^\d]*/, "")
    .split(/[.-]/);

  return [Number(major) || 0, Number(minor) || 0, Number(patch) || 0];
}
