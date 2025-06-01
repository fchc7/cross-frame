// 多窗口隔离示例
// 注意：这是示例代码，实际使用时应从npm包导入

import { createBridge } from "cross-frame";

/**
 * 场景模拟：
 * 一个主应用中包含两个iframe窗口，需要相互独立通信
 * - 主应用创建两个独立的桥梁，分别与两个iframe通信
 * - 两个iframe各自接收和处理自己的消息，互不干扰
 */

// 主应用逻辑
document.addEventListener("DOMContentLoaded", () => {
  const iframe1 = document.getElementById("iframe1");
  const iframe2 = document.getElementById("iframe2");

  // 创建窗口1的桥梁
  const bridge1 = createBridge(iframe1, {
    targetOrigin: "*",
    debug: true,
    // 启用多窗口隔离
    enableMultiWindow: true,
    windowId: "window-1",
    // 启用插件
    plugins: {
      logger: true,
    },
  });

  // 创建窗口2的桥梁
  const bridge2 = createBridge(iframe2, {
    targetOrigin: "*",
    debug: true,
    // 启用多窗口隔离
    enableMultiWindow: true,
    windowId: "window-2",
    // 启用插件
    plugins: {
      logger: true,
    },
  });

  // 与窗口1通信
  iframe1.onload = () => {
    console.log("iframe1 已加载");
    bridge1.send("init", { windowName: "窗口1", data: [1, 2, 3] });

    bridge1.on("response", (data) => {
      console.log("收到窗口1的响应:", data);
      document.getElementById("window1-response").textContent =
        JSON.stringify(data);
    });

    // 发送广播消息按钮
    document.getElementById("broadcast-btn").addEventListener("click", () => {
      const message = document.getElementById("broadcast-msg").value;
      // 向两个窗口发送相同的消息
      bridge1.send("broadcast", { message });
      bridge2.send("broadcast", { message });
    });
  };

  // 与窗口2通信
  iframe2.onload = () => {
    console.log("iframe2 已加载");
    bridge2.send("init", { windowName: "窗口2", data: [4, 5, 6] });

    bridge2.on("response", (data) => {
      console.log("收到窗口2的响应:", data);
      document.getElementById("window2-response").textContent =
        JSON.stringify(data);
    });

    // 窗口1专属消息按钮
    document.getElementById("window1-btn").addEventListener("click", () => {
      bridge1.send("special", { message: "这条消息只发给窗口1" });
    });

    // 窗口2专属消息按钮
    document.getElementById("window2-btn").addEventListener("click", () => {
      bridge2.send("special", { message: "这条消息只发给窗口2" });
    });
  };
});

// iframe窗口的共享代码（两个iframe都可以使用）
if (window !== window.parent) {
  // 自动检测环境并创建子窗口桥梁
  const bridge = createBridge(null, {
    targetOrigin: "*",
    debug: true,
    // 启用多窗口隔离 - 子窗口会自动匹配父窗口的windowId
    enableMultiWindow: true,
    plugins: {
      logger: true,
    },
  });

  // 显示窗口ID
  const displayWindowId = () => {
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.top = "10px";
    element.style.right = "10px";
    element.style.background = "rgba(0,0,0,0.7)";
    element.style.color = "white";
    element.style.padding = "5px 10px";
    element.style.borderRadius = "5px";
    element.textContent = `窗口ID: ${bridge.getDebugInfo().windowId}`;
    document.body.appendChild(element);
  };

  // 接收初始化消息
  bridge.on("init", (data) => {
    console.log("收到初始化消息:", data);

    // 显示窗口名称
    const heading = document.createElement("h2");
    heading.textContent = data.windowName;
    document.body.appendChild(heading);

    // 显示窗口ID
    displayWindowId();

    // 响应初始化消息
    bridge.send("response", {
      status: "ready",
      receivedData: data,
      windowId: bridge.getDebugInfo().windowId,
    });

    // 创建消息显示区域
    const messagesDiv = document.createElement("div");
    messagesDiv.id = "messages";
    document.body.appendChild(messagesDiv);
  });

  // 接收广播消息
  bridge.on("broadcast", (data) => {
    console.log("收到广播消息:", data);

    const messageElement = document.createElement("div");
    messageElement.className = "message broadcast";
    messageElement.textContent = `广播: ${data.message}`;
    document.getElementById("messages").appendChild(messageElement);
  });

  // 接收专属消息
  bridge.on("special", (data) => {
    console.log("收到专属消息:", data);

    const messageElement = document.createElement("div");
    messageElement.className = "message special";
    messageElement.textContent = `专属: ${data.message}`;
    document.getElementById("messages").appendChild(messageElement);
  });
}
