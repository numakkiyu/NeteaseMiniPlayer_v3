import { NeteaseApiClient } from "../api/NeteaseApiClient";
import { normalizeConfig } from "../config/normalizeConfig";
import { normalizeLyrics } from "../lyric/normalizeLyrics";
import { syncLyric as findActiveLyric } from "../lyric/syncLyric";
import {
  renderPlayerShell,
  updatePlayerView,
  type NMPv3RenderedElements,
} from "../ui/render";
import { classNames as c, stateClassNames as sc } from "../ui/classNames";
import { getDocument, getWindow } from "../utils/env";
import { emit } from "../utils/event";
import { logger } from "../utils/logger";
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
    await this.audio.play(this.currentSong?.url);

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
    this.cleanup.forEach((dispose) => dispose());
    this.cleanup.length = 0;
    mediaSessionManager.release(this);
    this.audio.destroy();
    this.target.innerHTML = "";
  }

  private async bootstrap(): Promise<void> {
    if (
      this.config.position !== "static" &&
      this.config.embedMode !== "article"
    ) {
      this.isMinimized =
        this.restoredState.minimized ?? this.config.defaultMinimized;
    }

    if (this.config.playlistId) {
      await this.loadPlaylist(this.config.playlistId);
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

  private bindEvents(): void {
    this.listen(this.elements.playButton, "click", () => void this.toggle());
    this.listen(
      this.elements.previousButton,
      "click",
      () => void this.previous(),
    );
    this.listen(this.elements.nextButton, "click", () => void this.next());
    this.listen(this.elements.progressTrack, "click", (event) =>
      this.seekFromPointer(event as MouseEvent, this.elements.progressTrack),
    );
    this.listen(this.elements.volumeTrack, "click", (event) =>
      this.volumeFromPointer(event as MouseEvent, this.elements.volumeTrack),
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

      this.isMinimized = !this.isMinimized;
      if (!this.isMinimized) {
        this.clearIdleStateClasses();
      }
      this.persistSettings();
      this.updateView();
      this.startIdleTimer();
    });
    this.listen(this.elements.cover.parentElement, "click", () => {
      if (
        this.dragState.moved ||
        Date.now() < this.dragState.suppressClickUntil
      ) {
        return;
      }

      if (this.isMinimized) {
        this.isMinimized = false;
        this.clearIdleStateClasses();
        this.persistSettings();
        this.updateView();
        return;
      }

      if (this.currentSong?.id) {
        getWindow()?.open(
          `https://music.163.com/song?id=${encodeURIComponent(this.currentSong.id)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
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
      this.listen(browserWindow, "resize", () =>
        this.snapPositionIntoViewport(),
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
        this.currentTime = audioState.currentTime;
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
        getWindow()?.setTimeout(
          () => void this.advanceAfterPlaybackError(shouldResume, failedIndex),
          900,
        );
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

      this.playlist = playlist.songs;
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
    if (
      this.destroyed ||
      this.playlist.length <= 1 ||
      this.currentIndex !== failedIndex
    ) {
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
      try {
        song.url = await this.api.getSongUrl(song.id);
      } catch {
        if (!this.isCurrentLoad(generation)) {
          return false;
        }

        // 高品质地址失败时降级到标准音质
        song.url = await this.api.getSongUrl(song.id, "standard");
      }
    }

    if (!this.isCurrentLoad(generation) || !song.url) {
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

  private seekFromPointer(event: MouseEvent, track: HTMLElement): void {
    if (!this.duration) {
      return;
    }

    const rect = track.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    this.seekTo(percent * this.duration);
  }

  private volumeFromPointer(event: MouseEvent, track: HTMLElement): void {
    const rect = track.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    this.setVolume(percent);
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

    this.store.set<number>(`progress:${this.currentSong.id}`, this.currentTime);
    this.lastProgressPersistedAt = now;
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
      this.store.set<number>(`progress:${this.currentSong.id}`, 0);
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

      this.elements.root.classList.add(sc.dragging);
    };

    const onPointerUp = (event: PointerEvent, cancelled = false) => {
      if (!this.dragState.active) {
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
      this.elements.root.style.transition = "";

      if (!cancelled && this.dragState.moved) {
        this.snapToViewportEdge();
        this.persistSettings();
      } else if (!cancelled && this.isMinimized) {
        this.isMinimized = false;
        this.dragState.suppressClickUntil = Date.now() + 350;
        this.clearIdleStateClasses();
        this.persistSettings();
        this.updateView();
      }

      this.dragState.ready = false;
      if (cancelled) {
        this.dragState.moved = false;
      }
      this.startIdleTimer();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !this.canDrag()) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.closest(interactiveSelector) || this.isPlaylistOpen) {
        return;
      }

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
      this.elements.root.style.transition = "none";
      this.elements.root.setPointerCapture?.(event.pointerId);
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

  private canDrag(): boolean {
    return (
      this.config.draggable &&
      this.config.position !== "static" &&
      this.config.embedMode !== "article"
    );
  }

  private applyFloatingPosition(left: number, top: number): void {
    this.elements.root.style.left = `${left}px`;
    this.elements.root.style.top = `${top}px`;
    this.elements.root.style.right = "auto";
    this.elements.root.style.bottom = "auto";
    this.elements.root.classList.add(sc.userPositioned);
    this.syncFloatingSideAttribute();
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
    this.elements.root.style.transition = "";
    this.elements.root.classList.remove(sc.userPositioned, sc.dragging);
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
    this.dragState.side = side;
    this.applyFloatingPosition(left, rect.top);
  }

  private snapPositionIntoViewport(): void {
    const browserWindow = getWindow();

    if (
      this.config.position === "static" ||
      !browserWindow ||
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
