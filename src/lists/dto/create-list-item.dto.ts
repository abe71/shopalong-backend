import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateListItemDto {
  @ApiProperty({ description: 'Ordinal position of the item in the list' })
  @IsNumber()
  ordinal: number

  @ApiProperty({ description: 'Label or name of the item' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Category of the item (e.g., dairy, produce)' })
  @IsString()
  @IsOptional()
  category?: string

  @ApiProperty({ description: 'OCR or suggestion confidence score' })
  @IsNumber()
  @IsOptional()
  confidence?: number
}
