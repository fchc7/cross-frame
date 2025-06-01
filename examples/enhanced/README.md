# 增强功能示例

本目录展示了 iframe-connect 库的高级特性和优化，让您能够在更复杂的场景中使用。

## 功能展示

### 1. 请求超时优化

传统方法使用独立的 setTimeout 为每个请求设置超时，但当请求量大时会消耗大量资源。iframe-connect 提供了优化的超时处理机制，使用单一计时器管理所有请求的超时。

```javascript
// 配置自定义超时时间（毫秒）
const bridge = createBridge(iframe, {
  timeout: 10000, // 全局默认超时
});

// 单个请求的自定义超时
const result = await bridge.request("longOperation", data, {
  timeout: 30000, // 此请求的专属超时设置
});
```

### 2. 消息队列和批处理

当需要发送大量消息时，可以使用队列插件进行批处理和优先级控制：

```javascript
const bridge = createBridge(iframe, {
  plugins: {
    queue: {
      batchSize: 10, // 批量发送大小
      flushInterval: 1000, // 自动发送间隔（毫秒）
      priority: true, // 启用优先级
    },
  },
});

// 发送多个消息会自动排队
for (let i = 0; i < 100; i++) {
  bridge.send("update", { id: i, value: Math.random() });
}

// 获取队列插件实例
const queuePlugin = bridge._plugins?.queue;
if (queuePlugin) {
  // 手动刷新队列
  queuePlugin.flushNow();

  // 设置消息优先级（越高越优先）
  queuePlugin.setPriority("critical-update", { id: 999 }, 10);
}
```

### 3. 高级错误处理

实现更全面的错误处理和重试机制：

```javascript
try {
  const result = await bridge.request("api:call", data);
  processSuccess(result);
} catch (error) {
  if (error.code === "TIMEOUT") {
    // 处理超时
    showTimeoutMessage();
  } else if (error.code === "REMOTE_ERROR") {
    // 处理远程错误
    logRemoteError(error.details);
  } else {
    // 处理其他错误
    handleGenericError(error);
  }
}
```

### 4. 多窗口隔离

在同一页面中使用多个 iframe，确保消息不会串扰：

```javascript
const bridge1 = createBridge(iframe1, {
  enableMultiWindow: true,
  windowId: "window-1",
});

const bridge2 = createBridge(iframe2, {
  enableMultiWindow: true,
  windowId: "window-2",
});

// 每个iframe只会收到发给它的消息
```

## 文件说明

- `enhanced-example.js` - 增强功能示例代码
- `timeout-example.js` - 超时优化示例
- `multi-window-example.js` - 多窗口隔离示例

## 运行示例

打开对应的 HTML 文件即可查看示例运行效果：

- `timeout-example.html` - 超时优化示例
- `multi-window.html` - 多窗口隔离示例
