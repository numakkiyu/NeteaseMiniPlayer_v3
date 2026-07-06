import { describe, expect, it, vi } from "vitest";
import { NMPv3PlusSkinEngine, glassNMPv3PlusSkin } from "./SkinEngine";

describe("NMPv3PlusSkinEngine", () => {
  it("applies and clears skin tokens without changing player structure", () => {
    const target = createElementStub();
    const engine = new NMPv3PlusSkinEngine();
    engine.register(glassNMPv3PlusSkin);

    engine.apply("glass", target);

    expect(target.dataset.nmpv3PlusSkin).toBe("glass");
    expect(target.style.setProperty).toHaveBeenCalledWith(
      "--nmpv3-bg",
      "rgba(255, 255, 255, 0.72)",
    );
    expect(target.classList.add).toHaveBeenCalledWith("nmpv3-plus-skin-glass");

    engine.clear();

    expect(target.classList.remove).toHaveBeenCalledWith(
      "nmpv3-plus-skin-glass",
    );
    expect(target.style.removeProperty).toHaveBeenCalledWith("--nmpv3-bg");
    expect(target.dataset.nmpv3PlusSkin).toBeUndefined();
  });
});

function createElementStub(): HTMLElement {
  const values = new Map<string, string>();

  return {
    dataset: {},
    ownerDocument: undefined,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    style: {
      getPropertyValue: vi.fn((name: string) => values.get(name) ?? ""),
      setProperty: vi.fn((name: string, value: string) => {
        values.set(name, value);
      }),
      removeProperty: vi.fn((name: string) => {
        values.delete(name);
        return "";
      }),
    },
  } as unknown as HTMLElement;
}
