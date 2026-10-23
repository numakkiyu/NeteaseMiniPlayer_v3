import type {
  NMPv3PlusLogger,
  NMPv3PlusSlotContext,
  NMPv3PlusSlotRenderer,
} from "../types";

/**
 * 内置插槽名
 *
 * - toolbar：底部工具按钮行，适合放额外按钮
 * - overlay：覆盖整个播放器的浮层，适合提示、可视化、装饰
 * - panel：播放器下方，适合展开式面板
 *
 * 允许传入任意字符串，自定义插槽会挂在播放器根节点的末尾。
 */
export type NMPv3PlusSlotName =
  | "toolbar"
  | "overlay"
  | "panel"
  | (string & {});

interface SlotEntry {
  id: number;
  name: string;
  order: number;
  renderer: NMPv3PlusSlotRenderer;
  cleanups: Array<() => void>;
  disposable: () => void;
}

/** 内置插槽相对播放器根节点的挂载位置选择器 */
const SLOT_ANCHORS: Record<string, string> = {
  toolbar: ".nmpv3-tools",
  panel: ".nmpv3-bottom",
  overlay: "",
};

const SLOT_ATTR = "data-nmpv3-plus-slot";

/**
 * 插槽注册表
 *
 * 插件通过它往播放器里挂自定义 UI。设计上刻意不接管样式：
 * 容器只负责定位（一个空的块级元素），具体外观由插件自己的 CSS 决定，
 * 这样官方皮肤与第三方插件不会互相覆盖。
 */
export class NMPv3PlusSlotRegistry {
  private readonly entries: SlotEntry[] = [];
  private readonly containers = new Map<string, HTMLElement>();
  private nextId = 1;
  private root: HTMLElement | null = null;

  constructor(private readonly logger: NMPv3PlusLogger) {}

  /** 绑定播放器根节点；重复调用会先清理旧挂载 */
  attach(root: HTMLElement | null): void {
    if (this.root === root) {
      return;
    }

    this.root = root;
    this.containers.clear();

    if (root) {
      this.mountAll();
    }
  }

  /**
   * 注册一个插槽渲染器
   *
   * @param name 插槽名，内置 toolbar / overlay / panel，其余会新建容器
   * @param renderer 渲染函数，返回值可作清理回调
   * @param options.order 越小越靠前，默认 0
   */
  register(
    name: NMPv3PlusSlotName,
    renderer: NMPv3PlusSlotRenderer,
    options: { order?: number } = {},
  ): () => void {
    const entry: SlotEntry = {
      id: this.nextId,
      name,
      order: Number.isFinite(options.order) ? Number(options.order) : 0,
      renderer,
      cleanups: [],
      disposable: () => this.disposeEntry(entry),
    };

    this.nextId += 1;
    this.entries.push(entry);
    this.entries.sort((a, b) => a.order - b.order || a.id - b.id);

    if (this.root) {
      this.renderEntry(entry);
    }

    return entry.disposable;
  }

  /** 已注册的插槽名（去重） */
  list(): string[] {
    return Array.from(new Set(this.entries.map((entry) => entry.name)));
  }

  /** 按插槽名取容器，没挂载时返回 null */
  getContainer(name: string): HTMLElement | null {
    return this.containers.get(name) ?? null;
  }

  /** 清空所有插槽内容并解绑根节点 */
  clear(): void {
    for (const entry of [...this.entries]) {
      this.disposeEntry(entry);
    }

    this.entries.length = 0;

    for (const container of this.containers.values()) {
      container.remove();
    }

    this.containers.clear();
    this.root = null;
  }

  /** 播放器被外部替换 DOM 后调用，重建容器并重跑渲染器 */
  remount(root: HTMLElement | null): void {
    this.root = root;
    this.containers.clear();

    if (!root) {
      return;
    }

    this.mountAll();
  }

  private mountAll(): void {
    for (const entry of this.entries) {
      this.renderEntry(entry);
    }
  }

  private ensureContainer(name: string): HTMLElement | null {
    const existing = this.containers.get(name);

    if (existing?.isConnected) {
      return existing;
    }

    const root = this.root;

    if (!root) {
      return null;
    }

    const doc = root.ownerDocument;
    const container = doc.createElement("div");
    container.setAttribute(SLOT_ATTR, name);
    container.className = `nmpv3-plus-slot nmpv3-plus-slot--${name}`;

    const anchorSelector = SLOT_ANCHORS[name];

    if (anchorSelector) {
      const anchor = root.querySelector(anchorSelector);

      if (anchor?.parentElement) {
        /*
         * toolbar 插在工具行前面（视觉上在按钮左侧），
         * panel 插在底部行后面（展开时向下延伸）。
         */
        if (name === "toolbar") {
          anchor.before(container);
        } else {
          anchor.after(container);
        }

        this.containers.set(name, container);
        return container;
      }
    }

    root.append(container);
    this.containers.set(name, container);
    return container;
  }

  private renderEntry(entry: SlotEntry): void {
    if (!this.root) {
      return;
    }

    const container = this.ensureContainer(entry.name);

    if (!container) {
      return;
    }

    // 同一插槽多个渲染器各自一个子容器，互不影响
    const host = container.ownerDocument.createElement("div");
    host.dataset.nmpv3PlusSlotEntry = String(entry.id);

    try {
      const result = entry.renderer({
        container: host,
        onCleanup: (cleanup) => {
          if (typeof cleanup === "function") {
            entry.cleanups.push(cleanup);
          }
        },
      });

      if (typeof result === "function") {
        entry.cleanups.push(result);
      }

      container.append(host);
    } catch (error) {
      // 渲染失败不影响别的插槽，容器标记状态便于排查
      host.dataset.nmpv3PlusSlotError = "true";
      container.append(host);
      this.logger.error(
        `NMPv3+ slot renderer failed: ${entry.name}`,
        error,
      );
    }
  }

  private disposeEntry(entry: SlotEntry): void {
    const index = this.entries.indexOf(entry);

    if (index >= 0) {
      this.entries.splice(index, 1);
    }

    for (const cleanup of entry.cleanups.splice(0)) {
      try {
        cleanup();
      } catch (error) {
        this.logger.error(`NMPv3+ slot cleanup failed: ${entry.name}`, error);
      }
    }

    const container = this.containers.get(entry.name);

    if (container) {
      const host = container.querySelector(
        `[data-nmpv3-plus-slot-entry="${entry.id}"]`,
      );
      host?.remove();

      // 该插槽已无渲染器时把容器也去掉，避免留下一堆空 div
      if (!container.querySelector("[data-nmpv3-plus-slot-entry]")) {
        container.remove();
        this.containers.delete(entry.name);
      }
    }
  }
}
