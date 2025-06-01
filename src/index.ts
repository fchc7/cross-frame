/**
 * 跨框架通信工具包
 * 主入口文件
 */

// 导出类型定义
export type {
  MessageType,
  BaseMessage,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  BridgeConfig,
  EventListener,
} from "./types";

// 导出核心类（必需）
export { IframeBridge } from "./base-bridge";
export { HostBridge } from "./host-bridge";
export { ChildBridge } from "./child-bridge";
export { MessageHandler } from "./message-handler";

// 导出工厂函数
export {
  createHostBridge,
  createChildBridge,
  createAutoBridge,
  // 增强版（带插件支持）
  createEnhancedHostBridge,
  createEnhancedChildBridge,
  createEnhancedBridge,
  // 配置类型
  type EnhancedBridgeConfig,
} from "./factory";

// 导出所有插件
export * from "./plugins";

// 便捷导出函数（推荐使用）
/**
 * 创建跨框架桥梁实例（自动检测环境、支持插件）
 * 这是推荐的主要使用方法
 */
export { createEnhancedBridge as createBridge } from "./factory";
