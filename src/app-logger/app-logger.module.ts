import { Module, Global } from '@nestjs/common'
import { AppLogger } from './app-logger.service'

@Global()
@Module({
  providers: [AppLogger], // just this
  exports: [AppLogger], // and this
})
export class AppLoggerModule {}
