# HomeSwipe Logging System

This document describes the industrial-level logging system implemented in HomeSwipe.

## Overview

The logging system provides comprehensive tracking of all actions in both frontend and backend, with structured logging, automatic file rotation, and correlation IDs for request tracking.

## Backend Logging

### Log Files Location

All backend logs are stored in `backend/logs/` directory:

- `application-YYYY-MM-DD.log` - All application logs (info, warn, error, debug)
- `error-YYYY-MM-DD.log` - Error logs only
- `http-YYYY-MM-DD.log` - HTTP request/response logs
- `api-calls-YYYY-MM-DD.log` - External API calls (Redfin, Gemini, etc.)
- `user-actions-YYYY-MM-DD.log` - User action tracking
- `frontend-YYYY-MM-DD.log` - Logs from frontend application

### Log Rotation

- Files are rotated daily
- Maximum file size: 20MB
- Retention period:
  - Application logs: 14 days
  - Error logs: 30 days
  - HTTP logs: 7 days
  - API call logs: 14 days
  - User action logs: 30 days
  - Frontend logs: 14 days

### Log Structure

All logs are in JSON format with the following structure:

```json
{
  "timestamp": "2026-01-31 22:30:45.123",
  "level": "info",
  "message": "Search request received",
  "service": "homeswipe-backend",
  "correlationId": "1738367445123-xyz789",
  "metadata": {
    "query": "3 bed home in Sunnyvale",
    "hasExistingPreferences": false
  }
}
```

### Correlation IDs

Every request gets a unique correlation ID that tracks it through the entire system:
- Generated automatically for each HTTP request
- Passed to all services and API calls
- Returned in response headers as `X-Correlation-ID`
- Used to track requests across frontend and backend

### Using the Logger

```javascript
import logger, { logUserAction, logApiCall, logApiResponse } from '../utils/logger.js';

// General logging
logger.info('User preferences extracted', {
  correlationId,
  preferences: extractedData,
});

logger.error('API call failed', {
  correlationId,
  error: error.message,
  stack: error.stack,
});

// User action logging
logUserAction('SEARCH_INITIATED', {
  correlationId,
  query: userQuery,
  timestamp: new Date().toISOString(),
});

// API call logging
logApiCall('https://api.redfin.com/search', 'GET', {
  correlationId,
  params: searchParams,
});

logApiResponse('https://api.redfin.com/search', 'GET', 200, {
  correlationId,
  duration: '1234ms',
  resultCount: 10,
});
```

## Frontend Logging

### Frontend Logger Service

Location: `frontend/services/logger.ts`

The frontend logger provides:
- In-memory log storage (last 100 logs)
- Console output (with colored formatting)
- Automatic server transmission (for persistence)
- Correlation ID tracking

### Using Frontend Logger

```typescript
import logger, { logUserAction, logApiCall, logApiResponse } from './services/logger';

// User actions
logUserAction('SWIPE_RIGHT', {
  propertyId: '123456',
  address: '123 Main St',
});

logUserAction('SEARCH_INITIATED', {
  query: 'homes in San Francisco',
});

// API calls
const startTime = Date.now();
logApiCall('/api/search-listings', 'POST', {
  query: userQuery,
});

// After response
const duration = Date.now() - startTime;
logApiResponse('/api/search-listings', 'POST', response.status, duration, {
  listingCount: data.count,
});

// Errors
logger.error('Failed to load images', error, {
  propertyId: '123456',
  attemptCount: 3,
});

// Component lifecycle
logger.logComponentMount('HomeCard');
logger.logComponentUnmount('HomeCard');

// Navigation
logger.logNavigation('/landing', '/browsing');
```

## What Gets Logged

### User Actions

All user interactions are logged:
- Search initiated (query text, preferences)
- Search completed (results count, duration)
- Swipe left/right (property details)
- Property liked/disliked
- Navigation between screens
- Deep analysis requested
- Refinement queries

### API Calls

All external API calls are logged:
- **Redfin API**: Search requests, property details, image fetching
  - Request parameters
  - Response status
  - Duration
  - Result count

- **Gemini API**: Preference extraction, mapping, analysis
  - Model used
  - Prompt length
  - Response length
  - Duration

- **Google Maps API**: Geocoding, address lookups
  - Address queried
  - Lat/long returned
  - Duration

### HTTP Requests

All HTTP requests to backend:
- Method and path
- Query parameters
- Request body (for POST/PUT)
- Response status code
- Response time
- Client IP
- User agent
- Correlation ID

### Performance Metrics

Timing information is logged for:
- Total search duration
- Individual steps:
  - Preference extraction
  - Preference mapping
  - Redfin API call
  - Deep analysis (when enabled)
- Image loading
- Component render times

### Errors

All errors are logged with:
- Error message
- Stack trace
- Context (what was being done)
- Correlation ID (to trace request)
- User action that caused error

## Log Analysis

### Finding Issues

```bash
# Search for errors in last 7 days
grep '"level":"error"' backend/logs/error-*.log

# Find all requests for a specific correlation ID
grep "1738367445123-xyz789" backend/logs/application-*.log

# Check API performance
grep "API Response" backend/logs/api-calls-*.log | grep "duration"

# User action timeline
grep "User action" backend/logs/user-actions-*.log
```

### Performance Analysis

```bash
# Find slow Redfin API calls (>2000ms)
grep "Redfin API" backend/logs/api-calls-*.log | grep -E "duration.*[2-9][0-9]{3}ms"

# Average search duration
grep "Search request completed" backend/logs/application-*.log | grep "totalDuration"
```

### Debugging Workflow

1. Get correlation ID from error or user report
2. Search all log files for that correlation ID
3. See complete request flow:
   - User action
   - API calls made
   - Timing breakdown
   - Errors encountered

Example:
```bash
grep "correlation-id-here" backend/logs/*.log | less
```

## Configuration

### Environment Variables

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Disable frontend log transmission (development)
VITE_DISABLE_LOG_TRANSMISSION=true
```

### Disabling Logging

To disable specific log types:

```javascript
// In backend/utils/logger.js
const logger = winston.createLogger({
  level: 'error', // Only log errors
  // ...
});

// In frontend/services/logger.ts
class FrontendLogger {
  private logToServer = false; // Disable server transmission
  private logToConsole = false; // Disable console output
}
```

## Best Practices

1. **Always include correlation ID** - Pass it through all function calls
2. **Log at appropriate levels**:
   - DEBUG: Detailed diagnostic info
   - INFO: General informational messages
   - WARN: Warning messages (degraded but functional)
   - ERROR: Error messages (something failed)

3. **Include context** - Add metadata that helps debug:
   ```javascript
   logger.info('Processing search', {
     correlationId,
     query: userQuery,
     location: preferences.location,
     resultCount: results.length,
   });
   ```

4. **Don't log sensitive data** - Avoid logging:
   - API keys
   - Passwords
   - Personal information (full addresses, emails)
   - Credit card numbers

5. **Log timing for performance tracking**:
   ```javascript
   const startTime = Date.now();
   // ... operation ...
   const duration = Date.now() - startTime;
   logger.info('Operation completed', {
     correlationId,
     duration: `${duration}ms`,
   });
   ```

## Monitoring

### Log Monitoring Setup

For production, consider:
1. **Log aggregation**: Ship logs to ELK stack, Datadog, or CloudWatch
2. **Alerts**: Set up alerts for error rates, slow API calls
3. **Dashboards**: Create dashboards for key metrics

### Key Metrics to Monitor

- Error rate (errors per minute)
- Average search duration
- API call success rate
- User action frequency
- Frontend errors vs backend errors

## Troubleshooting

### Logs not appearing

1. Check `backend/logs/` directory exists
2. Check file permissions
3. Check LOG_LEVEL environment variable
4. Restart backend server

### Too many logs

Adjust log levels:
```javascript
const logger = winston.createLogger({
  level: 'warn', // Only warn and error
});
```

### Disk space issues

Logs auto-rotate and delete after retention period. To manually clean:
```bash
rm backend/logs/*-2026-01-*.log
```

## Examples

See the following files for implementation examples:
- `backend/routes/searchListings.js` - Complete search flow logging
- `backend/services/redfin Service.js` - API call logging
- `frontend/App.tsx` - User action logging (to be implemented)
