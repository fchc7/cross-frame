# 基础通信示例

这个示例演示了 cross-frame 库的基本功能，包括父窗口和 iframe 之间的双向通信。

## 功能展示

- 基本消息发送和接收
- 请求/响应模式
- 错误处理
- 事件监听

## 文件说明

- `parent.html` - 父窗口页面
- `child.html` - 子窗口(iframe)页面
- `parent.js` - 父窗口 JavaScript 代码
- `child.js` - 子窗口 JavaScript 代码

## 运行示例

1. 在浏览器中打开 `parent.html` 文件
2. 观察父窗口和 iframe 之间的通信
3. 尝试发送消息和请求，查看响应结果

## 核心代码

### 父窗口

```javascript
import { createBridge } from "cross-frame";

const iframe = document.getElementById("childFrame");
const bridge = createBridge(iframe, {
  targetOrigin: "*",
  debug: true,
});

// 发送消息
bridge.send("greeting", { message: "你好，iframe!" });

// 发送请求并等待响应
const response = await bridge.request("getData", { id: 123 });
console.log(response); // { success: true, data: {...} }

// 监听来自iframe的消息
bridge.on("childReady", (data) => {
  console.log("子窗口已准备就绪:", data);
});
```

### 子窗口(iframe)

```javascript
import { createBridge } from "cross-frame";

const bridge = createBridge(null, {
  targetOrigin: "*",
  debug: true,
});

// 监听来自父窗口的消息
bridge.on("greeting", (data) => {
  console.log("收到问候:", data.message);
});

// 处理请求并响应
bridge.on("getData", async (payload) => {
  // 获取数据
  const data = await fetchData(payload.id);
  // 返回响应
  return { success: true, data };
});

// 通知父窗口已准备就绪
bridge.send("childReady", { timestamp: Date.now() });
```
