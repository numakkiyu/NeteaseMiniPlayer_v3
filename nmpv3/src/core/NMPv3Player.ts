import { NeteaseApiClient } from "../api/NeteaseApiClient";
import { normalizeConfig } from "../config/normalizeConfig";
import { normalizeLyrics } from "../lyric/normalizeLyrics";
import { syncLyric as findActiveLyric } from "../lyric/syncLyric";
import {
  renderPlayerShell,
  resolveScaleFactor,
  updatePlayerView,
  type NMPv3RenderedElements,
} from "../ui/render";
import { classNames as c, stateClassNames as sc } from "../ui/classNames";
import { clearTargetMounted } from "../utils/dom";
import { getDocument, getWindow } from "../utils/env";
import { emit } from "../utils/event";
import { logger } from "../utils/logger";
import { watchSystemTheme } from "../utils/theme";
import { resolvePalette, type PaletteResolved } from "../theme/resolve";
import { AudioController } from "./AudioController";
import { globalAudioManager } from "./GlobalAudioManager";
import { mediaSessionManager } from "./MediaSessionManager";
import { StateStore } from "./StateStore";
import type {
  NMPv3Config,
  NMPv3LoadStatus,
  NMPv3LyricLine,
  NMPv3LyricStatus,
  NMPv3Layout,
  NMPv3PlayMode,
  NMPv3Player,
  NMPv3Playlist,
  NMPv3PlaylistLoadOptions,
  NMPv3Song,
  NMPv3State,
  NMPv3Theme,
} from "../types";

interface StoredState {
  volume?: number;
  playMode?: NMPv3PlayMode;
  showLyrics?: boolean;
  minimized?: boolean;
  position?: StoredPosition;
  /** 上次播放到的曲目 id，用于刷新/换页后续播同一首 */
  songId?: string;
  /** 上次播放的列表索引，songId 缺失或失效时的兜底 */
  currentIndex?: number;
}

interface StoredPosition {
  left: number;
  top: number;
  side?: "left" | "right";
}

/** 拖拽状态机，使用 requestAnimationFrame 批量刷新位置 */
interface DragState {
  active: boolean;
  moved: boolean;
  /** 是否已满足拖拽阈值，可开始跟随移动 */
  ready: boolean;
  frameId: number | null;
  pointerId: number | null;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  width: number;
  height: number;
  pendingLeft: number;
  pendingTop: number;
  pressStartedAt: number;
  /** 最小化状态下需按住一段时间才能拖拽，避免与点击展开冲突 */
  holdDelayMs: number;
  side: "left" | "right" | null;
  suppressClickUntil: number;
}

const PROGRESS_PERSIST_INTERVAL_MS = 3000;
/** 最小化后的唱片尺寸，与 CSS .nmpv3-is-minimized 保持一致 */
const MINIMIZED_SIZE = 80;
/** 展开态尺寸，与 CSS 中 width / min-height 保持一致 */
const EXPANDED_WIDTH = 420;
const EXPANDED_HEIGHT = 132;
/** 尺寸过渡保护窗口：这段时间内禁止视口夹取回写，避免打断贴边动画 */
const RESIZE_GUARD_MS = 340;
/** 视口/档位变化后等待尺寸过渡结束再贴边的延迟 */
const SIDE_SNAP_DELAY_MS = 320;

/**
 * NMPv3 播放器核心实例
 * 负责编排音频控制、UI 渲染、事件绑定、拖拽和空闲停靠等所有功能
 */
export class NMPv3PlayerInstance implements NMPv3Player {
  private readonly audio = new AudioController();
  private store: StateStore;
  private readonly cleanup: Array<() => void> = [];
  private api: NeteaseApiClient;
  private readonly elements: NMPv3RenderedElements;
  private config: NMPv3Config;
  private readonly restoredState: StoredState;
  private playlist: NMPv3Song[] = [];
  private lyrics: NMPv3LyricLine[] = [];
  private currentSong: NMPv3Song | null = null;
  private currentIndex = 0;
  private currentLyric: NMPv3LyricLine | null = null;
  private isPlaying = false;
  private isPlaylistOpen = false;
  private isMinimized = false;
  /** 形变（卡片 ↔ 唱片）标记的清除定时器 */
  private morphTimer: number | null = null;
  private wasPlayingBeforeHidden = false;
  private currentTime = 0;
  private duration = 0;
  private status: NMPv3LoadStatus = "idle";
  private lyricStatus: NMPv3LyricStatus = "idle";
  private errorMessage = "";
  private playMode: NMPv3PlayMode = "list";
  private idleTimer: number | null = null;
  private idleAnimationFallback: number | null = null;
  private idleAnimationCleanup: (() => void) | null = null;
  private viewportSnapFrame: number | null = null;
  /** 播放失败后延迟重试的定时器句柄，destroy 时清除 */
  private playbackErrorTimer: number | null = null;
  /** 空闲时段进度写入的句柄（requestIdleCallback 或 setTimeout 兜底） */
  private progressWriteHandle: { id: number; cancel: () => void } | null = null;

  /** 是否正在拖动进度条（拖动期间不被 timeupdate 回拉） */
  private scrubbing = false;
  /** 尺寸过渡保护定时器 */
  private resizeGuardTimer: number | null = null;
  /** 视口或档位变化后的贴边防抖定时器 */
  private sideSnapTimer: number | null = null;
  /** 宿主主题变化观察器（仅 auto 主题需要） */
  private hostThemeObserver: MutationObserver | null = null;
  /** 最近一次解析出的配色，供诊断读取 */
  private palette: PaletteResolved | null = null;
  /** 最终生效的缩放因子（档位 × 容器适配） */
  private scaleFactor = 1;
  /** 布局完成后的二次适配帧 */
  private scaleFitFrame: number | null = null;
  /** 本次按下时命中的元素，用于在 pointerup 判定"点击"落点 */
  private pressTarget: HTMLElement | null = null;
  private loadGeneration = 0;
  private lyricGeneration = 0;
  private lastProgressPersistedAt = 0;
  private destroyed = false;
  private isIdle = false;
  private isHovering = false;
  private isFocusedWithin = false;
  private lastVolumeBeforeMute = 0.8;
  private readonly dragState: DragState = {
    active: false,
    moved: false,
    ready: false,
    frameId: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    originLeft: 0,
    originTop: 0,
    width: 0,
    height: 0,
    pendingLeft: 0,
    pendingTop: 0,
    pressStartedAt: 0,
    holdDelayMs: 0,
    side: null,
    suppressClickUntil: 0,
  };

  constructor(
    private readonly target: HTMLElement,
    config: Partial<NMPv3Config>,
  ) {
    const initialConfig = normalizeConfig(config);
    this.store = new StateStore(this.storagePrefix(initialConfig));
    // 恢复持久化的用户设置（音量、播放模式、位置等）
    this.restoredState = initialConfig.remember
      ? this.store.get<StoredState>("state", {})
      : {};
    this.config = normalizeConfig({
      ...initialConfig,
      volume: this.restoredState.volume ?? initialConfig.volume,
      showLyrics: this.restoredState.showLyrics ?? initialConfig.showLyrics,
    });
    this.playMode = this.restoredState.playMode ?? "list";
    this.lastVolumeBeforeMute = this.config.volume || 0.8;
    this.api = new NeteaseApiClient(this.config.apiBaseUrl);
    // 先渲染 UI 骨架，触发 ready 事件后再异步加载歌曲数据
    this.elements = renderPlayerShell(this.target, this.config);
    this.audio.setVolume(this.config.volume);
    this.bindEvents();
    this.bindAudioEvents();
    this.setupHotkeys();
    this.setupDragAndDrop();
    this.applyRestoredPosition();
    this.applyResolvedTheme();
    this.applyScaleFit();
    this.scheduleScaleFit();
    this.updateView();
    emit(this.target, "nmpv3:ready", { player: this });
    void this.bootstrap();
  }

  async play(): Promise<void> {
    const generation = this.loadGeneration;

    if (!this.currentSong?.url && this.currentSong) {
      if (!(await this.ensureSongUrl(this.currentSong, generation))) {
        return;
      }
    }

    if (!this.currentSong?.url) {
      return;
    }

    globalAudioManager.pauseAll(this);

    try {
      await this.audio.play(this.currentSong.url);
    } catch (error) {
      // 浏览器自动播放策略拒绝（NotAllowedError）或音频源不可用属于"未开始播放"，
      // 不是加载失败：不覆盖 status，也不向调用方抛未处理拒绝
      if (!this.isCurrentLoad(generation)) {
        return;
      }

      this.isPlaying = false;
      this.updateView();
      logger.warn("Playback was blocked or failed to start", error);
      emit(this.target, "nmpv3:error", {
        player: this,
        message: playErrorMessage(error),
        error,
      });
      return;
    }

    if (!this.isCurrentLoad(generation)) {
      return;
    }

    this.isPlaying = Boolean(this.currentSong?.url);
    this.updateView();
    mediaSessionManager.activate(this);
    emit(this.target, "nmpv3:play", { player: this, song: this.currentSong });
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
    this.persistProgress(true);
    this.updateView();
    mediaSessionManager.update(this);
    emit(this.target, "nmpv3:pause", { player: this, song: this.currentSong });
  }

  /**
   * 静默暂停：被其它实例抢占播放时使用
   * 不派发 nmpv3:pause 事件，避免宿主把"被抢占"误判为用户主动暂停
   */
  pauseSilently(): void {
    if (!this.isPlaying) {
      return;
    }

    this.audio.pause();
    this.isPlaying = false;
    this.persistProgress(true);
    this.updateView();
    mediaSessionManager.update(this);
  }

  async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.pause();
      return;
    }

    await this.play();
  }

  async next(): Promise<void> {
    if (this.playlist.length === 0) {
      return;
    }

    if (this.playMode === "single") {
      // 单曲循环：本曲已播完，清除进度记录后从头重播
      this.clearProgress();
      this.currentTime = 0;
      this.audio.seek(0);
      if (this.isPlaying) {
        await this.play();
      }
      return;
    }

    const generation = this.beginSourceLoad();
    const shouldResume = this.isPlaying;
    this.persistProgress(true);

    if (this.playMode === "shuffle" && this.playlist.length > 1) {
      // 随机模式：排除当前歌曲，避免重复播放同一首
      let nextIndex = this.currentIndex;
      while (nextIndex === this.currentIndex) {
        nextIndex = Math.floor(Math.random() * this.playlist.length);
      }
      this.currentIndex = nextIndex;
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }

    await this.loadCurrentSong(shouldResume, generation);
  }

  async previous(): Promise<void> {
    if (this.playlist.length === 0) {
      return;
    }

    const generation = this.beginSourceLoad();
    const shouldResume = this.isPlaying;
    this.persistProgress(true);
    this.currentIndex =
      this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
    await this.loadCurrentSong(shouldResume, generation);
  }

  async loadSong(songId: string): Promise<void> {
    const generation = this.beginSourceLoad();
    this.persistProgress(true);
    this.audio.pause();
    this.isPlaying = false;
    await this.loadSongForGeneration(songId, generation, false);
  }

  async loadPlaylist(playlistId: string): Promise<void> {
    const generation = this.beginSourceLoad();
    this.persistProgress(true);
    this.audio.pause();
    this.isPlaying = false;
    await this.loadPlaylistForGeneration(playlistId, generation, false);
  }

  async loadPlaylistData(
    playlist: NMPv3Playlist,
    options: NMPv3PlaylistLoadOptions = {},
  ): Promise<NMPv3Song | null> {
    const generation = this.beginSourceLoad();
    this.persistProgress(true);
    this.audio.pause();
    this.isPlaying = false;
    this.playlist = playlist.songs.map((song) => ({ ...song }));
    this.currentIndex = clampIndex(options.startIndex ?? 0, this.playlist);
    const song = await this.loadCurrentSong(
      options.autoplay ?? this.config.autoplay,
      generation,
    );

    if (!this.isCurrentLoad(generation)) {
      return null;
    }

    emit(this.target, "nmpv3:playlistchange", {
      player: this,
      playlist,
    });
    return song;
  }

  setLyrics(lyrics: readonly NMPv3LyricLine[]): void {
    this.lyricGeneration += 1;
    this.lyrics = lyrics.map((line) => ({ ...line }));
    this.lyricStatus = this.config.showLyrics
      ? this.lyrics.length > 0
        ? "ready"
        : "empty"
      : "hidden";
    this.syncLyric();
    this.updateView();
  }

  seekTo(time: number): void {
    if (!Number.isFinite(time) || this.duration <= 0) {
      return;
    }

    const nextTime = Math.max(0, Math.min(this.duration, time));
    this.audio.seek(nextTime);
    this.currentTime = nextTime;
    this.persistProgress(true);
    this.syncLyric();
    this.updateView();
  }

  setVolume(volume: number): void {
    void this.updateConfig({ volume });
  }

  setTheme(theme: NMPv3Theme): void {
    void this.updateConfig({ theme });
  }

  setLayout(layout: NMPv3Layout): void {
    void this.updateConfig({ layout });
  }

  async updateConfig(config: Partial<NMPv3Config>): Promise<void> {
    const previous = this.config;
    const next = normalizeConfig({ ...this.config, ...config });
    // 检测哪些配置项发生了变化，按需触发副作用
    const apiChanged = previous.apiBaseUrl !== next.apiBaseUrl;
    const sourceChanged =
      apiChanged ||
      previous.songId !== next.songId ||
      previous.playlistId !== next.playlistId;
    const lyricsChanged = previous.showLyrics !== next.showLyrics;
    const scaleChanged = previous.scale !== next.scale;
    const themeChanged = previous.theme !== next.theme;
    const paletteChanged =
      previous.palette !== next.palette ||
      previous.paletteFollowHost !== next.paletteFollowHost;
    const storageChanged =
      previous.storageKey !== next.storageKey ||
      previous.remember !== next.remember;
    const floatingBoundaryChanged =
      previous.position !== next.position ||
      previous.embedMode !== next.embedMode;
    const minimizedChanged =
      previous.defaultMinimized !== next.defaultMinimized &&
      next.position !== "static" &&
      next.embedMode !== "article";

    this.config = next;

    /*
     * 配置已落到实例上，先通知订阅者再执行副作用：
     * 订阅方（如 NMPv3+ 插件）读到的是最新配置，不必等待主题重算完成。
     */
    emit(this.target, "nmpv3:configchange", {
      player: this,
      config: next,
      previous,
      changes: config,
    });

    if (apiChanged) {
      this.api = new NeteaseApiClient(this.config.apiBaseUrl);
    }

    if (storageChanged) {
      this.store = new StateStore(this.storagePrefix(this.config));
    }

    if (this.config.volume > 0) {
      this.lastVolumeBeforeMute = this.config.volume;
    }
    this.audio.setVolume(this.config.volume);

    if (floatingBoundaryChanged) {
      this.clearIdleStateClasses();

      if (
        this.config.position === "static" ||
        this.config.embedMode === "article"
      ) {
        this.isMinimized = false;
        this.resetFloatingPosition();
      }
    }

    if (minimizedChanged) {
      this.isMinimized = this.config.defaultMinimized;
      if (!this.isMinimized) {
        this.clearIdleStateClasses();
      }
      this.reposeForSizeChange(this.isMinimized);
    }

    if (!this.config.showPlaylist) {
      this.isPlaylistOpen = false;
    }

    if (sourceChanged) {
      const shouldResume = this.isPlaying;
      const generation = this.beginSourceLoad();
      this.persistProgress(true);
      this.pause();

      if (this.config.playlistId) {
        await this.loadPlaylistForGeneration(
          this.config.playlistId,
          generation,
          shouldResume,
        );
      } else if (this.config.songId) {
        await this.loadSongForGeneration(
          this.config.songId,
          generation,
          shouldResume,
        );
      } else {
        this.playlist = [];
        this.currentSong = null;
        this.currentIndex = 0;
        this.currentTime = 0;
        this.duration = 0;
        this.lyrics = [];
        this.currentLyric = null;
        this.lyricStatus = this.config.showLyrics ? "empty" : "hidden";
        this.setStatus("ready");
      }
    } else if (lyricsChanged) {
      if (!this.config.showLyrics) {
        this.lyricGeneration += 1;
        this.lyrics = [];
        this.currentLyric = null;
        this.lyricStatus = "hidden";
      } else if (this.currentSong) {
        await this.loadLyrics(this.currentSong.id, this.loadGeneration);
        this.syncLyric();
      }
    }

    this.persistSettings();
    this.updateView();
    this.startIdleTimer();

    if (themeChanged || paletteChanged) {
      this.applyPalette();
      this.observeHostTheme();
    }

    // 档位 / 布局 / 内嵌模式变化都会改变设计宽，需要重新适配
    this.applyScaleFit();
    this.scheduleScaleFit();

    if (scaleChanged) {
      // 尺寸变了要重新贴回原来那一侧，否则缩小后会浮在中间
      this.scheduleSnapToSide();
    }
  }

  getState(): NMPv3State {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.config.volume,
      theme: this.config.theme,
      layout: this.config.layout,
      embedMode: this.config.embedMode,
      playMode: this.playMode,
      currentIndex: this.currentIndex,
      status: this.status,
      lyricStatus: this.lyricStatus,
      isMinimized: this.isMinimized,
    };
  }

  getCurrentSong(): NMPv3Song | null {
    return this.currentSong;
  }

  destroy(): void {
    this.destroyed = true;
    this.loadGeneration += 1;
    this.lyricGeneration += 1;
    this.persistProgress(true);
    this.persistSettings();
    this.clearIdleTimer();
    this.clearIdleAnimationWait();
    this.clearViewportSnapFrame();
    this.cancelProgressWrite();
    this.clearResizeGuard();
    this.clearSideSnapTimer();

    if (this.scaleFitFrame !== null) {
      getWindow()?.cancelAnimationFrame(this.scaleFitFrame);
      this.scaleFitFrame = null;
    }

    if (this.morphTimer !== null) {
      getWindow()?.clearTimeout(this.morphTimer);
      this.morphTimer = null;
    }

    this.cleanup.forEach((dispose) => dispose());
    this.cleanup.length = 0;
    mediaSessionManager.release(this);
    // 从全局实例表移除，避免 pauseAll 继续遍历已销毁实例
    globalAudioManager.remove(this);
    this.audio.destroy();
    // 只移除播放器自己的根节点：宿主可能在挂载后又往容器里放了别的内容，
    // 直接清空 target 会把这些内容一起删掉
    const root = this.elements.root;
    const parent = root.parentNode;

    if (parent && typeof parent.removeChild === "function") {
      parent.removeChild(root);
    }

    clearTargetMounted(this.target);
  }

  /**
   * 浮动定位前置检查
   *
   * 只要祖先带上 transform / filter / perspective / will-change:transform / contain:paint，
   * position: fixed 就会相对那个祖先定位，播放器会错位到宿主容器里。
   * 这里做一次性检测并给出明确提示，同时在根节点打标记方便宿主用 CSS 兜底。
   */
  /** 当前布局的设计基准宽度，必须与 CSS 的 width 规则一致 */
  private getDesignWidth(): number {
    // CSS 覆盖顺序：article(360) 定义在最后，优先级最高
    if (this.config.embedMode === "article") {
      return 360;
    }

    if (this.config.layout === "mini") {
      return 320;
    }

    return 420;
  }

  /**
   * 窄屏等比适配
   *
   * 只靠 CSS 的 max-width:100% 压窄宽度，内部尺寸仍按设计宽渲染，
   * 结果是「压扁」而不是「等比缩小」。这里把档位因子与容器适配因子相乘后
   * 写进 --nmpv3-s，让所有 calc() 尺寸一起缩放。
   */
  private applyScaleFit(): void {
    const root = this.elements.root;
    const base = resolveScaleFactor(this.config.scale);
    const design = this.getDesignWidth() * base;
    const browserWindow = getWindow();
    const isFloating =
      this.config.position !== "static" && this.config.embedMode !== "article";

    let available = 0;

    if (isFloating) {
      // 用 clientWidth 而不是 innerWidth：移动端两者可能不等（viewport 缩放），
      // 而 CSS 的 100vw 跟 clientWidth 同源，两边必须用同一个基准才不会一边算大一边压窄
      const viewportWidth =
        getDocument()?.documentElement.clientWidth ??
        browserWindow?.innerWidth ??
        0;
      available = viewportWidth - 16;
    } else {
      const host = root.parentElement;
      const viewportWidth =
        getDocument()?.documentElement.clientWidth ??
        browserWindow?.innerWidth ??
        0;

      if (host) {
        const style = getComputedStyle(host);
        const paddingX =
          (parseFloat(style.paddingLeft) || 0) +
          (parseFloat(style.paddingRight) || 0);
        const hostWidth = host.clientWidth || viewportWidth;
        // 宿主容器可能被内容撑开（flex/grid 项的 min-width:auto），
        // 再取一次与视口的较小值，保证永远不会超出屏幕
        available = Math.min(hostWidth - paddingX, viewportWidth - 16);
      } else {
        available = viewportWidth - 16;
      }
    }

    const fit =
      available > 0 && design > 0 ? Math.min(1, available / design) : 1;
    const factor = Math.round(base * fit * 1000) / 1000;

    root.style.setProperty("--nmpv3-s", String(factor));
    root.dataset.scaleFit = fit < 0.999 ? "true" : "false";
    this.scaleFactor = factor;
  }

  /**
   * 下一帧再算一次适配
   *
   * 构造与 updateConfig 时宿主可能还没完成布局（clientWidth 为 0），
   * 此时会退回视口宽，得出偏大的因子。等一帧再算一次即可拿到真实容器宽度。
   */
  private scheduleScaleFit(): void {
    const browserWindow = getWindow();

    if (!browserWindow || this.scaleFitFrame !== null) {
      return;
    }

    this.scaleFitFrame = browserWindow.requestAnimationFrame(() => {
      this.scaleFitFrame = null;

      if (!this.destroyed) {
        this.applyScaleFit();
      }
    });
  }

  /**
   * 标记「正在卡片 ↔ 唱片形变」
   *
   * 形变期间给根节点打上 data-morphing，
   * 由 CSS 收紧重排范围、并让内部内容先淡出，
   * 避免逐帧压缩内部元素造成的抖动。
   * 时长跟随慢动作倍率，动画结束后自动清除。
   */
  private enterMorphState(): void {
    const root = this.elements.root;
    const browserWindow = getWindow();

    root.dataset.morphing = "true";

    if (this.morphTimer !== null) {
      browserWindow?.clearTimeout(this.morphTimer);
      this.morphTimer = null;
    }

    const rawScale = getComputedStyle(root).getPropertyValue("--nmpv3-slow-mo");
    const slowMo = Number.parseFloat(rawScale);
    const total = 300 * (Number.isFinite(slowMo) && slowMo > 0 ? slowMo : 1);

    this.morphTimer =
      browserWindow?.setTimeout(() => {
        this.morphTimer = null;
        delete root.dataset.morphing;
      }, total + 40) ?? null;
  }

  private warnIfFixedContextBroken(): void {
    if (
      this.config.position === "static" ||
      this.config.embedMode === "article"
    ) {
      return;
    }

    const doc = getDocument();
    let node: HTMLElement | null = this.target.parentElement;

    while (node && node !== doc?.body && node !== doc?.documentElement) {
      const style = getComputedStyle(node);
      const broken =
        style.transform !== "none" ||
        style.filter !== "none" ||
        style.perspective !== "none" ||
        style.willChange.includes("transform") ||
        style.contain.includes("paint") ||
        style.backdropFilter !== "none";

      if (broken) {
        this.elements.root.dataset.fixedAncestor = "true";
        console.warn(
          `[NMPv3] 挂载点祖先 <${node.tagName.toLowerCase()}> 带有 transform/filter/perspective/contain，` +
            "position: fixed 会相对它偏移，浮动播放器可能错位。" +
            '建议把挂载点移出该容器，或改用 position="static"。',
        );
        return;
      }

      node = node.parentElement;
    }
  }

  private async bootstrap(): Promise<void> {
    this.warnIfFixedContextBroken();

    if (
      this.config.position !== "static" &&
      this.config.embedMode !== "article"
    ) {
      this.isMinimized =
        this.restoredState.minimized ?? this.config.defaultMinimized;
    }

    if (this.config.playlistId) {
      await this.loadPlaylist(this.config.playlistId);
      // 续播：载入列表后定位到上次播放的曲目（默认 loadPlaylist 会停在第一首）
      await this.restoreStoredTrack();
    } else if (this.config.songId) {
      await this.loadSong(this.config.songId);
    } else {
      this.setStatus("ready");
    }

    if (this.config.autoplay && this.currentSong) {
      await this.play().catch(() => {
        this.isPlaying = false;
        this.updateView();
      });
    }

    this.persistSettings();
    this.startIdleTimer();
  }

  /**
   * 换页/刷新续播：把播放位置定位到上次播放的曲目
   * 优先按 songId 精确匹配（列表顺序变动后仍能命中），退回按索引定位
   */
  private async restoreStoredTrack(): Promise<void> {
    if (this.destroyed || !this.config.remember || this.playlist.length === 0) {
      return;
    }

    const storedSongId = this.restoredState.songId;
    const storedIndex = this.restoredState.currentIndex;
    let targetIndex = -1;

    if (storedSongId) {
      targetIndex = this.playlist.findIndex((song) => song.id === storedSongId);
    }

    if (targetIndex < 0 && typeof storedIndex === "number") {
      targetIndex = clampIndex(storedIndex, this.playlist);
    }

    if (targetIndex < 0) {
      return;
    }

    if (targetIndex === this.currentIndex) {
      return;
    }

    const generation = this.beginSourceLoad();
    this.currentIndex = targetIndex;
    await this.loadCurrentSong(false, generation);
  }

  private bindEvents(): void {
    this.listen(this.elements.playButton, "click", () => void this.toggle());
    this.listen(
      this.elements.previousButton,
      "click",
      () => void this.previous(),
    );
    this.listen(this.elements.nextButton, "click", () => void this.next());
    this.bindTrackScrub(
      this.elements.progressTrack,
      (ratio) => this.previewSeek(ratio),
      (ratio) => this.commitSeek(ratio),
    );
    this.bindTrackScrub(
      this.elements.volumeTrack,
      (ratio) => this.setVolume(ratio),
      (ratio) => this.setVolume(ratio),
    );
    this.listen(this.elements.lyricsButton, "click", () => {
      const showLyrics = !this.config.showLyrics;
      this.config = normalizeConfig({
        ...this.config,
        showLyrics,
      });
      if (!showLyrics) {
        this.lyrics = [];
        this.currentLyric = null;
        this.lyricStatus = "hidden";
      }
      this.persistSettings();
      this.updateView();

      if (showLyrics && this.currentSong) {
        void this.loadLyrics(this.currentSong.id, this.loadGeneration).then(
          () => {
            this.syncLyric();
            this.updateView();
          },
        );
      }
    });
    this.listen(this.elements.modeButton, "click", () => {
      this.playMode = nextPlayMode(this.playMode);
      this.persistSettings();
      this.updateView();
    });
    this.listen(this.elements.playlistButton, "click", () => {
      this.isPlaylistOpen =
        this.config.showPlaylist && this.playlist.length > 1
          ? !this.isPlaylistOpen
          : false;
      this.updateView();
    });
    this.listen(this.elements.minimizeButton, "click", () => {
      if (
        this.config.position === "static" ||
        this.config.embedMode === "article"
      ) {
        return;
      }

      this.enterMorphState();
      this.isMinimized = !this.isMinimized;
      if (!this.isMinimized) {
        this.clearIdleStateClasses();
      }
      this.persistSettings();
      this.updateView();
      this.reposeForSizeChange(this.isMinimized);
      this.startIdleTimer();
    });
    // 键盘激活封面（Enter/Space）：指针点击走 pointerup 路径，这里只兜键盘
    this.listen(this.elements.cover.parentElement, "click", (event) => {
      if ((event as MouseEvent).detail !== 0) {
        return;
      }

      this.activateCover();
    });
    this.listen(this.elements.playlistList, "click", (event) => {
      const item = (event.target as HTMLElement).closest<HTMLElement>(
        `.${c.playlistItem}`,
      );

      if (!item?.dataset.index) {
        return;
      }

      const generation = this.beginSourceLoad();
      const shouldResume = this.isPlaying;
      this.persistProgress(true);
      this.currentIndex = Number(item.dataset.index);
      void this.loadCurrentSong(shouldResume, generation);
      this.isPlaylistOpen = false;
      this.updateView();
    });
    // 系统明暗切换时重新解析（仅 auto 需要）
    this.cleanup.push(
      watchSystemTheme(() => {
        if (this.config.theme === "auto") {
          this.applyResolvedTheme();
        }
      }),
    );
    this.observeHostTheme();

    this.listen(this.elements.root, "mouseenter", () => {
      this.isHovering = true;
      this.restoreIdleDock();
    });
    this.listen(this.elements.root, "mouseleave", () => {
      this.isHovering = false;
      this.startIdleTimer();
    });
    this.listen(this.elements.root, "focusin", () => {
      this.isFocusedWithin = true;
      this.restoreIdleDock();
    });
    this.listen(this.elements.root, "focusout", () => {
      this.isFocusedWithin = false;
      this.startIdleTimer();
    });

    const doc = getDocument();
    if (doc) {
      // 页面切后台时自动暂停，返回时自动恢复（仅在 autoPauseOnHidden 开启时生效）
      const visibilityHandler = () => {
        if (!this.config.autoPauseOnHidden) {
          return;
        }

        if (doc.hidden && this.isPlaying) {
          this.wasPlayingBeforeHidden = true;
          this.pause();
        } else if (!doc.hidden && this.wasPlayingBeforeHidden) {
          this.wasPlayingBeforeHidden = false;
          void this.play();
        }
      };
      this.listen(doc, "visibilitychange", visibilityHandler);
    }

    const browserWindow = getWindow();
    if (browserWindow) {
      this.listen(browserWindow, "resize", () => {
        // 任何档位都要按容器可用宽度重新适配，否则窄屏会被压扁
        this.applyScaleFit();
        // 尺寸变化带 300ms 过渡，等落定后再贴回原来那一侧
        this.scheduleSnapToSide();
      });
      // 页面滚动后浮动播放器可能落到视口外，滚动结束再拉回可视区域
      this.listen(
        browserWindow,
        "scroll",
        () => this.snapPositionIntoViewport(),
        { passive: true },
      );
      this.listen(browserWindow, "pagehide", () => {
        this.persistProgress(true);
        this.persistSettings();
      });
    }
  }

  private bindAudioEvents(): void {
    this.cleanup.push(
      this.audio.on("loadedmetadata", () => {
        const audioState = this.audio.getState();
        this.duration = audioState.duration;
        this.updateView();
      }),
      this.audio.on("timeupdate", () => {
        const audioState = this.audio.getState();
        // 拖动进度条期间以手指位置为准，不被 timeupdate 回拉
        if (!this.scrubbing) {
          this.currentTime = audioState.currentTime;
        }
        this.duration = audioState.duration;
        this.persistProgress(false);
        this.syncLyric();
        this.updateView();
      }),
      this.audio.on("ended", () => {
        this.clearProgress();
        void this.next();
      }),
      this.audio.on("error", () => {
        const shouldResume = this.isPlaying;
        const failedIndex = this.currentIndex;
        this.handleError(new Error("Audio playback failed"), "Playback failed");
        // 延迟重试定时器纳入 cleanup，destroy 时一并清除，避免销毁后回调
        const browserWindow = getWindow();
        const timer = browserWindow?.setTimeout(() => {
          this.playbackErrorTimer = null;
          void this.advanceAfterPlaybackError(shouldResume, failedIndex);
        }, 900);
        if (timer != null) {
          this.playbackErrorTimer = timer;
          this.cleanup.push(() => {
            browserWindow?.clearTimeout(timer);
            if (this.playbackErrorTimer === timer) {
              this.playbackErrorTimer = null;
            }
          });
        }
      }),
    );
  }

  private async loadSongForGeneration(
    songId: string,
    generation: number,
    shouldResume: boolean,
  ): Promise<void> {
    this.setStatus("loading");

    try {
      const song = await this.api.getSong(songId);

      if (!this.isCurrentLoad(generation)) {
        return;
      }

      this.playlist = [song];
      this.currentIndex = 0;
      await this.loadCurrentSong(shouldResume, generation);
    } catch (error) {
      if (this.isCurrentLoad(generation)) {
        this.handleError(error, "Failed to load song");
      }
    }
  }

  private async loadPlaylistForGeneration(
    playlistId: string,
    generation: number,
    shouldResume: boolean,
  ): Promise<void> {
    this.setStatus("loading");

    try {
      const playlist = await this.api.getPlaylist(playlistId);

      if (!this.isCurrentLoad(generation)) {
        return;
      }

      this.playlist = playlist.songs.map((song) => ({ ...song }));
      this.currentIndex = 0;
      await this.loadCurrentSong(shouldResume, generation);

      if (!this.isCurrentLoad(generation)) {
        return;
      }

      emit(this.target, "nmpv3:playlistchange", {
        player: this,
        playlist,
      });
    } catch (error) {
      if (this.isCurrentLoad(generation)) {
        this.handleError(error, "Failed to load playlist");
      }
    }
  }

  private async advanceAfterPlaybackError(
    shouldResume: boolean,
    failedIndex: number,
  ): Promise<void> {
    if (this.destroyed || this.currentIndex !== failedIndex) {
      return;
    }

    // 单曲列表没有可跳过的下一首：明确报错，而不是静默停在错误状态
    if (this.playlist.length <= 1) {
      if (this.status !== "error") {
        this.handleError(
          new Error("This song is not playable right now"),
          "Playback failed",
        );
      }

      return;
    }

    const generation = this.beginSourceLoad();
    this.currentIndex = (failedIndex + 1) % this.playlist.length;
    await this.loadCurrentSong(shouldResume, generation);
  }

  private beginSourceLoad(): number {
    return ++this.loadGeneration;
  }

  private isCurrentLoad(generation: number): boolean {
    return !this.destroyed && generation === this.loadGeneration;
  }

  private async loadCurrentSong(
    shouldResume: boolean,
    generation: number,
  ): Promise<NMPv3Song | null> {
    if (!this.isCurrentLoad(generation)) {
      return null;
    }

    const song = this.playlist[this.currentIndex] ?? null;

    if (!song) {
      this.currentSong = null;
      this.setStatus("ready");
      return null;
    }

    /*
     * 换到新曲目前，先丢弃上一首的进度记录。
     * 切歌意味着用户主动离开了那首，回头再放应当从头开始；
     * 暂停/离开页面仍然保留进度，由 persistProgress 负责。
     */
    this.clearProgress();

    this.currentSong = song;
    this.currentTime = 0;
    this.duration = song.duration ? song.duration / 1000 : 0;
    this.currentLyric = null;
    this.lyrics = [];
    this.lyricStatus = this.config.showLyrics ? "loading" : "hidden";
    this.setStatus("loading");

    try {
      if (!(await this.ensureSongUrl(song, generation))) {
        return null;
      }

      if (!this.isCurrentLoad(generation)) {
        return null;
      }

      this.restoreProgress(song);
      await this.loadLyrics(song.id, generation);

      if (!this.isCurrentLoad(generation)) {
        return null;
      }

      this.syncLyric();
      this.setStatus("ready");
      emit(this.target, "nmpv3:songchange", {
        player: this,
        song: this.currentSong,
      });

      /*
       * 切歌后立刻把「当前是哪一首」写进存储。
       * 之前只在配置变更、最小化等动作时才落盘，导致换页后回到的是旧歌。
       */
      this.persistSettings();

      if (shouldResume) {
        await this.play();
      }

      mediaSessionManager.update(this);
      return this.currentSong;
    } catch (error) {
      if (this.isCurrentLoad(generation)) {
        this.handleError(error, "Failed to load playback data");
      }

      return null;
    }
  }

  private async ensureSongUrl(
    song: NMPv3Song,
    generation: number,
  ): Promise<boolean> {
    if (!song.url) {
      // 依次尝试高品质与标准音质，任一级抛错都继续降级，最终失败则返回 false
      for (const level of ["exhigh", "standard"] as const) {
        try {
          const url = await this.api.getSongUrl(song.id, level);

          if (!this.isCurrentLoad(generation)) {
            return false;
          }

          if (url) {
            song.url = url;
            break;
          }
        } catch (error) {
          if (!this.isCurrentLoad(generation)) {
            return false;
          }

          logger.warn(`Failed to resolve song url (${level})`, error);
        }
      }
    }

    if (!this.isCurrentLoad(generation) || !song.url) {
      // 两级地址均不可用：清掉脏 url，交由调用方走错误/跳过流程
      song.url = undefined;
      return false;
    }

    this.audio.setSrc(song.url);
    return true;
  }

  private async loadLyrics(
    songId: string,
    sourceGeneration: number,
  ): Promise<void> {
    const lyricGeneration = ++this.lyricGeneration;

    if (!this.config.showLyrics) {
      this.lyrics = [];
      this.lyricStatus = "hidden";
      return;
    }

    this.lyricStatus = "loading";

    try {
      const data = await this.api.getLyrics(songId);

      if (
        !this.isCurrentLoad(sourceGeneration) ||
        lyricGeneration !== this.lyricGeneration
      ) {
        return;
      }

      const normalizedLyrics = normalizeLyrics(data);
      this.lyrics = normalizedLyrics.lyrics;
      this.lyricStatus = normalizedLyrics.status;
    } catch (error) {
      if (
        !this.isCurrentLoad(sourceGeneration) ||
        lyricGeneration !== this.lyricGeneration
      ) {
        return;
      }

      this.lyrics = [];
      this.lyricStatus = "error";
      logger.warn("Failed to load lyrics", error);
    }
  }

  private syncLyric(): void {
    this.currentLyric = findActiveLyric(this.lyrics, this.currentTime);
  }

  /**
   * 绑定轨道的指针拖动
   * pointerdown + setPointerCapture 保证手指移出轨道后仍持续接收事件；
   * 移动阶段用 rAF 节流只做预览，松手才提交，避免拖动过程中反复 seek 造成卡顿
   */
  private bindTrackScrub(
    track: HTMLElement,
    onPreview: (ratio: number) => void,
    onCommit: (ratio: number) => void,
  ): void {
    const browserWindow = getWindow();
    let ratio = 0;
    let frame: number | null = null;
    let activePointer: number | null = null;

    const ratioFromPointer = (event: PointerEvent): number => {
      const rect = track.getBoundingClientRect();

      if (rect.width <= 0) {
        return 0;
      }

      return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    };

    const schedulePreview = () => {
      if (!browserWindow || frame !== null) {
        return;
      }

      frame = browserWindow.requestAnimationFrame(() => {
        frame = null;
        onPreview(ratio);
      });
    };

    const finish = (event: PointerEvent, commit: boolean) => {
      if (activePointer === null || event.pointerId !== activePointer) {
        return;
      }

      if (browserWindow && frame !== null) {
        browserWindow.cancelAnimationFrame(frame);
        frame = null;
      }

      if (track.hasPointerCapture?.(event.pointerId)) {
        track.releasePointerCapture?.(event.pointerId);
      }

      activePointer = null;
      delete track.dataset.scrubbing;
      this.scrubbing = false;

      if (commit) {
        onCommit(ratio);
      } else {
        onPreview(ratio);
      }
    };

    this.listen(track, "pointerdown", (event) => {
      const pointerEvent = event as PointerEvent;

      if (pointerEvent.button !== 0) {
        return;
      }

      activePointer = pointerEvent.pointerId;
      ratio = ratioFromPointer(pointerEvent);
      track.dataset.scrubbing = "true";
      this.scrubbing = true;
      try {
        track.setPointerCapture?.(pointerEvent.pointerId);
      } catch {
        // 同上
      }
      pointerEvent.preventDefault();
      onPreview(ratio);
    });

    this.listen(track, "pointermove", (event) => {
      const pointerEvent = event as PointerEvent;

      if (activePointer === null || pointerEvent.pointerId !== activePointer) {
        return;
      }

      ratio = ratioFromPointer(pointerEvent);
      schedulePreview();
    });

    this.listen(track, "pointerup", (event) =>
      finish(event as PointerEvent, true),
    );
    this.listen(track, "pointercancel", (event) =>
      finish(event as PointerEvent, false),
    );

    // 键盘激活（Enter/Space）时 detail 为 0，交给热键处理，避免跳到 0 秒
    this.listen(track, "click", (event) => {
      if ((event as MouseEvent).detail === 0) {
        return;
      }
    });
  }

  /** 拖动中的进度预览：只更新界面与歌词，不触碰 audio */
  private previewSeek(ratio: number): void {
    if (this.duration <= 0) {
      return;
    }

    this.currentTime = ratio * this.duration;
    this.syncLyric();
    this.updateView();
  }

  /** 松手提交 seek */
  private commitSeek(ratio: number): void {
    if (this.duration <= 0) {
      return;
    }

    this.seekTo(ratio * this.duration);
  }

  private setStatus(status: NMPv3LoadStatus): void {
    this.status = status;
    this.errorMessage = "";
    this.updateView();
  }

  private handleError(error: unknown, fallback: string): void {
    this.status = "error";
    this.errorMessage = error instanceof Error ? error.message : fallback;
    this.isPlaying = false;
    this.updateView();
    emit(this.target, "nmpv3:error", {
      player: this,
      message: this.errorMessage,
      error,
    });
  }

  private updateView(): void {
    updatePlayerView(this.elements, this.config, {
      song: this.currentSong,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.config.volume,
      status: this.status,
      errorMessage: this.errorMessage,
      lyric: this.currentLyric,
      lyricStatus: this.lyricStatus,
      playMode: this.playMode,
      currentIndex: this.currentIndex,
      playlist: this.playlist,
      showLyrics: this.config.showLyrics,
      isPlaylistOpen: this.isPlaylistOpen,
      isMinimized: this.isMinimized,
    });
    this.syncFloatingSideAttribute();
    this.queueViewportSnap();
  }

  private persistSettings(): void {
    if (!this.config.remember) {
      return;
    }

    const state: StoredState = {
      volume: this.config.volume,
      playMode: this.playMode,
      showLyrics: this.config.showLyrics,
      minimized: this.isMinimized,
    };

    if (this.currentSong) {
      // 记录当前曲目，刷新/换页后据此续播
      state.songId = this.currentSong.id;
      state.currentIndex = this.currentIndex;
    }

    if (this.canPersistPosition()) {
      const position = this.getPersistablePosition();
      if (position) {
        state.position = position;
      }
    }

    this.store.set<StoredState>("state", state);
  }

  private persistProgress(force = false): void {
    if (!this.config.remember || !this.currentSong || this.currentTime <= 0) {
      return;
    }

    const now = Date.now();
    if (
      !force &&
      now - this.lastProgressPersistedAt < PROGRESS_PERSIST_INTERVAL_MS
    ) {
      return;
    }

    this.lastProgressPersistedAt = now;

    // 非强制写入走空闲回调，避免 localStorage 同步写阻塞 timeupdate 主路径
    if (force) {
      this.writeProgress();
      return;
    }

    this.scheduleProgressWrite();
  }

  /** 在空闲时段写入进度，浏览器不支持时退回微任务 */
  private scheduleProgressWrite(): void {
    if (this.progressWriteHandle !== null) {
      return;
    }

    const browserWindow = getWindow();
    const idle = browserWindow?.requestIdleCallback;

    if (browserWindow && typeof idle === "function") {
      this.progressWriteHandle = {
        cancel: () =>
          browserWindow.cancelIdleCallback?.(
            this.progressWriteHandle?.id as number,
          ),
        id: idle(() => {
          this.progressWriteHandle = null;
          this.writeProgress();
        }),
      };
      this.cleanup.push(() => this.cancelProgressWrite());
      return;
    }

    const timer = browserWindow?.setTimeout(() => {
      this.progressWriteHandle = null;
      this.writeProgress();
    }, 0);

    if (timer != null) {
      this.progressWriteHandle = {
        cancel: () => browserWindow?.clearTimeout(timer),
        id: timer,
      };
      this.cleanup.push(() => this.cancelProgressWrite());
    }
  }

  private cancelProgressWrite(): void {
    this.progressWriteHandle?.cancel();
    this.progressWriteHandle = null;
  }

  private writeProgress(): void {
    if (this.destroyed || !this.config.remember || !this.currentSong) {
      return;
    }

    this.store.set<number>(`progress:${this.currentSong.id}`, this.currentTime);
  }

  private restoreProgress(song: NMPv3Song): void {
    if (!this.config.remember) {
      return;
    }

    const remembered = this.store.get<number>(`progress:${song.id}`, 0);
    const durationSeconds = song.duration
      ? song.duration / 1000
      : this.duration;

    if (
      remembered > 3 &&
      (!durationSeconds || remembered < durationSeconds - 5)
    ) {
      // 超过 3 秒且不是接近结尾才恢复进度，避免恢复已听完的歌曲
      this.audio.seek(remembered);
      this.currentTime = remembered;
    }
  }

  private clearProgress(): void {
    if (this.config.remember && this.currentSong) {
      // 删除条目而非写入 0，避免残留脏数据
      this.store.remove(`progress:${this.currentSong.id}`);
    }

    this.lastProgressPersistedAt = 0;
  }

  private startIdleTimer(): void {
    this.clearIdleTimer();

    if (
      !this.shouldEnableIdleDock() ||
      this.isHovering ||
      this.isFocusedWithin ||
      this.dragState.active
    ) {
      return;
    }

    this.idleTimer =
      getWindow()?.setTimeout(() => {
        this.triggerIdleDock();
      }, 5000) ?? null;
  }

  private clearIdleTimer(): void {
    if (this.idleTimer != null) {
      getWindow()?.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** 触发空闲停靠动画：先淡出，再贴边隐藏 */
  private triggerIdleDock(): void {
    if (!this.shouldEnableIdleDock() || this.isIdle) {
      return;
    }

    this.clearIdleStateClasses();
    this.isIdle = true;

    const side = this.getDockSide();
    if (side === "right") {
      this.elements.root.classList.add(sc.dockedRight);
    } else if (side === "left") {
      this.elements.root.classList.add(sc.dockedLeft);
    }

    this.elements.root.classList.add(sc.idleFadingOut);
    this.waitForIdleAnimation("nmpv3-player-fade-out", 720, () => {
      if (!this.isIdle) {
        return;
      }

      this.elements.root.classList.remove(sc.idleFadingOut);
      this.elements.root.classList.add(sc.idle);
    });
  }

  /** 取消空闲停靠：先从贴边位置弹出，再淡入完整播放器 */
  private restoreIdleDock(): void {
    this.clearIdleTimer();

    if (!this.hasIdleStateClasses()) {
      return;
    }

    const side = this.currentDockSideFromClasses();
    this.elements.root.classList.remove(sc.idle, sc.idleFadingOut);
    this.isIdle = false;

    if (side) {
      const poppingClass = side === "right" ? sc.poppingRight : sc.poppingLeft;
      const dockedClass = side === "right" ? sc.dockedRight : sc.dockedLeft;
      const animationName =
        side === "right"
          ? "nmpv3-player-popout-right"
          : "nmpv3-player-popout-left";

      this.elements.root.classList.add(poppingClass);
      this.waitForIdleAnimation(animationName, 360, () => {
        this.elements.root.classList.remove(poppingClass, dockedClass);
        this.fadeIdleIn();
      });
      return;
    }

    this.fadeIdleIn();
  }

  private fadeIdleIn(): void {
    this.elements.root.classList.add(sc.idleFadingIn);
    this.waitForIdleAnimation("nmpv3-player-fade-in", 360, () => {
      this.elements.root.classList.remove(sc.idleFadingIn);
    });
  }

  private clearIdleStateClasses(): void {
    this.clearIdleAnimationWait();
    this.isIdle = false;
    this.elements.root.classList.remove(
      sc.idle,
      sc.idleFadingIn,
      sc.idleFadingOut,
      sc.dockedLeft,
      sc.dockedRight,
      sc.poppingLeft,
      sc.poppingRight,
    );
  }

  private hasIdleStateClasses(): boolean {
    return (
      this.isIdle ||
      this.elements.root.classList.contains(sc.idle) ||
      this.elements.root.classList.contains(sc.idleFadingOut) ||
      this.elements.root.classList.contains(sc.idleFadingIn) ||
      this.elements.root.classList.contains(sc.dockedLeft) ||
      this.elements.root.classList.contains(sc.dockedRight) ||
      this.elements.root.classList.contains(sc.poppingLeft) ||
      this.elements.root.classList.contains(sc.poppingRight)
    );
  }

  private shouldEnableIdleDock(): boolean {
    return (
      this.isMinimized &&
      this.config.position !== "static" &&
      this.config.embedMode !== "article"
    );
  }

  private getDockSide(): "left" | "right" | null {
    return this.getFloatingSide();
  }

  private currentDockSideFromClasses(): "left" | "right" | null {
    if (this.elements.root.classList.contains(sc.dockedRight)) {
      return "right";
    }

    if (this.elements.root.classList.contains(sc.dockedLeft)) {
      return "left";
    }

    return null;
  }

  private waitForIdleAnimation(
    animationName: string,
    fallbackMs: number,
    onDone: () => void,
  ): void {
    const browserWindow = getWindow();
    this.clearIdleAnimationWait();

    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      this.clearIdleAnimationWait();
      onDone();
    };
    const onEnd = (event: AnimationEvent) => {
      if (
        event.target !== this.elements.root ||
        event.animationName !== animationName
      ) {
        return;
      }

      finish();
    };

    this.elements.root.addEventListener("animationend", onEnd);
    this.idleAnimationFallback =
      browserWindow?.setTimeout(finish, fallbackMs) ?? null;
    this.idleAnimationCleanup = () => {
      this.elements.root.removeEventListener("animationend", onEnd);
    };
  }

  private clearIdleAnimationWait(): void {
    this.idleAnimationCleanup?.();
    this.idleAnimationCleanup = null;
    this.clearIdleAnimationFallback();
  }

  private clearIdleAnimationFallback(): void {
    if (this.idleAnimationFallback != null) {
      getWindow()?.clearTimeout(this.idleAnimationFallback);
      this.idleAnimationFallback = null;
    }
  }

  private listen(
    target: EventTarget | null | undefined,
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    if (!target) {
      return;
    }

    target.addEventListener(type, handler, options);
    this.cleanup.push(() => target.removeEventListener(type, handler, options));
  }

  private storagePrefix(config: NMPv3Config): string {
    const key =
      config.storageKey ||
      this.target.id ||
      (config.songId ? `song:${config.songId}` : "") ||
      (config.playlistId ? `playlist:${config.playlistId}` : "") ||
      "global";

    return `nmpv3:${key}`;
  }

  private setupHotkeys(): void {
    const doc = getDocument();

    if (!doc) {
      return;
    }

    this.listen(doc, "keydown", (event) =>
      this.handleHotkey(event as KeyboardEvent),
    );
  }

  private handleHotkey(event: KeyboardEvent): void {
    if (
      !this.config.hotkeys ||
      // 带修饰键的组合键属于浏览器/系统快捷键（Ctrl+R 刷新、Ctrl+L 聚焦地址栏等），
      // 不得被播放器热键吞掉
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      // 输入法组字过程中不响应热键，避免误触发
      event.isComposing ||
      (!this.isHovering && !this.isFocusedWithin) ||
      // 输入框中不拦截键盘事件，避免干扰用户输入
      isEditableTarget(event.target)
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === " " || key === "k") {
      event.preventDefault();
      void this.toggle();
    } else if (key === "j") {
      event.preventDefault();
      void this.previous();
    } else if (key === "l") {
      event.preventDefault();
      void this.next();
    } else if (key === "arrowleft") {
      event.preventDefault();
      this.seekBy(-5);
    } else if (key === "arrowright") {
      event.preventDefault();
      this.seekBy(5);
    } else if (key === "arrowup") {
      event.preventDefault();
      this.stepVolume(0.05);
    } else if (key === "arrowdown") {
      event.preventDefault();
      this.stepVolume(-0.05);
    } else if (key === "m") {
      event.preventDefault();
      this.toggleMute();
    } else if (key === "r") {
      event.preventDefault();
      this.playMode = nextPlayMode(this.playMode);
      this.persistSettings();
      this.updateView();
    }
  }

  private seekBy(deltaSeconds: number): void {
    this.seekTo(this.currentTime + deltaSeconds);
  }

  private stepVolume(delta: number): void {
    this.setVolume(this.config.volume + delta);
  }

  private toggleMute(): void {
    if (this.config.volume > 0) {
      this.lastVolumeBeforeMute = this.config.volume;
      this.setVolume(0);
      return;
    }

    this.setVolume(this.lastVolumeBeforeMute || 0.8);
  }

  private setupDragAndDrop(): void {
    const browserWindow = getWindow();

    if (!browserWindow) {
      return;
    }

    // 交互控件区域不触发拖拽，保留原生交互行为
    const interactiveSelector = `input, textarea, select, a, .${c.controls}, .${c.tools}, .${c.progressTrack}, .${c.volumeTrack}, .${c.playlistPanel}`;

    const flushPosition = () => {
      this.dragState.frameId = null;
      this.applyFloatingPosition(
        this.dragState.pendingLeft,
        this.dragState.pendingTop,
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!this.dragState.active) {
        return;
      }

      // 多指触控时只跟随发起拖拽的那一根手指，避免位置被第二指抢夺
      if (
        this.dragState.pointerId !== null &&
        event.pointerId !== this.dragState.pointerId
      ) {
        return;
      }

      const deltaX = event.clientX - this.dragState.startX;
      const deltaY = event.clientY - this.dragState.startY;
      const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      const threshold = this.isMinimized ? 16 : 10;

      if (!this.dragState.ready) {
        const heldLongEnough =
          Date.now() - this.dragState.pressStartedAt >=
          this.dragState.holdDelayMs;

        if (!heldLongEnough || distance < threshold) {
          return;
        }

        this.dragState.ready = true;
      }

      this.dragState.moved = distance > threshold;
      event.preventDefault();
      const maxLeft = Math.max(
        8,
        browserWindow.innerWidth - this.dragState.width - 8,
      );
      const maxTop = Math.max(
        8,
        browserWindow.innerHeight - this.dragState.height - 8,
      );
      this.dragState.pendingLeft = Math.min(
        maxLeft,
        Math.max(8, this.dragState.originLeft + deltaX),
      );
      this.dragState.pendingTop = Math.min(
        maxTop,
        Math.max(8, this.dragState.originTop + deltaY),
      );

      if (this.dragState.frameId === null) {
        this.dragState.frameId =
          browserWindow.requestAnimationFrame(flushPosition);
      }
    };

    const onPointerUp = (event: PointerEvent, cancelled = false) => {
      if (!this.dragState.active) {
        return;
      }
      // 其它手指抬起不应结束本次拖拽
      if (
        !cancelled &&
        this.dragState.pointerId !== null &&
        event.pointerId !== this.dragState.pointerId
      ) {
        return;
      }

      this.dragState.active = false;

      if (this.dragState.frameId !== null) {
        browserWindow.cancelAnimationFrame(this.dragState.frameId);
        this.dragState.frameId = null;

        if (!cancelled && this.dragState.moved) {
          flushPosition();
        }
      }

      const pointerId = this.dragState.pointerId ?? event.pointerId;
      if (this.elements.root.hasPointerCapture?.(pointerId)) {
        this.elements.root.releasePointerCapture?.(pointerId);
      }
      this.dragState.pointerId = null;

      this.elements.root.classList.remove(sc.dragging);
      delete this.elements.root.dataset.dragging;

      if (!cancelled && this.dragState.moved) {
        this.snapToViewportEdge();
        this.persistSettings();
      } else if (
        !cancelled &&
        Date.now() >= this.dragState.suppressClickUntil
      ) {
        if (this.isMinimized) {
          this.isMinimized = false;
          this.dragState.suppressClickUntil = Date.now() + 350;
          this.clearIdleStateClasses();
          this.persistSettings();
          this.updateView();
          this.reposeForSizeChange(this.isMinimized);
        } else {
          // 点击（非拖拽）由这里分发，不依赖 click 事件：
          // root 上的 setPointerCapture 会把 click 重定向，子元素的 click 监听收不到
          this.handlePressTarget();
        }
      }

      this.dragState.ready = false;
      if (cancelled) {
        this.dragState.moved = false;
      }
      this.startIdleTimer();
    };

    const onPointerDown = (event: PointerEvent) => {
      // 每次按下都重置，避免上一次的落点泄漏到本次判定
      this.pressTarget = null;

      if (event.button !== 0 || !this.canDrag()) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.closest(interactiveSelector) || this.isPlaylistOpen) {
        return;
      }

      this.pressTarget = target;

      const rect = this.elements.root.getBoundingClientRect();
      this.dragState.active = true;
      this.dragState.moved = false;
      this.dragState.ready = !this.isMinimized;
      this.dragState.startX = event.clientX;
      this.dragState.startY = event.clientY;
      this.dragState.originLeft = rect.left;
      this.dragState.originTop = rect.top;
      this.dragState.width =
        rect.width || this.elements.root.offsetWidth || 420;
      this.dragState.height =
        rect.height || this.elements.root.offsetHeight || 120;
      this.dragState.pendingLeft = rect.left;
      this.dragState.pendingTop = rect.top;
      this.dragState.pressStartedAt = Date.now();
      this.dragState.holdDelayMs = this.isMinimized ? 160 : 0;
      this.dragState.pointerId = event.pointerId;
      this.clearIdleTimer();
      this.clearIdleStateClasses();
      // 用数据属性驱动 CSS 关闭过渡，避免逐帧读写 style 触发额外样式重算
      this.elements.root.dataset.dragging = "true";
      this.elements.root.classList.add(sc.dragging);
      try {
        this.elements.root.setPointerCapture?.(event.pointerId);
      } catch {
        // 合成事件或已释放的指针不支持捕获，忽略即可
      }
    };

    this.listen(this.elements.root, "pointerdown", (event) =>
      onPointerDown(event as PointerEvent),
    );
    this.listen(browserWindow, "pointermove", (event) =>
      onPointerMove(event as PointerEvent),
    );
    this.listen(browserWindow, "pointerup", (event) =>
      onPointerUp(event as PointerEvent),
    );
    this.listen(browserWindow, "pointercancel", (event) =>
      onPointerUp(event as PointerEvent, true),
    );
  }

  /**
   * 分发"点击"（非拖拽的按下-抬起）行为
   * 目前只有封面：最小化时展开，展开时跳转网易云音乐单曲页
   */
  private handlePressTarget(): void {
    const target = this.pressTarget;

    if (!target || !target.closest(`.${c.coverButton}`)) {
      return;
    }

    this.activateCover();
  }

  /** 封面激活：最小化时展开，展开态跳转网易云单曲页 */
  private activateCover(): void {
    if (this.isMinimized) {
      this.isMinimized = false;
      this.clearIdleStateClasses();
      this.persistSettings();
      this.updateView();
      this.scheduleReposeIfNeeded();
      return;
    }

    if (this.currentSong?.id) {
      getWindow()?.open(
        `https://music.163.com/song?id=${encodeURIComponent(this.currentSong.id)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  /**
   * 解析并写入最终明暗
   * auto 会采样宿主实际背景亮度：宿主是浅色就用浅色皮肤，
   * 不再盲从系统偏好，避免「系统深色 + 浅色网页」时配色割裂
   */
  private applyResolvedTheme(): void {
    this.applyPalette();
  }

  /**
   * 解析并注入整套配色变量
   * 仲裁规则（两个开关独立）：
   *   paletteFollowHost = true  → 色相与明暗都跟随宿主
   *   paletteFollowHost = false → 色相用色板，明暗优先 theme 显式值，否则用色板自带倾向
   */
  private applyPalette(): void {
    const resolved = resolvePalette({
      paletteId: this.config.palette,
      paletteFollowHost: this.config.paletteFollowHost,
      theme: this.config.theme,
      hostElement: this.target,
    });

    const root = this.elements.root;

    for (const [key, value] of Object.entries(resolved.palette.variables)) {
      // 保留宿主用 --nmpv3-bg 覆盖底色的既有约定
      const cssValue =
        key === "primary-bg" || key === "surface"
          ? `var(--nmpv3-bg, ${value})`
          : value;
      root.style.setProperty(`--nmpv3-${key}`, cssValue);
    }

    root.dataset.resolvedTheme = resolved.palette.scheme;
    root.dataset.palette = this.config.palette;
    this.palette = resolved;
  }

  /** 当前配色解析结果（诊断 / 测试用） */
  getPaletteInfo(): PaletteResolved | null {
    return this.palette;
  }

  /** 当前实际生效的缩放因子（档位 × 容器适配） */
  getScaleFactor(): number {
    return this.scaleFactor;
  }

  /** 宿主切换主题（改 class / style / data-theme）时跟随重算 */
  private observeHostTheme(): void {
    const doc = getDocument();

    if (
      !doc ||
      typeof MutationObserver === "undefined" ||
      this.config.theme !== "auto" ||
      this.hostThemeObserver
    ) {
      return;
    }

    const browserWindow = getWindow();
    let timer: number | null = null;

    // 只有这些属性会真正影响宿主明暗；其余 attr 变化直接忽略，
    // 避免宿主拖拽/动画高频改 style 时反复重算配色拖慢宿主
    const themeAttributes = new Set([
      "class",
      "style",
      "data-theme",
      "data-page-theme",
      "data-mode",
      "data-color-scheme",
      "data-bs-theme",
    ]);

    const schedule = () => {
      if (timer !== null) {
        return;
      }

      // 主题切换是低频事件，200ms 节流足够，无需帧级精度
      if (browserWindow) {
        timer = browserWindow.setTimeout(() => {
          timer = null;
          this.applyResolvedTheme();
        }, 200);
        return;
      }

      this.applyResolvedTheme();
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const name = record.attributeName;

        if (name && (themeAttributes.has(name) || name.startsWith("data-"))) {
          schedule();
          return;
        }
      }
    });

    const options: MutationObserverInit = { attributes: true };

    observer.observe(doc.documentElement, options);

    if (doc.body) {
      observer.observe(doc.body, options);
    }

    this.hostThemeObserver = observer;
    this.cleanup.push(() => {
      observer.disconnect();
      this.hostThemeObserver = null;

      if (timer !== null) {
        getWindow()?.clearTimeout(timer);
        timer = null;
      }
    });
  }

  /** 统一的最小化态变化后处理：展开时重新贴边 */
  private scheduleReposeIfNeeded(): void {
    this.reposeForSizeChange(this.isMinimized);
  }

  /**
   * 视口尺寸或缩放档位变化后，把播放器贴回原来那一侧
   * 尺寸过渡需要 300ms，过早读取 rect 会拿到中间值，夹出的位置在过渡结束后就偏了
   */
  private scheduleSnapToSide(): void {
    const browserWindow = getWindow();

    if (!browserWindow) {
      return;
    }

    this.clearSideSnapTimer();
    this.sideSnapTimer = browserWindow.setTimeout(() => {
      this.sideSnapTimer = null;
      this.snapFloatingToSide();
    }, SIDE_SNAP_DELAY_MS);
  }

  private clearSideSnapTimer(): void {
    if (this.sideSnapTimer != null) {
      getWindow()?.clearTimeout(this.sideSnapTimer);
      this.sideSnapTimer = null;
    }
  }

  /** 按当前实际尺寸与记录的方向，贴回最近的一侧并夹进视口 */
  private snapFloatingToSide(): void {
    const browserWindow = getWindow();

    if (
      !browserWindow ||
      this.destroyed ||
      this.config.position === "static" ||
      this.config.embedMode === "article" ||
      !this.elements.root.classList.contains(sc.userPositioned) ||
      // 空闲停靠由 dock 动画控制 transform，不能在这里改 left
      this.hasIdleStateClasses()
    ) {
      return;
    }

    const root = this.elements.root;
    const rect = root.getBoundingClientRect();
    const width = rect.width || EXPANDED_WIDTH;
    const height = rect.height || EXPANDED_HEIGHT;
    const margin = 8;
    const side =
      this.dragState.side ??
      (this.config.position.endsWith("left") ? "left" : "right");
    const left =
      side === "left"
        ? margin
        : Math.max(margin, browserWindow.innerWidth - width - margin);
    const top = Math.max(
      margin,
      Math.min(
        Math.max(margin, browserWindow.innerHeight - height - margin),
        rect.top,
      ),
    );

    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      return;
    }

    this.dragState.side = side;
    root.dataset.side = side;
    this.applyFloatingPosition(left, top);
    // 这次定位由我们负责，短时间内不要被视口夹取回写覆盖
    this.holdViewportSnap();
  }

  private canDrag(): boolean {
    return (
      this.config.draggable &&
      this.config.position !== "static" &&
      this.config.embedMode !== "article"
    );
  }

  private applyFloatingPosition(left: number, top: number): void {
    const style = this.elements.root.style;
    const leftValue = `${left}px`;
    const topValue = `${top}px`;

    // 只在值真正变化时写内联样式，减少拖拽期间每帧的样式失效
    if (style.left !== leftValue) {
      style.left = leftValue;
    }
    if (style.top !== topValue) {
      style.top = topValue;
    }
    if (style.right !== "auto") {
      style.right = "auto";
    }
    if (style.bottom !== "auto") {
      style.bottom = "auto";
    }

    this.elements.root.classList.add(sc.userPositioned);
    this.syncFloatingSideAttribute();
  }

  /**
   * 位置落定
   * left/top 已纳入 root 的默认 transition（与尺寸同参数），
   * 因此这里直接写入即可获得"边缩边靠 / 边放大边外移"的同步动画
   */
  private settleToPosition(left: number, top: number): void {
    this.applyFloatingPosition(left, top);
  }

  /**
   * 最小化 / 展开时同步贴边
   * 位置与尺寸共用同一组 transition 参数，两种变化同时开始、同时结束，
   * 视觉上就是"边缩小边靠边"/"边向外靠边放大"。
   * 必须用**目标尺寸**计算落点：此刻 DOM 仍是旧尺寸，读 offsetWidth 会算错。
   */
  private reposeForSizeChange(minimized: boolean): void {
    const browserWindow = getWindow();

    if (
      !browserWindow ||
      this.destroyed ||
      this.config.position === "static" ||
      this.config.embedMode === "article" ||
      !this.elements.root.classList.contains(sc.userPositioned)
    ) {
      return;
    }

    const root = this.elements.root;
    const margin = 8;
    const hostWidth = this.target.clientWidth || EXPANDED_WIDTH;
    const targetWidth = minimized
      ? MINIMIZED_SIZE
      : Math.min(EXPANDED_WIDTH, hostWidth);
    const targetHeight = minimized ? MINIMIZED_SIZE : EXPANDED_HEIGHT;
    const side =
      this.dragState.side ??
      (this.config.position.endsWith("left") ? "left" : "right");
    const left =
      side === "left"
        ? margin
        : Math.max(margin, browserWindow.innerWidth - targetWidth - margin);
    const inlineTop = Number.parseFloat(root.style.top);
    const top = Math.max(
      margin,
      Math.min(
        browserWindow.innerHeight - targetHeight - margin,
        Number.isFinite(inlineTop) ? inlineTop : margin,
      ),
    );

    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      return;
    }

    this.dragState.side = side;
    root.dataset.side = side;
    this.applyFloatingPosition(left, top);

    // 尺寸过渡期间禁止视口夹取回写，否则会把正在进行的贴边动画覆盖掉
    this.holdViewportSnap();
  }

  /** 尺寸过渡期间挂起视口夹取，过渡结束后恢复 */
  private holdViewportSnap(): void {
    const browserWindow = getWindow();

    if (!browserWindow) {
      return;
    }

    // 顺序很关键：先清理上一次的守卫（内部会 delete data-resizing），再设新标记
    this.clearResizeGuard();
    this.elements.root.dataset.resizing = "true";
    this.resizeGuardTimer = browserWindow.setTimeout(() => {
      this.resizeGuardTimer = null;
      delete this.elements.root.dataset.resizing;
    }, RESIZE_GUARD_MS);
  }

  private clearResizeGuard(): void {
    if (this.resizeGuardTimer != null) {
      getWindow()?.clearTimeout(this.resizeGuardTimer);
      this.resizeGuardTimer = null;
    }

    delete this.elements.root.dataset.resizing;
  }

  private resetFloatingPosition(): void {
    const browserWindow = getWindow();
    if (browserWindow && this.dragState.frameId !== null) {
      browserWindow.cancelAnimationFrame(this.dragState.frameId);
      this.dragState.frameId = null;
    }

    if (
      this.dragState.pointerId !== null &&
      this.elements.root.hasPointerCapture?.(this.dragState.pointerId)
    ) {
      this.elements.root.releasePointerCapture?.(this.dragState.pointerId);
    }

    this.elements.root.style.left = "";
    this.elements.root.style.top = "";
    this.elements.root.style.right = "";
    this.elements.root.style.bottom = "";
    this.elements.root.classList.remove(sc.userPositioned, sc.dragging);
    delete this.elements.root.dataset.dragging;
    delete this.elements.root.dataset.side;
    this.dragState.side = null;
    this.dragState.active = false;
    this.dragState.moved = false;
    this.dragState.ready = false;
    this.dragState.pointerId = null;
  }

  private snapToViewportEdge(): void {
    const browserWindow = getWindow();

    if (!browserWindow) {
      return;
    }

    const rect = this.elements.root.getBoundingClientRect();
    const width = rect.width || 420;
    const height = rect.height || 120;
    const horizontalMargin = Math.max(
      0,
      Math.min(20, (browserWindow.innerWidth - width) / 2),
    );
    const side =
      rect.left + rect.width / 2 < browserWindow.innerWidth / 2
        ? "left"
        : "right";
    const left =
      side === "left"
        ? horizontalMargin
        : browserWindow.innerWidth - width - horizontalMargin;
    // 吸附后仍需保证完整落在视口内，避免贴边后被裁掉
    const top = Math.max(
      8,
      Math.min(browserWindow.innerHeight - height - 8, rect.top),
    );
    this.dragState.side = side;
    this.settleToPosition(left, top);
  }

  private snapPositionIntoViewport(): void {
    const browserWindow = getWindow();

    if (
      this.config.position === "static" ||
      !browserWindow ||
      this.elements.root.dataset.resizing === "true" ||
      this.hasIdleStateClasses()
    ) {
      return;
    }

    const rect = this.elements.root.getBoundingClientRect();
    const width = rect.width || 420;
    const height = rect.height || 120;
    const left = Math.max(
      8,
      Math.min(browserWindow.innerWidth - width - 8, rect.left),
    );
    const top = Math.max(
      8,
      Math.min(browserWindow.innerHeight - height - 8, rect.top),
    );

    if (Number.isFinite(left) && Number.isFinite(top)) {
      this.applyFloatingPosition(left, top);
    }
  }

  private queueViewportSnap(): void {
    const browserWindow = getWindow();
    if (
      !browserWindow ||
      this.config.position === "static" ||
      this.config.embedMode === "article" ||
      this.hasIdleStateClasses() ||
      // 尺寸过渡期间不夹取：此时 rect 是动画中间值，回写会把贴边动画覆盖掉
      this.elements.root.dataset.resizing === "true" ||
      !this.elements.root.classList.contains(sc.userPositioned) ||
      this.viewportSnapFrame !== null
    ) {
      return;
    }

    this.viewportSnapFrame = browserWindow.requestAnimationFrame(() => {
      this.viewportSnapFrame = null;
      this.snapPositionIntoViewport();
    });
  }

  private clearViewportSnapFrame(): void {
    const browserWindow = getWindow();
    if (!browserWindow || this.viewportSnapFrame === null) {
      return;
    }

    browserWindow.cancelAnimationFrame(this.viewportSnapFrame);
    this.viewportSnapFrame = null;
  }

  private getPersistablePosition(): StoredPosition | null {
    if (
      !this.canPersistPosition() ||
      !getWindow() ||
      this.hasIdleStateClasses()
    ) {
      return null;
    }

    const rect = this.elements.root.getBoundingClientRect();

    if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) {
      return null;
    }

    return {
      left: rect.left,
      top: rect.top,
      side: this.dragState.side ?? undefined,
    };
  }

  private canPersistPosition(): boolean {
    return (
      this.config.remember &&
      this.config.position !== "static" &&
      this.config.embedMode !== "article" &&
      (Boolean(this.config.storageKey) || Boolean(this.target.id))
    );
  }

  private applyRestoredPosition(): void {
    const browserWindow = getWindow();

    if (
      !this.restoredState.position ||
      !this.canPersistPosition() ||
      !browserWindow
    ) {
      return;
    }

    const width = this.elements.root.offsetWidth || 420;
    const height = this.elements.root.offsetHeight || 120;
    const left = Math.max(
      8,
      Math.min(
        browserWindow.innerWidth - width - 8,
        this.restoredState.position.left,
      ),
    );
    const top = Math.max(
      8,
      Math.min(
        browserWindow.innerHeight - height - 8,
        this.restoredState.position.top,
      ),
    );

    if (Number.isFinite(left) && Number.isFinite(top)) {
      this.dragState.side =
        left + width / 2 < browserWindow.innerWidth / 2 ? "left" : "right";
      this.applyFloatingPosition(left, top);
    }
  }

  private syncFloatingSideAttribute(): void {
    if (
      this.config.position === "static" ||
      this.config.embedMode === "article"
    ) {
      delete this.elements.root.dataset.side;
      return;
    }

    const side = this.getFloatingSide();

    if (side) {
      this.elements.root.dataset.side = side;
      this.dragState.side = side;
    } else {
      delete this.elements.root.dataset.side;
      this.dragState.side = null;
    }
  }

  private getFloatingSide(): "left" | "right" | null {
    const browserWindow = getWindow();
    const root = this.elements.root;

    if (root.classList.contains(sc.userPositioned) && browserWindow) {
      // 优先用刚写入内联样式的 left 做算术判定：
      // 拖动时每帧都会走到这里，getBoundingClientRect 会强制同步布局造成掉帧
      const inlineLeft = Number.parseFloat(root.style.left);
      const width = this.dragState.width || root.offsetWidth || 420;

      if (Number.isFinite(inlineLeft)) {
        return inlineLeft + width / 2 < browserWindow.innerWidth / 2
          ? "left"
          : "right";
      }

      const rect = root.getBoundingClientRect();
      if (Number.isFinite(rect.left) && Number.isFinite(rect.width)) {
        return rect.left + rect.width / 2 < browserWindow.innerWidth / 2
          ? "left"
          : "right";
      }
    }

    if (this.dragState.side) {
      return this.dragState.side;
    }

    if (this.config.position.endsWith("left")) {
      return "left";
    }

    if (this.config.position.endsWith("right")) {
      return "right";
    }

    return null;
  }
}

function nextPlayMode(mode: NMPv3PlayMode): NMPv3PlayMode {
  if (mode === "list") {
    return "single";
  }

  if (mode === "single") {
    return "shuffle";
  }

  return "list";
}

/**
 * 把播放失败原因翻译成面向用户的提示
 * 浏览器自动播放策略拒绝与网络/解码失败需要区分，避免统一显示技术性文案
 */
function playErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";

  if (name === "NotAllowedError") {
    return "Playback needs a user gesture. Click the play button to start.";
  }

  if (name === "NotSupportedError") {
    return "This audio format is not supported by the browser.";
  }

  if (name === "AbortError") {
    return "Playback was interrupted.";
  }

  return error instanceof Error && error.message
    ? error.message
    : "Playback failed";
}

function clampIndex(index: number, songs: readonly NMPv3Song[]): number {
  if (!Number.isFinite(index) || songs.length === 0) {
    return 0;
  }

  return Math.max(0, Math.min(songs.length - 1, Math.trunc(index)));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
