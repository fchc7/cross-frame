/**
 * 重试插件
 * 为 iframe-connect 提供自动重试功能
 */

import type { IframeBridge } from "../base-bridge";
import type { MessageType } from "../types";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoff?: "linear" | "exponential";
  retryCondition?: (error: Error) => boolean;
}

export class RetryManager {
  private options: Required<RetryOptions>;
  private bridge: IframeBridge;

  constructor(bridge: IframeBridge, options: RetryOptions = {}) {
    this.bridge = bridge;
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoff: "exponential",
      retryCondition: (error) => error.message.includes("timeout"),
      ...options,
    };

    this.setupRetry();
  }

  private setupRetry() {
    // 重写 request 方法以支持重试
    const originalRequest = this.bridge.request.bind(this.bridge);
    this.bridge.request = async <T, R>(
      type: MessageType,
      payload: T
    ): Promise<R> => {
      return this.requestWithRetry(originalRequest, type, payload);
    };
  }

  private async requestWithRetry<T, R>(
    originalRequest: (type: MessageType, payload: T) => Promise<R>,
    type: MessageType,
    payload: T
  ): Promise<R> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await originalRequest(type, payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果不满足重试条件，直接抛出错误
        if (!this.options.retryCondition(lastError)) {
          throw lastError;
        }

        // 如果是最后一次尝试，抛出错误
        if (attempt === this.options.maxRetries) {
          throw lastError;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt);
        console.warn(
          `[CrossFrame] 请求失败，${delay}ms 后重试 (${attempt + 1}/${
            this.options.maxRetries
          })`
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    let delay: number;

    if (this.options.backoff === "linear") {
      delay = this.options.baseDelay * (attempt + 1);
    } else {
      delay = this.options.baseDelay * Math.pow(2, attempt);
    }

    return Math.min(delay, this.options.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 手动重试方法
  async retryRequest<T, R>(
    type: MessageType,
    payload: T,
    customOptions?: Partial<RetryOptions>
  ): Promise<R> {
    const options = { ...this.options, ...customOptions };

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await this.bridge.request<T, R>(type, payload);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (!options.retryCondition!(err) || attempt === options.maxRetries) {
          throw err;
        }

        const delay = this.calculateDelayWithOptions(attempt, options);
        await this.sleep(delay);
      }
    }

    throw new Error("Retry failed");
  }

  private calculateDelayWithOptions(
    attempt: number,
    options: Required<RetryOptions>
  ): number {
    let delay: number;

    if (options.backoff === "linear") {
      delay = options.baseDelay * (attempt + 1);
    } else {
      delay = options.baseDelay * Math.pow(2, attempt);
    }

    return Math.min(delay, options.maxDelay);
  }
}

// 工厂函数
export function createRetryManager(
  bridge: IframeBridge,
  options?: RetryOptions
): RetryManager {
  return new RetryManager(bridge, options);
}
