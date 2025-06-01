/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 消息处理器
 * 负责处理消息的发送、接收和响应逻辑
 */

import type {
  MessageType,
  RequestMessage,
  ResponseMessage,
  EventListener,
  PendingRequest,
} from "./types";

export class MessageHandler {
  private pendingRequests = new Map<string, PendingRequest>();
  private eventListeners = new Map<MessageType, Set<EventListener>>();
  private messageId = 0;
  private targetOrigin: string;
  private timeout?: number;
  private debug: boolean;
  private timeoutChecker: number | null = null; // 集中式超时检查器
  private checkInterval = 1000; // 检查间隔（毫秒）

  constructor(targetOrigin: string, timeout?: number, debug: boolean = false) {
    this.targetOrigin = targetOrigin;
    this.timeout = timeout;
    this.debug = debug;

    // 启动超时检查器
    this.startTimeoutChecker();
  }

  /**
   * 启动集中式超时检查器
   */
  private startTimeoutChecker(): void {
    if (this.timeoutChecker !== null) return;

    this.timeoutChecker = setInterval(() => {
      this.checkTimeouts();
    }, this.checkInterval) as unknown as number;
  }

  /**
   * 检查所有待处理请求的超时
   */
  private checkTimeouts(): void {
    if (this.pendingRequests.size === 0) return;

    const now = Date.now();

    // 收集超时的请求ID
    const timedOutIds: string[] = [];

    this.pendingRequests.forEach((request, id) => {
      if (request.expirationTime && now >= request.expirationTime) {
        timedOutIds.push(id);
      }
    });

    // 处理超时的请求
    timedOutIds.forEach((id) => {
      const request = this.pendingRequests.get(id);
      if (request) {
        this.pendingRequests.delete(id);
        request.reject(new Error(`Request timeout: ${id}`));

        if (this.debug) {
          this.log(`请求超时: ${id}`);
        }
      }
    });
  }

  /**
   * 生成唯一的消息ID
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageId}`;
  }

  /**
   * 调试日志
   */
  log(...args: any[]): void {
    if (this.debug) {
      console.log("[CrossFrame]", ...args);
    }
  }

  /**
   * 处理响应消息
   */
  handleResponse(response: ResponseMessage): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      return;
    }

    // 不再需要清除计时器，直接从待处理请求中移除
    this.pendingRequests.delete(response.id);

    if (response.success) {
      pending.resolve(response.data);
    } else {
      pending.reject(new Error(response.error || "Unknown error"));
    }
  }

  /**
   * 处理请求消息
   */
  async handleRequest(request: RequestMessage, source: Window): Promise<void> {
    this.log("Received request:", request);

    const listeners = this.eventListeners.get(request.type);
    if (!listeners || listeners.size === 0) {
      // 发送错误响应
      const response: ResponseMessage = {
        id: request.id,
        success: false,
        error: `No handler for message type: ${request.type}`,
        isResponse: true,
        timestamp: Date.now(),
      };
      source.postMessage(response, this.targetOrigin);
      return;
    }

    try {
      // 执行所有监听器
      const results = await Promise.all(
        Array.from(listeners).map((listener) => listener(request.payload))
      );

      // 发送成功响应（取第一个结果）
      const response: ResponseMessage = {
        id: request.id,
        success: true,
        data: results[0],
        isResponse: true,
        timestamp: Date.now(),
      };
      source.postMessage(response, this.targetOrigin);
    } catch (error) {
      // 发送错误响应
      const response: ResponseMessage = {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        isResponse: true,
        timestamp: Date.now(),
      };
      source.postMessage(response, this.targetOrigin);
    }
  }

  /**
   * 创建待处理的请求
   * @param id 请求ID
   * @param resolve 成功回调
   * @param reject 失败回调
   * @param requestTimeout 可选的单个请求超时时间，覆盖全局设置
   */
  createPendingRequest(
    id: string,
    resolve: Function,
    reject: Function,
    requestTimeout?: number
  ): void {
    // 优先使用请求特定的超时时间，其次使用全局超时设置
    const timeout =
      requestTimeout !== undefined ? requestTimeout : this.timeout;

    // 计算过期时间
    const expirationTime =
      timeout !== undefined ? Date.now() + timeout : undefined;

    // 添加到待处理请求，设置过期时间而不是计时器
    this.pendingRequests.set(id, {
      resolve,
      reject,
      expirationTime,
    });
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: MessageType, listener: EventListener): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    this.eventListeners.get(type)!.add(listener);

    // 返回取消监听的函数
    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(type);
        }
      }
    };
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: MessageType, listener?: EventListener): void {
    const listeners = this.eventListeners.get(type);

    if (!listeners) {
      return;
    }

    if (listener) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    } else {
      this.eventListeners.delete(type);
    }
  }

  /**
   * 清理所有待处理的请求
   */
  cleanup(): void {
    // 停止超时检查器
    if (this.timeoutChecker !== null) {
      clearInterval(this.timeoutChecker);
      this.timeoutChecker = null;
    }

    // 拒绝所有待处理请求
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("Bridge destroyed"));
    });
    this.pendingRequests.clear();
    this.eventListeners.clear();
  }

  /**
   * 获取待处理请求数量（用于调试）
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * 获取监听器数量（用于调试）
   */
  getListenersCount(): number {
    return this.eventListeners.size;
  }
}
