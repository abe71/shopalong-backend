import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './users.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async resolveOrCreateUser(deviceId: string): Promise<User> {
    if (!deviceId) {
      throw new BadRequestException('Missing device_id')
    }

    const existing = await this.userRepo.findOne({
      where: { device_id: deviceId },
    })
    if (existing) return existing

    const newUser = this.userRepo.create({
      device_id: deviceId,
      name: `user_${deviceId}`,
    })

    return this.userRepo.save(newUser)
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find()
  }
}
