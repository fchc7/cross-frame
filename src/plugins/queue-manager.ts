/**
 * 消息队列管理器
 * 提供批量消息处理和流量控制功能
 */

import type { IframeBridge } from "../base-bridge";
import type { MessageType } from "../types";

export interface QueueOptions {
  maxSize?: number;
  flushInterval?: number;
  batchSize?: number;
  priority?: boolean;
}

interface QueuedMessage {
  type: MessageType;
  payload: any;
  priority?: number;
  timestamp: number;
  resolve?: (value: any) => void;
  reject?: (error: Error) => void;
  requestTimeout?: number;
}

export class QueueManager {
  private options: Required<QueueOptions>;
  private bridge: IframeBridge;
  private messageQueue: QueuedMessage[] = [];
  private processing = false;
  private flushTimer?: number;

  constructor(bridge: IframeBridge, options: QueueOptions = {}) {
    this.bridge = bridge;
    this.options = {
      maxSize: 100,
      flushInterval: 1000,
      batchSize: 10,
      priority: false,
      ...options,
    };

    this.setupQueue();
    this.startFlushTimer();
  }

  private setupQueue() {
    // 重写 send 方法
    const originalSend = this.bridge.send.bind(this.bridge); // eslint-disable-line @typescript-eslint/no-unused-vars
    this.bridge.send = <T>(type: MessageType, payload: T) => {
      this.enqueue({
        type,
        payload,
        timestamp: Date.now(),
      });
    };

    // 重写 request 方法，保留超时参数
    const originalRequest = this.bridge.request.bind(this.bridge); // eslint-disable-line @typescript-eslint/no-unused-vars
    this.bridge.request = <T, R>(
      type: MessageType,
      payload: T,
      requestTimeout?: number
    ): Promise<R> => {
      return new Promise((resolve, reject) => {
        this.enqueue({
          type,
          payload,
          timestamp: Date.now(),
          resolve,
          reject,
          requestTimeout,
        });
      });
    };
  }

  private enqueue(message: QueuedMessage) {
    // 检查队列大小
    if (this.messageQueue.length >= this.options.maxSize) {
      const error = new Error("消息队列已满");
      if (message.reject) {
        message.reject(error);
      } else {
        console.warn("[CrossFrame] 消息队列已满，丢弃消息:", message);
      }
      return;
    }

    // 添加到队列
    this.messageQueue.push(message);

    // 如果启用了优先级，对队列进行排序
    if (this.options.priority) {
      this.messageQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    // 立即处理或等待批量处理
    if (this.messageQueue.length >= this.options.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.messageQueue.length > 0) {
        this.flush();
      }
    }, this.options.flushInterval) as unknown as number;
  }

  private async flush() {
    if (this.processing || this.messageQueue.length === 0) {
      return;
    }

    this.processing = true;

    // 取出要处理的消息
    const batch = this.messageQueue.splice(0, this.options.batchSize);

    try {
      // 批量处理消息
      for (const message of batch) {
        try {
          if (message.resolve) {
            // 这是一个 request，传递超时参数
            const result = await this.bridge.request(
              message.type,
              message.payload,
              message.requestTimeout
            );
            message.resolve(result);
          } else {
            // 这是一个 send
            this.bridge.send(message.type, message.payload);
          }
        } catch (error) {
          if (message.reject) {
            message.reject(
              error instanceof Error ? error : new Error(String(error))
            );
          } else {
            console.error("[CrossFrame] 消息处理失败:", error);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // 手动刷新队列
  async flushNow(): Promise<void> {
    return this.flush();
  }

  // 设置消息优先级
  setPriority(type: MessageType, payload: any, priority: number) {
    this.enqueue({
      type,
      payload,
      priority,
      timestamp: Date.now(),
    });
  }

  // 获取队列状态
  getQueueStatus() {
    return {
      size: this.messageQueue.length,
      maxSize: this.options.maxSize,
      processing: this.processing,
      usage: (this.messageQueue.length / this.options.maxSize) * 100,
    };
  }

  // 清空队列
  clear() {
    const rejectedCount = this.messageQueue.filter((msg) => msg.reject).length;
    this.messageQueue.forEach((msg) => {
      if (msg.reject) {
        msg.reject(new Error("队列已清空"));
      }
    });
    this.messageQueue = [];
    console.log(`[CrossFrame] 队列已清空，${rejectedCount} 个请求被拒绝`);
  }

  // 销毁队列管理器
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.clear();
  }
}

// 工厂函数
export function createQueueManager(
  bridge: IframeBridge,
  options?: QueueOptions
): QueueManager {
  return new QueueManager(bridge, options);
}
