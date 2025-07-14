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
    Object.entries(OCR_VIDEO_LIMITS).forEach(([key, { min }]) => {
      fakeVideos[key] = Buffer.alloc(min + 1000, 0) // safely above minimum
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('/ocr/process (POST) - accepts valid upload', async () => {
    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', '123e4567-e89b-12d3-a456-426614174000')
      .field('device_uuid', 'device-abc')
      .field('device_info', JSON.stringify({ model: 'iPhone' }))
      .attach('video_full', fakeVideos.video_full, 'video_full.mp4')
      .attach('video_top', fakeVideos.video_top, 'video_top.mp4')
      .attach('video_bottom', fakeVideos.video_bottom, 'video_bottom.mp4')
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
      .attach('video_full', fakeVideos.video_full, 'video_full.mp4')

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('list_guid must be a UUID')
  })
})
