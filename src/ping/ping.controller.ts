import { Controller, Get } from '@nestjs/common'
import { AppLogger } from '@/app-logger/app-logger.service'

@Controller('ping')
export class PingController {
  constructor(private readonly logger: AppLogger) {
    this.logger.log('PingController initialized')
  }

  @Get()
  getPing(): string {
    this.logger.log('Ping route hit')
    return 'pong'
  }
}
