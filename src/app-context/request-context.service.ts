import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'
import { RequestContext } from 'src/app-context/request-context'

@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

  runWithContext<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback)
  }

  getContext(): RequestContext {
    return (
      this.asyncLocalStorage.getStore() ?? {
        requestId: 'unknown',
        userId: 'unknown',
        deviceId: 'unknown',
        ip: 'unknown',
      }
    )
  }

  get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    return this.asyncLocalStorage.getStore()?.[key]
  }
}
