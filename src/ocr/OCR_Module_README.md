# 🧾 OCR Module – Shopalong Backend

**Created/Updated:** 2025-07-03

This module handles OCR video segment ingestion, validation, and forwarding to the internal OCR processing service. It is part of the Shopalong backend system.

---

## 📦 Features

- Accepts multi-part form uploads (`video_full`, `video_top`, `video_bottom`)
- Validates file type (must be MP4) and size (configurable limits)
- Requires associated metadata (`list_guid`, `device_uuid`, optional `device_info`)
- Forwards validated payload to the internal OCR processor via HTTP
- Logs key operations using `AppLogger` and structured context

---

## 🛠️ Usage

### Endpoint

`POST /ocr/process`

#### Request

- **Fields**:
  - `list_guid` (UUID, required)
  - `device_uuid` (string, required)
  - `device_info` (stringified JSON, optional)

- **Files**:
  - `video_full` (MP4)
  - `video_top` (MP4)
  - `video_bottom` (MP4)

> Validation: File size limits and types enforced via `OCR_VIDEO_LIMITS` in `shopalong-config.ts`.

#### Response (on success)

```json
{
  "status": "accepted",
  "message": "OCR request received",
  "list_guid": "..."
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

Includes:

- `ocr.service.spec.ts`:
  - File validation
  - Error throwing for missing/malformed input
  - Axios call mocking (`forwardToInternalProcessor`)
  - Logger is mocked to suppress noise

### End-to-End Tests

```bash
npm run test:e2e
```

Includes:

- `ocr.controller.e2e-spec.ts`:
  - Tests happy-path upload with multipart form
  - Simulates internal service response with `nock`
  - Mocks `shopalong-config` for smaller file size acceptance
  - Validates UUID format errors, missing files, and mime types

---

## 🔧 Configuration

Defined in `src/shopalong-config.ts`:

```ts
export const OCR_VIDEO_LIMITS = {
  video_full: { min: 100_000, max: 15_000_000 },
  video_top: { min: 50_000, max: 5_000_000 },
  video_bottom: { min: 50_000, max: 5_000_000 },
}
```

Set `INTERNAL_OCR_URL` via `.env` or environment config.

---

## 📁 File Structure

```
src/ocr/
├── ocr.controller.ts
├── ocr.service.ts
├── dto/
│   └── ocr-upload.dto.ts
├── validators/
│   └── is-uuid.decorator.ts
├── __tests__/
│   └── ocr.service.spec.ts
test/e2e/
└── ocr.controller.e2e-spec.ts
```

---

## 🧼 Logging

Logs use `AppLogger`, scoped by request context:

- Validations
- Forwarding attempts
- Errors (Axios failures, bad input, etc.)

---

## 🧪 Manual Testing (Optional)

For full-stack testing with real videos:

Use Postman, Insomnia, or SoapUI to send a multipart `POST` request to:

```
http://localhost:<port>/ocr/process
```

With:
- Fields: `list_guid`, `device_uuid`, `device_info`
- Files: three small `video/mp4` files (see `test/e2e/sample.mp4`)

---

## 🧙 Tips

- Use `nock` for mocking external HTTP in tests.
- Use `jest.resetModules()` if mocking global config modules between tests.
- Always test size + type validation in the **service**, not the controller.
- Keep test video samples small and adjust limits via config mocks.
