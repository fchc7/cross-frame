# TypeScript 类型示例

iframe-connect 库提供完整的 TypeScript 类型支持，使用泛型可以获得更好的类型安全性。

## 基本类型

```typescript
import { createBridge } from "iframe-connect";

// 基本使用
const bridge = createBridge(iframe);
bridge.send("hello", { message: "你好" }); // 基本类型推导
```

## 自定义消息类型

```typescript
// 定义消息类型映射
interface MyMessages {
  "user:login": { username: string; password: string };
  "user:logout": { userId: string };
  "data:fetch": { id: number; filter?: string };
  "ui:update": { component: string; visible: boolean };
}

// 发送消息时使用类型
bridge.send<MyMessages["user:login"]>("user:login", {
  username: "john", // 类型检查 ✓
  password: "secret", // 类型检查 ✓
});

// 错误用法会在编译时被捕获
bridge.send<MyMessages["user:login"]>("user:login", {
  username: "john",
  // password: 缺少必需属性 - TypeScript 编译错误 ✗
  age: 30, // 多余属性 - TypeScript 编译错误 ✗
});
```

## 请求和响应类型

```typescript
// 定义请求和响应类型
interface RequestTypes {
  "data:fetch": { id: number };
  "user:getProfile": { userId: string };
}

interface ResponseTypes {
  "data:fetch": {
    id: number;
    name: string;
    description: string;
  };
  "user:getProfile": {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

// 使用泛型指定请求和响应类型
const data = await bridge.request<
  RequestTypes["data:fetch"], // 请求类型
  ResponseTypes["data:fetch"] // 响应类型
>("data:fetch", { id: 123 });

// 现在 data 的类型是 ResponseTypes["data:fetch"]
console.log(data.name); // 类型安全 ✓
console.log(data.description); // 类型安全 ✓
```

## 事件监听器类型

```typescript
// 事件处理函数也可以使用泛型
bridge.on<MyMessages["ui:update"]>("ui:update", (payload) => {
  // payload 类型为 { component: string; visible: boolean }
  if (payload.visible) {
    showComponent(payload.component);
  } else {
    hideComponent(payload.component);
  }
});

// 请求处理器也可以使用类型
bridge.on<RequestTypes["user:getProfile"], ResponseTypes["user:getProfile"]>(
  "user:getProfile",
  async (payload) => {
    // payload 类型为 { userId: string }
    const user = await fetchUserProfile(payload.userId);

    // 返回值类型被检查
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }
);
```

类型安全的消息传递可以显著减少运行时错误，提高代码质量和开发效率。
