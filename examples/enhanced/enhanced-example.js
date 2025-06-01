// 增强功能示例
// 注意：这是示例代码，实际使用时应从npm包导入

import { createBridge } from "cross-frame";

/**
 * 本示例展示cross-frame的高级功能和优化
 * 1. 超时优化
 * 2. 队列管理
 * 3. 插件组合使用
 * 4. 高级错误处理
 */

// 主窗口代码
document.addEventListener("DOMContentLoaded", () => {
  const demoSelect = document.getElementById("demo-select");
  const outputDiv = document.getElementById("output");
  const iframe = document.getElementById("demo-frame");
  let bridge;

  // 显示输出信息
  function log(message, type = "info") {
    const item = document.createElement("div");
    item.className = `log-item ${type}`;
    item.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> ${message}`;
    outputDiv.prepend(item);
  }

  // 清除输出
  document.getElementById("clear-btn").addEventListener("click", () => {
    outputDiv.innerHTML = "";
  });

  // 初始化桥接
  function initBridge(config = {}) {
    log("初始化桥接...");

    // 创建具有多种增强功能的桥接
    bridge = createBridge(iframe, {
      targetOrigin: "*",
      debug: true,
      timeout: 5000, // 默认超时5秒

      // 启用各种插件
      plugins: {
        logger: {
          level: "debug",
          colors: true,
        },
        queue: {
          maxSize: 50,
          batchSize: 5,
          flushInterval: 1000,
          priority: true,
        },
        retry: {
          maxRetries: 3,
          baseDelay: 300,
          backoff: "exponential",
        },
        ...config.plugins,
      },

      ...config,
    });

    log(
      "桥接已初始化，配置: " +
        JSON.stringify({
          timeout: bridge.config.timeout,
          plugins: Object.keys(bridge._plugins || {}),
        })
    );

    // 监听来自iframe的就绪消息
    bridge.on("ready", (data) => {
      log(`子窗口就绪，版本: ${data.version}`);

      // 启用演示按钮
      document.querySelectorAll(".demo-btn").forEach((btn) => {
        btn.disabled = false;
      });
    });

    return bridge;
  }

  // 在iframe加载完成后初始化
  iframe.onload = () => {
    initBridge();
  };

  // 演示1: 超时优化
  document
    .getElementById("timeout-demo")
    .addEventListener("click", async () => {
      try {
        log("发送超时请求测试，使用10秒超时...");

        // 使用特定请求的超时设置
        const result = await bridge.request(
          "longOperation",
          { duration: 3000 },
          {
            timeout: 10000, // 此请求专属的超时时间
          }
        );

        log(`请求成功: ${JSON.stringify(result)}`, "success");
      } catch (error) {
        log(`请求失败: ${error.message}`, "error");
      }
    });

  // 演示2: 超时失败
  document
    .getElementById("timeout-fail-demo")
    .addEventListener("click", async () => {
      try {
        log("发送一定会超时的请求，使用2秒超时...");

        // 使用特定请求的超时设置（故意设置短超时）
        const result = await bridge.request(
          "longOperation",
          { duration: 5000 },
          {
            timeout: 2000, // 此请求专属的超时时间（一定会超时）
          }
        );

        log(`请求成功: ${JSON.stringify(result)}`, "success");
      } catch (error) {
        log(`请求超时: ${error.message}`, "error");
      }
    });

  // 演示3: 队列批处理
  document.getElementById("queue-demo").addEventListener("click", () => {
    log("发送50条批量消息...");

    // 批量发送消息，将由队列插件管理
    for (let i = 0; i < 50; i++) {
      bridge.send("batchUpdate", { id: i, value: Math.random() });
    }

    // 获取队列状态
    const queuePlugin = bridge._plugins?.queue;
    if (queuePlugin) {
      const status = queuePlugin.getQueueStatus();
      log(`队列状态: ${JSON.stringify(status)}`);

      // 手动刷新队列
      setTimeout(() => {
        log("手动刷新队列...");
        queuePlugin.flushNow();
      }, 2000);
    }
  });

  // 演示4: 高优先级消息
  document.getElementById("priority-demo").addEventListener("click", () => {
    // 先发送10条低优先级消息
    log("发送10条低优先级消息...");
    for (let i = 0; i < 10; i++) {
      bridge.send("lowPriority", { id: i });
    }

    // 然后发送高优先级消息
    log("发送1条高优先级消息（应该优先处理）...");
    const queuePlugin = bridge._plugins?.queue;
    if (queuePlugin) {
      queuePlugin.setPriority("highPriority", { id: 999, urgent: true }, 10);
    }
  });

  // 演示5: 重试机制
  document.getElementById("retry-demo").addEventListener("click", async () => {
    try {
      log("发送可能失败的请求（有自动重试）...");

      const result = await bridge.request("unreliable", { retryTest: true });
      log(`请求最终成功: ${JSON.stringify(result)}`, "success");
    } catch (error) {
      log(`所有重试都失败: ${error.message}`, "error");
    }
  });
});

// 子窗口（iframe）代码
if (window !== window.parent) {
  document.addEventListener("DOMContentLoaded", () => {
    // 创建桥接
    const bridge = createBridge(null, {
      targetOrigin: "*",
      debug: true,
      plugins: {
        logger: true,
      },
    });

    // 处理长时间操作请求
    bridge.on("longOperation", async (payload) => {
      const duration = payload.duration || 1000;
      const startTime = Date.now();

      console.log(`执行长时间操作，持续 ${duration}ms`);
      document.body.innerHTML += `<div>执行长时间操作，持续 ${duration}ms...</div>`;

      // 模拟长时间操作
      await new Promise((resolve) => setTimeout(resolve, duration));

      const endTime = Date.now();
      console.log(`长时间操作完成，实际耗时: ${endTime - startTime}ms`);
      document.body.innerHTML += `<div>长时间操作完成，实际耗时: ${
        endTime - startTime
      }ms</div>`;

      return {
        success: true,
        duration: endTime - startTime,
        payload,
      };
    });

    // 处理批量更新消息
    let batchCount = 0;
    bridge.on("batchUpdate", (payload) => {
      batchCount++;
      console.log(
        `批量更新 #${batchCount}: ID=${payload.id}, 值=${payload.value}`
      );

      if (batchCount % 10 === 0 || payload.id === 49) {
        document.body.innerHTML += `<div>已处理 ${batchCount} 条批量消息</div>`;
      }
    });

    // 处理优先级消息
    bridge.on("lowPriority", (payload) => {
      console.log(`处理低优先级消息: ID=${payload.id}`);
    });

    bridge.on("highPriority", (payload) => {
      console.log(`处理高优先级消息: ID=${payload.id}, 紧急=${payload.urgent}`);
      document.body.innerHTML += `<div style="color:red;font-weight:bold">收到高优先级消息: ID=${payload.id}</div>`;
    });

    // 处理不可靠请求（有时失败）
    let retryCount = 0;
    bridge.on("unreliable", (payload) => {
      retryCount++;
      console.log(`处理不可靠请求，尝试 #${retryCount}`);
      document.body.innerHTML += `<div>处理不可靠请求，尝试 #${retryCount}</div>`;

      // 前两次尝试时失败
      if (retryCount < 3) {
        throw new Error(`故意失败，尝试 #${retryCount}`);
      }

      return {
        success: true,
        attempts: retryCount,
        message: "最终成功",
      };
    });

    // 通知父窗口已就绪
    setTimeout(() => {
      document.body.innerHTML = `<h2>增强功能演示 - 子窗口</h2>
        <div>子窗口已就绪，等待操作...</div>`;

      bridge.send("ready", {
        timestamp: Date.now(),
        version: "enhanced-demo-1.0",
      });
    }, 500);
  });
}
