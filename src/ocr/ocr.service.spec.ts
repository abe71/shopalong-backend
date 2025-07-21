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
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

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
  let listRepo: Repository<List>
  let eventRepo: Repository<ListStatusEvent>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    listRepo = moduleFixture.get<Repository<List>>(getRepositoryToken(List))
    eventRepo = moduleFixture.get<Repository<ListStatusEvent>>(
      getRepositoryToken(ListStatusEvent),
    )

    fakeVideos.full = Buffer.alloc(OCR_VIDEO_LIMITS.full.min + 1000)
    fakeVideos.top = Buffer.alloc(OCR_VIDEO_LIMITS.top.min + 1000)
    fakeVideos.bottom = Buffer.alloc(OCR_VIDEO_LIMITS.bottom.min + 1000)
  })

  afterAll(async () => {
    await app.close()
  })

  async function waitForEvent(
    listGuid: string,
    expectedStatuses: string[],
    maxWaitMs = 1000,
  ): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      const list = await listRepo.findOne({ where: { list_guid: listGuid } })

      if (list) {
        const events = await eventRepo.find({
          where: { list: { list_guid: list.list_guid } },
          relations: ['list'],
        })
        const eventTypes = events.map((e) => e.event_type)
        if (expectedStatuses.every((s) => eventTypes.includes(s))) return
      }

      await new Promise((r) => setTimeout(r, 100))
    }

    const allEvents = await eventRepo.find({ relations: ['list'] })
    console.error(
      `[ERROR] Timeout waiting for statuses [${expectedStatuses.join(', ')}] for list ${listGuid}`,
    )
    console.error(`[ERROR] ALL ListStatusEvents:`)
    for (const e of allEvents) {
      console.error(
        `- ${e.event_type} (list_guid=${e.list?.list_guid}, id=${e.id}, created_at=${e.created_at.toISOString()})`,
      )
    }

    throw new Error(
      `Timeout: Expected events [${expectedStatuses.join(', ')}] not found for list ${listGuid}`,
    )
  }

  it('/ocr/process (POST) - accepts valid upload', async () => {
    const listGuid = '123e4567-e89b-12d3-a456-426614174000'
    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', listGuid)
      .field('device_uuid', 'device-abc')
      .field('device_info', 'iPhone')
      .attach('full', fakeVideos.full, 'video_full.mp4')
      .attach('top', fakeVideos.top, 'video_top.mp4')
      .attach('bottom', fakeVideos.bottom, 'video_bottom.mp4')

    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      status: 'accepted',
      list_guid: listGuid,
      message: expect.any(String),
    })

    await waitForEvent(listGuid, ['ocr_started'])
  })

  it('/ocr/process (POST) - fails on invalid list_guid', async () => {
    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('list_guid', 'not-a-guid')
      .field('device_uuid', 'device-abc')
      .attach('full', fakeVideos.full, 'video_full.mp4')

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('list_guid must be a UUID')
  })
})
