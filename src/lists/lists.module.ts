import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { List } from './entities/lists.entity'
import { ListItem } from './entities/list_items.entity'
import { ListItemAlternative } from './entities/list_item_alternatives.entity'
import { ListSuggestion } from './entities/list_suggestions.entity'
import { ListStatusEvent } from './entities/list_status_events.entity'
import { UserList } from './entities/user_lists.entity'

import { ListsService } from './lists.service'
import { ListItemsService } from './list_items.service'
import { ListItemAlternativesService } from './list_item_alternatives.service'
import { ListSuggestionsService } from './list_suggestions.service'
import { ListStatusEventsService } from './list_status_events.service'
import { ListRepository } from './list.repository'
import { DataSource } from 'typeorm'
import { ListsController } from './lists.controller'
import { User } from '@/users/entities/users.entity'
import { UsersService } from '@/users/users.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      List,
      ListItem,
      ListItemAlternative,
      ListSuggestion,
      ListStatusEvent,
      UserList,
      User,
    ]),
  ],
  controllers: [ListsController],
  providers: [
    {
      provide: ListRepository,
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(List).extend(ListRepository.prototype),
      inject: [DataSource],
    },
    ListsService,
    ListItemsService,
    ListItemAlternativesService,
    ListSuggestionsService,
    ListStatusEventsService,
    UsersService,
  ],
  exports: [
    ListsService,
    ListItemsService,
    ListItemAlternativesService,
    ListSuggestionsService,
    ListStatusEventsService,
    UsersService,
    ListRepository,
    TypeOrmModule,
  ],
})
export class ListsModule {}
