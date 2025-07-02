// src/app-context/request-context.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { RequestContextService } from './request-context.service'
import { RequestContext } from './request-context'
import * as os from 'os'
import * as crypto from 'crypto'

export function createRequestContextMiddleware(
  contextService: RequestContextService,
) {
  return function useRequestContext(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const headers = req.headers
    const context: RequestContext = {
      requestId: headers['x-request-id']?.toString() || crypto.randomUUID(),
      deviceId: headers['x-device-id']?.toString() || 'unknown',
      app: headers['x-app']?.toString(),
      service_name: headers['x-service-name']?.toString(),
      metadata: parseMetadataHeader(headers['x-metadata']),
      method: req.method,
      path: req.url,
      hostname: os.hostname(),
      ip: req.socket.remoteAddress || '',
      userAgent: headers['user-agent']?.toString(),
      query: (req as any).query || {},
    }

    contextService.runWithContext(context, next)
  }
}

function parseMetadataHeader(
  header: string | string[] | undefined,
): Record<string, any> {
  if (!header) return {}
  try {
    return JSON.parse(Array.isArray(header) ? header[0] : header)
  } catch {
    return {}
  }
}
