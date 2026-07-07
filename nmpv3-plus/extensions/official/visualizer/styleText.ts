export const nmpv3PlusVisualizerCssText = `
.nmpv3-plus-visualizer {
  position: absolute;
  inset: auto 14px 12px auto;
  z-index: 3;
  display: inline-grid;
  grid-auto-flow: column;
  align-items: end;
  gap: 3px;
  width: max-content;
  max-width: calc(100% - 28px);
  height: 22px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(3px);
  will-change: transform, opacity;
  contain: layout paint;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.nmpv3-plus-visualizer[data-state="ready"] {
  opacity: 0.42;
}

.nmpv3-plus-visualizer[data-state="playing"] {
  opacity: 0.78;
  transform: translateY(0);
}

.nmpv3-plus-visualizer__bar {
  width: 3px;
  min-height: 5px;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--nmpv3-plus-cover-color, var(--nmpv3-accent, #ff6b35)) 76%, white),
    var(--nmpv3-plus-cover-color, var(--nmpv3-accent, #ff6b35))
  );
  opacity: 0.84;
  transform: scaleY(0.42);
  transform-origin: 50% 100%;
  will-change: transform, opacity;
}

.nmpv3-plus-visualizer[data-mode="wave"] .nmpv3-plus-visualizer__bar {
  border-radius: 3px;
}

.nmpv3-plus-visualizer[data-mode="ambient"] {
  inset: 10px 10px auto auto;
  height: 18px;
  filter: blur(0.2px);
}

.nmpv3-plus-layout-card .nmpv3-plus-visualizer,
.nmpv3-plus-layout-cover .nmpv3-plus-visualizer {
  position: absolute;
  inset: auto 14px 14px auto;
  margin: 0;
}

.nmpv3-plus-layout-cover .nmpv3-plus-visualizer {
  top: calc(14px + var(--nmpv3-plus-cover-size, 128px) - 20px);
  right: auto;
  bottom: auto;
  left: calc(14px + (var(--nmpv3-plus-cover-size, 128px) - 80px) / 2);
  width: 80px;
  max-width: 80px;
  height: 18px;
  justify-content: center;
  gap: 2.5px;
  padding: 3px 5px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(10, 13, 18, 0.28);
  backdrop-filter: blur(8px) saturate(1.08);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.nmpv3-plus-layout-cover .nmpv3-plus-visualizer__bar {
  width: 2.5px;
  min-height: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .nmpv3-plus-visualizer {
    transition: none;
    transform: none;
  }

  .nmpv3-plus-visualizer__bar {
    transform: scaleY(0.68);
    will-change: auto;
  }
}

@media (max-width: 520px) {
  .nmpv3-plus-layout-cover .nmpv3-plus-visualizer {
    top: calc(12px + var(--nmpv3-plus-cover-size, 104px) - 19px);
    left: calc(12px + (var(--nmpv3-plus-cover-size, 104px) - 76px) / 2);
    width: 76px;
    max-width: 76px;
  }
}
`;
