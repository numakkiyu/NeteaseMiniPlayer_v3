/**
 * HTML5 Audio 封装层
 * 负责音频播放、暂停、seek、音量控制和事件订阅
 */
export class AudioController {
  private readonly audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
  }

  async play(url?: string): Promise<void> {
    if (url) {
      this.audio.src = url;
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
    if (this.audio.src !== url) {
      this.audio.src = url;
    }
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  seek(time: number): void {
    if (Number.isFinite(time)) {
      this.audio.currentTime = Math.max(0, time);
    }
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
    this.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }
}
