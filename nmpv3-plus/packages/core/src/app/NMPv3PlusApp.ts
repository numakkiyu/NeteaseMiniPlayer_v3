import {
  createNMPv3PlusRuntime,
  type NMPv3PlusRuntime,
} from "../runtime/NMPv3PlusRuntime";
import type {
  NMPv3PlusLyricsAdapter,
  NMPv3PlusPlugin,
  NMPv3PlusRuntimeOptions,
  NMPv3PlusSkin,
  NMPv3PlusSourceAdapter,
} from "../types";

export interface NMPv3PlusAppOptions {
  plugins?: NMPv3PlusPlugin[];
  skins?: NMPv3PlusSkin[];
  sourceAdapters?: NMPv3PlusSourceAdapter[];
  lyricsAdapters?: NMPv3PlusLyricsAdapter[];
  defaultSkin?: string;
}

export type NMPv3PlusAppRoot = HTMLElement | string | null;

export interface NMPv3PlusAppMountOptions extends Omit<
  NMPv3PlusRuntimeOptions,
  "root" | "plugins" | "skins" | "sourceAdapters" | "lyricsAdapters"
> {
  root?: NMPv3PlusAppRoot;
  skin?: string;
  autoStart?: boolean;
}

export class NMPv3PlusApp {
  private readonly plugins: NMPv3PlusPlugin[] = [];
  private readonly skins: NMPv3PlusSkin[] = [];
  private readonly sourceAdapters: NMPv3PlusSourceAdapter[] = [];
  private readonly lyricsAdapters: NMPv3PlusLyricsAdapter[] = [];
  private defaultSkin?: string;
  private runtime: NMPv3PlusRuntime | null = null;

  constructor(options: NMPv3PlusAppOptions = {}) {
    this.use(...(options.plugins ?? []));
    this.source(...(options.sourceAdapters ?? []));
    this.lyrics(...(options.lyricsAdapters ?? []));
    this.skin(...(options.skins ?? []));
    this.defaultSkin = options.defaultSkin;
  }

  use(...plugins: NMPv3PlusPlugin[]): this {
    this.plugins.push(...plugins);
    return this;
  }

  source(...adapters: NMPv3PlusSourceAdapter[]): this {
    this.sourceAdapters.push(...adapters);
    return this;
  }

  lyrics(...adapters: NMPv3PlusLyricsAdapter[]): this {
    this.lyricsAdapters.push(...adapters);
    return this;
  }

  skin(...items: Array<NMPv3PlusSkin | string>): this {
    for (const item of items) {
      if (typeof item === "string") {
        this.defaultSkin = item;
      } else {
        this.skins.push(item);
      }
    }

    return this;
  }

  async mount(
    input: NMPv3PlusAppRoot | NMPv3PlusAppMountOptions = {},
  ): Promise<NMPv3PlusRuntime> {
    if (this.runtime) {
      throw new Error("NMPv3+ app is already mounted.");
    }

    const options = normalizeMountOptions(input);
    const root = resolveRoot(options.root);
    const skin = options.skin ?? this.defaultSkin;
    const runtime = createNMPv3PlusRuntime({
      ...options,
      root,
      plugins: this.plugins,
      skins: this.skins,
      sourceAdapters: this.sourceAdapters,
      lyricsAdapters: this.lyricsAdapters,
    });

    if (skin) {
      runtime.applySkin(skin, root ?? undefined);
    }

    if (options.autoStart !== false) {
      await runtime.start();
    }

    this.runtime = runtime;
    return runtime;
  }

  async unmount(): Promise<void> {
    await this.runtime?.destroy();
    this.runtime = null;
  }

  getRuntime(): NMPv3PlusRuntime | null {
    return this.runtime;
  }
}

export function createNMPv3PlusApp(
  options?: NMPv3PlusAppOptions,
): NMPv3PlusApp {
  return new NMPv3PlusApp(options);
}

function normalizeMountOptions(
  input: NMPv3PlusAppRoot | NMPv3PlusAppMountOptions,
): NMPv3PlusAppMountOptions {
  if (input === null || typeof input === "string" || isElementLike(input)) {
    return { root: input };
  }

  return input;
}

function resolveRoot(root: NMPv3PlusAppRoot | undefined): HTMLElement | null {
  if (typeof root !== "string") {
    return root ?? null;
  }

  const element = globalThis.document?.querySelector<HTMLElement>(root) ?? null;

  if (!element) {
    throw new Error(`NMPv3+ app mount target not found: ${root}`);
  }

  return element;
}

function isElementLike(value: unknown): value is HTMLElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "querySelector" in value &&
    "ownerDocument" in value
  );
}
