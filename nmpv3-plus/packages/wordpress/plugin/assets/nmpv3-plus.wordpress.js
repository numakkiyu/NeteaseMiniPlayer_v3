import {
  createCustomApiSourceAdapter,
  createLocalJsonSourceAdapter,
  createNMPv3PlusRuntime,
  applyNMPv3PlusLyricsToBasePlayer,
  parseStaticLyrics,
  loadNMPv3PlusPluginPackage,
  loadNMPv3PlusSkinPackage,
  loadNMPv3PlusPlaylistIntoBasePlayer,
  officialNMPv3PlusSkins,
  resolveNMPv3PlayerFromElement,
} from "./nmpv3-plus.runtime.js";

const DEFAULT_API_BASE_URL =
  "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php";

const extensionFactories = {
  "advanced-layouts": async (root) => {
    const module =
      await import("./extensions/official/advanced-layouts/index.js");
    const layout =
      root.getAttribute("data-plus-layout") ||
      root.getAttribute("plus-layout") ||
      "card";
    return module.createAdvancedLayoutPlugin({
      layout: layout === "cover" ? "cover" : "card",
    });
  },
  visualizer: async () => {
    const module = await import("./extensions/official/visualizer/index.js");
    return module.createVisualizerPlugin();
  },
  "host-sync": async (root, settings) => {
    const module = await import("./extensions/official/host-sync/index.js");
    return module.createHostSyncPlugin({
      pageLinking: shouldEnablePageLinking(root, settings),
    });
  },
  "cover-color": async () => {
    const module = await import("./extensions/official/cover-color/index.js");
    return module.createCoverColorPlugin();
  },
  "cross-tab-sync": async () => {
    const module =
      await import("./extensions/official/cross-tab-sync/index.js");
    return module.createCrossTabSyncPlugin();
  },
  "media-session": async () => {
    const module = await import("./extensions/official/media-session/index.js");
    return module.createMediaSessionPlugin();
  },
  "custom-source": async (root, settings) => {
    const module = await import("./extensions/official/custom-source/index.js");
    const adapter = sourceAdapterFor(root, settings);
    return adapter ? module.createCustomSourcePlugin(adapter) : null;
  },
  "local-lyrics": async (root, settings) => {
    const lyricsUrl =
      root.getAttribute("lyrics-url") || settings.customLyricsUrl || "";
    const translationLyricsUrl =
      root.getAttribute("translation-lyrics-url") ||
      root.getAttribute("tlyric-url") ||
      settings.customTranslationLyricsUrl ||
      "";

    if (!lyricsUrl) {
      return null;
    }

    const module = await import("./extensions/official/local-lyrics/index.js");
    const text = await fetchText(lyricsUrl, "local lyrics");
    const translation = translationLyricsUrl
      ? await fetchText(translationLyricsUrl, "local translation lyrics")
      : "";
    const songId = root.getAttribute("song-id") || "default";
    return module.createLocalLyricsPlugin({
      [songId]: translation ? { lyric: text, translation } : text,
    });
  },
  "pwa-cache": async () => {
    const module = await import("./extensions/official/pwa-cache/index.js");
    return module.createPwaCachePlugin();
  },
};

await whenReady();
await bootNMPv3PlusWordPress();
window.addEventListener("nmpv3plus:refresh", () => {
  void bootNMPv3PlusWordPress();
});

async function bootNMPv3PlusWordPress() {
  const settings = normalizedSettings();
  syncBasePlayerApi(settings.apiBaseUrl);
  const roots = Array.from(
    document.querySelectorAll("nmp-player:not([data-nmpv3-plus-ready])"),
  );
  const runtimes = [];

  for (const root of roots) {
    root.dataset.nmpv3PlusReady = "loading";
    const runtime = createNMPv3PlusRuntime({
      root,
      eventTarget: root,
      player: resolveNMPv3PlayerFromElement(root),
      skins: officialNMPv3PlusSkins,
    });

    await installDeclaredExtensionPackages(root, runtime, settings);

    for (const extension of enabledExtensionsFor(root, settings)) {
      const factory = extensionFactories[extension];

      if (!factory) {
        continue;
      }

      try {
        const plugin = await factory(root, settings);

        if (plugin) {
          await runtime.installPlugin(plugin);
        }
      } catch (error) {
        console.warn(`NMPv3+ WordPress extension failed: ${extension}`, error);
      }
    }

    const skin = root.getAttribute("skin") || settings.defaultSkin || "default";

    await registerDeclaredSkins(root, runtime, settings);

    if (runtime.skins.get(skin)) {
      runtime.applySkin(skin, root);
    }

    await loadDeclaredSource(root, runtime, settings);
    await runtime.start();
    root.nmpv3PlusRuntime = runtime;
    root.dataset.nmpv3PlusReady = "true";
    runtimes.push(runtime);
  }

  window.NMPv3PlusWordPressRuntimes = [
    ...(window.NMPv3PlusWordPressRuntimes || []),
    ...runtimes,
  ];
  window.dispatchEvent(
    new CustomEvent("nmpv3plus:wordpress-ready", {
      detail: { runtimes },
    }),
  );
}

function normalizedSettings() {
  const config = window.NMPv3PlusWordPress || {};
  const settings = config.settings || config;

  return {
    apiBaseUrl:
      settings.apiBaseUrl ||
      window.NMPv3Config?.apiBaseUrl ||
      window.NMPv3ApiBaseUrl ||
      window.NeteaseMiniPlayerConfig?.apiBaseUrl ||
      window.NeteaseMiniPlayerApiBaseUrl ||
      window.NMPv3?.getGlobalConfig?.().apiBaseUrl ||
      DEFAULT_API_BASE_URL,
    defaultSkin: settings.defaultSkin || "default",
    enabledExtensions: Array.isArray(settings.enabledExtensions)
      ? settings.enabledExtensions
      : [],
    enabledSkins: Array.isArray(settings.enabledSkins)
      ? settings.enabledSkins
      : ["default"],
    extensionPackages: normalizePackages(settings.extensionPackages),
    skinPackages: normalizePackages(settings.skinPackages),
    localMusicJsonUrl: settings.localMusicJsonUrl || "",
    customLyricsUrl: settings.customLyricsUrl || "",
    customTranslationLyricsUrl: settings.customTranslationLyricsUrl || "",
    hostSyncEnabled: Boolean(settings.hostSyncEnabled),
    pageLinkingEnabled: Boolean(settings.pageLinkingEnabled),
  };
}

function normalizePackages(value) {
  return Array.isArray(value) ? value.filter((item) => item?.manifestUrl) : [];
}

function syncBasePlayerApi(apiBaseUrl) {
  if (!apiBaseUrl) {
    return;
  }

  window.NMPv3Config = Object.assign({}, window.NMPv3Config || {}, {
    apiBaseUrl,
  });
  window.NMPv3ApiBaseUrl = apiBaseUrl;
  window.NeteaseMiniPlayerApiBaseUrl = apiBaseUrl;

  if (typeof window.NMPv3?.setApiBaseUrl === "function") {
    window.NMPv3.setApiBaseUrl(apiBaseUrl);
    return;
  }

  if (typeof window.NMPv3?.setGlobalConfig === "function") {
    window.NMPv3.setGlobalConfig({ apiBaseUrl });
  }
}

function enabledExtensionsFor(root, settings) {
  const selected = new Set(settings.enabledExtensions);

  if (root.getAttribute("host-sync") === "true" || settings.hostSyncEnabled) {
    selected.add("host-sync");
  }

  if (shouldEnablePageLinking(root, settings)) {
    selected.add("host-sync");
  }

  if (
    root.getAttribute("source-type") ||
    root.getAttribute("source") ||
    settings.localMusicJsonUrl
  ) {
    selected.add("custom-source");
  }

  if (
    root.getAttribute("lyrics-url") ||
    root.getAttribute("translation-lyrics-url") ||
    root.getAttribute("tlyric-url") ||
    settings.customLyricsUrl ||
    settings.customTranslationLyricsUrl
  ) {
    selected.add("local-lyrics");
  }

  return Array.from(selected);
}

function shouldEnablePageLinking(root, settings) {
  return (
    root.getAttribute("page-linking") === "true" ||
    Boolean(settings.pageLinkingEnabled)
  );
}

function sourceAdapterFor(root, settings) {
  const source = root.getAttribute("source") || settings.localMusicJsonUrl;

  if (source) {
    return createLocalJsonSourceAdapter();
  }

  if (settings.apiBaseUrl) {
    return createCustomApiSourceAdapter({
      baseUrl: settings.apiBaseUrl,
    });
  }

  return null;
}

async function installDeclaredExtensionPackages(root, runtime, settings) {
  const extensionUrl = root.getAttribute("extension-url") || "";
  const packages = [
    ...settings.extensionPackages,
    ...(extensionUrl
      ? [
          {
            manifestUrl: extensionUrl,
            entryUrl: root.getAttribute("extension-entry-url") || undefined,
            styleUrl: root.getAttribute("extension-style-url") || undefined,
            className: root.getAttribute("extension-class") || undefined,
            exportName: root.getAttribute("extension-export") || undefined,
          },
        ]
      : []),
  ];

  for (const extensionPackage of packages) {
    try {
      const packageResult = await loadNMPv3PlusPluginPackage(extensionPackage);
      await runtime.installPlugin(packageResult.plugin);
    } catch (error) {
      console.warn(
        `NMPv3+ WordPress extension package failed: ${extensionPackage.manifestUrl}`,
        error,
      );
    }
  }
}

async function registerDeclaredSkins(root, runtime, settings) {
  const skinUrl = root.getAttribute("skin-url") || "";
  const packages = [
    ...settings.skinPackages,
    ...(skinUrl
      ? [
          {
            manifestUrl: skinUrl,
            cssUrl: root.getAttribute("skin-css-url") || undefined,
            className: root.getAttribute("skin-class") || undefined,
          },
        ]
      : []),
  ];

  for (const skinPackage of packages) {
    try {
      runtime.registerSkin(await loadNMPv3PlusSkinPackage(skinPackage));
    } catch (error) {
      console.warn(
        `NMPv3+ WordPress skin package failed: ${skinPackage.manifestUrl}`,
        error,
      );
    }
  }
}

async function loadDeclaredSource(root, runtime, settings) {
  const input = sourceInputFor(root, settings);

  if (!input) {
    return;
  }

  const player = resolveNMPv3PlayerFromElement(root);
  await waitForBasePlayerReady(player);
  const playlist = await runtime.loadPlaylist(input);
  const currentSong = await loadNMPv3PlusPlaylistIntoBasePlayer(
    player,
    playlist,
    {
      root,
      autoplay: root.getAttribute("autoplay") === "true",
    },
  );
  await applyDeclaredLyrics(root, runtime, player, currentSong, settings);
  runtime.emit("source:loaded", {
    input,
    playlist,
    song: currentSong,
  });
}

async function waitForBasePlayerReady(player) {
  if (!player?.getState) {
    await nextFrame();
    await nextFrame();
    return;
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = player.getState();

    if (
      state?.status &&
      state.status !== "idle" &&
      state.status !== "loading"
    ) {
      return;
    }

    await delay(25);
  }
}

function nextFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(resolve);
      return;
    }

    setTimeout(resolve, 0);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sourceInputFor(root, settings) {
  const sourceType = root.getAttribute("source-type");
  const source = root.getAttribute("source") || settings.localMusicJsonUrl;

  if (source) {
    return {
      source: "local-json",
      url: source,
      id: root.getAttribute("song-id") || undefined,
    };
  }

  const sourceId =
    root.getAttribute("playlist-id") || root.getAttribute("song-id") || "";

  if (sourceType === "custom-api" && settings.apiBaseUrl && sourceId) {
    return {
      source: "custom-api",
      id: sourceId,
    };
  }

  return null;
}

async function applyDeclaredLyrics(root, runtime, player, song, settings) {
  const declaredLyrics = declaredLyricsUrls(root, song, settings);

  if (!declaredLyrics.lyricUrl && !declaredLyrics.translationLyricUrl) {
    return;
  }

  const lyrics =
    (await runtime.getLyrics({ songId: song.id, song }).catch(() => null)) ||
    (await runtime
      .getLyrics({ songId: "default", source: "static-lyrics", song })
      .catch(() => null));

  const resolvedLyrics =
    lyrics ||
    (await loadLyricsFromDeclaredUrls(song.id, declaredLyrics).catch(
      () => null,
    ));

  if (!resolvedLyrics) {
    return;
  }

  applyNMPv3PlusLyricsToBasePlayer(player, resolvedLyrics, root);
  runtime.emit("lyrics:loaded", {
    song,
    lyrics: resolvedLyrics,
  });
}

function declaredLyricsUrls(root, song, settings) {
  return {
    lyricUrl:
      root.getAttribute("lyrics-url") ||
      settings.customLyricsUrl ||
      song.lyricUrl ||
      "",
    translationLyricUrl:
      root.getAttribute("translation-lyrics-url") ||
      root.getAttribute("tlyric-url") ||
      settings.customTranslationLyricsUrl ||
      song.translationLyricUrl ||
      "",
  };
}

async function loadLyricsFromDeclaredUrls(songId, urls) {
  if (!urls.lyricUrl && !urls.translationLyricUrl) {
    return null;
  }

  const lyric = urls.lyricUrl
    ? await fetchText(urls.lyricUrl, "local lyrics")
    : "";
  const translation = urls.translationLyricUrl
    ? await fetchText(urls.translationLyricUrl, "local translation lyrics")
    : "";

  return {
    songId,
    source: "local-lyrics-url",
    raw: {
      lyricUrl: urls.lyricUrl,
      translationLyricUrl: urls.translationLyricUrl,
    },
    lines: parseStaticLyrics({
      lyric,
      translation,
    }),
  };
}

async function fetchText(url, label) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NMPv3+ ${label} request failed: ${response.status}`);
  }

  return response.text();
}

async function whenReady() {
  if (customElements?.whenDefined) {
    await customElements.whenDefined("nmp-player");
  }

  if (document.readyState === "loading") {
    await new Promise((resolve) =>
      document.addEventListener("DOMContentLoaded", resolve, { once: true }),
    );
  }
}
