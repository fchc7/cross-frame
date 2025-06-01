# iframe-connect 示例

这个目录包含了多个示例，展示如何使用 iframe-connect 库进行跨窗口通信。

## 示例列表

### [基础通信](./basic)

基本的父窗口和子窗口(iframe)之间的通信示例，展示核心功能的使用。

### [增强功能](./enhanced)

展示 iframe-connect 的增强功能，包括插件系统、超时处理和其他高级特性。

### [插件系统](./plugins)

详细介绍如何使用 iframe-connect 的插件系统，包括日志、重试和队列管理插件。

### [多窗口隔离](./multi-window)

演示如何在多个窗口或 iframe 之间实现消息隔离，避免跨窗口干扰。

### [TypeScript 支持](./typescript)

展示如何利用 TypeScript 类型系统获得类型安全的消息传递。

## 运行示例

1. 克隆仓库

```bash
git clone https://github.com/yourusername/iframe-connect.git
cd iframe-connect
```

2. 安装依赖

```bash
npm install
```

3. 构建库

```bash
npm run build
```

4. 打开示例
   使用任何 HTTP 服务器在本地运行这些示例，例如：

```bash
# 如果安装了 http-server
npx http-server

# 或者使用 Python 内置服务器
python -m http.server
```

然后在浏览器中访问对应的示例页面。
