// src/lists/dto/create-list.dto.ts
import {
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { CreateListItemDto } from './create-list-item.dto'

export class CreateListDto {
  @ApiProperty({
    description:
      'The device ID. Used to connect to the user. If the user is not registered a user will be created named as the device ID',
  })
  @IsUUID()
  device_id: string

  @ApiPropertyOptional({
    description:
      'UUID of the origin list (version chain root). If omitted, a new "list family" will be created',
  })
  @IsOptional()
  @IsUUID()
  origin_list_guid?: string

  @ApiPropertyOptional({ description: 'Human-readable list name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Store identifier, if known' })
  @IsOptional()
  @IsString()
  store_id?: string

  @ApiPropertyOptional({
    description: 'Items included in the list',
    type: [CreateListItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListItemDto)
  items?: CreateListItemDto[]
}
