// test/logs.e2e-spec.ts
import request from 'supertest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { LogsService } from '../src/logs/logs.service'

describe('LogsController (e2e)', () => {
  let app: INestApplication
  let logsService: LogsService

  const mockLogsService = {
    forwardToLoki: jest.fn(),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LogsService)
      .useValue(mockLogsService)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

    await app.init()
    logsService = moduleFixture.get<LogsService>(LogsService)
  })

  afterEach(() => {
    mockLogsService.forwardToLoki.mockReset()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should accept valid log and call service', async () => {
    const validPayload = {
      level: 'info',
      tag: 'ListScanner',
      message: 'User opened scanner',
      metadata: { userId: 'abc123' },
    }

    await request(app.getHttpServer())
      .post('/logs')
      .send(validPayload)
      .expect(201)

    expect(mockLogsService.forwardToLoki).toHaveBeenCalledWith(validPayload)
  })

  it('should reject invalid payload', async () => {
    const invalidPayload = {
      tag: 'MissingLevelAndMessage',
    }

    await request(app.getHttpServer())
      .post('/logs')
      .send(invalidPayload)
      .expect(400)

    expect(mockLogsService.forwardToLoki).not.toHaveBeenCalled()
  })
})
