import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Body,
} from '@nestjs/common'
import {
  ApiOkResponse,
  ApiAcceptedResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiQuery,
} from '@nestjs/swagger'
import { ListsService } from './lists.service'
import {
  ListStatusCode,
  ListStatusEventsService,
} from './list_status_events.service'
import { ListResultDto } from './dto/list-result.dto'
import { PendingListDto } from './dto/pending-list.dto'
import { FailedListDto } from './dto/failed-list.dto'
import { AppLogger } from '@/app-logger/app-logger.service'
import { CreateListDto } from './dto/create-list.dto'
import { List } from './entities/lists.entity'
import { ListItemsService } from './list_items.service'

// Design Note: Lists are immutable. Updates always create new versions with full item sets.
// No support for delta updates or partial item additions.
@ApiTags('Lists')
@Controller('lists')
export class ListsController {
  constructor(
    private readonly listsService: ListsService,
    private readonly listStatusEventsService: ListStatusEventsService,
    private readonly logger: AppLogger,
    private readonly listItemsService: ListItemsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new empty or metadata-only list' })
  @ApiCreatedResponse({ description: 'The created list', type: ListResultDto })
  async createList(@Body() dto: CreateListDto): Promise<ListResultDto> {
    const { items, ...listData } = dto
    const savedList = await this.listsService.create(dto)

    if (items?.length) {
      await this.listItemsService.saveItems(savedList.list_guid, items)
    }

    return this.listsService.getStructuredResult(
      savedList.origin_list_guid,
      savedList.version,
    )
  }

  @Get(':origin_list_guid')
  @ApiOperation({
    summary: 'Get a processed shopping list by origin and optional version',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    type: Number,
    description: 'Optional version number. Latest will be returned if omitted.',
  })
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
  @Get(':origin_list_guid')
  @ApiOperation({
    summary: 'Get a processed shopping list by origin and optional version',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    type: Number,
    description: 'Optional version number. Latest will be returned if omitted.',
  })
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
  async getListByOrigin(
    @Param('origin_list_guid') originGuid: string,
    @Query('version') version?: number,
  ): Promise<ListResultDto | PendingListDto | FailedListDto> {
    this.logger.log('list route hit')

    const list = await this.listsService.findByOrigin(originGuid, version)
    if (!list) {
      throw new NotFoundException(`No list found for origin ${originGuid}`)
    }

    const status = await this.listStatusEventsService.getLatestStatus(
      list.list_guid,
    )

    switch (status) {
      case ListStatusCode.DONE:
        return this.listsService.getStructuredResult(originGuid, version)

      case ListStatusCode.PROCESSING:
        return {
          list_guid: list.list_guid,
          status,
          message: 'Processing not yet complete. Try again shortly.',
        } as PendingListDto

      case ListStatusCode.FAILED:
        throw new UnprocessableEntityException({
          list_guid: list.list_guid,
          status,
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
