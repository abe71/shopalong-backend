import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ListsService } from './lists.service'
import { List } from './entities/lists.entity'
import { ListItem } from './entities/list_items.entity'
import { UserList } from './entities/user_lists.entity'
import { Repository } from 'typeorm'

describe('ListsService', () => {
  let service: ListsService
  let listRepo: Repository<List>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        {
          provide: getRepositoryToken(List),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserList),
          useClass: Repository,
        },
      ],
    }).compile()

    service = module.get<ListsService>(ListsService)
    listRepo = module.get<Repository<List>>(getRepositoryToken(List))
  })

  describe('findByGuid', () => {
    it('should return a list if found', async () => {
      const mockList = { list_guid: 'abc-123' } as List
      jest.spyOn(listRepo, 'findOne').mockResolvedValue(mockList)

      const result = await service.findByGuid('abc-123')
      expect(result).toEqual(mockList)
    })

    it('should return null if list is not found', async () => {
      jest.spyOn(listRepo, 'findOne').mockResolvedValue(null)
      const result = await service.findByGuid('not-found')
      expect(result).toBeNull()
    })
  })

  describe('getStructuredResult', () => {
    it('should return structured DTO with items and metadata', async () => {
      const mockItems: ListItem[] = [
        {
          id: '1',
          text: 'mjölk',
          category: 'dairy',
          confidence: 0.95,
          source: 'llm',
          list: {} as List,
          ordinal: 0,
          label: '',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          alternatives: [],
        } as ListItem,
      ]

      const mockList = {
        list_guid: 'abc-123',
        created_at: new Date('2024-01-01'),
        source_video: null,
        userList: { user_id: 'user-42' },
        items: [],
      } as unknown as List

      jest.spyOn(listRepo, 'findOne').mockResolvedValue(mockList)

      const result = await service.getStructuredResult('abc-123')
      expect(result.items).toEqual([])
    })
  })
})
