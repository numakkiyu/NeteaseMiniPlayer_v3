import { classNames as c, stateClassNames as sc } from "../ui/classNames";

export const nmpv3Css = `
nmp-player,
.netease-mini-player {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.${c.player} {
  --nmpv3-primary-bg: var(--nmpv3-bg, #fafafa);
  --nmpv3-secondary-bg: #f1f2f4;
  --nmpv3-surface: var(--nmpv3-bg, #fafafa);
  --nmpv3-surface-strong: #ffffff;
  --nmpv3-accent: #ff6b35;
  --nmpv3-accent-2: #7a66ff;
  --nmpv3-accent-3: #00a9d6;
  --nmpv3-accent-soft: rgba(255, 107, 53, 0.13);
  --nmpv3-track: rgba(23, 25, 31, 0.12);
  --nmpv3-text: #2f333a;
  --nmpv3-muted: #66707d;
  --nmpv3-faint: #929aa6;
  --nmpv3-border: rgba(24, 27, 32, 0.08);
  --nmpv3-shadow-light: rgba(255, 255, 255, 0.92);
  --nmpv3-shadow-dark: rgba(18, 21, 28, 0.13);
  --nmpv3-shadow-outset: 6px 8px 18px var(--nmpv3-shadow-dark), -5px -5px 14px var(--nmpv3-shadow-light);
  --nmpv3-shadow-inset: inset 2px 2px 5px rgba(18, 21, 28, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.86);
  --nmpv3-flow-1: rgba(255, 107, 53, 0.26);
  --nmpv3-flow-2: rgba(0, 169, 214, 0.18);
  --nmpv3-flow-3: rgba(122, 102, 255, 0.18);
  --nmpv3-flow-4: rgba(255, 209, 102, 0.16);
  --nmpv3-flow-opacity: 0.36;
  --nmpv3-flow-speed: 11s;
  --nmpv3-radius: 16px;
  --nmpv3-control-size: 32px;
  --nmpv3-tool-size: 28px;
  --nmpv3-playlist-row-height: 56px;
  --nmpv3-idle-opacity: 0.72;
  --nmpv3-dock-gap: 20px;
  /* 停靠时露在视口内的宽度：保证玩家永远看得见、抓得住 */
  --nmpv3-dock-peek: 14px;
  --nmpv3-opacity-duration-down: 600ms;
  --nmpv3-opacity-duration-up: 250ms;
  --nmpv3-dock-duration: 450ms;
  --nmpv3-popout-duration: 280ms;
  --nmpv3-opacity-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --nmpv3-opacity-ease-in: cubic-bezier(0.4, 0, 0.2, 1);
  --nmpv3-dock-ease-out: cubic-bezier(0.18, 0.9, 0.2, 1);
  --nmpv3-popout-ease: cubic-bezier(0.4, 0, 0.2, 1);
  /* 统一动效令牌：入场用 decelerate、退场用 accelerate、位移落定用 settle */
  --nmpv3-motion-fast: 140ms;
  --nmpv3-motion-base: 220ms;
  --nmpv3-motion-slow: 300ms;
  --nmpv3-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --nmpv3-ease-entrance: cubic-bezier(0.05, 0.7, 0.1, 1);
  --nmpv3-ease-exit: cubic-bezier(0.3, 0, 1, 1);
  --nmpv3-ease-settle: cubic-bezier(0.22, 1, 0.36, 1);
  --nmpv3-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(420px, 100%);
  min-height: 132px;
  padding: 12px;
  overflow: visible;
  isolation: isolate;
  touch-action: manipulation;
  border: 1px solid var(--nmpv3-border);
  border-radius: var(--nmpv3-radius);
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 107, 53, 0.1), transparent 34%),
    radial-gradient(circle at 82% 24%, rgba(0, 169, 214, 0.08), transparent 34%),
    var(--nmpv3-surface);
  color: var(--nmpv3-text);
  box-shadow: var(--nmpv3-shadow-outset);
  font: 13px/1.35 var(--nmpv3-font);
  letter-spacing: 0;
  text-wrap: pretty;
  transition:
    transform var(--nmpv3-motion-base) var(--nmpv3-ease-standard),
    opacity var(--nmpv3-motion-base) ease,
    box-shadow var(--nmpv3-motion-base) ease,
    background-color var(--nmpv3-motion-base) ease,
    color var(--nmpv3-motion-base) ease,
    border-radius var(--nmpv3-motion-base) var(--nmpv3-ease-standard),
    /* 位置与尺寸使用同一时长与缓动：最小化时"边缩边靠边"，展开时"边向外靠边放大" */
    left var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    top var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    width var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    height var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    min-height var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    padding var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance);
  /* 把重排范围限制在组件内部，尺寸变化不再引起宿主页面 reflow */
  contain: layout style;
}

/* 拖拽期间关闭所有过渡，让位置严格跟手；松手后由 CSS 过渡接管落定 */
.${c.player}[data-dragging="true"] {
  transition: none;
  will-change: transform;
}

.${c.player}[data-dragging="true"] .${c.main} {
  cursor: grabbing;
}

.${c.player}::before {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 0;
  border-radius: calc(var(--nmpv3-radius) - 1px);
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 20%, var(--nmpv3-flow-1) 0%, transparent 58%),
    radial-gradient(circle at 82% 24%, var(--nmpv3-flow-2) 0%, transparent 56%),
    radial-gradient(circle at 22% 86%, var(--nmpv3-flow-3) 0%, transparent 58%),
    radial-gradient(circle at 86% 78%, var(--nmpv3-flow-4) 0%, transparent 55%);
  clip-path: inset(0 round calc(var(--nmpv3-radius) - 1px));
  opacity: var(--nmpv3-flow-opacity);
  filter: saturate(1.04) brightness(1.02);
  transform: scale(1);
  /* 只动 transform + opacity：两者都在合成层完成，不触发布局与重绘 */
  animation: nmpv3-flow-breathe var(--nmpv3-flow-speed) ease-in-out infinite;
  animation-play-state: paused;
  will-change: transform, opacity;
}

.${c.player}:hover::before,
.${c.player}:focus-within::before,
.${c.player}.${sc.isPlaying}::before {
  animation-play-state: running;
}

.nmpv3-main,
.nmpv3-bottom,
.nmpv3-playlist-panel,
.nmpv3-status {
  position: relative;
  z-index: 1;
}

.${c.player}[data-draggable="true"]:not([data-position="static"]):not([data-embed-mode="article"]) {
  touch-action: none;
}

.${c.player}.${sc.dragging} {
  cursor: grabbing;
  user-select: none;
}

.${c.player}.${sc.userPositioned} {
  right: auto;
  bottom: auto;
}

.${c.player},
.${c.player} *,
.${c.player} *::before,
.${c.player} *::after {
  box-sizing: border-box;
}

.${c.player} [hidden] {
  display: none !important;
}

.${c.player}[data-theme="dark"],
.${c.player}[data-theme="auto"].${sc.themeDark} {
  --nmpv3-primary-bg: var(--nmpv3-bg, #202228);
  --nmpv3-secondary-bg: #2a2d34;
  --nmpv3-surface: var(--nmpv3-bg, #202228);
  --nmpv3-surface-strong: #272a31;
  --nmpv3-accent: #ff8558;
  --nmpv3-accent-2: #8d82ff;
  --nmpv3-accent-3: #28c7ed;
  --nmpv3-accent-soft: rgba(255, 133, 88, 0.16);
  --nmpv3-track: rgba(255, 255, 255, 0.16);
  --nmpv3-text: #eff2f6;
  --nmpv3-muted: #b6beca;
  --nmpv3-faint: #858e9d;
  --nmpv3-border: rgba(255, 255, 255, 0.08);
  --nmpv3-shadow-light: rgba(255, 255, 255, 0.04);
  --nmpv3-shadow-dark: rgba(0, 0, 0, 0.44);
  --nmpv3-shadow-outset: 6px 8px 18px rgba(0, 0, 0, 0.38), -4px -4px 12px rgba(255, 255, 255, 0.04);
  --nmpv3-shadow-inset: inset 2px 2px 5px rgba(0, 0, 0, 0.34), inset -2px -2px 5px rgba(255, 255, 255, 0.04);
  --nmpv3-flow-1: rgba(255, 133, 88, 0.22);
  --nmpv3-flow-2: rgba(40, 199, 237, 0.16);
  --nmpv3-flow-3: rgba(141, 130, 255, 0.18);
  --nmpv3-flow-4: rgba(255, 209, 102, 0.12);
  --nmpv3-flow-opacity: 0.3;
  --nmpv3-flow-speed: 12s;
}

@media (prefers-color-scheme: dark) {
  .${c.player}[data-theme="auto"] {
    --nmpv3-primary-bg: var(--nmpv3-bg, #202228);
    --nmpv3-secondary-bg: #2a2d34;
    --nmpv3-surface: var(--nmpv3-bg, #202228);
    --nmpv3-surface-strong: #272a31;
    --nmpv3-accent: #ff8558;
    --nmpv3-accent-2: #8d82ff;
    --nmpv3-accent-3: #28c7ed;
    --nmpv3-accent-soft: rgba(255, 133, 88, 0.16);
    --nmpv3-track: rgba(255, 255, 255, 0.16);
    --nmpv3-text: #eff2f6;
    --nmpv3-muted: #b6beca;
    --nmpv3-faint: #858e9d;
    --nmpv3-border: rgba(255, 255, 255, 0.08);
    --nmpv3-shadow-light: rgba(255, 255, 255, 0.04);
    --nmpv3-shadow-dark: rgba(0, 0, 0, 0.44);
    --nmpv3-shadow-outset: 6px 8px 18px rgba(0, 0, 0, 0.38), -4px -4px 12px rgba(255, 255, 255, 0.04);
    --nmpv3-shadow-inset: inset 2px 2px 5px rgba(0, 0, 0, 0.34), inset -2px -2px 5px rgba(255, 255, 255, 0.04);
    --nmpv3-flow-1: rgba(255, 133, 88, 0.22);
    --nmpv3-flow-2: rgba(40, 199, 237, 0.16);
    --nmpv3-flow-3: rgba(141, 130, 255, 0.18);
    --nmpv3-flow-4: rgba(255, 209, 102, 0.12);
    --nmpv3-flow-opacity: 0.3;
    --nmpv3-flow-speed: 12s;
  }
}

.nmpv3-player[data-position="top-left"],
.nmpv3-player[data-position="top-right"],
.nmpv3-player[data-position="bottom-left"],
.nmpv3-player[data-position="bottom-right"] {
  position: fixed;
  z-index: 2147483000;
}

.nmpv3-player[data-position="top-left"] { top: 20px; left: 20px; }
.nmpv3-player[data-position="top-right"] { top: 20px; right: 20px; }
.nmpv3-player[data-position="bottom-left"] { bottom: 20px; left: 20px; }
.nmpv3-player[data-position="bottom-right"] { right: 20px; bottom: 20px; }

.nmpv3-player[data-position="static"].nmpv3-playlist-open {
  margin-bottom: min(358px, calc(100vh - 146px));
}

.nmpv3-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.nmpv3-mini-panel {
  display: none;
}

.nmpv3-cover-button {
  position: relative;
  flex: 0 0 60px;
  width: 60px;
  height: 60px;
  min-width: 60px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #2d2f35 0%, #17191f 55%, #090a0d 100%);
  color: rgba(255, 255, 255, 0.94);
  cursor: pointer;
  /* 封面随容器同步形变，避免尺寸过渡时两者不同步造成的抖动 */
  transition:
    width var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    height var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance),
    flex-basis var(--nmpv3-motion-slow) var(--nmpv3-ease-entrance);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 0 18px rgba(0, 0, 0, 0.45),
    0 10px 18px rgba(0, 0, 0, 0.24),
    0 2px 4px rgba(255, 255, 255, 0.08);
}

.nmpv3-cover-button::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 4;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at center, transparent 73%, rgba(255, 255, 255, 0.13) 78%, transparent 84%),
    radial-gradient(ellipse 42% 34% at 30% 22%, rgba(255, 255, 255, 0.19), transparent 72%),
    radial-gradient(ellipse 38% 46% at 74% 76%, rgba(0, 169, 214, 0.11), transparent 74%);
  mix-blend-mode: screen;
  opacity: 0.7;
}

.nmpv3-cover {
  position: absolute;
  inset: 5px;
  z-index: 2;
  display: block;
  width: calc(100% - 10px);
  height: calc(100% - 10px);
  border-radius: inherit;
  object-fit: cover;
  -webkit-user-drag: none;
  user-select: none;
  filter: brightness(0.96) contrast(1.06) saturate(1.04);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 5px 12px rgba(0, 0, 0, 0.2);
  transform-origin: 50% 50%;
  backface-visibility: hidden;
  will-change: transform;
}

.nmpv3-cover-fallback {
  position: absolute;
  inset: 5px;
  z-index: 2;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.45), transparent 40%),
    linear-gradient(145deg, rgba(255, 107, 53, 0.82), rgba(122, 102, 255, 0.66), rgba(0, 169, 214, 0.62));
  color: rgba(255, 255, 255, 0.96);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.nmpv3-vinyl-ring {
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: inherit;
  background:
    radial-gradient(circle at center, transparent 0 10.5%, rgba(8, 9, 12, 0.9) 11.2% 14%, transparent 14.8% 80%, rgba(255, 255, 255, 0.13) 83%, rgba(8, 10, 14, 0.54) 87%, transparent 91%),
    radial-gradient(ellipse 46% 36% at 30% 22%, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.06) 38%, transparent 74%),
    radial-gradient(ellipse 38% 42% at 76% 74%, rgba(40, 199, 237, 0.12), transparent 72%),
    repeating-radial-gradient(circle at center, rgba(255, 255, 255, 0.072) 0 0.72px, rgba(0, 0, 0, 0) 0.8px 4.6px);
  pointer-events: none;
  box-shadow:
    inset 0 0 16px rgba(0, 0, 0, 0.5),
    inset 0 0 34px rgba(0, 0, 0, 0.2);
  opacity: 0.94;
  transform-origin: 50% 50%;
}

/* 旋转动画常驻，仅用 play-state 启停：
   暂停时停在当前角度，恢复播放从原角度继续，而不是跳回 0 度 */
.nmpv3-cover,
.nmpv3-vinyl-ring {
  animation: nmpv3-spin 6s linear infinite;
  animation-play-state: paused;
}

.nmpv3-is-playing .nmpv3-cover,
.nmpv3-is-playing .nmpv3-vinyl-ring {
  animation-play-state: running;
}

.nmpv3-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  align-self: stretch;
}

.nmpv3-title,
.nmpv3-artist,
.nmpv3-album,
.nmpv3-playlist-name,
.nmpv3-playlist-artist {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nmpv3-title,
.nmpv3-artist {
  color: var(--nmpv3-text);
  position: relative;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

/* 内层承载文本：溢出时由 JS 设 --nmpv3-marquee-shift 做往复滚动 */
.nmpv3-title-text,
.nmpv3-artist-text {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  will-change: transform;
}

.nmpv3-title[data-overflow="true"] .nmpv3-title-text,
.nmpv3-artist[data-overflow="true"] .nmpv3-artist-text {
  animation: nmpv3-marquee-h var(--nmpv3-marquee-duration, 7s) ease-in-out infinite alternate;
}

/* 横向滚动时右侧淡出，避免文字被硬边裁断 */
.nmpv3-title[data-overflow="true"],
.nmpv3-artist[data-overflow="true"] {
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 86%, transparent 100%);
  mask-image: linear-gradient(to right, #000 0, #000 86%, transparent 100%);
}

/* 未溢出时保留省略号语义 */
.nmpv3-title:not([data-overflow="true"]) .nmpv3-title-text,
.nmpv3-artist:not([data-overflow="true"]) .nmpv3-artist-text {
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.nmpv3-title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.nmpv3-artist {
  color: var(--nmpv3-muted);
  font-size: 12px;
  line-height: 1.2;
}

.nmpv3-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--nmpv3-faint);
  font-size: 10px;
  line-height: 1.2;
}

.nmpv3-album {
  flex: 1 1 auto;
  min-width: 0;
}

.nmpv3-order {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}

.nmpv3-mode-badge {
  flex: 0 0 auto;
  max-width: 68px;
  padding: 1px 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--nmpv3-accent-soft);
  color: var(--nmpv3-accent);
  font-size: 9px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nmpv3-lyrics {
  min-height: 20px;
  display: flex;
  min-width: 0;
  max-width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
}

.nmpv3-lyric-original,
.nmpv3-lyric-translation {
  position: relative;
  min-width: 0;
  max-width: 100%;
  /* 每行都不折行：超出宽度时由内层横向滚动展示，行数固定不变 */
  overflow: hidden;
  white-space: nowrap;
}

.nmpv3-lyric-original-text,
.nmpv3-lyric-translation-text {
  display: inline-block;
  white-space: nowrap;
  will-change: transform;
}

/* 溢出滚动时右侧淡出，避免文字被硬边裁断 */
.nmpv3-lyric-original[data-overflow="true"],
.nmpv3-lyric-translation[data-overflow="true"] {
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 84%, transparent 100%);
  mask-image: linear-gradient(to right, #000 0, #000 84%, transparent 100%);
}

.nmpv3-lyric-original[data-overflow="true"] .nmpv3-lyric-original-text {
  animation: nmpv3-marquee-h var(--nmpv3-marquee-duration, 9s) ease-in-out infinite alternate;
}

.nmpv3-lyric-translation[data-overflow="true"] .nmpv3-lyric-translation-text {
  animation: nmpv3-marquee-h var(--nmpv3-marquee-duration, 9s) ease-in-out infinite alternate;
}

.nmpv3-lyric-original {
  color: color-mix(in srgb, var(--nmpv3-accent) 76%, #d30024);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.35;
}

.nmpv3-lyric-translation {
  color: var(--nmpv3-muted);
  font-size: 10px;
  line-height: 1.3;
}

.nmpv3-controls {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.nmpv3-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--nmpv3-control-size);
  height: var(--nmpv3-control-size);
  min-width: var(--nmpv3-control-size);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--nmpv3-primary-bg);
  color: var(--nmpv3-muted);
  cursor: pointer;
  box-shadow:
    2px 2px 4px var(--nmpv3-shadow-dark),
    -2px -2px 4px var(--nmpv3-shadow-light);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.nmpv3-icon-button > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 0;
}

.nmpv3-icon-button svg {
  display: block;
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.nmpv3-icon-button:hover,
.nmpv3-icon-button:focus-visible,
.nmpv3-icon-button.nmpv3-active {
  background: var(--nmpv3-secondary-bg);
  color: var(--nmpv3-accent);
  outline: none;
  box-shadow: var(--nmpv3-shadow-inset);
}

.nmpv3-icon-button:active {
  transform: scale(0.94);
}

.nmpv3-play {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: var(--nmpv3-accent);
  color: white;
  box-shadow:
    0 8px 18px rgba(255, 107, 53, 0.28),
    2px 2px 4px var(--nmpv3-shadow-dark),
    -2px -2px 4px var(--nmpv3-shadow-light);
}

.nmpv3-play:hover,
.nmpv3-play:focus-visible {
  background: color-mix(in srgb, var(--nmpv3-accent) 88%, var(--nmpv3-accent-3));
  color: white;
}

.nmpv3-play svg {
  width: 19px;
  height: 19px;
}

.nmpv3-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.nmpv3-progress {
  width: 100%;
  min-width: 154px;
  max-width: none;
  display: grid;
  grid-template-columns: 38px minmax(72px, 1fr) 38px;
  align-items: center;
  gap: 7px;
}

.nmpv3-time {
  display: block;
  min-width: 38px;
  color: var(--nmpv3-faint);
  font-size: 10px;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.nmpv3-progress-track,
.nmpv3-volume-track {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  /* 拖动时禁止浏览器接管手势，保证 pointermove 连续触发 */
  touch-action: none;
}

/* 拖拽中的视觉反馈：轨道变粗、手柄放大，给出"抓住了"的即时感 */
.nmpv3-progress-track[data-scrubbing="true"],
.nmpv3-volume-track[data-scrubbing="true"] {
  cursor: grabbing;
}

.nmpv3-progress-track[data-scrubbing="true"]::before,
.nmpv3-volume-track[data-scrubbing="true"]::before {
  height: 6px;
}

.nmpv3-progress-track[data-scrubbing="true"] .nmpv3-progress-bar,
.nmpv3-volume-track[data-scrubbing="true"] .nmpv3-volume-bar {
  height: 6px;
}

.nmpv3-progress-track[data-scrubbing="true"] .nmpv3-progress-bar::after {
  width: 12px;
  height: 12px;
  right: -5px;
  box-shadow: 0 0 12px rgba(0, 169, 214, 0.72);
}

.nmpv3-progress-track::before,
.nmpv3-volume-track::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 4px;
  border-radius: 999px;
  background: var(--nmpv3-secondary-bg);
  box-shadow: var(--nmpv3-shadow-inset);
  transform: translateY(-50%);
  transition: height var(--nmpv3-motion-fast) var(--nmpv3-ease-standard);
}

.nmpv3-progress-bar,
.nmpv3-volume-bar {
  position: absolute;
  top: 50%;
  left: 0;
  max-width: 100%;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--nmpv3-accent), var(--nmpv3-accent-3));
  transform: translateY(-50%);
  transition: height var(--nmpv3-motion-fast) var(--nmpv3-ease-standard);
}

.nmpv3-progress-bar::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--nmpv3-accent-3);
  box-shadow: 0 0 8px rgba(0, 169, 214, 0.45);
  transform: translateY(-50%);
  transition:
    width var(--nmpv3-motion-fast) var(--nmpv3-ease-standard),
    height var(--nmpv3-motion-fast) var(--nmpv3-ease-standard),
    right var(--nmpv3-motion-fast) var(--nmpv3-ease-standard),
    box-shadow var(--nmpv3-motion-fast) var(--nmpv3-ease-standard);
}

.nmpv3-tools {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  margin-left: auto;
}

.nmpv3-tools .nmpv3-icon-button {
  width: var(--nmpv3-tool-size);
  height: var(--nmpv3-tool-size);
  min-width: var(--nmpv3-tool-size);
  background: transparent;
  box-shadow: none;
}

.nmpv3-tools .nmpv3-icon-button:hover,
.nmpv3-tools .nmpv3-icon-button:focus-visible,
.nmpv3-tools .nmpv3-icon-button.nmpv3-active {
  background: var(--nmpv3-accent-soft);
  box-shadow: none;
}

.nmpv3-tools .nmpv3-icon-button svg {
  width: 15px;
  height: 15px;
}

.nmpv3-volume {
  flex: 0 0 68px;
  width: 68px;
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  align-items: center;
  gap: 5px;
  color: var(--nmpv3-muted);
}

.nmpv3-volume svg {
  display: block;
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.nmpv3-playlist-panel {
  position: absolute;
  right: 0;
  left: 0;
  top: calc(100% + 8px);
  max-height: min(348px, calc(100vh - 156px));
  overflow: hidden;
  border: 1px solid var(--nmpv3-border);
  border-radius: 14px;
  background: var(--nmpv3-surface-strong);
  box-shadow:
    4px 4px 10px var(--nmpv3-shadow-dark),
    -4px -4px 10px var(--nmpv3-shadow-light);
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px) scale(0.985);
  transform-origin: top center;
  clip-path: inset(0 0 100% 0 round 14px);
  transition:
    opacity 170ms ease,
    transform 210ms cubic-bezier(0.18, 0.9, 0.2, 1),
    clip-path 210ms cubic-bezier(0.18, 0.9, 0.2, 1);
  will-change: opacity, transform, clip-path;
}

.nmpv3-player.nmpv3-playlist-open .nmpv3-playlist-panel {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
  clip-path: inset(0 0 0 0 round 14px);
}

.nmpv3-player[data-position^="bottom"] .nmpv3-playlist-panel {
  top: auto;
  bottom: calc(100% + 10px);
  transform: translateY(8px) scale(0.985);
  transform-origin: bottom center;
}

.nmpv3-player[data-position^="bottom"].nmpv3-playlist-open .nmpv3-playlist-panel {
  transform: translateY(0) scale(1);
}

.nmpv3-playlist-list {
  max-height: min(348px, calc(100vh - 156px));
  display: grid;
  gap: 4px;
  padding: 6px;
  overflow-y: auto;
  scrollbar-width: none;
}

.nmpv3-playlist-list::-webkit-scrollbar {
  display: none;
}

.nmpv3-playlist-item {
  --nmpv3-playlist-item-delay: 0ms;
  width: 100%;
  min-height: var(--nmpv3-playlist-row-height);
  display: grid;
  grid-template-columns: 30px 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.nmpv3-player.nmpv3-playlist-open .nmpv3-playlist-item {
  animation: nmpv3-playlist-item-in 180ms cubic-bezier(0.18, 0.9, 0.2, 1) both;
  animation-delay: var(--nmpv3-playlist-item-delay);
}

.nmpv3-playlist-item:last-child {
  border-bottom: 0;
}

.nmpv3-playlist-item:hover,
.nmpv3-playlist-item:focus-visible,
.nmpv3-playlist-item.nmpv3-active {
  background: color-mix(in srgb, var(--nmpv3-accent-soft) 76%, var(--nmpv3-surface-strong));
  color: var(--nmpv3-accent);
  outline: none;
}

.nmpv3-playlist-index {
  min-width: 30px;
  color: var(--nmpv3-faint);
  font-size: 10.5px;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.nmpv3-playlist-info {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.nmpv3-playlist-cover {
  display: block;
  width: 42px;
  height: 42px;
  border: 1px solid var(--nmpv3-border);
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.34), transparent 35%),
    linear-gradient(145deg, var(--nmpv3-secondary-bg), var(--nmpv3-primary-bg));
  object-fit: cover;
}

.nmpv3-playlist-cover.nmpv3-no-cover {
  background:
    radial-gradient(circle at 50% 50%, var(--nmpv3-accent-soft), transparent 60%),
    var(--nmpv3-secondary-bg);
}

.nmpv3-playlist-name {
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.28;
}

.nmpv3-playlist-artist {
  color: var(--nmpv3-muted);
  font-size: 11px;
  line-height: 1.28;
}

.nmpv3-playlist-duration {
  color: var(--nmpv3-faint);
  font-size: 10.5px;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.nmpv3-status {
  margin-top: 2px;
  color: #d92336;
  font-size: 12px;
  line-height: 1.25;
}

.nmpv3-player[data-layout="mini"] {
  width: min(320px, 100%);
  min-height: 92px;
}

.nmpv3-player[data-layout="mini"] .nmpv3-main {
  gap: 10px;
}

.nmpv3-player[data-layout="mini"] .nmpv3-cover-button {
  flex-basis: 46px;
  width: 46px;
  height: 46px;
  min-width: 46px;
}

.nmpv3-player[data-layout="mini"] .nmpv3-lyrics,
.nmpv3-player[data-layout="mini"] .nmpv3-meta,
.nmpv3-player[data-layout="mini"] .nmpv3-previous,
.nmpv3-player[data-layout="mini"] .nmpv3-next,
.nmpv3-player[data-layout="mini"] .nmpv3-tools {
  display: none;
}

.nmpv3-player[data-layout="mini"] .nmpv3-bottom {
  margin-top: 0;
}

.nmpv3-player[data-layout="mini"] .nmpv3-progress {
  max-width: none;
}

.nmpv3-player[data-layout="dock"] {
  width: min(420px, calc(100vw - 32px));
}

.nmpv3-player[data-embed-mode="article"] {
  width: min(360px, 100%);
  min-height: 98px;
}

.nmpv3-player[data-embed-mode="article"] .nmpv3-main {
  gap: 10px;
}

.nmpv3-player[data-embed-mode="article"] .nmpv3-cover-button {
  flex-basis: 50px;
  width: 50px;
  height: 50px;
  min-width: 50px;
}

.nmpv3-player[data-embed-mode="article"] .nmpv3-meta,
.nmpv3-player[data-embed-mode="article"] .nmpv3-previous,
.nmpv3-player[data-embed-mode="article"] .nmpv3-next,
.nmpv3-player[data-embed-mode="article"] .nmpv3-playlist-toggle,
.nmpv3-player[data-embed-mode="article"] .nmpv3-minimize {
  display: none;
}

.nmpv3-player[data-embed-mode="article"] .nmpv3-progress {
  min-width: 0;
  max-width: none;
}

.nmpv3-player.nmpv3-is-minimized {
  width: 80px;
  min-width: 80px;
  min-height: 80px;
  height: 80px;
  padding: 0;
  border-radius: 50%;
  overflow: visible;
  background:
    radial-gradient(120px 120px at 30% 30%, rgba(255, 133, 88, 0.24), transparent 60%),
    radial-gradient(120px 120px at 70% 70%, rgba(0, 169, 214, 0.2), transparent 60%),
    linear-gradient(135deg, #151515, #1e1e1e);
}

.nmpv3-player.nmpv3-is-minimized .nmpv3-main {
  display: block;
  width: 100%;
  height: 100%;
}

.nmpv3-player.nmpv3-is-minimized .nmpv3-cover-button {
  width: 100%;
  height: 100%;
  min-width: 100%;
  border: 0;
  box-shadow: none;
}

.nmpv3-player.nmpv3-is-minimized .nmpv3-cover {
  inset: 8px;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  filter: brightness(0.86) contrast(1.08) saturate(1.04);
}

.nmpv3-player.nmpv3-is-minimized .nmpv3-body,
.nmpv3-player.nmpv3-is-minimized .nmpv3-controls,
.nmpv3-player.nmpv3-is-minimized .nmpv3-bottom,
.nmpv3-player.nmpv3-is-minimized .nmpv3-playlist-panel,
.nmpv3-player.nmpv3-is-minimized .nmpv3-status {
  display: none;
}

.nmpv3-player.nmpv3-is-minimized .nmpv3-mini-panel {
  position: absolute;
  top: 50%;
  left: calc(100% + 10px);
  z-index: 15;
  display: grid;
  width: 172px;
  max-width: min(172px, calc(100vw - 112px));
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--nmpv3-border);
  border-radius: 12px;
  background: var(--nmpv3-surface-strong);
  color: var(--nmpv3-text);
  box-shadow:
    4px 4px 12px var(--nmpv3-shadow-dark),
    -4px -4px 12px var(--nmpv3-shadow-light);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) translateX(-4px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.nmpv3-player.nmpv3-is-minimized[data-position$="right"] .nmpv3-mini-panel {
  right: calc(100% + 10px);
  left: auto;
  transform: translateY(-50%) translateX(4px);
}

.nmpv3-player.nmpv3-is-minimized[data-side="left"] .nmpv3-mini-panel {
  right: auto;
  left: calc(100% + 10px);
  transform: translateY(-50%) translateX(-4px);
}

.nmpv3-player.nmpv3-is-minimized[data-side="right"] .nmpv3-mini-panel {
  right: calc(100% + 10px);
  left: auto;
  transform: translateY(-50%) translateX(4px);
}

.nmpv3-player.nmpv3-is-minimized:hover .nmpv3-mini-panel,
.nmpv3-player.nmpv3-is-minimized:focus-within .nmpv3-mini-panel {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.nmpv3-mini-title,
.nmpv3-mini-subtitle,
.nmpv3-mini-mode {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nmpv3-mini-title {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}

.nmpv3-mini-subtitle,
.nmpv3-mini-mode {
  color: var(--nmpv3-muted);
  font-size: 10px;
  line-height: 1.25;
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-idle {
  opacity: var(--nmpv3-idle-opacity);
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-fading-out {
  animation: nmpv3-player-fade-out var(--nmpv3-opacity-duration-down) var(--nmpv3-opacity-ease-out) forwards;
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-fading-in {
  animation: nmpv3-player-fade-in var(--nmpv3-opacity-duration-up) var(--nmpv3-opacity-ease-in) forwards;
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-docked-right {
  transform: translateX(calc(50% - var(--nmpv3-dock-peek)));
  opacity: var(--nmpv3-idle-opacity);
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-docked-left {
  transform: translateX(calc(-50% + var(--nmpv3-dock-peek)));
  opacity: var(--nmpv3-idle-opacity);
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-fading-out.nmpv3-docked-right {
  animation:
    nmpv3-player-fade-out var(--nmpv3-opacity-duration-down) var(--nmpv3-opacity-ease-out) forwards,
    nmpv3-player-dock-right var(--nmpv3-dock-duration) var(--nmpv3-dock-ease-out) forwards;
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-fading-out.nmpv3-docked-left {
  animation:
    nmpv3-player-fade-out var(--nmpv3-opacity-duration-down) var(--nmpv3-opacity-ease-out) forwards,
    nmpv3-player-dock-left var(--nmpv3-dock-duration) var(--nmpv3-dock-ease-out) forwards;
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-popping-right {
  animation: nmpv3-player-popout-right var(--nmpv3-popout-duration) var(--nmpv3-popout-ease) forwards;
}

.nmpv3-player.nmpv3-is-minimized.nmpv3-popping-left {
  animation: nmpv3-player-popout-left var(--nmpv3-popout-duration) var(--nmpv3-popout-ease) forwards;
}

@media (max-width: 520px), (hover: none) and (pointer: coarse) {
  .nmpv3-player {
    width: min(100%, 360px);
    min-height: 116px;
    padding: 10px;
  }

  .nmpv3-player[data-position="top-left"] {
    top: 8px;
    left: 8px;
  }

  .nmpv3-player[data-position="top-right"] {
    top: 8px;
    right: 8px;
  }

  .nmpv3-player[data-position="bottom-left"] {
    bottom: 8px;
    left: 8px;
  }

  .nmpv3-player[data-position="bottom-right"] {
    right: 8px;
    bottom: 8px;
  }

  .nmpv3-player[data-position="static"].nmpv3-playlist-open {
    margin-bottom: min(314px, calc(100vh - 134px));
  }

  .nmpv3-main {
    gap: 10px;
  }

  .nmpv3-cover-button {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
    min-width: 50px;
  }

  .nmpv3-title {
    font-size: 12px;
  }

  .nmpv3-artist,
  .nmpv3-lyric-original {
    font-size: 10px;
  }

  .nmpv3-lyric-translation {
    font-size: 9px;
  }

  .nmpv3-previous,
  .nmpv3-next,
  .nmpv3-volume {
    display: none;
  }

  .nmpv3-controls {
    gap: 0;
  }

  .nmpv3-icon-button,
  .nmpv3-play {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .nmpv3-bottom {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .nmpv3-progress {
    width: 100%;
    min-width: 0;
    max-width: none;
    grid-template-columns: 35px minmax(0, 1fr) 35px;
  }

  .nmpv3-tools {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

  .nmpv3-tools .nmpv3-icon-button {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .nmpv3-playlist-panel,
  .nmpv3-playlist-list {
    max-height: min(304px, calc(100vh - 144px));
  }

  .nmpv3-playlist-list {
    padding: 5px;
  }

  .nmpv3-playlist-item {
    --nmpv3-playlist-row-height: 52px;
    grid-template-columns: 26px 38px minmax(0, 1fr) 40px;
    gap: 8px;
    padding: 7px 8px;
  }

  .nmpv3-playlist-cover {
    width: 38px;
    height: 38px;
  }

  .nmpv3-playlist-name {
    font-size: 12px;
  }

  .nmpv3-playlist-artist {
    font-size: 10.5px;
  }

  .nmpv3-player[data-layout="mini"] .nmpv3-bottom {
    display: block;
  }
}

@keyframes nmpv3-marquee-h {
  0%, 10% {
    transform: translateX(0);
  }
  90%, 100% {
    transform: translateX(var(--nmpv3-marquee-shift, 0px));
  }
}

@keyframes nmpv3-marquee-v {
  0%, 10% {
    transform: translateY(0);
  }
  90%, 100% {
    transform: translateY(var(--nmpv3-marquee-shift, 0px));
  }
}

@keyframes nmpv3-flow-breathe {
  0%, 100% {
    opacity: calc(var(--nmpv3-flow-opacity) * 0.68);
    transform: scale(1);
  }
  50% {
    opacity: var(--nmpv3-flow-opacity);
    transform: scale(1.03);
  }
}

@keyframes nmpv3-spin {
  to { transform: rotate(360deg); }
}

@keyframes nmpv3-player-fade-out {
  from { opacity: 1; }
  to { opacity: var(--nmpv3-idle-opacity); }
}

@keyframes nmpv3-player-fade-in {
  from { opacity: var(--nmpv3-idle-opacity); }
  to { opacity: 1; }
}

@keyframes nmpv3-player-dock-right {
  from { transform: translateX(0); }
  to { transform: translateX(calc(50% - var(--nmpv3-dock-peek))); }
}

@keyframes nmpv3-player-dock-left {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-50% + var(--nmpv3-dock-peek))); }
}

@keyframes nmpv3-player-popout-right {
  from {
    opacity: var(--nmpv3-idle-opacity);
    transform: translateX(calc(50% - var(--nmpv3-dock-peek)));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes nmpv3-player-popout-left {
  from {
    opacity: var(--nmpv3-idle-opacity);
    transform: translateX(calc(-50% + var(--nmpv3-dock-peek)));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes nmpv3-playlist-item-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nmpv3-player,
  .nmpv3-player::before,
  .nmpv3-cover,
  .nmpv3-vinyl-ring,
  .nmpv3-icon-button,
  .nmpv3-playlist-panel,
  .nmpv3-playlist-item {
    animation: none !important;
    transition: none !important;
  }
}
`;
