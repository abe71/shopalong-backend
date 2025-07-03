import { IsUUID, IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class OCRUploadDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsUUID()
  list_guid: string

  @ApiProperty({ type: 'string' })
  @IsString()
  device_uuid: string

  @ApiProperty({
    type: 'string',
    required: false,
    description: 'Optional JSON string with device metadata',
  })
  @IsOptional()
  @IsString()
  device_info?: string
}
