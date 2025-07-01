import { Controller, Get } from '@nestjs/common'
import { AppLogger } from 'src/app-logger/app-logger.service'

@Controller('ping')
export class PingController {
  constructor(private readonly logger: AppLogger) {
    this.logger.log('PingController initialized', 'PingController')
  }

  @Get()
  getPing(): string {
    this.logger.log('Ping route hit', 'PingController')
    return 'pong'
  }
}
