export {
  clamp,
  contrastRatio,
  hexToOklch,
  hueDistance,
  oklchContrast,
  oklchToHex,
  oklchToRgb,
  oklchToRgba,
  parseHex,
  relativeLuminance,
  rgbToOklch,
  rotateHue,
  type Oklch,
} from "./color";

export {
  defaultPaletteId,
  getPalettePreset,
  isPaletteId,
  paletteIds,
  palettePresets,
  type NMPv3PaletteId,
  type PalettePreset,
} from "./presets";

export {
  derivePalette,
  type DerivedPalette,
  type PaletteVariables,
} from "./derive";

export {
  analyzeHostColor,
  cssColorToOklch,
  type HostColorAnalysis,
} from "./host";

export {
  resolvePalette,
  suggestPaletteForHost,
  type PaletteResolveInput,
  type PaletteResolved,
} from "./resolve";
