import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import * as path from 'path'
import { OcrModule } from '../../src/ocr/ocr.module'
import { UsersModule } from '../../src/users/users.module'
import { ListsModule } from '../../src/lists/lists.module'
import { ListStatusEvent } from '../../src/lists/entities/list_status_events.entity'
import { List } from '../../src/lists/entities/lists.entity'
import { ListItem } from '../../src/lists/entities/list_items.entity'
import { ListSuggestion } from '../../src/lists/entities/list_suggestions.entity'
import { AppLoggerModule } from '../../src/app-logger/app-logger.module'
import { User } from '../../src/users/entities/users.entity'
import { ConfigModule } from '@nestjs/config'
import { ListItemAlternative } from '@/lists/entities/list_item_alternatives.entity'
import { Repository } from 'typeorm'
import { UserList } from '@/lists/entities/user_lists.entity'

jest.mock('axios', () => ({
  post: jest.fn(() =>
    Promise.resolve({
      data: {
        items: [
          {
            id: 'item-001',
            label: 'Milk',
            category: 'Dairy',
            ordinal: 0,
            confidence: 0.95,
          },
          {
            id: 'item-002',
            label: 'Bread',
            category: 'Bakery',
            ordinal: 1,
            confidence: 0.9,
          },
        ],
      },
    }),
  ),
}))

jest.mock('../../src/shopalong-constants', () => ({
  OCR_VIDEO_LIMITS: {
    full: { min: 1, max: 15_000_000 },
    top: { min: 1, max: 5_000_000 },
    bottom: { min: 1, max: 5_000_000 },
  },
}))

async function waitForEvent(
  listRepo: Repository<List>,
  eventRepo: Repository<ListStatusEvent>,
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

describe('OcrController (e2e) with full processing', () => {
  let app: INestApplication
  let listRepo
  let eventRepo
  let userRepo: Repository<User>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [
            UserList,
            User,
            List,
            ListStatusEvent,
            ListItem,
            ListSuggestion,
            ListItemAlternative,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          User,
          List,
          ListStatusEvent,
          ListItem,
          ListSuggestion,
        ]),
        OcrModule,
        UsersModule,
        ListsModule,
        AppLoggerModule,
        ListItemAlternative,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
    userRepo = moduleFixture.get(getRepositoryToken(User))
    listRepo = moduleFixture.get(getRepositoryToken(List))
    eventRepo = moduleFixture.get(getRepositoryToken(ListStatusEvent))
  })

  afterAll(async () => {
    await app.close()
  })

  it('/ocr/process (POST) - full flow works and logs status', async () => {
    const list_guid = '123e4567-e89b-12d3-a456-426614174000'

    const response = await request(app.getHttpServer())
      .post('/ocr/process')
      .field('device_uuid', 'device-abc')
      .field('device_info', JSON.stringify({ model: 'iPhone' }))
      .attach('full', path.join(__dirname, 'sample.mp4'))
      .attach('top', path.join(__dirname, 'sample.mp4'))
      .attach('bottom', path.join(__dirname, 'sample.mp4'))

    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      status: 'accepted',
      message: expect.any(String),
    })

    await waitForEvent(listRepo, eventRepo, response.body.origin_list_guid, [
      'ocr_started',
      'done',
    ])

    const list = await listRepo.findOne({
      where: { origin_list_guid: response.body.origin_list_guid },
    })
    expect(list).toBeDefined()
    expect(list.list_guid).toBe(response.body.origin_list_guid) // We expect the IDs to be same since we are on version 1

    const events = await eventRepo.find({
      where: { list: { id: list.id } },
      relations: ['list'],
    })
    const eventTypes = events.map((e) => e.event_type)
    expect(eventTypes).toEqual(expect.arrayContaining(['ocr_started', 'done']))
  }, 2000)
})
