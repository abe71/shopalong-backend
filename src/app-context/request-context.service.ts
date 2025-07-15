import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'
import * as os from 'os'
import { RequestContext } from './request-context'

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContext>()

  getContext(): RequestContext {
    return (
      this.als.getStore() ?? {
        requestId: 'manual-fallback',
        hostname: os.hostname(),
        ip: 'unknown',
        path: 'unknown',
        method: 'manual',
        userAgent: 'manual',
        service_name: 'shopalong',
        app: 'shopalong-backend',
      }
    )
  }

  setContextPartial(patch: Partial<RequestContext>) {
    const ctx = this.als.getStore()
    if (!ctx) throw new Error('Context not available')
    Object.assign(ctx, patch)
  }

  runWithContext(ctx: RequestContext, fn: () => void) {
    this.als.run(ctx, fn)
  }
}
