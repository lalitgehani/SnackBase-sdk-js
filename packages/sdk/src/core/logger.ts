export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export type LogHandler = (entry: LogEntry) => void;

export class Logger {
  private level: LogLevel;
  private handlers: LogHandler[] = [];
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(level: LogLevel = LogLevel.NONE) {
    this.level = level;
    
    // Default console handler
    this.handlers.push((entry) => {
      const { level, message, data } = entry;
      const args = data ? [message, data] : [message];
      
      switch (level) {
        case LogLevel.ERROR:
          console.error('[SnackBase]', ...args);
          break;
        case LogLevel.WARN:
          console.warn('[SnackBase]', ...args);
          break;
        case LogLevel.INFO:
          console.info('[SnackBase]', ...args);
          break;
        case LogLevel.DEBUG:
          console.debug('[SnackBase]', ...args);
          break;
      }
    });

    // Internal buffer handler
    this.handlers.push((entry) => {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    });
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (this.level < level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.handlers.forEach(handler => handler(entry));
  }

  public error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
}
