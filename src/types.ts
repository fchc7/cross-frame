/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 跨框架通信工具包类型定义
 */

// 基础类型定义
export type MessageType = `${string}:${string}`;

export interface BaseMessage<T = any> {
  type: MessageType;
  payload: T;
  windowId?: string; // 可选的窗口标识符，用于多窗口隔离
  timestamp: number;
}

export interface RequestMessage<T = any> extends BaseMessage<T> {
  id: string;
  needResponse: true;
}

export interface ResponseMessage<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  windowId?: string;
  timestamp: number;
  isResponse: true;
}

export interface EventMessage<T = any> extends BaseMessage<T> {
  needResponse?: false;
}

// 通信配置
export interface BridgeConfig {
  targetOrigin?: string;
  timeout?: number;
  debug?: boolean;
  enableMultiWindow?: boolean; // 是否启用多窗口隔离
  windowId?: string; // 自定义窗口ID
}

// 事件监听器类型
export type EventListener<T = any, R = any> = (payload: T) => R | Promise<R>;

// 待处理请求类型
export interface PendingRequest {
  resolve: Function;
  reject: Function;
  expirationTime?: number; // 过期时间而不是计时器
}
