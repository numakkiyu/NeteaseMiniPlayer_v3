export const defaultSkinCssText =
  "/* Default skin intentionally preserves the base NMPv3 visual language. */";

export const glassSkinCssText = `
.nmpv3-plus-skin-glass .nmpv3-player {
  backdrop-filter: blur(18px) saturate(1.12);
}

.nmpv3-plus-skin-glass .nmpv3-cover {
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.24);
}
`;

export const minimalSkinCssText = `
.nmpv3-plus-skin-minimal .nmpv3-player {
  border-style: solid;
}

.nmpv3-plus-skin-minimal .nmpv3-cover {
  filter: saturate(0.92);
}
`;

export const animeSkinCssText = `
.nmpv3-plus-skin-anime .nmpv3-player {
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96),
    rgba(255, 245, 248, 0.92)
  );
}

.nmpv3-plus-skin-anime .nmpv3-cover {
  box-shadow:
    0 0 0 3px rgba(255, 111, 145, 0.16),
    0 16px 38px rgba(255, 111, 145, 0.22);
}
`;

export const cyberSkinCssText = `
.nmpv3-plus-skin-cyber .nmpv3-player {
  background-image: linear-gradient(
    135deg,
    rgba(11, 15, 20, 0.98),
    rgba(15, 23, 31, 0.94)
  );
}

.nmpv3-plus-skin-cyber .nmpv3-cover {
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.32),
    0 0 32px rgba(34, 211, 238, 0.18);
}
`;

export const vinylSkinCssText = `
.nmpv3-plus-skin-vinyl .nmpv3-player {
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9),
    rgba(246, 241, 234, 0.94)
  );
}

.nmpv3-plus-skin-vinyl .nmpv3-cover {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.35),
    0 18px 42px rgba(65, 48, 33, 0.24);
}
`;
