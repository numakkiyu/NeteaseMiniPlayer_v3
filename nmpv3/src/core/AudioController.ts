/**
 * HTML5 Audio 封装层
 * 负责音频播放、暂停、seek、音量控制和事件订阅
 */
export class AudioController {
  private readonly audio: HTMLAudioElement;
  private currentSrc = "";
  /**
   * 待生效的 seek 位置
   * iOS Safari 在 readyState = HAVE_NOTHING 阶段赋值 currentTime 会被静默丢弃，
   * 因此元数据加载完成前记录的 seek 先暂存，待 loadedmetadata 后补发
   */
  private pendingSeek: number | null = null;
  private readonly detachLoadedMetadata: () => void;

  constructor() {
    this.audio = new Audio();
    this.detachLoadedMetadata = this.on("loadedmetadata", () => {
      this.flushPendingSeek();
    });
  }

  async play(url?: string): Promise<void> {
    if (url) {
      this.setSrc(url);
    }

    if (!this.audio.src) {
      return;
    }

    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  setSrc(url: string): void {
    if (this.currentSrc !== url || !this.audio.src) {
      this.audio.src = url;
      this.currentSrc = url;
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  seek(time: number): void {
    if (!Number.isFinite(time)) {
      return;
    }

    const target = Math.max(0, time);

    // 元数据尚未就绪时先暂存，避免 iOS 上 seek 被丢弃
    if (this.audio.readyState < HAVE_METADATA) {
      this.pendingSeek = target;
      return;
    }

    this.pendingSeek = null;
    this.audio.currentTime = target;
  }

  on<K extends keyof HTMLMediaElementEventMap>(
    event: K,
    handler: (event: HTMLMediaElementEventMap[K]) => void,
  ): () => void {
    this.audio.addEventListener(event, handler);
    return () => this.audio.removeEventListener(event, handler);
  }

  getState(): Pick<HTMLAudioElement, "currentTime" | "duration" | "volume"> {
    return {
      currentTime: this.audio.currentTime,
      duration: this.audio.duration,
      volume: this.audio.volume,
    };
  }

  destroy(): void {
    this.pendingSeek = null;
    this.detachLoadedMetadata();
    this.pause();
    this.audio.removeAttribute("src");
    this.currentSrc = "";
    this.audio.load();
  }

  private flushPendingSeek(): void {
    const pending = this.pendingSeek;

    if (pending === null) {
      return;
    }

    this.pendingSeek = null;
    const duration = this.audio.duration;

    // 目标超出媒体时长时收敛到末尾之前，避免直接跳到结束
    const target =
      Number.isFinite(duration) && duration > 0
        ? Math.min(pending, Math.max(0, duration - 0.5))
        : pending;

    this.audio.currentTime = target;
  }
}

/** HTMLMediaElement.HAVE_METADATA */
const HAVE_METADATA = 1;
