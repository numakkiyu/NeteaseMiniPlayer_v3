export type NMPv3LogLevel = "info" | "warn" | "error";

export interface NMPv3Logger {
  enabled: boolean;
  info(message: string, detail?: unknown): void;
  warn(message: string, detail?: unknown): void;
  error(message: string, detail?: unknown): void;
}

class ConsoleLogger implements NMPv3Logger {
  enabled = false;

  info(message: string, detail?: unknown): void {
    this.write("info", message, detail);
  }

  warn(message: string, detail?: unknown): void {
    this.write("warn", message, detail);
  }

  error(message: string, detail?: unknown): void {
    this.write("error", message, detail);
  }

  private write(level: NMPv3LogLevel, message: string, detail?: unknown): void {
    if (!this.enabled || typeof console === "undefined") {
      return;
    }

    console[level](`[NMPv3] ${message}`, detail ?? "");
  }
}

export const logger = new ConsoleLogger();
