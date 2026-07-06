import type { NMPv3PlusLogger } from "../types";

export class NMPv3PlusConsoleLogger implements NMPv3PlusLogger {
  constructor(private readonly enabled = false) {}

  info(message: string, ...args: unknown[]): void {
    this.write("info", message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.write("warn", message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write("error", message, args);
  }

  private write(
    level: "info" | "warn" | "error",
    message: string,
    args: unknown[],
  ): void {
    if (!this.enabled || typeof console === "undefined") {
      return;
    }

    console[level](`[NMPv3+] ${message}`, ...args);
  }
}
