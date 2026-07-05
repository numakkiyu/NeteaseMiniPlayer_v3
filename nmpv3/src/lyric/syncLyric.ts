import type { NMPv3LyricLine } from "../types";

/**
 * 根据当前播放时间查找对应的歌词行
 * 返回最后一个 time ≤ currentTime 的歌词行
 */
export function syncLyric(
  lyrics: readonly NMPv3LyricLine[],
  currentTime: number,
): NMPv3LyricLine | null {
  if (lyrics.length === 0 || !Number.isFinite(currentTime)) {
    return null;
  }

  let active: NMPv3LyricLine | null = null;

  for (const line of lyrics) {
    if (currentTime >= line.time) {
      active = line;
    } else {
      break;
    }
  }

  return active;
}
