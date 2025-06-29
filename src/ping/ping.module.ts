// ping.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Ping } from './ping.entity'
import { PingController } from './ping.controller'
import { PingService } from './ping.service'

@Module({
  imports: [TypeOrmModule.forFeature([Ping])],
  controllers: [PingController],
  providers: [PingService],
})
export class PingModule {}
