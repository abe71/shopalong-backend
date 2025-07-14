import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ListItem } from './entities/list_items.entity'
import { Repository } from 'typeorm'

@Injectable()
export class ListItemsService {
  constructor(
    @InjectRepository(ListItem) private readonly itemRepo: Repository<ListItem>,
  ) {}

  async saveItems(
    listId: string,
    items: Partial<ListItem>[],
  ): Promise<ListItem[]> {
    const mapped = items.map((i) =>
      this.itemRepo.create({ ...i, list: { list_guid: listId } }),
    )
    return this.itemRepo.save(mapped)
  }
}
