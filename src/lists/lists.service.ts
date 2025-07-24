import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { List } from './entities/lists.entity'
import { UserList } from './entities/user_lists.entity'
import { ListResultDto } from './dto/list-result.dto'
import { CreateListDto } from './dto/create-list.dto'
import { User } from '@/users/entities/users.entity'
import { ListItem } from './entities/list_items.entity'
import {
  ListStatusEventsService,
  ListStatusCode,
} from './list_status_events.service'
import { UsersService } from '@/users/users.service'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listRepo: Repository<List>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserList)
    private readonly userListRepo: Repository<UserList>,
    private readonly listStatusEventsService: ListStatusEventsService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    dto: CreateListDto,
    status: ListStatusCode | null = ListStatusCode.DONE,
  ): Promise<List> {
    const user = await this.usersService.resolveOrCreateUser(dto.device_id)

    // Determine the latest version of the origin list, if it exists
    const previousList = dto.origin_list_guid
      ? await this.findByOrigin(dto.origin_list_guid)
      : null

    // If an origin_list_guid is provided but no list with that origin exists yet,
    // we treat this as the first version of a new list family — using the provided
    // origin_list_guid as the list_guid for consistency.
    const list_guid =
      !previousList && dto.origin_list_guid ? dto.origin_list_guid : uuidv4()

    // If no origin_list_guid is provided, this is a brand new list family,
    // so we use the newly generated list_guid as both the list and origin ID.
    const origin_list_guid = dto.origin_list_guid ?? list_guid

    const version = previousList ? previousList.version + 1 : 1

    const list = this.listRepo.create({
      ...dto,
      list_guid,
      origin_list_guid,
      version,
      user,
    })

    const savedList = await this.listRepo.save(list)

    if (status) {
      await this.listStatusEventsService.create({
        list_guid: savedList.list_guid,
        status,
      })
    }

    return savedList
  }

  async findByOrigin(
    originGuid: string,
    version?: number,
  ): Promise<List | null> {
    return version != null
      ? this.listRepo.findOne({
          where: { origin_list_guid: originGuid, version },
          relations: ['items', 'user'],
        })
      : this.listRepo.findOne({
          where: { origin_list_guid: originGuid },
          order: { version: 'DESC' },
          relations: ['items', 'user'],
        })
  }

  async getStructuredResult(
    originGuid: string,
    version?: number,
  ): Promise<ListResultDto> {
    const list = await this.findByOrigin(originGuid, version)

    if (!list) {
      throw new NotFoundException(`List not found for origin ${originGuid}`)
    }

    const items = (list.items ?? []).map((item) => ({
      name: item.name,
      category: item.category,
      confidence: item.confidence,
    }))

    const latestStatus = await this.listStatusEventsService.getLatestStatus(
      list.list_guid,
    )

    return {
      origin_list_guid: list.origin_list_guid,
      status: (latestStatus as ListStatusCode) ?? ListStatusCode.DONE,
      version: list.version,
      items,
      metadata: {
        created_at: list.created_at,
      },
    }
  }

  async findOriginList(listGuid: string): Promise<List> {
    const current = await this.listRepo.findOneOrFail({
      where: { list_guid: listGuid },
    })
    const origin = await this.listRepo.findOneOrFail({
      where: { list_guid: current.origin_list_guid, version: 1 },
    })
    return origin
  }

  async findListByItem(itemId: string): Promise<List> {
    const item = await this.listRepo.manager.findOneOrFail(ListItem, {
      where: { id: itemId },
      relations: ['list'],
    })
    return item.list
  }
}
