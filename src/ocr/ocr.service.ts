import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { File as MulterFile } from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import { ConfigService } from '@nestjs/config'
import { OCRUploadDto } from './ocr-upload.dto'
import { OCR_VIDEO_LIMITS } from '../shopalong-constants'
import { AppLogger } from '@/app-logger/app-logger.service'
import { UsersService } from '@/users/users.service'
import { ListsService } from '@/lists/lists.service'
import { ListItemsService } from '@/lists/list_items.service'
import { ListSuggestionsService } from '@/lists/list_suggestions.service'
import {
  ListStatusEventsService,
  ListStatusCode,
} from '@/lists/list_status_events.service'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '@/users/entities/users.entity'
import { Repository } from 'typeorm'
import { List } from '@/lists/entities/lists.entity'

@Injectable()
export class OcrService {
  private readonly internalOcrUrl: string

  constructor(
    private configService: ConfigService,
    private readonly logger: AppLogger,
    private readonly usersService: UsersService,
    private readonly listsService: ListsService,
    private readonly listItemsService: ListItemsService,
    private readonly listSuggestionsService: ListSuggestionsService,
    private readonly listStatusEventsService: ListStatusEventsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(List)
    private readonly listRepo: Repository<List>,
  ) {
    this.internalOcrUrl =
      this.configService.get<string>('INTERNAL_OCR_URL') ??
      'http://localhost:3001'
  }

  extractUploadData(
    body: OCRUploadDto,
    files: MulterFile[],
  ): {
    deviceUuid: string
    deviceInfo?: string
    fileMap: Record<string, MulterFile>
  } {
    const { device_uuid, device_info } = body

    const fileMap: Record<string, MulterFile> = {}
    for (const file of files) {
      fileMap[file.fieldname] = file
    }

    return {
      deviceUuid: device_uuid,
      deviceInfo: device_info,
      fileMap,
    }
  }

  async uploadFiles(
    deviceUuid: string,
    files: Record<string, MulterFile>,
    deviceInfo?: string,
  ): Promise<void> {
    const required = ['full', 'top', 'bottom']

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

    this.logger.debug(
      'OCR upload validated',
      JSON.stringify({
        device_uuid: deviceUuid,
        files: Object.keys(files),
        ...(deviceInfo ? { device_info: deviceInfo } : {}),
      }),
    )
  }

  async forwardToInternalProcessor(
    list,
    user,
    deviceUuid: string,
    files: Record<string, MulterFile>,
    deviceInfo?: string,
  ): Promise<void> {
    const form = new FormData()
    form.append('list_guid', list.origin_list_guid)
    form.append('user_id', user.id)
    form.append('device_uuid', deviceUuid)
    if (deviceInfo) form.append('device_info', deviceInfo)

    for (const key of ['full', 'top', 'bottom']) {
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
        timeout: 120000,
      })

      const data = response.data
      this.logger.debug('Vision response:', JSON.stringify(data, null, 2))

      const items = data.smartList ?? data.items ?? []
      const cleanedItems = (data.smartList ?? []).map((item) => {
        const topAlt = item.alternatives?.[0]
        const fallbackName = item.label || item.original || 'OCR-failed'

        return {
          ordinal: item.ordinal,
          name: fallbackName, // <- required column in DB
          category: topAlt?.category || 'uncategorized',
          confidence: topAlt?.confidence ?? 0,
          source: 'ocr',
          listListGuid: list.list_guid,
        }
      })

      await this.listItemsService.saveItems(list.list_guid, cleanedItems)

      const suggestions = data.suggestions ?? []
      await this.listSuggestionsService.saveSuggestions(
        list.list_guid,
        suggestions,
      )

      await this.listStatusEventsService.create({
        list_guid: list.list_guid,
        status: ListStatusCode.DONE,
        metadata: {
          item_count: items.length,
          suggestion_count: suggestions.length,
        },
      })

      this.logger.debug(
        'Forwarded OCR request and saved result',
        JSON.stringify({
          origin_list_guid: list.origin_list_guid,
          user_id: user.id,
        }),
      )
    } catch (err) {
      await this.listStatusEventsService.create({
        list_guid: list.list_guid,
        status: ListStatusCode.OCR_FAILED,
        metadata: {
          error: err.message,
          response: err.response?.data,
        },
      })

      this.logger.error(
        'OCR request failed',
        JSON.stringify({
          origin_list_guid: list.origin_list_guid,
          user_id: user.id,
          error: err.message,
          response: err.response?.data,
        }),
      )
    }
  }

  async launchAsyncOcrProcessing(
    deviceUuid: string,
    fileMap: Record<string, MulterFile>,
    deviceInfo?: string,
  ): Promise<List> {
    const user = await this.usersService.resolveOrCreateUser(deviceUuid)

    const now = new Date()
    const dateStr = now.toLocaleString('sv-SE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const list = await this.listsService.create(
      {
        device_id: deviceUuid,
        name: `OCR Scan – ${dateStr}`,
      },
      ListStatusCode.OCR_STARTED,
    )

    this.forwardToInternalProcessor(list, user, deviceUuid, fileMap, deviceInfo)
      .then(() => {
        this.logger.debug(
          'OCR async processing completed',
          JSON.stringify({ deviceUuid }),
        )
      })
      .catch((err) => {
        this.logger.error(
          'OCR async processing failed',
          JSON.stringify({
            deviceUuid,
            error: err.message,
            stack: err.stack,
          }),
        )
      })
    return list
  }
}
