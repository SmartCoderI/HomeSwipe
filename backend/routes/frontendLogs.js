import express from 'express';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create dedicated logger for frontend logs
const logsDir = path.join(__dirname, '..', 'logs');

const frontendLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'frontend-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
});

const frontendLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'homeswipe-frontend' },
  transports: [frontendLogsTransport],
});

/**
 * POST /api/frontend-logs
 * Receive and persist logs from frontend
 */
router.post('/api/frontend-logs', (req, res) => {
  try {
    const logEntry = req.body;

    // Validate log entry
    if (!logEntry || !logEntry.level || !logEntry.message) {
      return res.status(400).json({
        error: 'Invalid log entry format',
      });
    }

    // Add server-side metadata
    const enrichedLog = {
      ...logEntry,
      serverTimestamp: new Date().toISOString(),
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      serverCorrelationId: req.correlationId,
    };

    // Log to file based on level
    switch (logEntry.level) {
      case 'debug':
        frontendLogger.debug(logEntry.message, enrichedLog);
        break;
      case 'info':
        frontendLogger.info(logEntry.message, enrichedLog);
        break;
      case 'warn':
        frontendLogger.warn(logEntry.message, enrichedLog);
        break;
      case 'error':
        frontendLogger.error(logEntry.message, enrichedLog);
        break;
      default:
        frontendLogger.info(logEntry.message, enrichedLog);
    }

    // Return success without blocking
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging frontend entry:', error);
    // Don't fail - logging should not break the app
    res.status(200).json({ success: false });
  }
});

export default router;
