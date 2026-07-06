import {
  createStaticLyricsAdapter,
  type NMPv3PlusPlugin,
  type NMPv3PlusStaticLyricsValue,
} from "../../../packages/core/src/index";

export function createLocalLyricsPlugin(
  lyrics: Record<string, NMPv3PlusStaticLyricsValue>,
): NMPv3PlusPlugin {
  return {
    name: "nmpv3-plus-extension-local-lyrics",
    version: "1.0.0",
    setup(ctx) {
      return ctx.lyrics.register(createStaticLyricsAdapter(lyrics));
    },
  };
}
