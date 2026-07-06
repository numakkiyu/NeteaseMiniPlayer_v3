import { describe, expect, it, vi } from "vitest";
import { createNMPv3PlusRuntime } from "../../../packages/core/src/index";
import {
  createAdvancedLayoutPlugin,
  nmpv3PlusAdvancedLayoutCss,
} from "./index";
import { nmpv3PlusAdvancedLayoutCssText } from "./styleText";

describe("advanced layouts extension", () => {
  it("applies and cleans up an opt-in card layout", async () => {
    const player = createElementStub();
    const root = createElementStub(player);
    const runtime = createNMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
    });
    const applied = vi.fn();
    runtime.on("layout:applied", applied);

    await runtime.installPlugin(createAdvancedLayoutPlugin({ layout: "card" }));

    expect(player.classList.add).toHaveBeenCalledWith("nmpv3-plus-layout-card");
    expect(player.dataset.nmpv3PlusLayout).toBe("card");
    expect(root.ownerDocument.head.append).toHaveBeenCalledTimes(1);
    expect(applied).toHaveBeenCalledWith({
      layout: "card",
      target: player,
    });

    runtime.destroy();

    expect(player.classList.remove).toHaveBeenCalledWith(
      "nmpv3-plus-layout-card",
    );
    expect(player.dataset.nmpv3PlusLayout).toBeUndefined();
  });

  it("falls back to root when a concrete player part is unavailable", async () => {
    const root = createElementStub();
    const runtime = createNMPv3PlusRuntime({
      root: root as unknown as HTMLElement,
    });

    await runtime.installPlugin(
      createAdvancedLayoutPlugin({ layout: "cover" }),
    );

    expect(root.classList.add).toHaveBeenCalledWith("nmpv3-plus-layout-cover");
    expect(root.dataset.nmpv3PlusLayout).toBe("cover");
  });

  it("keeps the cover layout on a vertical axis with shrinkable content", () => {
    expect(nmpv3PlusAdvancedLayoutCss).toBe(nmpv3PlusAdvancedLayoutCssText);
    expect(nmpv3PlusAdvancedLayoutCss).toContain("flex-direction: column");
    expect(nmpv3PlusAdvancedLayoutCss).toContain("min-width: 0");
    expect(nmpv3PlusAdvancedLayoutCss).toContain("white-space: normal");
    expect(nmpv3PlusAdvancedLayoutCss).toContain(
      ".nmpv3-plus-layout-cover .nmpv3-title",
    );
  });
});

interface ElementStub {
  dataset: Record<string, string>;
  ownerDocument: {
    head: {
      querySelector: ReturnType<typeof vi.fn>;
      append: ReturnType<typeof vi.fn>;
    };
    createElement(tagName: string): ElementStub;
  };
  classList: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  querySelector: ReturnType<typeof vi.fn>;
}

function createElementStub(player?: ElementStub): ElementStub {
  const element: ElementStub = {
    dataset: {},
    ownerDocument: undefined as unknown as ElementStub["ownerDocument"],
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    querySelector: vi.fn(() => player ?? null),
  };

  element.ownerDocument = {
    head: {
      querySelector: vi.fn(() => null),
      append: vi.fn(),
    },
    createElement() {
      return createElementStub();
    },
  };

  return element;
}
