<script setup lang="ts">
import { withBase } from "vitepress";
</script>

<template>
  <footer class="bhcn-footer" aria-label="BHCN STUDIO maintainer notice">
    <div class="bhcn-footer__inner">
      <img
        class="bhcn-footer__logo bhcn-footer__logo--light"
        :src="withBase('/bhcnlogo/bhcn-logo-full-light.svg')"
        alt="BHCN STUDIO"
        loading="lazy"
      />
      <img
        class="bhcn-footer__logo bhcn-footer__logo--dark"
        :src="withBase('/bhcnlogo/bhcn-logo-full-dark.svg')"
        alt="BHCN STUDIO"
        loading="lazy"
      />
      <p class="bhcn-footer__label">
        本项目由 BHCN STUDIO 维护，基于
        <a
          href="https://github.com/Binaryify/NeteaseCloudMusicApi"
          target="_blank"
          rel="noreferrer"
        >
          NeteaseCloudMusicApi
        </a>
        • 采用 Apache 2.0 许可证
      </p>
    </div>
  </footer>
</template>
