export function emit(
  target: EventTarget,
  name: string,
  detail?: unknown,
): void {
  target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail,
    }),
  );
}
