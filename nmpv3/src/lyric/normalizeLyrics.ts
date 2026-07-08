import type { NeteaseLyricResponse } from "../api/types";
import type { NMPv3LyricLine, NMPv3LyricStatus } from "../types";
import { mergeLyrics, parseLrc } from "./parseLrc";

type LoadedLyricStatus = Extract<
  NMPv3LyricStatus,
  "ready" | "empty" | "instrumental"
>;

interface NormalizedLyrics {
  lyrics: NMPv3LyricLine[];
  status: LoadedLyricStatus;
}

export function normalizeLyrics(data: NeteaseLyricResponse): NormalizedLyrics {
  const lyrics = mergeLyrics(data.lrc?.lyric, data.tlyric?.lyric).filter(
    hasDisplayableLyric,
  );

  if (lyrics.length > 0) {
    return { lyrics, status: "ready" };
  }

  return {
    lyrics,
    status: isInstrumentalResponse(data) ? "instrumental" : "empty",
  };
}

function hasDisplayableLyric(line: NMPv3LyricLine): boolean {
  return Boolean(line.text.trim() || line.translation?.trim());
}

function isInstrumentalResponse(data: NeteaseLyricResponse): boolean {
  if (data.pureMusic || data.nolyric) {
    return true;
  }

  const originalLines = parseLrc(data.lrc?.lyric ?? "");
  const translatedLines = parseLrc(data.tlyric?.lyric ?? "");
  const timedLines = [...originalLines, ...translatedLines];

  return timedLines.length > 0 && timedLines.every((line) => !line.text.trim());
}
