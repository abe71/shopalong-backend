# Shopalong Backend

_Last updated: 2025-07-03_

This is the **NestJS-based backend** service for the Shopalong platform. It provides endpoints for OCR list upload and processing, structured logging, and internal communication between app components.

---

## Overview

This backend handles:
- **OCR file upload** via multipart `POST /ocr/process`
- **Validation** of files for size, type, and presence
- **Forwarding** to an internal processor endpoint
- **Structured logging** of all API requests to a centralized log stream (e.g., Loki)
- **Error handling and sanitization** for stability in production

---

## Directory Structure

```
src/
├── app.controller.ts        # Health check & root endpoint
├── logs/                    # Logs module (controller + service)
├── ocr/                     # OCR upload logic, file validation, forwarder
├── app-logger/              # AppLogger service (winston wrapper)
├── app-context/             # RequestContext service for enriched logs
├── shopalong-constants.ts   # Global, environment-independent constants
└── main.ts                  # App bootstrap logic
```

---

## Testing

This repo supports **three tiers** of tests:

- **Unit**: Fully mocked (`ocr.service.spec.ts`)
- **Integration**: Real service instances, mocked external calls
- **E2E**: Nock mocks for outbound traffic, otherwise full app via `supertest`

Run tests:

```bash
npm run test           # Unit + integration
npm run test:e2e       # E2E with full app context
```

> ✅ All core logic is covered with test cases for success and failure modes.

---

## Configuration Principles

- `.env` and `ConfigService`: Used for **environment-dependent values**, e.g. internal service URLs
- `shopalong-constants.ts`: Used for **static global constants**, e.g. file size limits

> Never mix both in the same code path — ensures clean testability and clarity.

---

## Deployment

This backend is designed to be deployed independently and connects via HTTP/REST to other services. It can be containerized or run on bare metal.

---

## Author Notes

- This project uses `npm` only — no `yarn`
- Logs are structured and contextualized using a custom logger
- Internal and external APIs are versioned and documented via Swagger

