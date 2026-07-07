export const nmpv3PlusAdvancedLayoutCssText = `
.nmpv3-plus-layout-card.nmpv3-player,
.nmpv3-plus-layout-card .nmpv3-player {
  width: min(520px, 100%);
  transition:
    width 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.nmpv3-plus-layout-card .nmpv3-main {
  align-items: center;
}

.nmpv3-plus-layout-card .nmpv3-title,
.nmpv3-plus-layout-card .nmpv3-artist,
.nmpv3-plus-layout-card .nmpv3-lyric-original,
.nmpv3-plus-layout-card .nmpv3-lyric-translation,
.nmpv3-plus-layout-cover .nmpv3-title,
.nmpv3-plus-layout-cover .nmpv3-artist,
.nmpv3-plus-layout-cover .nmpv3-lyric-original,
.nmpv3-plus-layout-cover .nmpv3-lyric-translation {
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
}

.nmpv3-plus-layout-card .nmpv3-cover-button {
  width: 92px;
  height: 92px;
}

.nmpv3-plus-layout-cover.nmpv3-player,
.nmpv3-plus-layout-cover .nmpv3-player {
  --nmpv3-plus-cover-size: clamp(116px, 28vw, 144px);
  --nmpv3-plus-cover-gap: 14px;
  width: min(540px, 100%);
  min-height: 0;
  padding: 14px;
  gap: 10px;
  text-align: left;
  transition:
    width 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.nmpv3-plus-layout-cover .nmpv3-main {
  display: grid;
  grid-template-columns: var(--nmpv3-plus-cover-size) minmax(0, 1fr) max-content;
  grid-template-areas: "cover body controls";
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: var(--nmpv3-plus-cover-gap);
}

.nmpv3-plus-layout-cover .nmpv3-cover-button {
  grid-area: cover;
  flex: 0 0 var(--nmpv3-plus-cover-size);
  width: var(--nmpv3-plus-cover-size);
  height: var(--nmpv3-plus-cover-size);
  min-width: var(--nmpv3-plus-cover-size);
  overflow: hidden;
  border-color: rgba(10, 13, 18, 0.28);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 26px rgba(0, 0, 0, 0.42),
    0 16px 32px rgba(15, 23, 42, 0.22);
}

.nmpv3-plus-layout-cover .nmpv3-cover-button::after {
  background:
    radial-gradient(circle at center, transparent 0 66%, rgba(255, 255, 255, 0.12) 72%, transparent 80%),
    radial-gradient(ellipse 70% 32% at 32% 24%, rgba(255, 255, 255, 0.24), transparent 68%),
    radial-gradient(ellipse 58% 44% at 72% 70%, rgba(0, 169, 214, 0.12), transparent 72%);
  opacity: 0.6;
}

.nmpv3-plus-layout-cover .nmpv3-vinyl-ring {
  background:
    radial-gradient(circle at center, transparent 0 9%, rgba(6, 8, 12, 0.92) 10% 14%, transparent 15% 76%, rgba(255, 255, 255, 0.1) 78%, transparent 86%),
    radial-gradient(ellipse 48% 32% at 34% 24%, rgba(255, 255, 255, 0.12), transparent 72%),
    radial-gradient(ellipse 42% 44% at 72% 70%, rgba(40, 199, 237, 0.1), transparent 74%),
    repeating-radial-gradient(circle at center, rgba(255, 255, 255, 0.052) 0 0.7px, rgba(0, 0, 0, 0) 0.9px 5.2px);
}

.nmpv3-plus-layout-cover .nmpv3-body,
.nmpv3-plus-layout-cover .nmpv3-controls,
.nmpv3-plus-layout-cover .nmpv3-bottom {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.nmpv3-plus-layout-cover .nmpv3-body {
  grid-area: body;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
}

.nmpv3-plus-layout-cover .nmpv3-title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--nmpv3-text);
  font-size: 13.5px;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.nmpv3-plus-layout-cover .nmpv3-artist {
  display: -webkit-box;
  overflow: hidden;
  color: var(--nmpv3-muted);
  font-size: 11.5px;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.nmpv3-plus-layout-cover .nmpv3-meta {
  max-width: 100%;
}

.nmpv3-plus-layout-cover .nmpv3-lyrics {
  width: 100%;
  min-height: 0;
  margin-top: 3px;
  padding: 6px 8px;
  border-left: 2px solid color-mix(in srgb, var(--nmpv3-accent) 58%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--nmpv3-accent-soft) 54%, transparent);
}

.nmpv3-plus-layout-cover .nmpv3-title,
.nmpv3-plus-layout-cover .nmpv3-artist,
.nmpv3-plus-layout-cover .nmpv3-meta,
.nmpv3-plus-layout-cover .nmpv3-lyrics,
.nmpv3-plus-layout-cover .nmpv3-lyric-original,
.nmpv3-plus-layout-cover .nmpv3-lyric-translation {
  width: 100%;
  min-width: 0;
}

.nmpv3-plus-layout-cover .nmpv3-controls {
  grid-area: controls;
  width: auto;
  justify-content: center;
  gap: 7px;
  margin-left: 0;
}

.nmpv3-plus-layout-cover .nmpv3-play {
  width: 40px;
  height: 40px;
  min-width: 40px;
}

.nmpv3-plus-layout-cover .nmpv3-lyric-original {
  color: color-mix(in srgb, var(--nmpv3-accent) 48%, var(--nmpv3-text));
  font-size: 11px;
  font-weight: 650;
  line-height: 1.35;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.nmpv3-plus-layout-cover .nmpv3-lyric-translation {
  color: var(--nmpv3-muted);
  font-size: 10px;
}

.nmpv3-plus-layout-cover .nmpv3-bottom {
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: 9px;
}

.nmpv3-plus-layout-cover .nmpv3-progress {
  min-width: 0;
}

.nmpv3-plus-layout-cover .nmpv3-tools {
  gap: 6px;
}

.nmpv3-plus-layout-cover .nmpv3-tools .nmpv3-icon-button {
  background: color-mix(in srgb, var(--nmpv3-surface-strong) 58%, transparent);
  box-shadow: none;
}

.nmpv3-plus-layout-cover .nmpv3-tools .nmpv3-icon-button:hover,
.nmpv3-plus-layout-cover .nmpv3-tools .nmpv3-icon-button:focus-visible,
.nmpv3-plus-layout-cover .nmpv3-tools .nmpv3-icon-button.nmpv3-active {
  background: var(--nmpv3-accent-soft);
}

.nmpv3-plus-layout-cover .nmpv3-tools:not(:has(.nmpv3-mode:not([hidden]))):not(:has(.nmpv3-playlist-toggle:not([hidden]))):not(:has(.nmpv3-minimize:not([hidden]))) {
  display: none;
}

@media (max-width: 520px) {
  .nmpv3-plus-layout-card.nmpv3-player,
  .nmpv3-plus-layout-card .nmpv3-player,
  .nmpv3-plus-layout-cover.nmpv3-player,
  .nmpv3-plus-layout-cover .nmpv3-player {
    width: 100%;
  }

  .nmpv3-plus-layout-cover.nmpv3-player,
  .nmpv3-plus-layout-cover .nmpv3-player {
    --nmpv3-plus-cover-size: clamp(98px, 32vw, 112px);
    --nmpv3-plus-cover-gap: 12px;
    padding: 12px;
  }

  .nmpv3-plus-layout-cover .nmpv3-main {
    grid-template-columns: var(--nmpv3-plus-cover-size) minmax(0, 1fr);
    grid-template-areas:
      "cover body"
      "controls controls";
    align-items: center;
    row-gap: 10px;
  }

  .nmpv3-plus-layout-cover .nmpv3-cover-button {
    width: var(--nmpv3-plus-cover-size);
    height: var(--nmpv3-plus-cover-size);
  }

  .nmpv3-plus-layout-cover .nmpv3-controls {
    justify-self: center;
  }

  .nmpv3-plus-layout-cover .nmpv3-bottom {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .nmpv3-plus-layout-cover .nmpv3-tools {
    justify-content: center;
  }

  .nmpv3-plus-layout-cover .nmpv3-lyrics {
    padding: 5px 7px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nmpv3-plus-layout-card.nmpv3-player,
  .nmpv3-plus-layout-card .nmpv3-player,
  .nmpv3-plus-layout-cover.nmpv3-player,
  .nmpv3-plus-layout-cover .nmpv3-player {
    transition: none;
  }
}
`;
