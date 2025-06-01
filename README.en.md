# iframe-connect

A lightweight, type-safe cross-frame communication library.

## Features

- 🚀 **Lightweight** - Simple core code, no external dependencies, only ~9KB in size
- 🔒 **Type-Safe** - Full TypeScript support with generic-friendly interfaces
- 🎯 **Easy to Use** - Intuitive API design
- 🔌 **Plugin System** - Support for logging, retry, queue, and other extensions
- 🔄 **Bidirectional** - Request/response pattern support
- 🛡️ **Multi-Window Isolation** - Optional message isolation between windows

## Installation

```bash
npm install iframe-connect
```

## Basic Usage

### Simple API

```typescript
import { createBridge } from "iframe-connect";

// Auto-detect environment (parent window or child window)
const bridge = createBridge(iframe); // Provide iframe in parent window
// OR
const bridge = createBridge(); // No parameters needed in child window

// Send a message
bridge.send("greeting", { message: "Hello!" });

// Send a request and wait for response
const response = await bridge.request("getData", { id: 123 });
console.log(response);

// Listen for messages
bridge.on("notification", (payload) => {
  console.log("Received notification:", payload);
});
```

### With Plugins

```typescript
import { createBridge } from "iframe-connect";

const bridge = createBridge(iframe, {
  // Basic configuration
  targetOrigin: "https://trusted-domain.com",
  debug: true,

  // Plugin configuration
  plugins: {
    // Enable logger plugin
    logger: {
      level: "info",
      colors: true,
    },

    // Enable retry functionality
    retry: {
      maxRetries: 3,
    },

    // Enable queue management
    queue: {
      batchSize: 5,
    },
  },
});

// Use API normally (already enhanced)
bridge.send("user:login", { username: "john" });

// Requests will automatically retry, queue, and log
const result = await bridge.request("data:fetch", { id: 123 });
```

## Multi-Window Isolation

In environments with multiple iframes, enable multi-window isolation:

```typescript
// Parent window A
const bridgeA = createBridge(iframeA, {
  enableMultiWindow: true,
  windowId: "window-A",
});

// Parent window B
const bridgeB = createBridge(iframeB, {
  enableMultiWindow: true,
  windowId: "window-B",
});

// Now messages between the two windows won't interfere
```

## Type Safety

```typescript
// Define your message types
interface MyMessages {
  "user:login": { username: string; password: string };
  "user:logout": { userId: string };
  "data:update": { id: number; data: any };
}

// Use generics for type hints
bridge.send<MyMessages["user:login"]>("user:login", {
  username: "john",
  password: "secret",
});

// Request/response also supports generics
const result = await bridge.request<
  MyMessages["data:update"],
  { success: boolean; id: number }
>("data:update", {
  id: 1,
  data: { name: "Updated Name" },
});
```

## Available Plugins

### Logger Plugin

```typescript
// Automatically log all communication messages
const bridge = createBridge(iframe, {
  plugins: {
    logger: {
      level: "debug", // debug, info, warn, error
      colors: true,
      timestamp: true,
    },
  },
});
```

### Retry Plugin

```typescript
// Automatically retry failed requests
const bridge = createBridge(iframe, {
  plugins: {
    retry: {
      maxRetries: 3,
      backoff: "exponential", // linear, exponential
      retryCondition: (error) => error.message.includes("timeout"),
    },
  },
});
```

### Queue Plugin

```typescript
// Batch process messages with priority support
const bridge = createBridge(iframe, {
  plugins: {
    queue: {
      maxSize: 100,
      batchSize: 10,
      flushInterval: 1000,
      priority: true,
    },
  },
});
```

## Configuration Options

```typescript
interface BridgeConfig {
  targetOrigin?: string; // Target origin, default '*'
  timeout?: number; // Request timeout, default 5000ms
  debug?: boolean; // Debug mode, default false
  enableMultiWindow?: boolean; // Enable multi-window isolation, default false
  windowId?: string; // Custom window ID
  plugins?: {
    logger?: boolean | LoggerOptions;
    retry?: boolean | RetryOptions;
    queue?: boolean | QueueOptions;
  };
}
```

## Examples

Check the [examples](./examples) directory for full examples:

- [Basic Communication](./examples/basic) - Basic parent-child window communication
- [Multi-Window Isolation](./examples/multi-window) - Message isolation in multi-window environments
- [Plugin System](./examples/plugins) - Using plugins to enhance functionality
- [Type Safety](./examples/typescript) - TypeScript type definition examples
- [Enhanced Features](./examples/enhanced) - Advanced features and optimizations

## License

[MIT](LICENSE)
