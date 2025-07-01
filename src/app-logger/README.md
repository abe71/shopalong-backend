# Shopalong Logger & Request Context

## Overview

This module provides structured request-aware logging using:

- `AsyncLocalStorage` for request-scoped context (IP, user ID, method, etc.)
- A custom logger (`AppLogger`) that:
  - Writes to the console (via Winston)
  - Sends logs to Grafana Loki with rich metadata

---

## Structure

| Component                  | Responsibility                                               |
| -------------------------- | ------------------------------------------------------------ |
| `RequestContextService`    | Holds request metadata per request using `AsyncLocalStorage` |
| `RequestContextMiddleware` | Extracts metadata from HTTP requests (e.g., IP, headers)     |
| `AppLogger`                | Logs to console and forwards structured logs to Loki         |

---

## Request Metadata Collected

These fields are automatically attached to every log (if available):

- `requestId` – unique ID for tracing
- `userId` – extracted from authenticated request
- `deviceId` – fallback if no user ID
- `ip`, `hostname`, `method`, `path`, `query`, `userAgent`

---

## Logging Usage (NestJS)

Inject `AppLogger` instead of using `console` or Nest’s `Logger`:

```ts
constructor(private readonly logger: AppLogger) {}

this.logger.log('Something happened', 'MyService')
```
