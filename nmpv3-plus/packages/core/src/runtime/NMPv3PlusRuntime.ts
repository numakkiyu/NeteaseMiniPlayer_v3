import { NMPv3PlusHostBridge } from "../bridge/HostBridge";
import { NMPv3PlusEventBus } from "../event/EventBus";
import { NMPv3PlusConsoleLogger } from "../logger/Logger";
import { NMPv3PlusLyricsAdapterManager } from "../lyric/LyricsAdapterManager";
import { NMPv3PlusPluginManager } from "../plugin/PluginManager";
import { createPlayerConfigChannel } from "../player/PlayerConfigBridge";
import { NMPv3PlusSlotRegistry } from "../slot/SlotRegistry";
import {
  NMPv3PlusCommandRegistry,
  NMPv3PlusShortcutRegistry,
} from "../commands/CommandRegistry";
import { NMPv3PlusSkinEngine } from "../skin/SkinEngine";
import { NMPv3PlusMusicSourceManager } from "../source/MusicSourceManager";
import { NMPv3PlusMemoryStore } from "../store/MemoryStore";
import type {
  NMPv3PlusEventHandler,
  NMPv3PlusHostBridgeOptions,
  NMPv3PlusLyricsAdapter,
  NMPv3PlusLyricsInput,
  NMPv3PlusLyricsResult,
  NMPv3PlusPlugin,
  NMPv3PlusPluginContext,
  NMPv3PlusRuntimeOptions,
  NMPv3PlusSkin,
  NMPv3PlusSourceAdapter,
  NMPv3PlusSourceInput,
} from "../types";

/**
 * NMPv3+ runtime core. Composes events, store, sources, lyrics, skins, and
 * plugins behind one start/installPlugin/applySkin/bridgeHost API surface.
 */
/**
 * 快捷键监听目标
 *
 * 有播放器根节点就监听根节点，避免抢走整页的键盘事件；
 * 没有的话退回 document，由注册表内部的目标判空逻辑兜住。
 */
function resolveKeydownTarget(
  root: HTMLElement | null,
): Document | HTMLElement | null {
  if (root) {
    return root;
  }

  return typeof document === "undefined" ? null : document;
}

export class NMPv3PlusRuntime {
  /** 插槽注册表，插件通过 ctx.slot 使用 */
  readonly slots: NMPv3PlusSlotRegistry;
  /** 命令注册表，插件通过 ctx.command 使用 */
  readonly commands: NMPv3PlusCommandRegistry;
  /** 快捷键注册表，插件通过 ctx.shortcut 使用 */
  readonly shortcuts: NMPv3PlusShortcutRegistry;
  readonly events = new NMPv3PlusEventBus();
  readonly store;
  readonly logger;
  readonly source = new NMPv3PlusMusicSourceManager();
  readonly lyrics = new NMPv3PlusLyricsAdapterManager();
  readonly skins = new NMPv3PlusSkinEngine();
  readonly plugins: NMPv3PlusPluginManager;
  private hostBridge: NMPv3PlusHostBridge | null = null;
  private readonly cleanup: Array<() => void> = [];

  constructor(private readonly options: NMPv3PlusRuntimeOptions = {}) {
    this.store = options.store ?? new NMPv3PlusMemoryStore();
    this.logger =
      options.logger ?? new NMPv3PlusConsoleLogger(options.debug ?? true);
    this.slots = new NMPv3PlusSlotRegistry(this.logger);
    this.commands = new NMPv3PlusCommandRegistry(this.logger);
    this.shortcuts = new NMPv3PlusShortcutRegistry(this.logger);
    this.plugins = new NMPv3PlusPluginManager(
      () => this.createPluginContext(),
      this.logger,
      options.pluginTimeout,
    );

    // 插槽与快捷键都挂在播放器根节点上，先绑定再装插件
    this.slots.attach(options.root ?? null);
    this.shortcuts.attach(resolveKeydownTarget(options.root ?? null));

    options.sourceAdapters?.forEach((adapter) => this.source.register(adapter));
    options.lyricsAdapters?.forEach((adapter) => this.lyrics.register(adapter));
    options.skins?.forEach((skin) => this.skins.register(skin));
    this.bridgeNMPv3Events();
  }

  async start(): Promise<void> {
    const installed = await this.plugins.installAll(this.options.plugins ?? []);

    installed.forEach(({ plugin }) => {
      this.emit("plugin:installed", { plugin });
    });

    this.emit("ready", { runtime: this });
  }

  async installPlugin(plugin: NMPv3PlusPlugin): Promise<void> {
    await this.plugins.install(plugin);
    this.emit("plugin:installed", { plugin });
  }

  registerSource(adapter: NMPv3PlusSourceAdapter): () => void {
    const unregister = this.source.register(adapter);
    this.emit("source:registered", { adapter });
    return unregister;
  }

  registerLyrics(adapter: NMPv3PlusLyricsAdapter): () => void {
    const unregister = this.lyrics.register(adapter);
    this.emit("lyrics:registered", { adapter });
    return unregister;
  }

  registerSkin(skin: NMPv3PlusSkin): () => void {
    const unregister = this.skins.register(skin);
    this.emit("skin:registered", { skin });
    return unregister;
  }

  applySkin(name: string, target = this.options.root): NMPv3PlusSkin {
    if (!target) {
      throw new Error("NMPv3+ applySkin requires a target element");
    }

    const skin = this.skins.apply(name, target);
    this.emit("skin:applied", { skin, target });
    return skin;
  }

  bridgeHost(options: NMPv3PlusHostBridgeOptions): NMPv3PlusHostBridge {
    this.hostBridge?.stop();
    this.hostBridge = new NMPv3PlusHostBridge(this.events, options);
    this.hostBridge.start();
    return this.hostBridge;
  }

  loadSong(input: NMPv3PlusSourceInput) {
    return this.source.loadSong(input);
  }

  loadPlaylist(input: NMPv3PlusSourceInput) {
    return this.source.loadPlaylist(input);
  }

  getLyrics(input: NMPv3PlusLyricsInput): Promise<NMPv3PlusLyricsResult> {
    return this.lyrics.getLyrics(input);
  }

  on<TPayload = unknown>(
    event: string,
    handler: NMPv3PlusEventHandler<TPayload>,
  ): () => void {
    return this.events.on(event, handler);
  }

  emit(event: string, payload?: unknown): void {
    this.events.emit(event, payload);
  }

  async destroy(): Promise<void> {
    while (this.cleanup.length > 0) {
      try {
        this.cleanup.pop()?.();
      } catch (error) {
        this.logger.error("Runtime cleanup failed", error);
      }
    }

    this.hostBridge?.stop();
    await this.plugins.clear();
    this.events.clear();
    this.skins.clear();
    this.store.clear();
  }

  private createPluginContext(): NMPv3PlusPluginContext {
    return {
      root: this.options.root ?? null,
      player: this.options.player ?? null,
      audio: this.options.audio ?? null,
      store: this.store,
      api: this.options.api ?? null,
      source: {
        loadSong: (input) => this.source.loadSong(input),
        loadPlaylist: (input) => this.source.loadPlaylist(input),
        register: (adapter) => this.registerSource(adapter),
      },
      lyrics: {
        getLyrics: (input) => this.lyrics.getLyrics(input),
        register: (adapter) => this.registerLyrics(adapter),
      },
      on: (event, handler) => this.on(event, handler),
      emit: (event, payload) => this.emit(event, payload),
      getPart: (name) => this.getPart(name),
      setToken: (name, value) => this.setToken(name, value),
      config: createPlayerConfigChannel({
        getPlayer: () => this.options.player ?? null,
        getEventTarget: () => this.options.root ?? null,
      }),
      slot: {
        register: (name, renderer, options) =>
          this.slots.register(name, renderer, options),
        getContainer: (name) => this.slots.getContainer(name),
        list: () => this.slots.list(),
      },
      command: {
        register: (command) => this.commands.register(command),
        execute: (id, arg) => this.commands.execute(id, arg),
        list: () =>
          this.commands.list().map((command) => ({
            id: command.id,
            title: command.title,
          })),
      },
      shortcut: {
        register: (binding) => this.shortcuts.register(binding),
        list: () => this.shortcuts.list(),
      },
      logger: this.logger,
    };
  }

  private getPart(name: string): HTMLElement | null {
    if (
      !this.options.root ||
      typeof this.options.root.querySelector !== "function"
    ) {
      return null;
    }

    return (
      this.options.root.querySelector<HTMLElement>(
        `[data-nmpv3-plus-part="${name}"], [data-nmpv3-part="${name}"], .nmpv3-${name}`,
      ) ?? null
    );
  }

  private setToken(name: string, value: string): void {
    this.options.root?.style.setProperty(name, value);
  }

  private bridgeNMPv3Events(): void {
    if (this.options.bridgeNMPv3Events === false) {
      return;
    }

    const target = this.options.eventTarget ?? this.options.root;

    if (!target || typeof target.addEventListener !== "function") {
      return;
    }

    // Bridge base NMPv3 DOM events into the runtime bus and nmp: aliases.
    const eventMap = {
      "nmpv3:ready": "ready",
      "nmpv3:play": "play",
      "nmpv3:pause": "pause",
      "nmpv3:songchange": "songchange",
      "nmpv3:playlistchange": "playlistchange",
      "nmpv3:error": "error",
    } as const;

    for (const [domEvent, runtimeEvent] of Object.entries(eventMap)) {
      const handler = (event: Event) => {
        const payload =
          "detail" in event
            ? (event as CustomEvent<unknown>).detail
            : { event };

        this.emit(runtimeEvent, payload);
        this.emit(`nmp:${runtimeEvent}`, payload);
      };

      target.addEventListener(domEvent, handler);
      this.cleanup.push(() => target.removeEventListener(domEvent, handler));
    }
  }
}

export function createNMPv3PlusRuntime(
  options?: NMPv3PlusRuntimeOptions,
): NMPv3PlusRuntime {
  return new NMPv3PlusRuntime(options);
}
