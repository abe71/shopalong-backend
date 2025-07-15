import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { List } from '@/lists/entities/lists.entity'
import { ListItem } from '@/lists/entities/list_items.entity'
import { ListStatusEvent } from '@/lists/entities/list_status_events.entity'
import { ListItemAlternative } from '@/lists/entities/list_item_alternatives.entity'
import { ListSuggestion } from '@/lists/entities/list_suggestions.entity'
import { UserList } from '@/lists/entities/user_lists.entity'
import { OCR_VIDEO_LIMITS } from '@/shopalong-constants'

const TEST_ENTITIES = [
  List,
  ListItem,
  ListStatusEvent,
  ListItemAlternative,
  ListSuggestion,
  UserList,
]

describe('OcrController (e2e)', () => {
  let app: INestApplication
  const fakeVideos: Record<string, Buffer> = {}

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    // Prepare mock video buffers for each required input
    fakeVideos.full = Buffer.alloc(OCR_VIDEO_LIMITS.full.min + 1000)
    fakeVideos.top = Buffer.alloc(OCR_VIDEO_LIMITS.top.min + 1000)
    fakeVideos.bottom = Buffer.alloc(OCR_VIDEO_LIMITS.bottom.min + 1000)
  })

  afterAll(async () => {
    await app.close()
  })

  it('/ocr/process (POST) - accepts valid upload', async () => {
    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', '123e4567-e89b-12d3-a456-426614174000')
      .field('device_uuid', 'device-abc')
      .field('device_info', 'iPhone')
      .attach('full', fakeVideos.full, 'video_full.mp4')
      .attach('top', fakeVideos.top, 'video_top.mp4')
      .attach('bottom', fakeVideos.bottom, 'video_bottom.mp4')
    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      status: 'accepted',
      list_guid: '123e4567-e89b-12d3-a456-426614174000',
      message: expect.any(String),
    })
  })

  it('/ocr/process (POST) - fails on invalid list_guid', async () => {
    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', 'not-a-guid')
      .field('device_uuid', 'device-abc')
      .attach('full', fakeVideos.video_full, 'video_full.mp4')

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('list_guid must be a UUID')
  })
})
