/**
 * 主窗口iframe桥梁
 */

import { IframeBridge } from "./base-bridge";
import type { BridgeConfig } from "./types";

export class HostBridge extends IframeBridge {
  private iframe: HTMLIFrameElement;

  constructor(iframe: HTMLIFrameElement, config: BridgeConfig = {}) {
    super(config);
    this.iframe = iframe;
  }

  protected setupMessageListener(): void {
    window.addEventListener("message", this.handleIncomingMessage.bind(this));
  }

  protected getTargetWindow(): Window | null {
    return this.iframe.contentWindow;
  }
}
