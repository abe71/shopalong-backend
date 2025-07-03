import { Module } from '@nestjs/common'
import { OcrController } from './ocr.controller'
import { OcrService } from './ocr.service'
import { ConfigModule } from '@nestjs/config'
import { AppLoggerModule } from 'src/app-logger/app-logger.module'

@Module({
  imports: [ConfigModule, AppLoggerModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
