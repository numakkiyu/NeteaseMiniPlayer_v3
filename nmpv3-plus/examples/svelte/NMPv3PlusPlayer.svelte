<script lang="ts">
  import { onMount } from "svelte";
  import { createNMPv3PlusSvelteBinding } from "netease-mini-player-v3-plus/svelte";

  const binding = createNMPv3PlusSvelteBinding({
    playlistId: "14273792576",
    sourceType: "local-json",
    source: "/music/playlist.json",
    skin: "vinyl",
    plusExtensions: ["advanced-layouts", "visualizer", "custom-source"],
    plusLayout: "cover",
    extensionUrl: "/extensions/user/wave/manifest.json",
    lyric: true,
  });

  onMount(async () => {
    await import("netease-mini-player-v3/auto");
    await import("netease-mini-player-v3-plus");
  });
</script>

<svelte:element this={binding.tagName} {...binding.props} />
