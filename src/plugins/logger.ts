/**
 * 日志插件
 * 为 cross-frame 提供详细的日志记录功能
 */

import type { IframeBridge } from "../base-bridge";
import type { MessageType } from "../types";

export interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
  level?: "debug" | "info" | "warn" | "error";
}

export class Logger {
  private options: Required<LoggerOptions>;
  private bridge: IframeBridge;

  constructor(bridge: IframeBridge, options: LoggerOptions = {}) {
    this.bridge = bridge;
    this.options = {
      prefix: "[CrossFrame]",
      timestamp: true,
      colors: true,
      level: "debug",
      ...options,
    };

    this.setupLogging();
  }

  private setupLogging() {
    // 重写 bridge 的 send 方法
    const originalSend = this.bridge.send.bind(this.bridge);
    this.bridge.send = <T>(type: MessageType, payload: T) => {
      this.log("info", "发送消息:", { type, payload });
      return originalSend(type, payload);
    };

    // 重写 bridge 的 request 方法
    const originalRequest = this.bridge.request.bind(this.bridge);
    this.bridge.request = async <T, R>(
      type: MessageType,
      payload: T
    ): Promise<R> => {
      this.log("info", "发送请求:", { type, payload });
      try {
        const result = await originalRequest(type, payload);
        this.log("info", "请求成功:", { type, result });
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.log("error", "请求失败:", { type, error: errorMessage });
        throw error;
      }
    };
  }

  private log(level: string, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.options.timestamp
      ? `[${new Date().toISOString()}]`
      : "";
    const prefix = this.options.prefix;
    const coloredMessage = this.options.colors
      ? this.colorize(level, message)
      : message;

    console.log(`${timestamp} ${prefix} ${coloredMessage}`, data || "");
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.options.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private colorize(level: string, message: string): string {
    if (!this.options.colors) return message;

    const colors = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
      reset: "\x1b[0m",
    };

    return `${colors[level as keyof typeof colors] || ""}${message}${
      colors.reset
    }`;
  }
}

// 工厂函数
export function createLogger(
  bridge: IframeBridge,
  options?: LoggerOptions
): Logger {
  return new Logger(bridge, options);
}
