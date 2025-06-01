# 插件系统示例

cross-frame 提供了灵活的插件系统，可以扩展基本功能，满足更复杂的通信需求。

## 可用插件

### 1. 日志插件 (Logger)

提供详细的消息日志记录，支持不同日志级别和颜色：

```javascript
import { createBridge } from "cross-frame";

const bridge = createBridge(iframe, {
  plugins: {
    logger: {
      prefix: "[CrossFrame]", // 日志前缀
      timestamp: true, // 是否显示时间戳
      colors: true, // 是否使用颜色
      level: "debug", // 日志级别: 'debug'|'info'|'warn'|'error'
    },
  },
});

// 所有通信都会自动记录日志
bridge.send("hello", { message: "世界" });
// [CrossFrame] [2023-08-11 12:34:56] 发送消息: { type: "hello", payload: { message: "世界" } }
```

### 2. 重试插件 (Retry)

自动为请求添加重试功能，特别适合不稳定网络环境：

```javascript
import { createBridge } from "cross-frame";

const bridge = createBridge(iframe, {
  plugins: {
    retry: {
      maxRetries: 3, // 最大重试次数
      baseDelay: 1000, // 基础延迟(ms)
      maxDelay: 10000, // 最大延迟(ms)
      backoff: "exponential", // 退避策略: 'linear'|'exponential'
      retryCondition: (error) => true, // 自定义重试条件
    },
  },
});

// 自动重试失败的请求
try {
  const result = await bridge.request("api:call", payload);
  console.log("成功:", result);
} catch (error) {
  console.error("所有重试都失败:", error);
}
```

### 3. 队列插件 (Queue)

提供消息队列管理，支持批量处理和优先级：

```javascript
import { createBridge } from "cross-frame";

const bridge = createBridge(iframe, {
  plugins: {
    queue: {
      maxSize: 100, // 队列最大容量
      flushInterval: 1000, // 自动刷新间隔(ms)
      batchSize: 10, // 批处理大小
      priority: false, // 是否启用优先级
    },
  },
});

// 批量发送消息（自动队列处理）
for (let i = 0; i < 20; i++) {
  bridge.send("data:update", { id: i, value: `值 ${i}` });
}

// 查看队列状态
const queuePlugin = bridge._plugins?.queue;
if (queuePlugin) {
  console.log(queuePlugin.getQueueStatus());
  // 手动刷新队列
  queuePlugin.flushNow();
}
```

## 组合使用插件

插件可以组合使用，创建功能强大的通信系统：

```javascript
import { createBridge } from "cross-frame";

const bridge = createBridge(iframe, {
  plugins: {
    logger: true, // 使用默认配置
    retry: {
      maxRetries: 3,
    },
    queue: {
      batchSize: 5,
    },
  },
});

// 现在您的通信同时具备日志记录、自动重试和队列管理功能
```

## 创建自定义插件

您也可以创建自定义插件扩展功能：

```javascript
// 自定义插件示例
function createMyPlugin(bridge, options = {}) {
  // 保存原始方法引用
  const originalSend = bridge.send.bind(bridge);

  // 重写方法
  bridge.send = (type, payload) => {
    // 添加自定义功能
    console.log(`自定义插件处理消息: ${type}`);

    // 添加时间戳
    const enhancedPayload = {
      ...payload,
      processedTime: Date.now(),
    };

    // 调用原始方法
    return originalSend(type, enhancedPayload);
  };

  // 返回插件实例
  return {
    name: "myPlugin",
    // 提供公共方法
    getStats() {
      return { processed: 123 };
    },
  };
}

// 使用自定义插件
const bridge = createBridge(iframe);
const myPlugin = createMyPlugin(bridge);
bridge._plugins = { ...bridge._plugins, myPlugin };
```

插件系统让 cross-frame 在保持核心简洁的同时，能够适应各种复杂场景。
