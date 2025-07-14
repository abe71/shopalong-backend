import { Module, Global } from '@nestjs/common'
import { AppLogger } from './app-logger.service'
import { AppContextModule } from '@/app-context/app-context.module'

@Global()
@Module({
  imports: [AppContextModule],
  providers: [AppLogger], // just this
  exports: [AppLogger], // and this
})
export class AppLoggerModule {}
