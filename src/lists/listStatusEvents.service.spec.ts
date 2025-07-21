import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ListStatusEventsService } from './list_status_events.service'
import { ListStatusEvent } from './entities/list_status_events.entity'
import { List } from './entities/lists.entity'
import { Repository } from 'typeorm'

describe('ListStatusEventsService', () => {
  let service: ListStatusEventsService
  let repo: Repository<ListStatusEvent>
  let listRepo: Repository<List>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListStatusEventsService,
        {
          provide: getRepositoryToken(ListStatusEvent),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(List),
          useClass: Repository,
        },
      ],
    }).compile()

    service = module.get<ListStatusEventsService>(ListStatusEventsService)
    repo = module.get<Repository<ListStatusEvent>>(
      getRepositoryToken(ListStatusEvent),
    )
    listRepo = module.get<Repository<List>>(getRepositoryToken(List))
  })

  it('should return "UPLOADED" if no events exist', async () => {
    jest.spyOn(repo, 'findOne').mockResolvedValue(null)
    const result = await service.getLatestStatus('nonexistent-guid')
    expect(result).toBe('UPLOADED')
  })

  it('should return the mapped status for "ocr_completed"', async () => {
    const list = { list_guid: 'abc-123' } as List
    const latestEvent: Partial<ListStatusEvent> = {
      list,
      created_at: new Date('2023-01-02'),
      event_type: 'ocr_completed',
    }
    jest
      .spyOn(repo, 'findOne')
      .mockResolvedValue(latestEvent as ListStatusEvent)
    const result = await service.getLatestStatus('abc-123')
    expect(result).toBe('DONE')
  })

  it('should handle multiple calls with different GUIDs and return mapped statuses', async () => {
    const listA = { list_guid: 'list-a' } as List
    const listB = { list_guid: 'list-b' } as List

    const eventA = {
      list: listA,
      created_at: new Date(),
      event_type: 'ocr_started',
    }
    const eventB = {
      list: listB,
      created_at: new Date(),
      event_type: 'ocr_completed',
    }

    const spy = jest.spyOn(repo, 'findOne')
    spy.mockImplementation(({ where }: any) => {
      if (where.list.list_guid === 'list-a')
        return Promise.resolve(eventA as ListStatusEvent)
      if (where.list.list_guid === 'list-b')
        return Promise.resolve(eventB as ListStatusEvent)
      return Promise.resolve(null)
    })

    expect(await service.getLatestStatus('list-a')).toBe('PROCESSING')
    expect(await service.getLatestStatus('list-b')).toBe('DONE')
    expect(await service.getLatestStatus('unknown')).toBe('UPLOADED')
  })
})
