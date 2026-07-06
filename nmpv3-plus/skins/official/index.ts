import type { NMPv3PlusSkin } from "../../packages/core/src/types";
import {
  animeSkinCssText,
  cyberSkinCssText,
  defaultSkinCssText,
  glassSkinCssText,
  minimalSkinCssText,
  vinylSkinCssText,
} from "./styleText";

export const defaultNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "default",
  displayName: "Default",
  version: "1.0.0",
  author: "BHCN STUDIO",
  supports: ["mini", "compact", "dock", "card", "cover"],
  tokens: {},
  cssText: defaultSkinCssText,
};

export const glassNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "glass",
  displayName: "Glass",
  version: "1.0.0",
  author: "BHCN STUDIO",
  supports: ["mini", "compact", "dock", "card", "cover"],
  className: "nmpv3-plus-skin-glass",
  tokens: {
    "--nmpv3-bg": "rgba(255, 255, 255, 0.72)",
    "--nmpv3-border": "rgba(255, 255, 255, 0.46)",
    "--nmpv3-shadow": "0 18px 52px rgba(18, 24, 40, 0.18)",
    "--nmpv3-radius": "20px",
  },
  cssText: glassSkinCssText,
};

export const minimalNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "minimal",
  displayName: "Minimal",
  version: "1.0.0",
  author: "BHCN STUDIO",
  supports: ["mini", "compact", "dock", "card", "cover"],
  className: "nmpv3-plus-skin-minimal",
  tokens: {
    "--nmpv3-bg": "#ffffff",
    "--nmpv3-text": "#1d1f24",
    "--nmpv3-muted": "#6d7280",
    "--nmpv3-border": "rgba(29,31,36,0.12)",
    "--nmpv3-shadow": "0 10px 28px rgba(16, 24, 40, 0.08)",
    "--nmpv3-radius": "12px",
  },
  cssText: minimalSkinCssText,
};

export const animeNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "anime",
  displayName: "Anime",
  version: "1.0.0",
  author: "BHCN STUDIO",
  supports: ["mini", "compact", "dock", "card", "cover"],
  className: "nmpv3-plus-skin-anime",
  tokens: {
    "--nmpv3-bg": "rgba(255, 250, 252, 0.94)",
    "--nmpv3-text": "#29212a",
    "--nmpv3-muted": "#806d8a",
    "--nmpv3-accent": "#ff6f91",
    "--nmpv3-border": "rgba(255, 111, 145, 0.22)",
    "--nmpv3-shadow": "0 18px 46px rgba(255, 111, 145, 0.16)",
    "--nmpv3-radius": "18px",
  },
  cssText: animeSkinCssText,
};

export const cyberNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "cyber",
  displayName: "Cyber",
  version: "1.0.0",
  author: "BHCN STUDIO",
  supports: ["mini", "compact", "dock", "card", "cover"],
  className: "nmpv3-plus-skin-cyber",
  tokens: {
    "--nmpv3-bg": "rgba(11, 15, 20, 0.94)",
    "--nmpv3-text": "#e8fbff",
    "--nmpv3-muted": "#88a8b2",
    "--nmpv3-accent": "#22d3ee",
    "--nmpv3-border": "rgba(34, 211, 238, 0.32)",
    "--nmpv3-shadow": "0 20px 54px rgba(0, 0, 0, 0.38)",
    "--nmpv3-radius": "14px",
  },
  cssText: cyberSkinCssText,
};

export const vinylNMPv3PlusSkin: NMPv3PlusSkin = {
  name: "vinyl",
  displayName: "Vinyl",
  version: "1.0.0",
  author: "BHCN STUDIO",
  supports: ["mini", "compact", "dock", "card", "cover"],
  className: "nmpv3-plus-skin-vinyl",
  tokens: {
    "--nmpv3-bg": "rgba(250, 248, 244, 0.95)",
    "--nmpv3-text": "#2d2822",
    "--nmpv3-muted": "#7c7167",
    "--nmpv3-accent": "#b4532a",
    "--nmpv3-border": "rgba(92, 70, 48, 0.16)",
    "--nmpv3-shadow": "0 18px 42px rgba(65, 48, 33, 0.16)",
    "--nmpv3-radius": "16px",
  },
  cssText: vinylSkinCssText,
};

export const officialNMPv3PlusSkins = [
  defaultNMPv3PlusSkin,
  glassNMPv3PlusSkin,
  minimalNMPv3PlusSkin,
  animeNMPv3PlusSkin,
  cyberNMPv3PlusSkin,
  vinylNMPv3PlusSkin,
];
