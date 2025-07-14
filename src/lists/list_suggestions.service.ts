import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ListSuggestion } from './entities/list_suggestions.entity'
import { Repository } from 'typeorm'

@Injectable()
export class ListSuggestionsService {
  constructor(
    @InjectRepository(ListSuggestion)
    private readonly suggestionRepo: Repository<ListSuggestion>,
  ) {}

  async saveSuggestions(
    listId: string,
    suggestions: Partial<ListSuggestion>[],
  ) {
    const mapped = suggestions.map((s) =>
      this.suggestionRepo.create({ ...s, list: { list_guid: listId } }),
    )
    return this.suggestionRepo.save(mapped)
  }
}
