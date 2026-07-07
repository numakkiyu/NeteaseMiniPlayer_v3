<script setup lang="ts">
import "netease-mini-player-v3/auto";
import { createNMPv3PlusNuxtClientPlan } from "netease-mini-player-v3-plus/nuxt";

const plan = createNMPv3PlusNuxtClientPlan({
  playlistId: "14273792576",
  sourceType: "local-json",
  source: "/music/playlist.json",
  skin: "cyber",
  plusExtensions: ["custom-source", "local-lyrics", "media-session"],
  lyricsUrl: "/lyrics/song.lrc",
  lyric: true,
});
</script>

<template>
  <nmp-player v-bind="plan.element.attrs" />
</template>
