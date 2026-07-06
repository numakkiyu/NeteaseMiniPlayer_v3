import type {
  NMPv3PlusPlugin,
  NMPv3PlusSourceAdapter,
} from "../../../packages/core/src/index";

export function createCustomSourcePlugin(
  adapter: NMPv3PlusSourceAdapter,
): NMPv3PlusPlugin {
  return {
    name: `nmpv3-plus-extension-custom-source:${adapter.name}`,
    version: "1.0.0",
    setup(ctx) {
      return ctx.source.register(adapter);
    },
  };
}
