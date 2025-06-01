/**
 * 跨框架桥梁工厂函数
 */

import { HostBridge } from "./host-bridge";
import { ChildBridge } from "./child-bridge";
import type { BridgeConfig } from "./types";
import {
  PluginsConfig,
  createLogger,
  createRetryManager,
  createQueueManager,
} from "./plugins";

// 扩展配置接口
export interface EnhancedBridgeConfig extends BridgeConfig {
  plugins?: PluginsConfig;
}

/**
 * 创建增强的主窗口桥梁（带插件支持）
 */
export function createEnhancedHostBridge(
  iframe: HTMLIFrameElement,
  config: EnhancedBridgeConfig = {}
): HostBridge {
  const { plugins: pluginsConfig, ...bridgeConfig } = config;
  const bridge = new HostBridge(iframe, bridgeConfig);

  // 应用插件
  if (pluginsConfig) {
    applyPlugins(bridge, pluginsConfig);
  }

  return bridge;
}

/**
 * 创建增强的子窗口桥梁（带插件支持）
 */
export function createEnhancedChildBridge(
  config: EnhancedBridgeConfig = {}
): ChildBridge {
  const { plugins: pluginsConfig, ...bridgeConfig } = config;
  const bridge = new ChildBridge(bridgeConfig);

  // 应用插件
  if (pluginsConfig) {
    applyPlugins(bridge, pluginsConfig);
  }

  return bridge;
}

/**
 * 自动创建增强的桥梁（根据环境判断，带插件支持）
 */
export function createEnhancedBridge(
  iframeOrConfig?: HTMLIFrameElement | EnhancedBridgeConfig,
  config?: EnhancedBridgeConfig
): HostBridge | ChildBridge {
  // 如果在iframe环境中
  if (window !== window.parent) {
    const bridgeConfig =
      iframeOrConfig instanceof HTMLElement
        ? config
        : (iframeOrConfig as EnhancedBridgeConfig);
    return createEnhancedChildBridge(bridgeConfig);
  }

  // 如果在主窗口环境中
  if (iframeOrConfig instanceof HTMLElement) {
    return createEnhancedHostBridge(iframeOrConfig, config);
  }

  throw new Error("在主窗口环境中必须提供 iframe 元素");
}

/**
 * 应用插件到桥梁实例
 */
function applyPlugins(
  bridge: HostBridge | ChildBridge,
  config: PluginsConfig
): void {
  // 应用日志插件
  if (config.logger) {
    const options = config.logger === true ? {} : config.logger;
    createLogger(bridge, options);
  }

  // 应用重试插件
  if (config.retry) {
    const options = config.retry === true ? {} : config.retry;
    createRetryManager(bridge, options);
  }

  // 应用队列插件
  if (config.queue) {
    const options = config.queue === true ? {} : config.queue;
    createQueueManager(bridge, options);
  }
}

/**
 * 创建主窗口桥梁
 */
export function createHostBridge(
  iframe: HTMLIFrameElement,
  config?: BridgeConfig
): HostBridge {
  return new HostBridge(iframe, config);
}

/**
 * 创建子窗口桥梁
 */
export function createChildBridge(config?: BridgeConfig): ChildBridge {
  return new ChildBridge(config);
}

/**
 * 自动创建桥梁（根据环境判断）
 */
export function createAutoBridge(
  iframeOrConfig?: HTMLIFrameElement | BridgeConfig,
  config?: BridgeConfig
): HostBridge | ChildBridge {
  // 如果在iframe环境中
  if (window !== window.parent) {
    const bridgeConfig =
      iframeOrConfig instanceof HTMLElement ? config : iframeOrConfig;
    return new ChildBridge(bridgeConfig);
  }

  // 如果在主窗口环境中
  if (iframeOrConfig instanceof HTMLElement) {
    return new HostBridge(iframeOrConfig, config);
  }

  throw new Error("在主窗口环境中必须提供 iframe 元素");
}
