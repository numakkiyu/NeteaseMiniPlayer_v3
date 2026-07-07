<script setup lang="ts">
import "netease-mini-player-v3/auto";
import { createNMPv3PlusVueBinding } from "netease-mini-player-v3-plus/vue";

const player = createNMPv3PlusVueBinding({
  playlistId: "14273792576",
  skin: "glass",
  layout: "compact",
  plusExtensions: ["visualizer", "host-sync"],
  hostSync: true,
  pageLinking: true,
});
</script>

<template>
  <nmp-player v-bind="player.attrs" />
</template>
