import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { List } from './entities/lists.entity'

@Injectable()
export class ListRepository extends Repository<List> {
  constructor(private readonly dataSource: DataSource) {
    super(List, dataSource.createEntityManager())
  }

  // Add any custom methods for querying or updating lists here
}
