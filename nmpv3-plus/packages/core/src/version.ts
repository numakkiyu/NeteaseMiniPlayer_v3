/**
 * Plus 契约版本
 *
 * 与包版本分开管理：包版本随发布走，契约版本只在公开 API 出现
 * 不兼容变化时才提升。插件按它声明兼容范围，加载前即可判断能否运行。
 *
 * 规则：
 * - 新增可选字段或方法 → 不提升
 * - 修改已有字段语义、删除字段 → 提升主版本
 */
export const NMPV3_PLUS_API_VERSION = "1.0.0";

/** 契约主版本，用于快速兼容判断 */
export const NMPV3_PLUS_API_MAJOR = 1;

/**
 * 判断插件声明的兼容范围是否覆盖当前契约版本
 *
 * 支持的形式：`">=1.0.0"`、`"^1.2.0"`、`"1.x"`、`"1"`、`"*"`。
 * 解析不了的写法一律放行，避免因为格式问题挡住插件。
 */
export function isApiVersionCompatible(
  range: string | undefined,
  current: string = NMPV3_PLUS_API_VERSION,
): boolean {
  if (!range) {
    return true;
  }

  const text = range.trim();

  if (text === "" || text === "*" || text === "x") {
    return true;
  }

  const currentMajor = Number.parseInt(current.split(".")[0] ?? "0", 10);

  if (!Number.isFinite(currentMajor)) {
    return true;
  }

  const majorMatch = text.match(/(\d+)/);

  if (!majorMatch) {
    return true;
  }

  const declaredMajor = Number.parseInt(majorMatch[1], 10);

  if (text.startsWith(">=")) {
    return currentMajor >= declaredMajor;
  }

  // ^1.2.3、~1.2.3、1.x、1 都按主版本比对
  return declaredMajor === currentMajor;
}
