import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Logger,
  HttpCode,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { MulterFile } from 'multer'
import { OCRUploadDto } from './ocr-upload.dto'
import { OCRProcessResponseDto } from './ocr-response.dto'
import { OcrService } from './ocr.service'

import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('OCR')
@Controller('ocr')
export class OcrController {
  private readonly logger = new Logger(OcrController.name)

  constructor(private readonly ocrService: OcrService) {}

  @Post('process')
  @HttpCode(202)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'OCR scan video segments and metadata',
    schema: {
      type: 'object',
      properties: {
        list_guid: { type: 'string', format: 'uuid' },
        device_uuid: { type: 'string' },
        device_info: { type: 'string', nullable: true },
        full: { type: 'string', format: 'binary' },
        top: { type: 'string', format: 'binary' },
        bottom: { type: 'string', format: 'binary' },
      },
      required: ['list_guid', 'device_uuid', 'full', 'top', 'bottom'],
    },
  })
  @ApiResponse({
    status: 202,
    description: 'OCR request received and forwarded',
    type: OCRProcessResponseDto,
  })
  async handleProcess(
    @Body() body: OCRUploadDto,
    @UploadedFiles() files: MulterFile[],
  ): Promise<OCRProcessResponseDto> {
    const { listGuid, deviceUuid, deviceInfo, fileMap } =
      this.ocrService.extractUploadData(body, files)

    await this.ocrService.uploadFiles(listGuid, deviceUuid, fileMap, deviceInfo)

    // This call will complete significantly after this method completes.
    this.ocrService.launchAsyncOcrProcessing(
      listGuid,
      deviceUuid,
      fileMap,
      deviceInfo,
    )

    return {
      status: 'accepted',
      message: 'OCR request validated and forwarded for processing',
      list_guid: listGuid,
    }
  }
}
