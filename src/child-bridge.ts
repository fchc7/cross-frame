/**
 * 子窗口iframe桥梁
 */

import { IframeBridge } from "./base-bridge";
import type { BridgeConfig } from "./types";

export class ChildBridge extends IframeBridge {
  constructor(config: BridgeConfig = {}) {
    super(config);
  }

  protected setupMessageListener(): void {
    window.addEventListener("message", this.handleIncomingMessage.bind(this));
  }

  protected getTargetWindow(): Window | null {
    return window.parent;
  }
}
