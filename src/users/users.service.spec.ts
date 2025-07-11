import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from './users.entity'
import { Repository } from 'typeorm'
import { BadRequestException } from '@nestjs/common'

describe('UsersService', () => {
  let service: UsersService
  let repo: Repository<User>

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repo = module.get<Repository<User>>(getRepositoryToken(User))
    jest.clearAllMocks()
  })

  it('should resolve existing user by device_id', async () => {
    const existingUser = { id: 'abc', device_id: 'dev123', name: 'user_dev123' }
    mockUserRepo.findOne.mockResolvedValue(existingUser)

    const result = await service.resolveOrCreateUser('dev123')
    expect(result).toEqual(existingUser)
    expect(mockUserRepo.findOne).toHaveBeenCalledWith({
      where: { device_id: 'dev123' },
    })
    expect(mockUserRepo.save).not.toHaveBeenCalled()
  })

  it('should create and return new user if not found', async () => {
    mockUserRepo.findOne.mockResolvedValue(undefined)

    const created = { id: 'new-id', device_id: 'dev456', name: 'user_dev456' }
    mockUserRepo.create.mockReturnValue(created)
    mockUserRepo.save.mockResolvedValue(created)

    const result = await service.resolveOrCreateUser('dev456')
    expect(result).toEqual(created)
    expect(mockUserRepo.create).toHaveBeenCalledWith({
      device_id: 'dev456',
      name: 'user_dev456',
    })
    expect(mockUserRepo.save).toHaveBeenCalledWith(created)
  })

  it('should throw if device_id is missing', async () => {
    await expect(service.resolveOrCreateUser('')).rejects.toThrow(
      BadRequestException,
    )
  })

  it('should return all users', async () => {
    const userList = [
      { id: '1', device_id: 'a', name: 'user_a' },
      { id: '2', device_id: 'b', name: 'user_b' },
    ]
    mockUserRepo.find.mockResolvedValue(userList)

    const result = await service.findAll()
    expect(result).toEqual(userList)
    expect(mockUserRepo.find).toHaveBeenCalled()
  })
})
