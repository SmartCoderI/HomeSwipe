/**
 * Frontend Logging Service
 * Provides structured logging for user actions and application events
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

class FrontendLogger {
  private correlationId: string;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory
  private logToConsole = true;
  private logToServer = true; // Can be disabled for development

  constructor() {
    this.correlationId = this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return `fe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const meta = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${level.toUpperCase()}] ${message}${meta}`;
  }

  private createLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      metadata,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private consoleLog(entry: LogEntry) {
    if (!this.logToConsole) return;

    const formattedMsg = this.formatMessage(entry.level, entry.message, entry.metadata);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMsg);
        break;
      case LogLevel.INFO:
        console.info(formattedMsg);
        break;
      case LogLevel.WARN:
        console.warn(formattedMsg);
        break;
      case LogLevel.ERROR:
        console.error(formattedMsg);
        break;
    }
  }

  private async sendToServer(entry: LogEntry) {
    if (!this.logToServer) return;

    try {
      // Send logs to backend for persistence
      await fetch('http://localhost:3001/api/frontend-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': this.correlationId,
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error('Failed to send log to server:', error);
    }
  }

  public debug(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
    this.addLog(entry);
    this.consoleLog(entry);
    // Don't send debug logs to server to reduce noise
  }

  public info(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
    this.addLog(entry);
    this.consoleLog(entry);
    this.sendToServer(entry);
  }

  public warn(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
    this.addLog(entry);
    this.consoleLog(entry);
    this.sendToServer(entry);
  }

  public error(message: string, error?: Error, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
    this.addLog(entry);
    this.consoleLog(entry);
    this.sendToServer(entry);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }

  public setCorrelationId(id: string) {
    this.correlationId = id;
  }

  public getCorrelationId(): string {
    return this.correlationId;
  }

  // Helper methods for specific user actions
  public logUserAction(action: string, details?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      action,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  public logApiCall(endpoint: string, method: string, details?: Record<string, any>) {
    this.info(`API call: ${method} ${endpoint}`, {
      endpoint,
      method,
      ...details,
    });
  }

  public logApiResponse(endpoint: string, method: string, status: number, duration: number, details?: Record<string, any>) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API response: ${method} ${endpoint} - ${status}`;

    const entry = this.createLogEntry(level, message, {
      endpoint,
      method,
      status,
      duration: `${duration}ms`,
      ...details,
    });

    this.addLog(entry);
    this.consoleLog(entry);
    this.sendToServer(entry);
  }

  public logComponentMount(componentName: string) {
    this.debug(`Component mounted: ${componentName}`, { component: componentName });
  }

  public logComponentUnmount(componentName: string) {
    this.debug(`Component unmounted: ${componentName}`, { component: componentName });
  }

  public logNavigation(from: string, to: string) {
    this.info(`Navigation: ${from} → ${to}`, { from, to });
  }
}

// Export singleton instance
export const logger = new FrontendLogger();

// Export helper functions for convenience
export const logUserAction = (action: string, details?: Record<string, any>) =>
  logger.logUserAction(action, details);

export const logApiCall = (endpoint: string, method: string, details?: Record<string, any>) =>
  logger.logApiCall(endpoint, method, details);

export const logApiResponse = (endpoint: string, method: string, status: number, duration: number, details?: Record<string, any>) =>
  logger.logApiResponse(endpoint, method, status, duration, details);

export const logError = (message: string, error?: Error, metadata?: Record<string, any>) =>
  logger.error(message, error, metadata);

export default logger;
