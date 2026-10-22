export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

/**
 * 解析标准 LRC 歌词文本
 * 支持 [mm:ss.xxx] 格式，毫秒部分可选
 */
const timeTagPattern = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?]/g;

export function parseLrc(input: string): LyricLine[] {
  const lines: LyricLine[] = [];

  for (const rawLine of input.split(/\r?\n/)) {
    // 一行可能带多个时间标签（网易云副歌重复行形如 [00:12][00:45]歌词），
    // 逐个展开成独立歌词行，避免第二个标签被当成正文
    const tags = [...rawLine.matchAll(timeTagPattern)];

    if (tags.length === 0) {
      continue;
    }

    // 正文位于最后一个时间标签之后
    const lastTag = tags[tags.length - 1];
    const text = rawLine.slice((lastTag.index ?? 0) + lastTag[0].length).trim();

    for (const tag of tags) {
      lines.push({
        time: toSeconds(tag[1], tag[2], tag[3]),
        text,
      });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
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
