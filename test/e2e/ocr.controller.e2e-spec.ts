jest.mock('../../src/shopalong-config', () => ({
  OCR_VIDEO_LIMITS: {
    video_full: { min: 10, max: 10_000_000 },
    video_top: { min: 10, max: 10_000_000 },
    video_bottom: { min: 10, max: 10_000_000 },
  },
}))
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { MulterModule } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import request from 'supertest'
import * as path from 'path'
import nock from 'nock'
import { OcrModule } from '../../src/ocr/ocr.module'

describe('OcrController (e2e with Nock)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MulterModule.register({ dest: './tmp' }), OcrModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    nock.cleanAll()
  })

  it('/ocr/process (POST) - should accept valid upload', async () => {
    nock('http://mocked-internal-url')
      .post('/ocr/process')
      .reply(200, { message: 'OK' })

    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', '123e4567-e89b-12d3-a456-426614174000')
      .field('device_uuid', 'device-abc')
      .field('device_info', JSON.stringify({ model: 'iPhone' }))
      .attach('video_full', path.join(__dirname, 'sample.mp4'))
      .attach('video_top', path.join(__dirname, 'sample.mp4'))
      .attach('video_bottom', path.join(__dirname, 'sample.mp4'))

    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      status: 'accepted',
      message: expect.any(String),
      list_guid: expect.any(String),
    })
  })

  it('/ocr/process (POST) - should fail on invalid list_guid', async () => {
    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', 'not-a-guid')
      .field('device_uuid', 'device-abc')
      .attach('video_full', path.join(__dirname, 'sample.mp4'))
      .attach('video_top', path.join(__dirname, 'sample.mp4'))
      .attach('video_bottom', path.join(__dirname, 'sample.mp4'))

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('list_guid must be a UUID')
  })
})
