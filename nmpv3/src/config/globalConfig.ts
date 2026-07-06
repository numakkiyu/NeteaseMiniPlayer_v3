import { mergeConfig, normalizeConfig } from "./normalizeConfig";
import { getWindow } from "../utils/env";
import type { NMPv3Config } from "../types";

/**
 * 运行时全局配置管理
 * 允许通过 window.NMPv3Config 在脚本加载前预设配置
 */
let globalConfig: NMPv3Config = normalizeConfig(readWindowRuntimeConfig());

export function getGlobalConfig(): NMPv3Config {
  return globalConfig;
}

export function setGlobalConfig(config: Partial<NMPv3Config>): NMPv3Config {
  const patch = mergeConfig(config);
  globalConfig = normalizeConfig(mergeConfig(globalConfig, patch));
  syncWindowRuntimeConfig(patch);
  return globalConfig;
}

export function setGlobalApiBaseUrl(apiBaseUrl: string): NMPv3Config {
  return setGlobalConfig({ apiBaseUrl });
}

export function refreshGlobalConfigFromWindow(): NMPv3Config {
  const runtimeConfig = readWindowRuntimeConfig();

  if (Object.keys(runtimeConfig).length > 0) {
    globalConfig = normalizeConfig(mergeConfig(globalConfig, runtimeConfig));
  }

  return globalConfig;
}

export function resolveConfigWithGlobal(
  config: Partial<NMPv3Config> = {},
): Partial<NMPv3Config> {
  return mergeConfig(refreshGlobalConfigFromWindow(), config);
}

function readWindowRuntimeConfig(): Partial<NMPv3Config> {
  const browserWindow = getWindow();

  if (!browserWindow) {
    return {};
  }

  return mergeConfig(
    browserWindow.NeteaseMiniPlayerConfig,
    browserWindow.NeteaseMiniPlayerApiBaseUrl
      ? { apiBaseUrl: browserWindow.NeteaseMiniPlayerApiBaseUrl }
      : undefined,
    browserWindow.NMPv3ApiBaseUrl
      ? { apiBaseUrl: browserWindow.NMPv3ApiBaseUrl }
      : undefined,
    browserWindow.NMPv3Config,
  );
}

function syncWindowRuntimeConfig(config: Partial<NMPv3Config>): void {
  const browserWindow = getWindow();

  if (!browserWindow) {
    return;
  }

  browserWindow.NMPv3Config = mergeConfig(browserWindow.NMPv3Config, config);

  if (config.apiBaseUrl) {
    browserWindow.NMPv3ApiBaseUrl = config.apiBaseUrl;
    browserWindow.NeteaseMiniPlayerApiBaseUrl = config.apiBaseUrl;
  }
}
