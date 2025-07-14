import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ListItemAlternative } from './entities/list_item_alternatives.entity'
import { Repository } from 'typeorm'

@Injectable()
export class ListItemAlternativesService {
  constructor(
    @InjectRepository(ListItemAlternative)
    private readonly altRepo: Repository<ListItemAlternative>,
  ) {}

  async saveAlternatives(itemId: string, alts: Partial<ListItemAlternative>[]) {
    const mapped = alts.map((a) =>
      this.altRepo.create({ ...a, item: { id: itemId } }),
    )
    return this.altRepo.save(mapped)
  }
}
