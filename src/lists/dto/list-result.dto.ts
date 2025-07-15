import { ApiProperty } from '@nestjs/swagger'

export class ListItemDto {
  @ApiProperty() text: string
  @ApiProperty() category: string
  @ApiProperty() confidence: number
}

export class ListResultDto {
  @ApiProperty() list_guid: string
  @ApiProperty() status: 'DONE'
  @ApiProperty({ type: [ListItemDto] }) items: ListItemDto[]
  @ApiProperty({ type: 'object', additionalProperties: true }) metadata: Record<
    string,
    any
  >
}
