import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async getHealthStatus() {
    try {
      await this.dataSource.query('SELECT 1') // ping DB
      return {
        status: 'ok',
        db: 'reachable',
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return { status: 'error', db: 'unreachable', error: err.message }
    }
  }
}
