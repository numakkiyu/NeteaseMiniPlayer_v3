import { icons } from "./icons";
import { getWindow } from "../utils/env";
import {
  classNames as c,
  cx,
  playModeClassNames,
  stateClassNames as sc,
} from "./classNames";
import type {
  NMPv3Config,
  NMPv3LoadStatus,
  NMPv3LyricLine,
  NMPv3LyricStatus,
  NMPv3PlayMode,
  NMPv3Song,
} from "../types";

export interface NMPv3ViewState {
  song: NMPv3Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  status: NMPv3LoadStatus;
  errorMessage?: string;
  lyric: NMPv3LyricLine | null;
  lyricStatus: NMPv3LyricStatus;
  playMode: NMPv3PlayMode;
  currentIndex: number;
  playlist: NMPv3Song[];
  showLyrics: boolean;
  isPlaylistOpen: boolean;
  isMinimized: boolean;
}

export interface NMPv3RenderedElements {
  root: HTMLElement;
  cover: HTMLImageElement;
  fallbackCover: HTMLElement;
  title: HTMLElement;
  titleText: HTMLElement;
  artist: HTMLElement;
  artistText: HTMLElement;
  album: HTMLElement;
  order: HTMLElement;
  modeBadge: HTMLElement;
  lyricOriginal: HTMLElement;
  lyricOriginalText: HTMLElement;
  lyricTranslation: HTMLElement;
  lyricTranslationText: HTMLElement;
  playButton: HTMLButtonElement;
  playIcon: HTMLElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  progressTrack: HTMLElement;
  progressBar: HTMLElement;
  currentTime: HTMLElement;
  totalTime: HTMLElement;
  volumeTrack: HTMLElement;
  volumeBar: HTMLElement;
  lyricsButton: HTMLButtonElement;
  modeButton: HTMLButtonElement;
  playlistButton: HTMLButtonElement;
  minimizeButton: HTMLButtonElement;
  playlistPanel: HTMLElement;
  playlistList: HTMLElement;
  status: HTMLElement;
  miniPanel: HTMLElement;
  miniTitle: HTMLElement;
  miniSubtitle: HTMLElement;
  miniMode: HTMLElement;
}

/**
 * 首次渲染播放器 DOM 骨架并返回所有可交互元素的引用
 */
export function renderPlayerShell(
  target: HTMLElement,
  config: NMPv3Config,
): NMPv3RenderedElements {
  target.innerHTML = "";

  const root = element("div", c.player);
  applyRootConfig(root, config);
  root.dataset.status = "idle";
  root.tabIndex = 0;
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "NeteaseMiniPlayer v3");

  const main = element("div", c.main);
  const miniPanel = element("div", c.miniPanel);
  miniPanel.setAttribute("aria-hidden", "true");
  const miniTitle = element("div", c.miniTitle);
  const miniSubtitle = element("div", c.miniSubtitle);
  const miniMode = element("div", c.miniMode);
  const miniActions = element("div", c.miniActions);
  miniActions.setAttribute("aria-hidden", "true");
  miniPanel.append(miniTitle, miniSubtitle, miniMode, miniActions);

  const coverWrap = element("button", c.coverButton) as HTMLButtonElement;
  coverWrap.type = "button";
  coverWrap.setAttribute(
    "aria-label",
    "在网易云音乐打开当前歌曲",
  );

  const cover = document.createElement("img");
  cover.className = c.cover;
  cover.alt = "";
  cover.loading = "lazy";

  const fallbackCover = element("span", c.coverFallback);
  fallbackCover.textContent = "NMP";
  coverWrap.append(cover, fallbackCover, element("span", c.vinylRing));

  const body = element("div", c.body);
  const title = element("div", c.title);
  const titleText = element("span", c.titleText);
  title.append(titleText);
  const artist = element("div", c.artist);
  const artistText = element("span", c.artistText);
  artist.append(artistText);
  const meta = element("div", c.meta);
  const album = element("span", c.album);
  const order = element("span", c.order);
  const modeBadge = element("span", c.modeBadge);
  meta.append(album, order, modeBadge);
  const lyrics = element("div", c.lyrics);
  const lyricOriginal = element("div", c.lyricOriginal);
  const lyricOriginalText = element("span", c.lyricOriginalText);
  lyricOriginal.append(lyricOriginalText);
  const lyricTranslation = element("div", c.lyricTranslation);
  const lyricTranslationText = element("span", c.lyricTranslationText);
  lyricTranslation.append(lyricTranslationText);
  lyrics.append(lyricOriginal, lyricTranslation);
  body.append(title, artist, meta, lyrics);

  const controls = element("div", c.controls);
  const previousButton = iconButton(
    c.previousButton,
    "上一首",
    icons.previous,
  );
  const playButton = iconButton(c.playButton, "播放", icons.play);
  const playIcon = playButton.querySelector("span") as HTMLElement;
  const nextButton = iconButton(c.nextButton, "下一首", icons.next);
  controls.append(previousButton, playButton, nextButton);
  main.append(coverWrap, miniPanel, body, controls);

  const bottom = element("div", c.bottom);
  const progress = element("div", c.progress);
  const currentTime = element("span", cx(c.time, c.currentTime));
  const progressTrack = element("button", c.progressTrack) as HTMLButtonElement;
  progressTrack.type = "button";
  progressTrack.setAttribute("aria-label", "调整播放进度");
  const progressBar = element("span", c.progressBar);
  progressTrack.append(progressBar);
  const totalTime = element("span", cx(c.time, c.totalTime));
  progress.append(currentTime, progressTrack, totalTime);

  const tools = element("div", c.tools);
  const volume = element("div", c.volume);
  volume.innerHTML = icons.volume;
  const volumeTrack = element("button", c.volumeTrack) as HTMLButtonElement;
  volumeTrack.type = "button";
  volumeTrack.setAttribute("aria-label", "调整音量");
  const volumeBar = element("span", c.volumeBar);
  volumeTrack.append(volumeBar);
  volume.append(volumeTrack);

  const lyricsButton = iconButton(
    c.lyricsToggle,
    "显示或隐藏歌词",
    icons.lyrics,
  );
  const modeButton = iconButton(c.modeButton, "切换播放模式", icons.loop);
  const playlistButton = iconButton(
    c.playlistToggle,
    "显示歌单",
    icons.list,
  );
  const minimizeButton = iconButton(
    c.minimizeButton,
    "收起",
    icons.minimize,
  );
  tools.append(
    volume,
    lyricsButton,
    modeButton,
    playlistButton,
    minimizeButton,
  );
  bottom.append(progress, tools);

  const playlistPanel = element("div", c.playlistPanel);
  const playlistList = element("div", c.playlistList);
  playlistPanel.append(playlistList);

  const status = element("div", c.status);
  root.append(main, bottom, playlistPanel, status);
  target.append(root);

  return {
    root,
    cover,
    fallbackCover,
    title,
    titleText,
    artist,
    artistText,
    album,
    order,
    modeBadge,
    lyricOriginal,
    lyricOriginalText,
    lyricTranslation,
    lyricTranslationText,
    playButton,
    playIcon,
    previousButton,
    nextButton,
    progressTrack,
    progressBar,
    currentTime,
    totalTime,
    volumeTrack,
    volumeBar,
    lyricsButton,
    modeButton,
    playlistButton,
    minimizeButton,
    playlistPanel,
    playlistList,
    status,
    miniPanel,
    miniTitle,
    miniSubtitle,
    miniMode,
  };
}

/**
 * 增量更新 UI：仅修改已变化的文本、样式和属性
 * 不重新创建 DOM，避免丢失事件绑定
 */
export function updatePlayerView(
  elements: NMPv3RenderedElements,
  config: NMPv3Config,
  state: NMPv3ViewState,
): void {
  applyRootConfig(elements.root, config);
  elements.root.dataset.status = state.status;
  elements.root.classList.toggle(sc.isPlaying, state.isPlaying);
  elements.root.classList.toggle(sc.isMinimized, state.isMinimized);
  elements.root.classList.toggle(sc.playlistOpen, state.isPlaylistOpen);
  elements.root.classList.toggle(sc.isArticle, config.embedMode === "article");

  const song = state.song;
  const isSingleSong = state.playlist.length <= 1;
  /*
   * 标题只放「内容」：歌名 > 加载提示 > 空。
   * 错误信息不再顶替歌名 —— 它属于状态，交给底部状态条表述。
   */
  const hasError = state.status === "error";
  const isLoading = state.status === "loading";

  elements.titleText.textContent = song?.name
    ? song.name
    : hasError
      ? "暂时无法播放"
      : isLoading
        ? "正在加载…"
        : "网易云音乐";
  /*
   * 副标题放歌手。
   * 加载中/无歌时不显示英文长句，留空比堆 SEO 式文案更干净。
   */
  elements.artistText.textContent = hasError
    ? ""
    : isLoading
      ? ""
      : song?.artists || "";
  syncMarquee(elements.title, elements.titleText, "x");
  syncMarquee(elements.artist, elements.artistText, "x");
  elements.album.textContent = song?.album ? `专辑：${song.album}` : "";
  elements.album.hidden = !song?.album;
  elements.order.textContent =
    state.playlist.length > 0
      ? `${state.currentIndex + 1}/${state.playlist.length}`
      : "0/0";
  elements.order.hidden = isSingleSong;
  elements.modeBadge.textContent = playModeTitle(state.playMode);
  elements.modeBadge.className = cx(
    c.modeBadge,
    playModeClassNames[state.playMode],
  );
  elements.modeBadge.hidden = isSingleSong;
  elements.cover.hidden = !song?.picUrl;
  elements.fallbackCover.hidden = Boolean(song?.picUrl);
  if (song?.picUrl && elements.cover.src !== song.picUrl) {
    elements.cover.src = song.picUrl;
  }

  const lyric = state.lyric;
  elements.lyricOriginalText.textContent = state.showLyrics
    ? lyric?.text || lyricFallback(state.status, state.lyricStatus)
    : "";
  elements.lyricTranslationText.textContent =
    state.showLyrics && lyric?.translation ? lyric.translation : "";
  elements.lyricTranslation.hidden = !state.showLyrics || !lyric?.translation;
  // 原文与译文各占一行，每行都不折行，超长时各自横向滚动
  syncMarquee(elements.lyricOriginal, elements.lyricOriginalText, "x");
  syncMarquee(elements.lyricTranslation, elements.lyricTranslationText, "x");
  elements.lyricsButton.classList.toggle(sc.active, state.showLyrics);

  setIconHtml(
    elements.playIcon,
    state.isPlaying ? icons.pause : icons.play,
  );
  elements.playButton.setAttribute(
    "aria-label",
    state.isPlaying ? "暂停" : "播放",
  );
  elements.progressBar.style.width = `${progressPercent(state.currentTime, state.duration)}%`;
  elements.currentTime.textContent = formatTime(state.currentTime);
  elements.totalTime.textContent = formatDurationLabel(state.duration);
  elements.volumeBar.style.width = `${Math.round(state.volume * 100)}%`;
  setIconHtml(
    elements.modeButton,
    `<span>${playModeIcon(state.playMode)}</span>`,
  );
  elements.modeButton.title = playModeTitle(state.playMode);
  elements.modeButton.setAttribute("aria-label", playModeTitle(state.playMode));
  elements.modeButton.hidden = isSingleSong;
  elements.playlistButton.classList.toggle(sc.active, state.isPlaylistOpen);
  elements.playlistButton.hidden =
    !config.showPlaylist ||
    config.embedMode === "article" ||
    state.playlist.length <= 1;
  elements.previousButton.hidden =
    config.embedMode === "article" || isSingleSong;
  elements.nextButton.hidden = config.embedMode === "article" || isSingleSong;
  elements.minimizeButton.hidden =
    config.embedMode === "article" || config.position === "static";
  setIconHtml(
    elements.minimizeButton,
    `<span>${state.isMinimized ? icons.maximize : icons.minimize}</span>`,
  );
  elements.minimizeButton.setAttribute(
    "aria-label",
    state.isMinimized ? "展开播放器" : "收起成唱片",
  );
  /*
   * 错误只在状态条出现一次。
   * 文案中文化；原始技术信息放进 title，方便排查又不吓到用户。
   */
  if (state.status === "error") {
    elements.status.textContent = friendlyErrorMessage(state.errorMessage);
    elements.status.title = state.errorMessage ?? "";
    elements.status.hidden = false;
  } else {
    elements.status.textContent = "";
    elements.status.removeAttribute("title");
    elements.status.hidden = true;
  }
  elements.miniTitle.textContent = song?.name || "正在加载…";
  elements.miniSubtitle.textContent = song?.artists || "";
  elements.miniMode.textContent = playModeTitle(state.playMode);
  elements.miniMode.hidden = isSingleSong;

  renderPlaylist(elements, state);
}

/** 档位 1-10 映射到缩放因子：5 为 1.0 倍，每档 ±0.1（1→0.6，10→1.5） */
export function scaleFromLevel(level: number): number {
  const clamped = Math.min(10, Math.max(1, level));
  return Math.round((0.6 + (clamped - 1) * 0.1) * 100) / 100;
}

/**
 * 档位对应的基准缩放因子
 *
 * `auto` 固定为 5 档（1.0 倍）。
 * 窄屏适配不在这里做——由 NMPv3Player.applyScaleFit() 按容器实际宽度
 * 统一收窄，保证「宽度与内部尺寸用同一个因子」，即真正的等比缩小。
 */
export function resolveScaleFactor(scale: NMPv3Config["scale"]): number {
  return scale === "auto" ? 1 : scaleFromLevel(scale);
}

function applyRootConfig(root: HTMLElement, config: NMPv3Config): void {
  // --nmpv3-s 由 NMPv3Player.applyScaleFit() 统一写入（档位因子 × 容器适配因子），
  // 这里不再设置，避免每次 updateView 把适配结果重置回档位原值
  root.dataset.theme = config.theme;
  root.dataset.layout = config.layout;
  root.dataset.embedMode = config.embedMode;
  root.dataset.position = config.position;
  root.dataset.draggable = String(config.draggable);
  root.style.setProperty("--nmpv3-idle-opacity", String(config.idleOpacity));
}

function renderPlaylist(
  elements: NMPv3RenderedElements,
  state: NMPv3ViewState,
): void {
  const isOpen = state.isPlaylistOpen && state.playlist.length > 1;
  const previousPanelState = elements.playlistPanel.dataset.state;
  const previousPlaylistSignature =
    elements.playlistList.dataset.playlistSignature;
  const previousActiveIndex = elements.playlistList.dataset.activeIndex;
  // 列表引用与长度未变时复用上次签名，避免 timeupdate 反复遍历上千首歌曲
  let playlistSignature = playlistSignatureCache.get(elements.playlistList);

  if (
    !playlistSignature ||
    playlistSignature.playlistRef !== state.playlist ||
    playlistSignature.length !== state.playlist.length
  ) {
    const signature = state.playlist
      .map((song) =>
        [
          song.id,
          song.name,
          song.artists ?? "",
          song.picUrl ?? "",
          song.duration ?? "",
        ].join("\u001f"),
      )
      .join("\u001e");
    playlistSignature = {
      playlistRef: state.playlist,
      length: state.playlist.length,
      signature,
    };
    playlistSignatureCache.set(elements.playlistList, playlistSignature);
  }

  const signature = playlistSignature.signature;
  const shouldSyncActiveScroll = shouldSyncPlaylistScroll({
    isOpen,
    previousPanelState,
    previousPlaylistSignature,
    previousActiveIndex,
    playlistSignature: signature,
    currentIndex: state.currentIndex,
  });

  elements.playlistPanel.setAttribute("aria-hidden", String(!isOpen));
  elements.playlistPanel.dataset.state = isOpen ? "open" : "closed";

  if (elements.playlistList.dataset.playlistSignature !== signature) {
    elements.playlistList.textContent = "";
    elements.playlistList.dataset.playlistSignature = signature;
    const items: HTMLButtonElement[] = [];

    state.playlist.forEach((song, index) => {
      const item = element("button", c.playlistItem) as HTMLButtonElement;
      item.type = "button";
      item.dataset.index = String(index);
      item.style.setProperty(
        "--nmpv3-playlist-item-delay",
        `${Math.min(index, 10) * 12}ms`,
      );

      const number = element("span", c.playlistIndex);
      number.textContent = String(index + 1).padStart(2, "0");
      const cover = document.createElement("img");
      cover.className = c.playlistCover;
      cover.alt = "";
      cover.loading = "lazy";
      cover.draggable = false;
      if (song.picUrl) {
        cover.src = song.picUrl;
      } else {
        cover.classList.add(c.noCover);
      }
      const info = element("span", c.playlistInfo);
      const name = element("span", c.playlistName);
      name.textContent = song.name;
      const artist = element("span", c.playlistArtist);
      artist.textContent = song.artists || "未知歌手";
      const duration = element("span", c.playlistDuration);
      duration.textContent = formatTime(
        song.duration ? song.duration / 1000 : 0,
      );
      info.append(name, artist);
      item.append(number, cover, info, duration);
      elements.playlistList.append(item);
      items.push(item);
    });

    playlistItemCache.set(elements.playlistList, items);
  }

  // 用缓存的 item 引用直接更新状态，避免每次渲染都全量 querySelectorAll
  const items =
    playlistItemCache.get(elements.playlistList) ??
    Array.from(
      elements.playlistList.querySelectorAll<HTMLButtonElement>(
        `.${c.playlistItem}`,
      ),
    );
  let active: HTMLElement | undefined;

  items.forEach((item, index) => {
    const isActive = index === state.currentIndex;
    item.classList.toggle(sc.active, isActive);
    item.setAttribute("aria-current", isActive ? "true" : "false");
    item.tabIndex = isOpen ? 0 : -1;

    if (isActive) {
      active = item;
    }
  });
  elements.playlistList.dataset.activeIndex = String(state.currentIndex);

  if (active && shouldSyncActiveScroll) {
    const list = elements.playlistList;
    const activeTop = active.offsetTop;
    const activeBottom = activeTop + active.offsetHeight;

    if (activeTop < list.scrollTop) {
      list.scrollTop = activeTop;
    } else if (activeBottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = activeBottom - list.clientHeight;
    }
  }
}

interface PlaylistSignatureCache {
  playlistRef: readonly NMPv3Song[];
  length: number;
  signature: string;
}

/** 歌单签名缓存：按列表元素隔离，避免 timeupdate 反复重算上千项签名 */
const playlistSignatureCache = new WeakMap<
  HTMLElement,
  PlaylistSignatureCache
>();

/** 歌单项引用缓存：替代每次渲染的 querySelectorAll 全遍历 */
const playlistItemCache = new WeakMap<HTMLElement, HTMLButtonElement[]>();

export function shouldSyncPlaylistScroll({
  isOpen,
  previousPanelState,
  previousPlaylistSignature,
  previousActiveIndex,
  playlistSignature,
  currentIndex,
}: {
  isOpen: boolean;
  previousPanelState?: string;
  previousPlaylistSignature?: string;
  previousActiveIndex?: string;
  playlistSignature: string;
  currentIndex: number;
}): boolean {
  if (!isOpen) {
    return false;
  }

  return (
    previousPanelState !== "open" ||
    previousPlaylistSignature !== playlistSignature ||
    previousActiveIndex !== String(currentIndex)
  );
}

function iconButton(
  className: string,
  label: string,
  icon: string,
): HTMLButtonElement {
  const button = element(
    "button",
    cx(c.iconButton, className),
  ) as HTMLButtonElement;
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<span>${icon}</span>`;
  return button;
}

function element(tagName: string, className: string): HTMLElement {
  const node = document.createElement(tagName);
  node.className = className;
  return node;
}

/**
 * 仅在内容变化时写入 innerHTML
 * timeupdate 约每 250ms 触发一次全量刷新，重复写入相同 SVG 会造成无谓的子树重建
 */
function setIconHtml(target: HTMLElement, html: string): void {
  if (target.dataset.iconHtml === html) {
    return;
  }

  target.dataset.iconHtml = html;
  target.innerHTML = html;
}

/** 记录每个容器上次的文本，避免每帧都做一次强制布局测量 */
const marqueeTextCache = new WeakMap<HTMLElement, string>();

/**
 * 文本溢出时启用往复滚动，把因宽度/高度被截断的内容完整展示出来
 * 只在文本真正变化时才测量，避免 timeupdate 高频调用引发布局抖动
 */
function syncMarquee(
  container: HTMLElement,
  textEl: HTMLElement,
  axis: "x" | "y",
): void {
  const text = textEl.textContent ?? "";

  if (marqueeTextCache.get(container) === text) {
    return;
  }

  marqueeTextCache.set(container, text);

  if (!text) {
    container.removeAttribute("data-overflow");
    container.style.removeProperty("--nmpv3-marquee-shift");
    return;
  }

  const measure = () => {
    const overflow =
      axis === "x"
        ? textEl.scrollWidth - container.clientWidth
        : textEl.scrollHeight - container.clientHeight;

    if (overflow > 2) {
      container.style.setProperty(
        "--nmpv3-marquee-shift",
        `-${Math.round(overflow) + 1}px`,
      );
      // 内容越长滚动越慢，避免长文本闪动过快
      container.style.setProperty(
        "--nmpv3-marquee-duration",
        `${Math.min(16, Math.max(6, 5 + overflow / 12)).toFixed(1)}s`,
      );
      container.dataset.overflow = "true";
      return;
    }

    container.removeAttribute("data-overflow");
    container.style.removeProperty("--nmpv3-marquee-shift");
  };

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(measure);
  } else {
    getWindow()?.setTimeout(measure, 0);
  }
}

function progressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (currentTime / duration) * 100));
}

export function formatTime(time: number): string {  if (!Number.isFinite(time) || time <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(time);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    // 长音频/播客：超过 60 分钟显示 h:mm:ss，避免出现 61:30 这类错误显示
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function lyricFallback(
  status: NMPv3LoadStatus,
  lyricStatus: NMPv3LyricStatus,
): string {
  if (status === "loading" || lyricStatus === "loading") {
    return "正在加载歌词";
  }

  if (lyricStatus === "instrumental") {
    return "纯音乐";
  }

  if (lyricStatus === "empty") {
    return "暂无歌词";
  }

  if (lyricStatus === "error") {
    return "歌词加载失败";
  }

  return "等待歌词";
}

function playModeIcon(mode: NMPv3PlayMode): string {
  if (mode === "single") {
    return icons.single;
  }

  if (mode === "shuffle") {
    return icons.shuffle;
  }

  return icons.loop;
}

/**
 * 把技术错误映射成用户看得懂的一句话
 *
 * 原始信息不丢弃，放到状态条的 title 属性里，鼠标悬停或读屏仍可获取。
 * 匹配不到时统一给「加载失败，请稍后重试」，不暴露内部实现细节。
 */
export function friendlyErrorMessage(message: string | null | undefined): string {
  const raw = (message ?? "").trim();

  if (!raw) {
    return "加载失败，请稍后重试";
  }

  if (/not found|找不到|不存在/i.test(raw)) {
    return "歌曲不存在或已下架";
  }

  if (/failed to fetch|networkerror|network error|timeout|timed out/i.test(raw)) {
    return "网络连接失败，请稍后重试";
  }

  if (/notallowed|user gesture|user didn't interact|autoplay/i.test(raw)) {
    return "点一下播放按钮开始播放";
  }

  if (/abort/i.test(raw)) {
    return "加载已取消";
  }

  if (/403|404|500|502|503/i.test(raw)) {
    return "服务暂时不可用，请稍后重试";
  }

  return "加载失败，请稍后重试";
}

/** 时间占位：未知总时长显示 --:-- 而不是 0:00 */
export function formatDurationLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "--:--";
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  return `${minutes}:${rest < 10 ? "0" : ""}${rest}`;
}

function playModeTitle(mode: NMPv3PlayMode): string {
  if (mode === "single") {
    return "单曲播放";
  }

  if (mode === "shuffle") {
    return "随机播放";
  }

  return "循环播放";
}
