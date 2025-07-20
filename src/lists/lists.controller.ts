import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common'
import {
  ApiOkResponse,
  ApiAcceptedResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger'
import { ListsService } from './lists.service'
import { ListStatusEventsService } from './list_status_events.service'
import { ListResultDto } from './dto/list-result.dto'
import { PendingListDto } from './dto/pending-list.dto'
import { FailedListDto } from './dto/failed-list.dto'
import { AppLogger } from '@/app-logger/app-logger.service'

@ApiTags('Lists')
@Controller('lists')
export class ListsController {
  constructor(
    private readonly listsService: ListsService,
    private readonly listStatusEventsService: ListStatusEventsService,
    private readonly logger: AppLogger,
  ) {}

  @Get(':list_guid')
  @ApiOperation({ summary: 'Get a processed shopping list by its GUID' })
  @ApiOkResponse({ type: ListResultDto })
  @ApiAcceptedResponse({
    type: PendingListDto,
    description: 'List is still being processed',
  })
  @ApiUnprocessableEntityResponse({
    type: FailedListDto,
    description: 'Processing failed',
  })
  @ApiNotFoundResponse({ description: 'List not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getListByGuid(
    @Param('list_guid') listGuid: string,
  ): Promise<ListResultDto | PendingListDto | FailedListDto> {
    this.logger.log('list route hit')
    const list = await this.listsService.findByGuid(listGuid)
    if (!list) {
      throw new NotFoundException(`No list found for guid ${listGuid}`)
    }

    const status = await this.listStatusEventsService.getLatestStatus(listGuid)

    switch (status) {
      case 'DONE':
        return this.listsService.getStructuredResult(listGuid) // Should return ListResultDto

      case 'PROCESSING':
      case 'UPLOADED':
        return {
          list_guid: listGuid,
          status,
          message: 'Processing not yet complete. Try again shortly.',
        } as PendingListDto

      case 'FAILED':
        throw new UnprocessableEntityException({
          list_guid: listGuid,
          status: 'FAILED',
          message:
            'Processing failed. Please try uploading again or contact support.',
        } as FailedListDto)

      default:
        throw new InternalServerErrorException(
          `Unknown processing status: ${status}`,
        )
    }
  }
}
