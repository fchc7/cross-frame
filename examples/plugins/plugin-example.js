// 插件系统示例代码
// 注意：实际使用时，应从npm包导入

// import { createBridge } from "iframe-connect";

// 主窗口中的代码
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("targetFrame");

  // 创建带多个插件的桥梁
  const bridge = createBridge(iframe, {
    targetOrigin: "*",
    debug: true,
    plugins: {
      // 启用日志插件，自定义配置
      logger: {
        level: "debug",
        colors: true,
        timestamp: true,
        prefix: "[CrossFrame]",
      },

      // 启用重试插件，自定义配置
      retry: {
        maxRetries: 3,
        baseDelay: 500,
        backoff: "exponential",
        retryCondition: (error) => {
          // 只有在网络错误或超时时重试
          return (
            error.message.includes("timeout") ||
            error.message.includes("network")
          );
        },
      },

      // 启用队列插件，自定义配置
      queue: {
        maxSize: 50,
        batchSize: 5,
        flushInterval: 2000,
        priority: true,
      },
    },
  });

  // iframe加载完成后开始通信
  iframe.onload = async () => {
    // 使用基本发送功能（由logger插件记录）
    bridge.send("hello", { message: "你好，iframe!" });

    // 发送批量消息（由队列插件管理）
    for (let i = 0; i < 10; i++) {
      bridge.send("data:update", { id: i, value: `数据项 ${i}` });
    }

    try {
      // 发送可能失败的请求（由重试插件管理）
      const result = await bridge.request("api:unreliable", { action: "get" });
      console.log("请求成功:", result);

      // 获取队列状态
      const queuePlugin = bridge._plugins?.queue;
      if (queuePlugin) {
        console.log("队列状态:", queuePlugin.getQueueStatus());

        // 发送高优先级消息
        queuePlugin.setPriority("ui:critical", { type: "alert" }, 10);
      }
    } catch (error) {
      console.error("所有重试后仍然失败:", error);
    }
  };
});

// 子窗口中的代码
if (window !== window.parent) {
  const bridge = createBridge(null, {
    targetOrigin: "*",
    debug: true,
    plugins: {
      logger: true, // 简化配置，使用默认值
    },
  });

  // 监听基本消息
  bridge.on("hello", (payload) => {
    console.log("收到问候:", payload.message);
    document.body.innerHTML += `<p>收到问候: ${payload.message}</p>`;
  });

  // 监听数据更新消息
  bridge.on("data:update", (payload) => {
    console.log("数据更新:", payload);
    document.body.innerHTML += `<p>数据更新: ID=${payload.id}, 值=${payload.value}</p>`;
  });

  // 处理可能失败的请求
  bridge.on("api:unreliable", (payload) => {
    // 模拟不稳定的API，随机失败
    if (Math.random() < 0.7) {
      throw new Error("timeout: 连接超时");
    }

    return {
      success: true,
      data: { result: "这是API的响应", timestamp: Date.now() },
    };
  });

  // 处理高优先级消息
  bridge.on("ui:critical", (payload) => {
    console.log("收到高优先级消息:", payload);

    const alertEl = document.createElement("div");
    alertEl.style.backgroundColor = "red";
    alertEl.style.color = "white";
    alertEl.style.padding = "10px";
    alertEl.style.margin = "10px 0";
    alertEl.textContent = `紧急消息: ${JSON.stringify(payload)}`;

    document.body.prepend(alertEl);
  });

  // 显示就绪状态
  document.body.innerHTML =
    "<h2>插件系统测试</h2><p>子窗口已就绪，等待消息...</p>";
}
