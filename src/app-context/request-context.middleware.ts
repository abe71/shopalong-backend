// src/app-context/request-context.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { RequestContextService } from './request-context.service'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const context = {
      requestId: uuidv4(),
      userId: req.headers['x-user-id'] as string | undefined,
      deviceId: req.headers['x-device-id'] as string | undefined,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      hostname: req.hostname,
      query: req.query,
      userAgent: req.headers['user-agent'],
    }

    this.contextService.runWithContext(context, () => next())
  }
}
