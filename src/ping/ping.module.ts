// ping.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Ping } from './ping.entity'
import { PingController } from './ping.controller'
import { PingService } from './ping.service'
import { AppLoggerModule } from 'src/app-logger/app-logger.module'

@Module({
  imports: [TypeOrmModule.forFeature([Ping]), AppLoggerModule],
  controllers: [PingController],
  providers: [PingService],
})
export class PingModule {}
