import type { NMPv3PlusLogger } from "../types";

/* ==================== 命令注册表 ==================== */

export interface NMPv3PlusCommand {
  /** 唯一 id，建议用 `插件名.动作` 形式避免撞名 */
  id: string;
  /** 展示名，供菜单或调试列表使用 */
  title?: string;
  handler: (arg?: unknown) => unknown | Promise<unknown>;
}

/**
 * 命令注册表
 *
 * 给插件一个统一的「可被外部调用」的入口：插件注册命令，
 * 宿主页面或其它插件按 id 执行，不需要互相 import。
 */
export class NMPv3PlusCommandRegistry {
  private readonly commands = new Map<string, NMPv3PlusCommand>();

  constructor(private readonly logger: NMPv3PlusLogger) {}

  register(command: NMPv3PlusCommand): () => void {
    const id = command.id?.trim();

    if (!id) {
      throw new Error("NMPv3+ command id is required");
    }

    if (typeof command.handler !== "function") {
      throw new Error(`NMPv3+ command handler must be a function: ${id}`);
    }

    if (this.commands.has(id)) {
      throw new Error(`NMPv3+ command already registered: ${id}`);
    }

    this.commands.set(id, { ...command, id });
    return () => {
      this.commands.delete(id);
    };
  }

  has(id: string): boolean {
    return this.commands.has(id);
  }

  list(): NMPv3PlusCommand[] {
    return Array.from(this.commands.values()).map((command) => ({
      id: command.id,
      title: command.title,
      handler: command.handler,
    }));
  }

  /**
   * 执行命令
   *
   * 命令不存在时抛出明确错误；命令自身抛错原样上抛，
   * 由调用方决定是重试还是提示用户。
   */
  async execute(id: string, arg?: unknown): Promise<unknown> {
    const command = this.commands.get(id);

    if (!command) {
      throw new Error(`NMPv3+ command not found: ${id}`);
    }

    return command.handler(arg);
  }

  /** 执行命令但不抛错，失败只记日志，供内部批处理使用 */
  async executeSafe(id: string, arg?: unknown): Promise<unknown> {
    try {
      return await this.execute(id, arg);
    } catch (error) {
      this.logger.error(`NMPv3+ command failed: ${id}`, error);
      return undefined;
    }
  }

  clear(): void {
    this.commands.clear();
  }
}

/* ==================== 快捷键注册表 ==================== */

export interface NMPv3PlusShortcutBinding {
  /** 组合键，如 "ctrl+k"、"shift+alt+p"、"escape" */
  keys: string;
  handler: (event: KeyboardEvent) => void;
  /** 允许在输入框内触发，默认 false */
  allowInEditable?: boolean;
  /** preventDefault，默认 true */
  preventDefault?: boolean;
}

interface ShortcutRecord {
  id: number;
  binding: string;
  normalized: NormalizedShortcut;
  handler: (event: KeyboardEvent) => void;
  allowInEditable: boolean;
  preventDefault: boolean;
}

interface NormalizedShortcut {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

/**
 * 解析组合键
 *
 * 支持 ctrl / control / meta / cmd / alt / option / shift 前缀，
 * 末段是 KeyboardEvent.key 的小写形式（如 k、escape、arrowleft）。
 * 解析失败返回 null，由调用方决定跳过。
 */
/** 修饰键名，出现在末段说明这个绑定没有真正的按键 */
const MODIFIER_NAMES = new Set([
  "ctrl",
  "control",
  "meta",
  "cmd",
  "command",
  "alt",
  "option",
  "shift",
]);

export function parseShortcut(binding: string): NormalizedShortcut | null {
  if (typeof binding !== "string" || binding.trim() === "") {
    return null;
  }

  const parts = binding
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const key = parts.pop() ?? "";
  const result: NormalizedShortcut = {
    key,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
  };

  for (const part of parts) {
    if (part === "ctrl" || part === "control") {
      result.ctrl = true;
    } else if (part === "meta" || part === "cmd" || part === "command") {
      result.meta = true;
    } else if (part === "alt" || part === "option") {
      result.alt = true;
    } else if (part === "shift") {
      result.shift = true;
    } else {
      // 出现未知修饰键，整个绑定视为无效，避免误绑
      return null;
    }
  }

  // "ctrl+" 这类只有修饰键的写法不构成有效绑定
  if (!key || MODIFIER_NAMES.has(key)) {
    return null;
  }

  return result;
}

/*
 * 判断事件目标是否是可编辑控件。
 * 用鸭子类型而不是 `instanceof HTMLElement`：模块可能在 SSR 或测试环境下
 * 加载，那里没有 HTMLElement 全局，直接判断会把整个快捷键系统打挂。
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const element = target as {
    isContentEditable?: boolean;
    tagName?: string;
  };

  if (element.isContentEditable === true) {
    return true;
  }

  const tag = element.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function matchesShortcut(
  event: KeyboardEvent,
  shortcut: NormalizedShortcut,
): boolean {
  if (event.key.toLowerCase() !== shortcut.key) {
    return false;
  }

  if (event.ctrlKey !== shortcut.ctrl) {
    return false;
  }

  if (event.metaKey !== shortcut.meta) {
    return false;
  }

  if (event.altKey !== shortcut.alt) {
    return false;
  }

  return event.shiftKey === shortcut.shift;
}

/**
 * 快捷键注册表
 *
 * 只在 attach 的目标上监听，不污染全局；默认跳过输入框，
 * 避免抢掉用户的正常输入。
 */
export class NMPv3PlusShortcutRegistry {
  private readonly records: ShortcutRecord[] = [];
  private target: Document | HTMLElement | null = null;
  private nextId = 1;

  constructor(private readonly logger: NMPv3PlusLogger) {}

  attach(target: Document | HTMLElement | null): void {
    if (this.target === target) {
      return;
    }

    this.detach();

    /*
     * 传入的对象不一定真是 DOM（测试替身、自定义根节点都可能缺方法），
     * 拿不到 addEventListener 就当作「无可监听目标」，注册仍然有效，
     * 只是不会自动触发——比直接抛错打断整个运行时启动要好。
     */
    const listenable =
      target && typeof (target as EventTarget).addEventListener === "function"
        ? target
        : null;

    this.target = listenable;

    if (listenable) {
      listenable.addEventListener(
        "keydown",
        this.handleKeydown as EventListener,
      );
    }
  }

  detach(): void {
    if (this.target && typeof this.target.removeEventListener === "function") {
      this.target.removeEventListener(
        "keydown",
        this.handleKeydown as EventListener,
      );
    }

    this.target = null;
  }

  register(binding: NMPv3PlusShortcutBinding): () => void {
    const normalized = parseShortcut(binding.keys);

    if (!normalized) {
      this.logger.warn(
        `NMPv3+ shortcut ignored, cannot parse binding: ${binding.keys}`,
      );
      return () => {};
    }

    const record: ShortcutRecord = {
      id: this.nextId,
      binding: binding.keys,
      normalized,
      handler: binding.handler,
      allowInEditable: binding.allowInEditable === true,
      preventDefault: binding.preventDefault !== false,
    };

    this.nextId += 1;
    this.records.push(record);

    return () => {
      const index = this.records.indexOf(record);

      if (index >= 0) {
        this.records.splice(index, 1);
      }
    };
  }

  list(): string[] {
    return this.records.map((record) => record.binding);
  }

  clear(): void {
    this.records.length = 0;
    this.detach();
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    for (const record of this.records) {
      if (!matchesShortcut(event, record.normalized)) {
        continue;
      }

      if (!record.allowInEditable && isEditableTarget(event.target)) {
        continue;
      }

      if (record.preventDefault) {
        event.preventDefault();
      }

      try {
        record.handler(event);
      } catch (error) {
        this.logger.error(
          `NMPv3+ shortcut handler failed: ${record.binding}`,
          error,
        );
      }

      return;
    }
  };
}
