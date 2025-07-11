import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { File as MulterFile } from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import { ConfigService } from '@nestjs/config'
import { OCRUploadDto } from './ocr-upload.dto'
import { OCR_VIDEO_LIMITS } from '../shopalong-constants'
import { AppLogger } from 'src/app-logger/app-logger.service'

@Injectable()
export class OcrService {
  private readonly internalOcrUrl: string

  constructor(
    private configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.internalOcrUrl =
      this.configService.get<string>('INTERNAL_OCR_URL') ??
      'http://localhost:3001'
  }

  extractUploadData(
    body: OCRUploadDto,
    files: MulterFile[],
  ): {
    listGuid: string
    deviceUuid: string
    deviceInfo?: string
    fileMap: Record<string, MulterFile>
  } {
    const { list_guid, device_uuid, device_info } = body

    const fileMap: Record<string, MulterFile> = {}
    for (const file of files) {
      fileMap[file.fieldname] = file
    }

    return {
      listGuid: list_guid,
      deviceUuid: device_uuid,
      deviceInfo: device_info,
      fileMap,
    }
  }

  async uploadFiles(
    listGuid: string,
    deviceUuid: string,
    files: Record<string, MulterFile>,
    deviceInfo?: string,
  ): Promise<void> {
    const required = ['video_full', 'video_top', 'video_bottom']

    for (const key of required) {
      if (!files[key]) {
        throw new BadRequestException(`Missing file: ${key}`)
      }

      const file = files[key]
      if (file.mimetype !== 'video/mp4') {
        throw new BadRequestException(`${key} must be MP4`)
      }
      const { min, max } = OCR_VIDEO_LIMITS[key]
      if (file.size < min || file.size > max) {
        throw new BadRequestException(
          `${key} size must be between ${min} and ${max} bytes`,
        )
      }
    }

    this.logger.log(
      'OCR upload validated',
      JSON.stringify({
        list_guid: listGuid,
        device_uuid: deviceUuid,
        files: Object.keys(files),
        ...(deviceInfo ? { device_info: deviceInfo } : {}),
      }),
    )
  }

  async forwardToInternalProcessor(
    listGuid: string,
    deviceUuid: string,
    files: Record<string, MulterFile>,
    deviceInfo?: string,
  ): Promise<void> {
    const form = new FormData()

    form.append('list_guid', listGuid)
    form.append('device_uuid', deviceUuid)
    if (deviceInfo) form.append('device_info', deviceInfo)

    for (const key of ['video_full', 'video_top', 'video_bottom']) {
      const file = files[key]
      if (!file) continue

      form.append(key, file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      })
    }

    try {
      const response = await axios.post(this.internalOcrUrl, form, {
        headers: form.getHeaders(),
        timeout: 5000,
      })

      this.logger.log(
        'Forwarded OCR request to internal service',
        JSON.stringify({
          list_guid: listGuid,
          device_uuid: deviceUuid,
          response: response.data,
        }),
      )
    } catch (err) {
      this.logger.error(
        'Failed to forward OCR to internal service',
        JSON.stringify({
          list_guid: listGuid,
          device_uuid: deviceUuid,
          error: err.message,
          response: err.response?.data,
        }),
      )
    }
  }
}
