import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioController } from "./AudioController";

describe("AudioController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not reset playback when play receives the current source again", async () => {
    vi.stubGlobal("Audio", MockAudioElement);
    MockAudioElement.instances = [];
    const controller = new AudioController();
    const audio = MockAudioElement.instances[0];

    controller.setSrc("https://music.test/song.mp3");
    controller.seek(42);

    await controller.play("https://music.test/song.mp3");

    expect(audio.srcAssignments).toEqual(["https://music.test/song.mp3"]);
    expect(controller.getState().currentTime).toBe(42);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });
});

class MockAudioElement {
  static instances: MockAudioElement[] = [];

  currentTime = 0;
  duration = 240;
  volume = 1;
  srcAssignments: string[] = [];
  play = vi.fn(async () => {});
  pause = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  private audioSrc = "";

  constructor() {
    MockAudioElement.instances.push(this);
  }

  get src(): string {
    return this.audioSrc;
  }

  set src(value: string) {
    this.audioSrc = value;
    this.currentTime = 0;
    this.srcAssignments.push(value);
  }

  removeAttribute(name: string): void {
    if (name === "src") {
      this.audioSrc = "";
    }
  }
}
