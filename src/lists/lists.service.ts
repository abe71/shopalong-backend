import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { List } from './entities/lists.entity'
import { UserList } from './entities/user_lists.entity'
import { ListResultDto } from './dto/list-result.dto'

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listRepo: Repository<List>,
    @InjectRepository(UserList)
    private readonly userListRepo: Repository<UserList>,
  ) {}

  async findByGuid(listGuid: string): Promise<List | null> {
    return this.listRepo.findOne({
      where: { list_guid: listGuid },
    })
  }

  async create(listGuid: string, userId: string): Promise<List> {
    let list = await this.listRepo.findOne({ where: { list_guid: listGuid } })

    if (!list) {
      list = await this.listRepo.save(
        this.listRepo.create({ list_guid: listGuid }),
      )
    }

    const existingLink = await this.userListRepo.findOne({
      where: { list: { list_guid: list.list_guid }, user: { id: userId } },
    })

    if (!existingLink) {
      await this.userListRepo.save(
        this.userListRepo.create({
          user: { id: userId },
          list: { list_guid: list.list_guid },
          role: 'owner',
        }),
      )
    }

    return list
  }

  async getStructuredResult(listGuid: string): Promise<ListResultDto> {
    const list = await this.listRepo.findOne({
      where: { list_guid: listGuid },
      relations: ['items', 'user'], // assumes correct relation names
    })

    if (!list) {
      throw new Error(`List with guid ${listGuid} not found`)
    }

    const items = (list.items ?? []).map((item) => ({
      text: item.label,
      category: item.category,
      confidence: item.confidence,
    }))

    return {
      list_guid: listGuid,
      status: 'DONE',
      items,
      metadata: {
        created_at: list.created_at,
      },
    }
  }
}
