import { Module } from '@nestjs/common'
import { OcrController } from './ocr.controller'
import { OcrService } from './ocr.service'
import { ConfigModule } from '@nestjs/config'
import { AppLoggerModule } from '@/app-logger/app-logger.module'
import { ListsModule } from '@/lists/lists.module'
import { UsersModule } from '@/users/users.module'

@Module({
  imports: [ConfigModule, AppLoggerModule, ListsModule, UsersModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
