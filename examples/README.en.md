# cross-frame Examples

This directory contains multiple examples demonstrating how to use the cross-frame library for cross-window communication.

## Example List

### [Basic Communication](./basic)

Basic communication between parent window and child window (iframe), showcasing the core functionality.

### [Enhanced Features](./enhanced)

Demonstrates enhanced features of cross-frame, including the plugin system, timeout handling, and other advanced features.

### [Plugin System](./plugins)

Detailed introduction on how to use the cross-frame plugin system, including logger, retry, and queue management plugins.

### [Multi-Window Isolation](./multi-window)

Shows how to implement message isolation between multiple windows or iframes to avoid cross-window interference.

### [TypeScript Support](./typescript)

Demonstrates how to leverage the TypeScript type system for type-safe messaging.

## Running Examples

1. Clone the repository

```bash
git clone https://github.com/yourusername/cross-frame.git
cd cross-frame
```

2. Install dependencies

```bash
npm install
```

3. Build the library

```bash
npm run build
```

4. Open examples
   Use any HTTP server to run these examples locally, for example:

```bash
# If you have http-server installed
npx http-server

# Or use Python's built-in server
python -m http.server
```

Then visit the corresponding example page in your browser.
