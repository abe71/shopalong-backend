import { ApiProperty } from '@nestjs/swagger'

export class PendingListDto {
  @ApiProperty() list_guid: string
  @ApiProperty({ enum: ['PROCESSING', 'UPLOADED'] }) status: string
  @ApiProperty() message: string
}
