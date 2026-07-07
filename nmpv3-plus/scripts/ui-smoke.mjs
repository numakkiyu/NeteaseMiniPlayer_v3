#!/usr/bin/env node
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(packageRoot, "..");
const requiredFiles = ["nmpv3/dist/nmpv3.min.js", "nmpv3-plus/dist/browser.js"];
const viewports = [
  { name: "mobile", width: 375, height: 720 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(workspaceRoot, file))) {
    throw new Error(
      `Missing ${file}. Run pnpm --filter netease-mini-player-v3 build and pnpm --filter netease-mini-player-v3-plus build first.`,
    );
  }
}

const tempDir = await mkdtemp(join(tmpdir(), "nmpv3-plus-ui-"));
const screenshotDir = join(tempDir, "screenshots");
const htmlPath = join(tempDir, "index.html");
const playlistPath = join(tempDir, "playlist.json");
const lyricsPath = join(tempDir, "lyrics.lrc");
const smokeSongTitle =
  "A very long NMPv3 Plus local JSON song title that must wrap cleanly without pushing controls outside the player";
const smokeLyric =
  "Long local lyric line loaded through NMPv3 Plus custom lyrics without horizontal overflow";
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NMPv3+ UI Smoke</title>
    <style>
      html {
        background: #f4f4f5;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        box-sizing: border-box;
        color: #202124;
        font-family: ui-sans-serif, "Segoe UI", sans-serif;
      }

      #fixture {
        width: min(100%, 420px);
        display: grid;
        justify-items: center;
      }

      nmp-player {
        width: 100%;
        display: block;
      }

      @media (max-width: 520px) {
        body {
          padding: 12px;
        }
      }
    </style>
  </head>
  <body>
    <main id="fixture" aria-label="NMPv3+ UI smoke fixture">
      <nmp-player
        id="plus-player"
        layout="compact"
        theme="auto"
        lyric="true"
        playlist="false"
        source-type="local-json"
        source="/__tmp__/playlist.json"
        lyrics-url="/__tmp__/lyrics.lrc"
        page-linking="true"
      ></nmp-player>
    </main>
    <script src="/nmpv3/dist/nmpv3.min.js"></script>
    <script>
      window.NMPv3PlusConfig = {
        defaultSkin: "default"
      };
    </script>
    <script type="module" src="/nmpv3-plus/dist/browser.js"></script>
    <script type="module">
      const playerElement = document.querySelector("#plus-player");
      await customElements.whenDefined("nmp-player");
      await waitForPlusBootstrap();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await waitForText(".nmpv3-title", ${JSON.stringify(smokeSongTitle)});
      await waitForText(".nmpv3-lyric-original", ${JSON.stringify(smokeLyric)});
      playerElement.dispatchEvent(new CustomEvent("nmpv3:songchange", {
        bubbles: true,
        detail: { song: { id: "smoke-song", name: ${JSON.stringify(smokeSongTitle)} } }
      }));
      playerElement.dispatchEvent(new CustomEvent("nmpv3:play", {
        bubbles: true,
        detail: { song: { id: "smoke-song", name: ${JSON.stringify(smokeSongTitle)} } }
      }));

      window.__nmpv3PlusSmoke = {
        ready: true,
        runtime: playerElement.nmpv3PlusRuntime
      };

      function waitForPlusBootstrap() {
        if (window.NMPv3PlusRuntimes?.length) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          window.addEventListener("nmpv3plus:ready", resolve, { once: true });
        });
      }

      async function waitForText(selector, expected) {
        for (let attempt = 0; attempt < 80; attempt += 1) {
          if (document.querySelector(selector)?.textContent?.trim() === expected) {
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 25));
        }

        throw new Error(selector + " did not render expected text");
      }
    </script>
  </body>
</html>
`;

await writeFile(htmlPath, html);
await writeFile(
  playlistPath,
  JSON.stringify(
    {
      id: "smoke-local-list",
      name: "NMPv3+ Local JSON Smoke",
      songs: [
        {
          id: "smoke-song",
          name: smokeSongTitle,
          artists: "NMPv3+ Local JSON / Host Sync / Base Compact UI",
          album: "Smoke fixture",
          url: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
          duration: 185000,
        },
      ],
    },
    null,
    2,
  ),
);
await writeFile(lyricsPath, `[00:00.00]${smokeLyric}\n`);

const server = createStaticServer(workspaceRoot, tempDir);
await new Promise((resolveServer) =>
  server.listen(0, "127.0.0.1", resolveServer),
);

const address = server.address();
const port = typeof address === "object" && address ? address.port : 0;
const baseUrl = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const messages = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) {
        messages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      messages.push(`pageerror: ${error.message}`);
    });

    await page.goto(`${baseUrl}/__tmp__/index.html`, {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(() => window.__nmpv3PlusSmoke?.ready === true);
    await page.waitForTimeout(120);

    const metrics = await page.evaluate(() => {
      const player = document.querySelector("#plus-player");
      const shell = document.querySelector(".nmpv3-player");
      const cover = document.querySelector(".nmpv3-cover-button");
      const play = document.querySelector(".nmpv3-play");
      const previous = document.querySelector(".nmpv3-previous");
      const next = document.querySelector(".nmpv3-next");
      const selectors = [
        ".nmpv3-player",
        ".nmpv3-main",
        ".nmpv3-cover-button",
        ".nmpv3-title",
        ".nmpv3-artist",
        ".nmpv3-lyric-original",
        ".nmpv3-controls",
        ".nmpv3-play",
        ".nmpv3-bottom",
      ];

      function rectFor(selector) {
        const node = document.querySelector(selector);
        if (!node) {
          return null;
        }
        const rect = node.getBoundingClientRect();
        return {
          selector,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            getComputedStyle(node).visibility !== "hidden" &&
            getComputedStyle(node).display !== "none",
        };
      }

      player.dispatchEvent(
        new CustomEvent("nmpv3:pause", {
          bubbles: true,
          detail: { song: { id: "smoke-song" } },
        }),
      );
      player.dispatchEvent(
        new CustomEvent("nmpv3:play", {
          bubbles: true,
          detail: { song: { id: "smoke-song" } },
        }),
      );

      return {
        title: document.title,
        bodyText: document.body.innerText,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        htmlSong: document.documentElement.getAttribute("data-nmpv3-plus-song"),
        linkedSong: document.documentElement.getAttribute(
          "data-nmpv3-plus-linked-song",
        ),
        linkedTitle: document.documentElement.getAttribute(
          "data-nmpv3-plus-linked-title",
        ),
        urlSong: new URL(window.location.href).searchParams.get("nmp_song"),
        titleText:
          document.querySelector(".nmpv3-title")?.textContent?.trim() ?? "",
        lyricText:
          document
            .querySelector(".nmpv3-lyric-original")
            ?.textContent?.trim() ?? "",
        htmlPlaying: document.documentElement.classList.contains(
          "nmpv3-plus-is-playing",
        ),
        shellLayout: shell?.dataset.nmpv3PlusLayout ?? null,
        shellClasses: shell?.className ?? "",
        baseLayout: shell?.getAttribute("data-layout") ?? null,
        skinData: player?.dataset.nmpv3PlusSkin ?? null,
        skin: player?.className ?? "",
        hasVisualizer: Boolean(
          document.querySelector(".nmpv3-plus-visualizer"),
        ),
        hasAdvancedLayout: Boolean(
          document.querySelector(
            ".nmpv3-plus-layout-card, .nmpv3-plus-layout-cover",
          ),
        ),
        playButtonAlignedWithMain: isVerticallyAligned(play, shell),
        coverSize: cover
          ? {
              width: cover.getBoundingClientRect().width,
              height: cover.getBoundingClientRect().height,
            }
          : null,
        previousHidden:
          previous?.hidden === true ||
          getComputedStyle(previous).display === "none",
        nextHidden:
          next?.hidden === true || getComputedStyle(next).display === "none",
        rects: selectors.map(rectFor).filter(Boolean),
      };

      function isVerticallyAligned(node, container) {
        if (!node || !container) {
          return false;
        }

        const nodeRect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const nodeCenterY = nodeRect.top + nodeRect.height / 2;

        return (
          nodeCenterY >= containerRect.top + 20 &&
          nodeCenterY <= containerRect.bottom - 20
        );
      }
    });

    const screenshotPath = join(screenshotDir, `${viewport.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await page.close();

    assertSmokeMetrics(viewport, metrics, messages);
    results.push({
      viewport,
      screenshotPath,
      metrics,
    });
  }
} catch (error) {
  if (process.env.NMPV3_PLUS_KEEP_UI_SMOKE !== "1") {
    await rm(tempDir, { recursive: true, force: true });
  }

  throw error;
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      browser: "Playwright chromium",
      url: `${baseUrl}/__tmp__/index.html`,
      results: results.map((result) => ({
        viewport: result.viewport,
        screenshotPath: result.screenshotPath,
        scrollWidth: result.metrics.scrollWidth,
        innerWidth: result.metrics.innerWidth,
        baseLayout: result.metrics.baseLayout,
        skin: result.metrics.skinData,
        hostSong: result.metrics.htmlSong,
      })),
    },
    null,
    2,
  ),
);

if (process.env.NMPV3_PLUS_KEEP_UI_SMOKE !== "1") {
  await rm(tempDir, { recursive: true, force: true });
}

function assertSmokeMetrics(viewport, metrics, messages) {
  const failures = [];

  if (metrics.title !== "NMPv3+ UI Smoke") {
    failures.push(`unexpected title: ${metrics.title}`);
  }

  if (!metrics.rects.some((rect) => rect.selector === ".nmpv3-player")) {
    failures.push("page appears blank or missing player text");
  }

  if (messages.length > 0) {
    failures.push(`console issues: ${messages.join(" | ")}`);
  }

  if (metrics.scrollWidth > metrics.innerWidth + 1) {
    failures.push(
      `horizontal overflow: scrollWidth ${metrics.scrollWidth} > viewport ${metrics.innerWidth}`,
    );
  }

  if (metrics.baseLayout !== "compact") {
    failures.push(`base compact layout not preserved: ${metrics.baseLayout}`);
  }

  if (metrics.shellLayout !== null || metrics.hasAdvancedLayout) {
    failures.push(
      `advanced layout leaked into default smoke: layout=${metrics.shellLayout}, class=${metrics.shellClasses}`,
    );
  }

  if (metrics.hasVisualizer) {
    failures.push("visualizer leaked into default smoke");
  }

  if (metrics.skinData !== "default") {
    failures.push(`default skin was not applied: ${metrics.skinData}`);
  }

  if (metrics.skin.includes("nmpv3-plus-skin-glass")) {
    failures.push(`glass skin leaked into default smoke: ${metrics.skin}`);
  }

  if (metrics.htmlSong !== smokeSongTitle) {
    failures.push(`host sync song mismatch: ${metrics.htmlSong}`);
  }

  if (metrics.linkedSong !== "smoke-song" || metrics.urlSong !== "smoke-song") {
    failures.push(
      `page linking mismatch: linked=${metrics.linkedSong}, url=${metrics.urlSong}`,
    );
  }

  if (metrics.linkedTitle !== smokeSongTitle) {
    failures.push(`page linking title mismatch: ${metrics.linkedTitle}`);
  }

  if (metrics.titleText !== smokeSongTitle) {
    failures.push(`local-json title did not render: ${metrics.titleText}`);
  }

  if (metrics.lyricText !== smokeLyric) {
    failures.push(`local lyrics did not render: ${metrics.lyricText}`);
  }

  if (!metrics.htmlPlaying) {
    failures.push("host sync playing class was not applied");
  }

  if (!metrics.playButtonAlignedWithMain) {
    failures.push("play button is visually detached from the main player");
  }

  if (!metrics.previousHidden || !metrics.nextHidden) {
    failures.push("single-song previous/next controls are visible");
  }

  const playerRect = metrics.rects.find(
    (rect) => rect.selector === ".nmpv3-player",
  );
  const maxPlayerHeight = viewport.name === "mobile" ? 250 : 220;

  if (playerRect && playerRect.height > maxPlayerHeight) {
    failures.push(
      `player is too tall for ${viewport.name}: ${playerRect.height} > ${maxPlayerHeight}`,
    );
  }

  const maxCoverSize = viewport.name === "mobile" ? 54 : 64;

  if (
    !metrics.coverSize ||
    metrics.coverSize.width > maxCoverSize ||
    metrics.coverSize.height > maxCoverSize
  ) {
    failures.push(
      `cover is too large for base ${viewport.name}: ${JSON.stringify(metrics.coverSize)}`,
    );
  }

  for (const rect of metrics.rects) {
    if (!rect.visible) {
      failures.push(`${rect.selector} is not visible`);
    }
    if (rect.left < -1 || rect.right > metrics.innerWidth + 1) {
      failures.push(
        `${rect.selector} is outside ${viewport.name} viewport: left=${rect.left}, right=${rect.right}, width=${metrics.innerWidth}`,
      );
    }
    if (rect.width > metrics.innerWidth + 1) {
      failures.push(
        `${rect.selector} wider than ${viewport.name} viewport: ${rect.width} > ${metrics.innerWidth}`,
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `${viewport.name} UI smoke failed:\n${failures.join("\n")}`,
    );
  }
}

function createStaticServer(rootDir, tmpDir) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname);
      const filePath = resolveStaticPath(rootDir, tmpDir, pathname);

      if (!filePath) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      response.writeHead(200, {
        "content-type": mimeType(filePath),
        "cache-control": "no-store",
      });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(404);
      response.end(error instanceof Error ? error.message : "Not found");
    }
  });
}

function resolveStaticPath(rootDir, tmpDir, pathname) {
  if (pathname.startsWith("/__tmp__/")) {
    const relative = normalize(pathname.replace(/^\/__tmp__\//, ""));
    const target = resolve(tmpDir, relative);
    return inside(target, tmpDir) ? target : null;
  }

  const relative = normalize(pathname.replace(/^\/+/, ""));
  const target = resolve(rootDir, relative);
  return inside(target, rootDir) ? target : null;
}

function inside(target, root) {
  const relative = target.slice(root.length);
  return target === root || relative.startsWith(sep);
}

function mimeType(filePath) {
  switch (extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
