import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { List } from '@/lists/entities/lists.entity'
import { ListItem } from '@/lists/entities/list_items.entity'
import { getDataSourceToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { User } from '@/users/entities/users.entity'

describe('ListsController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    dataSource = moduleFixture.get<DataSource>(getDataSourceToken())
  })

  afterAll(async () => {
    await dataSource.destroy()
    await app.close()
  })

  it('should create a list with items and retrieve it', async () => {
    const userId = uuidv4()

    await dataSource.getRepository(User).save({
      id: userId,
      device_id: userId,
      name: 'Test User', // or whatever fields your User entity requires
    })

    // 1. Create list
    const createRes = await request(app.getHttpServer())
      .post('/lists')
      .send({
        device_id: userId,
        name: 'Test List',
        items: [
          {
            name: 'mjölk',
            category: 'dairy',
            confidence: 0.95,
            ordinal: 0,
          },
          {
            name: 'bröd',
            category: 'bakery',
            confidence: 0.9,
            ordinal: 1,
          },
        ],
      })
      .expect(201)

    // 2. Get structured result
    const fetchRes = await request(app.getHttpServer())
      .get(`/lists/${createRes.body.origin_list_guid}`)
      .expect(200)

    expect(fetchRes.body.items).toHaveLength(2)
    expect(fetchRes.body.items[0].name).toBe('mjölk')
    expect(fetchRes.body.version).toBe(1)
  })
})
