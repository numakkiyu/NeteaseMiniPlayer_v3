import type { NMPv3PlusPlugin } from "../../../packages/core/src/index";

export interface NMPv3PlusCoverColorOptions {
  token?: string;
  sampleColor?: (url: string) => Promise<string>;
}

export function createCoverColorPlugin(
  options: NMPv3PlusCoverColorOptions = {},
): NMPv3PlusPlugin {
  const token = options.token ?? "--nmpv3-plus-cover-color";
  const sampleColor = options.sampleColor ?? sampleDominantColorFromImage;

  return {
    name: "nmpv3-plus-extension-cover-color",
    version: "1.0.0",
    setup(ctx) {
      return ctx.on("songchange", (payload) => {
        const picUrl = picUrlFromPayload(payload);

        if (!picUrl) {
          return;
        }

        void sampleColor(picUrl)
          .then((color) => {
            ctx.setToken(token, color);
            ctx.emit("cover-color", color);
          })
          .catch((error) => {
            ctx.logger.warn("Cover color extraction failed.", error);
          });
      });
    },
  };
}

/**
 * 从封面图片提取主色调
 * 将图片缩放到 24x24 缩略图，通过 Canvas 采样像素取平均值
 * 跳过透明像素（alpha < 16），无有效像素时返回默认暖橙色 #ff6b35
 */
export function dominantHexFromRgba(
  data: ArrayLike<number>,
  stride = 4,
): string {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += stride) {
    const alpha = stride > 3 ? (data[index + 3] ?? 255) : 255;

    if (alpha < 16) {
      continue;
    }

    red += data[index] ?? 0;
    green += data[index + 1] ?? 0;
    blue += data[index + 2] ?? 0;
    count += 1;
  }

  if (count === 0) {
    return "#ff6b35";
  }

  return rgbToHex(
    Math.round(red / count),
    Math.round(green / count),
    Math.round(blue / count),
  );
}

async function sampleDominantColorFromImage(url: string): Promise<string> {
  if (typeof Image === "undefined" || typeof document === "undefined") {
    throw new Error("Cover color extraction requires a browser document.");
  }

  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  // 24x24 缩略图在精度和性能间取得平衡
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return dominantHexFromRgba(
    context.getImageData(0, 0, canvas.width, canvas.height).data,
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Failed to load cover image: ${url}`));
    image.src = url;
  });
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function picUrlFromPayload(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("song" in payload && typeof payload.song === "object" && payload.song) {
    return picUrlFromPayload(payload.song);
  }

  return "picUrl" in payload && typeof payload.picUrl === "string"
    ? payload.picUrl
    : null;
}
