import { ApiProperty } from '@nestjs/swagger'

export class FailedListDto {
  @ApiProperty() list_guid: string
  @ApiProperty({ enum: ['FAILED'] }) status: string
  @ApiProperty() message: string
}
