import { NMPv3PlusEventBus } from "../event/EventBus";
import type {
  NMPv3PlusHostBridgeOptions,
  NMPv3PlusHostBridgeRule,
  NMPv3PlusHostBridgeValue,
} from "../types";

export class NMPv3PlusHostBridge {
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly eventBus: NMPv3PlusEventBus,
    private readonly options: NMPv3PlusHostBridgeOptions,
  ) {}

  start(): void {
    this.stop();

    for (const rule of this.options.rules) {
      const event = rule.on ?? rule.event;

      if (!event) {
        continue;
      }

      this.cleanup.push(
        this.eventBus.on(event, (payload) => this.applyRule(rule, payload)),
      );
    }
  }

  stop(): void {
    while (this.cleanup.length > 0) {
      this.cleanup.pop()?.();
    }
  }

  private applyRule(rule: NMPv3PlusHostBridgeRule, payload: unknown): void {
    const target = this.resolveTarget(rule.target);

    if (!target) {
      return;
    }

    applyNMPv3PlusHostBridgeRule(target, rule, payload);
  }

  private resolveTarget(target = this.options.target): HTMLElement | null {
    if (typeof target !== "string") {
      return target;
    }

    const root = this.options.root ?? globalThis.document;

    if (!root || typeof root.querySelector !== "function") {
      return null;
    }

    return root.querySelector<HTMLElement>(target);
  }
}

export function applyNMPv3PlusHostBridgeRule(
  target: HTMLElement,
  rule: NMPv3PlusHostBridgeRule,
  payload: unknown,
): void {
  const mapped = rule.map ? rule.map(payload) : true;
  const value = stringifyMappedValue(mapped);

  if (mapped == null) {
    return;
  }

  if (rule.className) {
    if (typeof rule.className === "string") {
      target.classList.toggle(rule.className, Boolean(mapped));
    } else {
      for (const [className, classValue] of Object.entries(rule.className)) {
        const resolved = resolveHostBridgeValue(classValue, payload);
        target.classList.toggle(className, Boolean(resolved));
      }
    }
  }

  if (rule.attribute) {
    if (typeof rule.attribute === "string") {
      setAttribute(target, rule.attribute, mapped, value);
    } else {
      for (const [attribute, attributeValue] of Object.entries(
        rule.attribute,
      )) {
        const resolved = resolveHostBridgeValue(attributeValue, payload);
        setAttribute(
          target,
          attribute,
          resolved,
          stringifyMappedValue(resolved),
        );
      }
    }
  }

  if (rule.token) {
    if (typeof rule.token === "string") {
      setStyleProperty(target, rule.token, mapped, value);
    } else {
      for (const [token, tokenValue] of Object.entries(rule.token)) {
        const resolved = resolveHostBridgeValue(tokenValue, payload);
        setStyleProperty(
          target,
          token,
          resolved,
          stringifyMappedValue(resolved),
        );
      }
    }
  }

  if (rule.style) {
    for (const [property, propertyValue] of Object.entries(rule.style)) {
      const resolved = resolveHostBridgeValue(propertyValue, payload);
      setStyleProperty(
        target,
        property,
        resolved,
        stringifyMappedValue(resolved),
      );
    }
  }
}

export function resolveHostBridgeValue(
  value: NMPv3PlusHostBridgeValue,
  payload: unknown,
): string | number | boolean | null | undefined {
  if (typeof value === "function") {
    return value(payload);
  }

  if (typeof value !== "string") {
    return value;
  }

  return resolveTemplate(value, payload);
}

/**
 * 解析 HostBridge 模板值，支持两种模式：
 * - {{ path.to.field }}  提取嵌套对象字段（类型保留）
 * - 混合文本 {{ field }}  ...  替换为字符串拼接
 */
function resolveTemplate(
  template: string,
  payload: unknown,
): string | number | boolean | null | undefined {
  // 单表达式：{{ xxx }} 占整串，返回原类型
  const singleExpression = template.match(/^{{\s*([^}]+?)\s*}}$/);

  if (singleExpression) {
    return toHostBridgeScalar(readPath(payload, singleExpression[1] ?? ""));
  }

  return template.replace(/{{\s*([^}]+?)\s*}}/g, (_match, path: string) => {
    const value = readPath(payload, path);
    return value == null ? "" : String(value);
  });
}

function toHostBridgeScalar(
  value: unknown,
): string | number | boolean | null | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value == null
  ) {
    return value;
  }

  return String(value);
}

function readPath(payload: unknown, path: string): unknown {
  const parts = path
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
  let current: unknown = payload;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function setAttribute(
  target: HTMLElement,
  attribute: string,
  mapped: string | number | boolean | null | undefined,
  value: string,
): void {
  if (mapped === false || mapped == null) {
    target.removeAttribute(attribute);
    return;
  }

  target.setAttribute(attribute, value || "true");
}

function setStyleProperty(
  target: HTMLElement,
  property: string,
  mapped: string | number | boolean | null | undefined,
  value: string,
): void {
  if (mapped === false || mapped == null || !value) {
    target.style.removeProperty(property);
    return;
  }

  target.style.setProperty(property, value);
}

function stringifyMappedValue(
  value: string | number | boolean | null | undefined,
): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
