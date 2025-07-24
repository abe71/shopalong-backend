import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ListsService } from './lists.service'
import { List } from './entities/lists.entity'
import { ListItem } from './entities/list_items.entity'
import { UserList } from './entities/user_lists.entity'
import { Repository } from 'typeorm'
import { User } from '@/users/entities/users.entity'
import { ListStatusEventsService } from './list_status_events.service'
import { ListStatusEvent } from './entities/list_status_events.entity'
import { UsersService } from '@/users/users.service'

describe('ListsService', () => {
  let service: ListsService
  let listRepo: Repository<List>
  let listStatusEventRepo: Repository<ListStatusEvent>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        ListStatusEventsService,
        {
          provide: getRepositoryToken(List),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ListStatusEvent),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserList),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: UsersService,
          useValue: {
            resolveOrCreateUser: jest.fn().mockResolvedValue({ id: 'user-42' }), // ← mock the method
          },
        },
      ],
    }).compile()

    service = module.get<ListsService>(ListsService)
    listRepo = module.get<Repository<List>>(getRepositoryToken(List))
    listStatusEventRepo = module.get<Repository<ListStatusEvent>>(
      getRepositoryToken(ListStatusEvent),
    )
  })

  describe('findByOrigin', () => {
    it('should return latest version if version is not specified', async () => {
      const mockList = { list_guid: 'abc-123', version: 3 } as List
      const spy = jest.spyOn(listRepo, 'findOne').mockResolvedValue(mockList)

      const result = await service.findByOrigin('abc-123')
      expect(result).toEqual(mockList)
      expect(spy).toHaveBeenCalledWith({
        where: { origin_list_guid: 'abc-123' },
        order: { version: 'DESC' },
        relations: ['items', 'user'],
      })
    })

    it('should return specified version if version is given', async () => {
      const mockList = { list_guid: 'abc-123', version: 1 } as List
      const spy = jest.spyOn(listRepo, 'findOne').mockResolvedValue(mockList)

      const result = await service.findByOrigin('abc-123', 1)
      expect(result).toEqual(mockList)
      expect(spy).toHaveBeenCalledWith({
        where: {
          origin_list_guid: 'abc-123',
          version: 1,
        },
        relations: ['items', 'user'],
      })
    })

    it('should return null if list is not found', async () => {
      jest.spyOn(listRepo, 'findOne').mockResolvedValue(null)
      const result = await service.findByOrigin('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('getStructuredResult', () => {
    it('should return structured DTO with items and metadata', async () => {
      const mockList = {
        list_guid: 'abc-123',
        created_at: new Date('2024-01-01'),
        origin_list_guid: 'abc-123',
        version: 1,
        user: { id: 'user-42' },
        items: [],
      } as unknown as List

      jest.spyOn(service, 'findByOrigin').mockResolvedValue(mockList)
      jest.spyOn(listStatusEventRepo, 'findOne').mockResolvedValue({
        list_guid: 'abc-123',
        event_type: 'done',
        created_at: new Date(),
      } as unknown as ListStatusEvent)
      const result = await service.getStructuredResult('abc-123')
      expect(result.origin_list_guid).toBe('abc-123') // We are using the fact that for version 1 the list_guid and origin_list_guid always are the same. This would not work for version 2-
      expect(result.items).toEqual([])
    })
  })
})
