// File: test/e2e/list-status-events.service.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../../src/app.module'
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm'
import { ListStatusEvent } from '@/lists/entities/list_status_events.entity'
import { Repository } from 'typeorm'
import { ConfigModule } from '@nestjs/config'
import { List } from '@/lists/entities/lists.entity'
import { AppLoggerModule } from '@/app-logger/app-logger.module'
import { ListStatusEventsService } from '@/lists/list_status_events.service'
import { ListItem } from '@/lists/entities/list_items.entity'
import { ListItemAlternative } from '@/lists/entities/list_item_alternatives.entity'
import { ListSuggestion } from '@/lists/entities/list_suggestions.entity'
import { v4 as uuidv4 } from 'uuid'
import { ListStatusEventsController } from '@/lists/list-status-events.controller'
import { UserList } from '@/lists/entities/user_lists.entity'
import { User } from '@/users/entities/users.entity'

describe('ListStatusEventsService (e2e)', () => {
  jest.setTimeout(20000)
  let app: INestApplication
  let repository: Repository<ListStatusEvent>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
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
        TypeOrmModule.forFeature([List, ListStatusEvent]),
        AppLoggerModule,
      ],
      providers: [ListStatusEventsService],
      controllers: [ListStatusEventsController],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    repository = moduleFixture.get<Repository<ListStatusEvent>>(
      getRepositoryToken(ListStatusEvent),
    )
    await repository.clear()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create a status event and persist it', async () => {
    const list_guid = uuidv4()

    const listRepo = app.get<Repository<List>>(getRepositoryToken(List))
    await listRepo.save({ list_guid, origin_list_guid: list_guid, version: 1 })

    const payload = {
      list_guid,
      user_id: 'test-user-1',
      status: 'OCR_RECEIVED',
      metadata: { note: 'Initial upload' },
    }

    const res = await request(app.getHttpServer())
      .post('/list/status')
      .send(payload)
      .expect(201)

    expect(res.body).toMatchObject({
      event_type: payload.status,
      details: payload.metadata,
      list: {
        list_guid: payload.list_guid,
      },
    })

    const all = await repository.find({ relations: ['list'] })

    expect(all.length).toBe(1)
    expect(all[0].list.list_guid).toBe(payload.list_guid)
  })
})
