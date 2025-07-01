import { Injectable } from '@nestjs/common'
import { AppLogger } from 'src/app-logger/app-logger.service'

@Injectable()
export class PingService {
  constructor(private readonly logger: AppLogger) {
    this.logger.log('Hello from SomeService', 'SomeService')
  }
  getPing(): string {
    return 'pong'
  }
}
