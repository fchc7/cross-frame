/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 跨框架通信基础桥梁类
 */

import { MessageHandler } from "./message-handler";
import type {
  MessageType,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  BridgeConfig,
  EventListener,
} from "./types";

export abstract class IframeBridge {
  protected messageHandler: MessageHandler;
  protected config: Required<BridgeConfig>;
  protected windowId?: string;

  constructor(config: BridgeConfig = {}) {
    // 设置默认配置
    this.config = {
      targetOrigin: "*",
      timeout: 5000,
      debug: false,
      enableMultiWindow: false,
      windowId: "",
      ...config,
    };

    // 如果启用多窗口隔离，生成或使用提供的窗口ID
    if (this.config.enableMultiWindow) {
      this.windowId = this.config.windowId || this.generateWindowId();
      if (this.config.debug) {
        console.log(`[CrossFrame] 多窗口模式启用，窗口ID: ${this.windowId}`);
      }
    }

    this.messageHandler = new MessageHandler(
      this.config.targetOrigin,
      this.config.timeout,
      this.config.debug
    );

    this.setupMessageListener();
  }

  /**
   * 生成唯一窗口ID
   */
  private generateWindowId(): string {
    return `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 设置消息监听器
   */
  protected abstract setupMessageListener(): void;

  /**
   * 获取目标窗口
   */
  protected abstract getTargetWindow(): Window | null;

  /**
   * 发送消息（无返回值）
   */
  send<T = any>(type: MessageType, payload: T): void {
    const targetWindow = this.getTargetWindow();
    if (!targetWindow) {
      this.messageHandler.log("目标窗口不可用");
      return;
    }

    const message: EventMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    // 如果启用多窗口隔离，添加窗口ID
    if (this.config.enableMultiWindow && this.windowId) {
      message.windowId = this.windowId;
    }

    this.messageHandler.log("发送消息:", message);
    targetWindow.postMessage(message, this.config.targetOrigin);
  }

  /**
   * 发送请求（有返回值）
   * @param type 消息类型
   * @param payload 消息负载
   * @param requestTimeout 单个请求的超时时间（毫秒），覆盖全局设置
   */
  request<T = any, R = any>(
    type: MessageType,
    payload: T,
    requestTimeout?: number
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const targetWindow = this.getTargetWindow();
      if (!targetWindow) {
        reject(new Error("目标窗口不可用"));
        return;
      }

      const messageId = this.messageHandler.generateMessageId();

      // 创建待处理请求，使用传入的requestTimeout或默认配置
      this.messageHandler.createPendingRequest(
        messageId,
        resolve,
        reject,
        requestTimeout !== undefined ? requestTimeout : undefined
      );

      const message: RequestMessage<T> = {
        id: messageId,
        type,
        payload,
        needResponse: true,
        timestamp: Date.now(),
      };

      // 如果启用多窗口隔离，添加窗口ID
      if (this.config.enableMultiWindow && this.windowId) {
        message.windowId = this.windowId;
      }

      this.messageHandler.log("发送请求:", message);
      targetWindow.postMessage(message, this.config.targetOrigin);
    });
  }

  /**
   * 监听消息
   */
  on<T = any, R = any>(
    type: MessageType,
    listener: EventListener<T, R>
  ): () => void {
    return this.messageHandler.addEventListener(type, listener);
  }

  /**
   * 取消监听
   */
  off<T = any, R = any>(
    type: MessageType,
    listener?: EventListener<T, R>
  ): void {
    this.messageHandler.removeEventListener(type, listener);
  }

  /**
   * 处理接收到的消息
   */
  protected handleIncomingMessage(event: MessageEvent): void {
    const targetWindow = this.getTargetWindow();
    if (!targetWindow || event.source !== targetWindow) {
      return;
    }

    // 如果启用多窗口隔离，检查窗口ID
    if (this.config.enableMultiWindow) {
      if (!event.data?.windowId || event.data.windowId !== this.windowId) {
        if (this.config.debug) {
          this.messageHandler.log("忽略其他窗口消息:", event.data);
        }
        return;
      }
    }

    // 处理响应消息
    if (event.data?.isResponse) {
      this.messageHandler.handleResponse(event.data as ResponseMessage);
      return;
    }

    // 处理请求消息
    if (event.data?.needResponse) {
      this.messageHandler.handleRequest(
        event.data as RequestMessage,
        targetWindow
      );
      return;
    }

    // 处理普通事件消息
    if (event.data?.type) {
      const listeners = (this.messageHandler as any).eventListeners.get(
        event.data.type
      );
      if (listeners && listeners.size > 0) {
        listeners.forEach((listener: EventListener) => {
          try {
            listener(event.data.payload);
          } catch (error) {
            this.messageHandler.log("事件监听器执行错误:", error);
          }
        });
      }
    }
  }

  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      config: this.config,
      windowId: this.windowId,
      pendingRequests: this.messageHandler.getPendingRequestsCount(),
      listeners: this.messageHandler.getListenersCount(),
    };
  }

  /**
   * 销毁桥梁
   */
  destroy(): void {
    this.messageHandler.cleanup();
    window.removeEventListener(
      "message",
      this.handleIncomingMessage.bind(this)
    );
  }
}
