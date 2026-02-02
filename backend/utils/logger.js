import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Console format for development (pretty print)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let metaStr = '';
    if (metadata && Object.keys(metadata).length > 0) {
      metaStr = '\n' + JSON.stringify(metadata, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Daily rotate file transport for all logs
const allLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
  level: 'debug',
});

// Daily rotate file transport for error logs
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
  level: 'error',
});

// Daily rotate file transport for HTTP requests
const httpLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d',
  format: logFormat,
});

// Daily rotate file transport for API calls (external)
const apiLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'api-calls-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Daily rotate file transport for user actions
const userActionsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'user-actions-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

// Create the main logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'homeswipe-backend' },
  transports: [
    allLogsTransport,
    errorLogsTransport,
    // Console output for development
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    }),
  ],
});

// Create specialized loggers for different concerns
const httpLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'homeswipe-http' },
  transports: [httpLogsTransport],
});

const apiLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  defaultMeta: { service: 'homeswipe-api-calls' },
  transports: [apiLogsTransport, allLogsTransport],
});

const userActionLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'homeswipe-user-actions' },
  transports: [userActionsTransport, allLogsTransport],
});

// Helper functions for structured logging
export const logUserAction = (action, details = {}) => {
  userActionLogger.info(action, {
    timestamp: new Date().toISOString(),
    action,
    ...details,
  });
};

export const logApiCall = (endpoint, method, details = {}) => {
  apiLogger.info(`API Call: ${method} ${endpoint}`, {
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    ...details,
  });
};

export const logApiResponse = (endpoint, method, statusCode, details = {}) => {
  const level = statusCode >= 400 ? 'error' : 'info';
  apiLogger[level](`API Response: ${method} ${endpoint} - ${statusCode}`, {
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    statusCode,
    ...details,
  });
};

export const logHttpRequest = (req, details = {}) => {
  httpLogger.info(`HTTP ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    correlationId: req.correlationId,
    ...details,
  });
};

export const logHttpResponse = (req, res, responseTime, details = {}) => {
  const level = res.statusCode >= 400 ? 'warn' : 'info';
  httpLogger[level](`HTTP ${req.method} ${req.path} - ${res.statusCode}`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    correlationId: req.correlationId,
    ...details,
  });
};

// Generate correlation ID for request tracking
export const generateCorrelationId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Middleware to add correlation ID to requests
export const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.get('X-Correlation-ID') || generateCorrelationId();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

// Middleware to log HTTP requests/responses
export const httpLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logHttpRequest(req, {
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    const responseTime = Date.now() - startTime;

    // Log response
    logHttpResponse(req, res, responseTime, {
      responseSize: data ? data.length : 0,
    });

    return res.send(data);
  };

  next();
};

export default logger;
