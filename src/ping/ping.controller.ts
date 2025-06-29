import { Controller, Get } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Ping } from './ping.entity'

@Controller('ping')
export class PingController {
  constructor(
    @InjectRepository(Ping)
    private readonly pingRepo: Repository<Ping>,
  ) {}

  @Get()
  async testPing() {
    return 'pong'
  }
}
