# cross-frame

[English](./README.en.md)
一个轻量级、类型安全的跨框架通信工具包

## 特性

- 🚀 **轻量级** - 核心代码简洁，无额外依赖，约 9KB 大小
- 🔒 **类型安全** - 完整的 TypeScript 支持，泛型友好
- 🎯 **简单易用** - 直观的 API 设计
- 🔌 **插件系统** - 支持日志、重试、队列等扩展功能
- 🔄 **双向通信** - 支持请求/响应模式
- 🛡️ **多窗口隔离** - 可选的窗口间消息隔离

## 安装

```bash
npm install cross-frame
```

## 基本使用

### 简单 API

```typescript
import { createBridge } from "cross-frame";

// 自动检测环境（主窗口或子窗口）
const bridge = createBridge(iframe); // 在主窗口中提供iframe
// 或
const bridge = createBridge(); // 在子窗口中无需参数

// 发送消息
bridge.send("greeting", { message: "Hello!" });

// 发送请求并等待响应
const response = await bridge.request("getData", { id: 123 });
console.log(response);

// 监听消息
bridge.on("notification", (payload) => {
  console.log("收到通知:", payload);
});
```

### 带插件支持

```typescript
import { createBridge } from "cross-frame";

const bridge = createBridge(iframe, {
  // 基础配置
  targetOrigin: "https://trusted-domain.com",
  debug: true,

  // 插件配置
  plugins: {
    // 启用日志插件
    logger: {
      level: "info",
      colors: true,
    },

    // 启用重试功能
    retry: {
      maxRetries: 3,
    },

    // 启用队列管理
    queue: {
      batchSize: 5,
    },
  },
});

// 正常使用API（已自动增强）
bridge.send("user:login", { username: "john" });

// 请求会自动重试、排队和记录日志
const result = await bridge.request("data:fetch", { id: 123 });
```

## 多窗口隔离

在有多个 iframe 的环境中，启用多窗口隔离：

```typescript
// 主窗口 A
const bridgeA = createBridge(iframeA, {
  enableMultiWindow: true,
  windowId: "window-A",
});

// 主窗口 B
const bridgeB = createBridge(iframeB, {
  enableMultiWindow: true,
  windowId: "window-B",
});

// 现在两个窗口的消息不会互相干扰
```

## 类型安全

```typescript
// 定义你的消息类型
interface MyMessages {
  "user:login": { username: string; password: string };
  "user:logout": { userId: string };
  "data:update": { id: number; data: any };
}

// 使用泛型获得类型提示
bridge.send<MyMessages["user:login"]>("user:login", {
  username: "john",
  password: "secret",
});

// 请求/响应也支持泛型
const result = await bridge.request<
  MyMessages["data:update"],
  { success: boolean; id: number }
>("data:update", {
  id: 1,
  data: { name: "更新的名称" },
});
```

## 可用插件

### 日志插件 (Logger)

```typescript
// 自动记录所有通信消息
const bridge = createBridge(iframe, {
  plugins: {
    logger: {
      level: "debug", // debug, info, warn, error
      colors: true,
      timestamp: true,
    },
  },
});
```

### 重试插件 (Retry)

```typescript
// 自动重试失败的请求
const bridge = createBridge(iframe, {
  plugins: {
    retry: {
      maxRetries: 3,
      backoff: "exponential", // linear, exponential
      retryCondition: (error) => error.message.includes("timeout"),
    },
  },
});
```

### 队列插件 (Queue)

```typescript
// 批量处理消息，支持优先级
const bridge = createBridge(iframe, {
  plugins: {
    queue: {
      maxSize: 100,
      batchSize: 10,
      flushInterval: 1000,
      priority: true,
    },
  },
});
```

## 配置选项

```typescript
interface BridgeConfig {
  targetOrigin?: string; // 目标域，默认 '*'
  timeout?: number; // 请求超时时间，默认 5000ms
  debug?: boolean; // 调试模式，默认 false
  enableMultiWindow?: boolean; // 启用多窗口隔离，默认 false
  windowId?: string; // 自定义窗口ID
  plugins?: {
    logger?: boolean | LoggerOptions;
    retry?: boolean | RetryOptions;
    queue?: boolean | QueueOptions;
  };
}
```

## 示例

查看 [examples](./examples) 目录获取完整示例：

- [基本通信](./examples/basic) - 基础的父子窗口通信
- [多窗口隔离](./examples/multi-window) - 多窗口环境下的消息隔离
- [插件系统](./examples/plugins) - 使用插件增强功能
- [类型安全](./examples/typescript) - TypeScript 类型定义示例
- [增强功能](./examples/enhanced) - 高级特性和优化

## 许可证

[MIT](LICENSE)
