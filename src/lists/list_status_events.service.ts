import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ListStatusEvent } from './entities/list_status_events.entity'
import { List } from './entities/lists.entity'

export enum ListStatusCode {
  OCR_STARTED = 'ocr_started',
  OCR_FAILED = 'ocr_failed',
  DONE = 'done',
  PROCESSING = 'processing',
  FAILED = 'failed',
}
@Injectable()
export class ListStatusEventsService {
  constructor(
    @InjectRepository(ListStatusEvent)
    private readonly eventRepo: Repository<ListStatusEvent>,
    @InjectRepository(List)
    private readonly listRepo: Repository<List>,
    @InjectRepository(ListStatusEvent)
    private readonly listStatusRepo: Repository<ListStatusEvent>,
  ) {}

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

  async getLatestStatus(listGuid: string): Promise<ListStatusCode> {
    const latest = await this.listStatusRepo.findOne({
      where: { list: { list_guid: listGuid } },
      relations: ['list'],
      order: { created_at: 'DESC' },
    })

    if (!latest) {
      throw new NotFoundException(`No status found for list ${listGuid}`)
    }

    // Normalize to enum value
    switch (latest.event_type) {
      case ListStatusCode.DONE:
      case ListStatusCode.PROCESSING:
      case ListStatusCode.OCR_STARTED:
      case ListStatusCode.FAILED:
        return latest.event_type as ListStatusCode
      default:
        throw new Error(`Unhandled event_type: ${latest.event_type}`)
    }
  }
}
