import { ApiProperty } from '@nestjs/swagger'

export class OCRProcessResponseDto {
  @ApiProperty({ enum: ['accepted', 'error'] })
  status: 'accepted' | 'error'

  @ApiProperty()
  message: string

  @ApiProperty({ format: 'uuid' })
  list_guid: string
}
