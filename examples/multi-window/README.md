# 多窗口隔离示例

在复杂环境（如 Electron 应用、多个 iframe 等）下，不同窗口之间的消息可能会产生串扰。iframe-connect 提供了内置的多窗口隔离机制，只需简单配置即可激活。

## 多窗口隔离

```javascript
import { createBridge } from "iframe-connect";

// 主窗口 A 创建的桥梁
const bridgeA = createBridge(iframeA, {
  // 启用多窗口隔离
  enableMultiWindow: true,
  // 指定窗口ID（或让系统自动生成）
  windowId: "window-A",

  // 同时启用插件
  plugins: {
    logger: true,
  },
});

// 主窗口 B 创建的桥梁
const bridgeB = createBridge(iframeB, {
  enableMultiWindow: true,
  windowId: "window-B",
  plugins: {
    logger: true,
  },
});
```

## 工作原理

1. 每个消息会附加唯一的 `windowId`
2. 接收方会检查消息的 `windowId`，只处理匹配的消息
3. 不匹配的消息会被忽略，防止跨窗口干扰

这一机制对于以下场景特别有用：

- Electron 多窗口应用
- 页面中含有多个 iframe
- 同一页面的多个组件需要独立通信

## 示例文件

- `multi-window.html` - 主页面，包含两个 iframe
- `multi-window-example.js` - 主要示例代码
- `iframe-content.html` - iframe 内容页面

## 运行示例

1. 打开 `multi-window.html` 文件
2. 观察两个 iframe 各自处理自己的消息
3. 尝试使用"广播"和"专属消息"按钮，观察隔离效果
