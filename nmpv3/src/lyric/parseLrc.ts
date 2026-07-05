export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

/**
 * 解析标准 LRC 歌词文本
 * 支持 [mm:ss.xxx] 格式，毫秒部分可选
 */
const linePattern = /^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?]\s*(.*)$/;

export function parseLrc(input: string): LyricLine[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.match(linePattern))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      time: toSeconds(match[1], match[2], match[3]),
      text: match[4] ?? "",
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * 合并原文歌词和翻译歌词
 * 按时间戳（精确到 0.01 秒）匹配原文和译文行
 */
export function mergeLyrics(
  originalInput = "",
  translationInput = "",
): LyricLine[] {
  const original = parseLrc(originalInput);
  const translations = parseLrc(translationInput);
  const translationMap = new Map(
    translations.map((line) => [roundTime(line.time), line.text]),
  );

  return original.map((line) => ({
    ...line,
    translation: translationMap.get(roundTime(line.time)),
  }));
}

function roundTime(time: number): number {
  return Math.round(time * 100) / 100;
}

function toSeconds(
  minutes: string,
  seconds: string,
  fraction: string | undefined,
): number {
  const milliseconds = Number((fraction ?? "0").padEnd(3, "0"));
  return (
    (Number(minutes) * 60 * 1000 + Number(seconds) * 1000 + milliseconds) / 1000
  );
}
