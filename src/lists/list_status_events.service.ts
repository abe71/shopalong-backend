import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ListStatusEvent } from './entities/list_status_events.entity'
import { List } from './entities/lists.entity'

@Injectable()
export class ListStatusEventsService {
  constructor(
    @InjectRepository(ListStatusEvent)
    private readonly eventRepo: Repository<ListStatusEvent>,
    @InjectRepository(List)
    private readonly listRepo: Repository<List>, // 👈 this is the missing line
  ) {}

  async log(listId: string, event_type: string, details?: any) {
    const event = this.eventRepo.create({
      list: { list_guid: listId },
      event_type,
      details,
    })
    return this.eventRepo.save(event)
  }

  async create(input: {
    list_guid: string
    status: string
    metadata?: Record<string, any>
  }): Promise<ListStatusEvent> {
    const list = await this.listRepo.findOneOrFail({
      where: { list_guid: input.list_guid },
    })

    const event = this.eventRepo.create({
      list,
      event_type: input.status,
      details: input.metadata ?? {},
    })

    return this.eventRepo.save(event)
  }
}
