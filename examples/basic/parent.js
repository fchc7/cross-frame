// 父窗口代码
// 注意：这是示例代码，实际使用时应从npm包导入
// import { createBridge } from "cross-frame";

/**
 * 模拟cross-frame库，仅用于示例
 * 实际使用时应导入真实的库
 */
const mockBridge = {
  iframe: null,
  listeners: {},
  initialize(iframe) {
    this.iframe = iframe;

    // 监听来自iframe的消息
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.isResponse && data.id) {
        // 处理响应
        const pendingRequest = this.pendingRequests[data.id];
        if (pendingRequest) {
          if (data.success) {
            pendingRequest.resolve(data.data);
          } else {
            pendingRequest.reject(new Error(data.error || "未知错误"));
          }
          delete this.pendingRequests[data.id];
        }
      } else if (data.type) {
        // 处理普通消息
        const listeners = this.listeners[data.type] || [];
        listeners.forEach((listener) => listener(data.payload));
      }
    });

    return this;
  },

  pendingRequests: {},
  requestId: 1,

  send(type, payload) {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.error("iframe不存在");
      return;
    }

    const message = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.iframe.contentWindow.postMessage(message, "*");
    this.logAction("发送", message);
    return true;
  },

  request(type, payload) {
    if (!this.iframe || !this.iframe.contentWindow) {
      return Promise.reject(new Error("iframe不存在"));
    }

    const id = `req_${this.requestId++}`;
    const message = {
      id,
      type,
      payload,
      needResponse: true,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests[id] = { resolve, reject };
      this.iframe.contentWindow.postMessage(message, "*");
      this.logAction("请求", message);

      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests[id]) {
          reject(new Error("请求超时"));
          delete this.pendingRequests[id];
          this.logAction("错误", { type, error: "请求超时" });
        }
      }, 5000);
    });
  },

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  },

  logAction(action, data) {
    console.log(`[${action}]`, data);
    const logContainer = document.getElementById("logContainer");
    if (logContainer) {
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.textContent = `[${new Date().toLocaleTimeString()}] ${action}: ${JSON.stringify(
        data
      )}`;
      logContainer.prepend(entry);
    }
  },
};

// 模拟createBridge函数
function createBridge(iframe, options = {}) {
  return mockBridge.initialize(iframe);
}

// 主程序
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("childFrame");
  const bridge = createBridge(iframe, {
    targetOrigin: "*",
    debug: true,
  });

  // 等待iframe加载完成
  iframe.onload = () => {
    console.log("iframe已加载");

    // 监听来自iframe的消息
    bridge.on("childReady", (data) => {
      console.log("子窗口已就绪:", data);
      bridge.logAction("收到", { type: "childReady", payload: data });
    });

    bridge.on("messageReceived", (data) => {
      bridge.logAction("收到", { type: "messageReceived", payload: data });
    });

    // 设置按钮点击事件
    document.getElementById("sendMessageBtn").addEventListener("click", () => {
      const messageInput = document.getElementById("messageInput");
      const message = messageInput.value.trim();
      if (message) {
        bridge.send("greeting", { message });
      }
    });

    document
      .getElementById("sendRequestBtn")
      .addEventListener("click", async () => {
        const requestId = document.getElementById("requestId").value;
        try {
          const responseOutput = document.getElementById("responseOutput");
          responseOutput.textContent = "发送请求中...";

          const response = await bridge.request("getData", { id: requestId });
          responseOutput.textContent = JSON.stringify(response, null, 2);
          bridge.logAction("响应", { response });
        } catch (error) {
          console.error("请求失败:", error);
          document.getElementById(
            "responseOutput"
          ).textContent = `错误: ${error.message}`;
          bridge.logAction("错误", { error: error.message });
        }
      });

    document
      .getElementById("triggerErrorBtn")
      .addEventListener("click", async () => {
        try {
          const responseOutput = document.getElementById("responseOutput");
          responseOutput.textContent = "触发错误测试中...";

          const response = await bridge.request("triggerError", { test: true });
          responseOutput.textContent = JSON.stringify(response, null, 2);
        } catch (error) {
          console.error("触发错误:", error);
          document.getElementById(
            "responseOutput"
          ).textContent = `预期错误: ${error.message}`;
          bridge.logAction("错误", { error: error.message });
        }
      });

    document.getElementById("clearLogsBtn").addEventListener("click", () => {
      document.getElementById("logContainer").innerHTML = "";
    });
  };
});
