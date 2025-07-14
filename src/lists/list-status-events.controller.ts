import { Body, Controller, Post } from '@nestjs/common'
import { ListStatusEventsService } from './list_status_events.service'

@Controller('list/status')
export class ListStatusEventsController {
  constructor(private readonly statusEventsService: ListStatusEventsService) {}

  @Post()
  async createStatus(@Body() body: any) {
    const { list_guid, status, metadata } = body
    return this.statusEventsService.create({
      list_guid,
      status,
      metadata,
    })
  }
}
