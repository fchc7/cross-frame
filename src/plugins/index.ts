/**
 * 插件模块导出
 */

// 基础插件
export { Logger, createLogger } from "./logger";
export type { LoggerOptions } from "./logger";

export { RetryManager, createRetryManager } from "./retry";
export type { RetryOptions } from "./retry";

// 高级功能插件
export { QueueManager, createQueueManager } from "./queue-manager";
export type { QueueOptions } from "./queue-manager";

// 统一插件配置类型
export interface PluginsConfig {
  logger?: boolean | import("./logger").LoggerOptions;
  retry?: boolean | import("./retry").RetryOptions;
  queue?: boolean | import("./queue-manager").QueueOptions;
}
