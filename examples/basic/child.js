// 子窗口代码
// 注意：这是示例代码，实际使用时应从npm包导入
// import { createBridge } from "cross-frame";

/**
 * 模拟cross-frame库，仅用于示例
 * 实际使用时应导入真实的库
 */
const mockBridge = {
  listeners: {},
  initialize() {
    // 监听来自父窗口的消息
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.needResponse && data.id && data.type) {
        // 处理请求
        this.handleRequest(data);
      } else if (data.type) {
        // 处理普通消息
        this.handleMessage(data);
      }
    });

    return this;
  },

  async handleRequest(data) {
    const { id, type, payload } = data;
    this.logMessage("请求", data);

    try {
      const listeners = this.listeners[type] || [];
      if (listeners.length === 0) {
        throw new Error(`没有处理 '${type}' 类型请求的监听器`);
      }

      // 调用第一个监听器
      const result = await listeners[0](payload);

      // 发送响应
      const response = {
        id,
        success: true,
        data: result,
        isResponse: true,
        timestamp: Date.now(),
      };

      window.parent.postMessage(response, "*");
      this.logMessage("响应", response);
    } catch (error) {
      // 发送错误响应
      const errorResponse = {
        id,
        success: false,
        error: error.message,
        isResponse: true,
        timestamp: Date.now(),
      };

      window.parent.postMessage(errorResponse, "*");
      this.logMessage("错误", errorResponse);
    }
  },

  handleMessage(data) {
    const { type, payload } = data;
    this.logMessage("消息", data);

    const listeners = this.listeners[type] || [];
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`处理消息 '${type}' 出错:`, error);
      }
    });
  },

  send(type, payload) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
    };

    window.parent.postMessage(message, "*");
    this.logMessage("发送", message);
    return true;
  },

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  },

  logMessage(action, data) {
    console.log(`[${action}]`, data);

    // 在UI中显示消息
    const containerType = data.needResponse
      ? "requestContainer"
      : "messageContainer";
    const container = document.getElementById(containerType);

    if (container) {
      const element = document.createElement("div");
      element.className = data.error
        ? "error"
        : data.needResponse
        ? "request"
        : "message";

      let content = `[${new Date().toLocaleTimeString()}] `;
      if (data.type) {
        content += `类型: ${data.type}, `;
      }
      if (data.id) {
        content += `ID: ${data.id}, `;
      }

      if (data.payload) {
        content += `数据: ${JSON.stringify(data.payload)}`;
      } else if (data.data) {
        content += `数据: ${JSON.stringify(data.data)}`;
      } else if (data.error) {
        content += `错误: ${data.error}`;
      }

      element.textContent = content;
      container.prepend(element);
    }

    // 更新状态显示
    const status = document.getElementById("status");
    if (status) {
      status.textContent = `上次操作: ${action} ${
        data.type || ""
      } 在 ${new Date().toLocaleTimeString()}`;
    }
  },
};

// 模拟createBridge函数
function createBridge(_, options = {}) {
  return mockBridge.initialize();
}

// 主程序
document.addEventListener("DOMContentLoaded", () => {
  const bridge = createBridge(null, {
    targetOrigin: "*",
    debug: true,
  });

  // 处理问候消息
  bridge.on("greeting", (data) => {
    console.log("收到问候:", data);

    // 回复消息收到确认
    bridge.send("messageReceived", {
      originalMessage: data.message,
      receivedAt: new Date().toISOString(),
    });
  });

  // 处理数据请求
  bridge.on("getData", async (payload) => {
    console.log("收到数据请求:", payload);

    // 模拟异步数据获取
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 根据ID返回不同数据
    if (payload.id == 123) {
      return {
        id: payload.id,
        name: "示例数据",
        description: "这是从子窗口返回的示例数据",
        timestamp: Date.now(),
      };
    } else {
      return {
        id: payload.id,
        name: `数据 ${payload.id}`,
        items: Array(3)
          .fill(0)
          .map((_, i) => ({ index: i, value: `项目 ${i}` })),
        timestamp: Date.now(),
      };
    }
  });

  // 处理故意触发错误
  bridge.on("triggerError", () => {
    throw new Error("这是一个故意触发的错误，用于测试错误处理");
  });

  // 通知父窗口已准备就绪
  setTimeout(() => {
    bridge.send("childReady", {
      timestamp: Date.now(),
      version: "示例版本 1.0",
      info: "子窗口已准备就绪",
    });
  }, 300);
});
