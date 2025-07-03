jest.mock('axios')
import { OcrService } from '../../src/ocr/ocr.service'
import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RequestContextService } from 'src/app-context/request-context.service'
import { AppLogger } from 'src/app-logger/app-logger.service'
import axios from 'axios'

const mockedAxios = axios as jest.Mocked<typeof axios>

const makeFile = (
  fieldname: string,
  size = 1_000_000,
  mimetype = 'video/mp4',
) => ({
  fieldname,
  originalname: `${fieldname}.mp4`,
  size,
  mimetype,
  buffer: Buffer.from('fake'),
})

describe('OcrService', () => {
  let service: OcrService
  let configService: ConfigService
  let mockLogger: AppLogger

  beforeEach(() => {
    const mockRequestContextService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as RequestContextService

    mockLogger = new AppLogger(mockRequestContextService)
    jest.spyOn(mockLogger, 'log').mockImplementation(() => {})
    jest.spyOn(mockLogger, 'error').mockImplementation(() => {})
    jest.spyOn(mockLogger, 'warn').mockImplementation(() => {})

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'OCR_VIDEO_LIMITS') {
          return {
            video_full: { min: 100_000, max: 15_000_000 },
            video_top: { min: 50_000, max: 5_000_000 },
            video_bottom: { min: 50_000, max: 5_000_000 },
          }
        }
        if (key === 'INTERNAL_OCR_URL')
          return 'http://mocked-internal-url/ocr/process'
        return undefined
      }),
    } as any

    service = new OcrService(configService, mockLogger)
  })

  describe('uploadFiles', () => {
    it('accepts valid files', async () => {
      const files = {
        video_full: makeFile('video_full'),
        video_top: makeFile('video_top'),
        video_bottom: makeFile('video_bottom'),
      }
      await expect(
        service.uploadFiles('guid', 'uuid', files),
      ).resolves.toBeUndefined()
    })

    it('throws if file is missing', async () => {
      const files = {
        video_full: makeFile('video_full'),
        video_top: makeFile('video_top'),
      }
      await expect(service.uploadFiles('guid', 'uuid', files)).rejects.toThrow(
        /Missing file: video_bottom/,
      )
    })

    it('throws if mimetype is invalid', async () => {
      const files = {
        video_full: makeFile('video_full', 1_000_000, 'video/avi'),
        video_top: makeFile('video_top'),
        video_bottom: makeFile('video_bottom'),
      }
      await expect(service.uploadFiles('guid', 'uuid', files)).rejects.toThrow(
        /video_full must be MP4/,
      )
    })

    it('throws if file too small', async () => {
      const files = {
        video_full: makeFile('video_full', 10),
        video_top: makeFile('video_top'),
        video_bottom: makeFile('video_bottom'),
      }
      await expect(service.uploadFiles('guid', 'uuid', files)).rejects.toThrow(
        /video_full size must be between/,
      )
    })

    it('throws if file too large', async () => {
      const files = {
        video_full: makeFile('video_full', 20_000_000),
        video_top: makeFile('video_top'),
        video_bottom: makeFile('video_bottom'),
      }
      await expect(service.uploadFiles('guid', 'uuid', files)).rejects.toThrow(
        /video_full size must be between/,
      )
    })
  })

  describe('forwardToInternalProcessor', () => {
    const files = {
      video_full: makeFile('video_full'),
      video_top: makeFile('video_top'),
      video_bottom: makeFile('video_bottom'),
    }

    it('calls axios with correct data', async () => {
      mockedAxios.post.mockResolvedValue({ data: { ok: true } })

      await expect(
        service.forwardToInternalProcessor('guid', 'uuid', files, 'info'),
      ).resolves.toBeUndefined()

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ocr/process'),
        expect.any(Object),
        expect.objectContaining({ headers: expect.any(Object) }),
      )
    })

    it('handles axios error', async () => {
      mockedAxios.post.mockRejectedValue({
        message: 'ENOTFOUND',
        response: undefined,
      })

      await expect(
        service.forwardToInternalProcessor('guid', 'uuid', files, 'info'),
      ).resolves.toBeUndefined()
    })

    it('logs error on 500 response', async () => {
      mockedAxios.post.mockRejectedValue({
        message: 'Internal Server Error',
        response: { data: 'Something broke' },
      })

      await expect(
        service.forwardToInternalProcessor('guid', 'uuid', files),
      ).resolves.toBeUndefined()
    })
  })
})
