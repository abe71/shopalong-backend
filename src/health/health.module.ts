import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([])], // no entities, but needed for DataSource injection
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
