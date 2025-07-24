import { ApiProperty } from '@nestjs/swagger'
import { ListStatusCode } from '../list_status_events.service'

export class ListItemDto {
  @ApiProperty() name: string
  @ApiProperty() category: string
  @ApiProperty() confidence: number
}

export class ListResultDto {
  @ApiProperty() origin_list_guid: string
  @ApiProperty({ enum: ListStatusCode })
  status: ListStatusCode
  @ApiProperty() version: number
  @ApiProperty({ type: [ListItemDto] }) items: ListItemDto[]
  @ApiProperty({ type: 'object', additionalProperties: true }) metadata: Record<
    string,
    any
  >
}
