export function emit(
  target: EventTarget,
  name: string,
  detail?: unknown,
): void {
  /*
   * 调用点都在实例方法里，target 正常不会为空；
   * 但外部替换根节点、测试替身等场景下仍可能拿到非事件目标，
   * 直接 dispatchEvent 会抛错打断主流程，这里静默跳过。
   */
  if (!target || typeof target.dispatchEvent !== "function") {
    return;
  }

  target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail,
    }),
  );
}
