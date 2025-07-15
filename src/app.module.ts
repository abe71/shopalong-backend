import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PingModule } from './ping/ping.module'
import { Ping } from './ping/ping.entity'
import { HealthModule } from './health/health.module'
import { AppLoggerModule } from './app-logger/app-logger.module'
import { AppContextModule } from './app-context/app-context.module'
import { LogsModule } from './logs/logs.module'
import { OcrModule } from './ocr/ocr.module'
import { UsersModule } from './users/users.module'
import { ListsModule } from './lists/lists.module'
import { List } from './lists/entities/lists.entity'
import { ListStatusEvent } from './lists/entities/list_status_events.entity'
import { ListItem } from './lists/entities/list_items.entity'
import { ListItemAlternative } from './lists/entities/list_item_alternatives.entity'
import { UserList } from './lists/entities/user_lists.entity'
import { User } from './users/entities/users.entity'
import { ListSuggestion } from './lists/entities/list_suggestions.entity'

@Module({
  imports: [
    LogsModule,
    AppContextModule,
    AppLoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        config: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const dbType = config.get<string>('DB_TYPE') || 'sqlite'

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [
              UserList,
              User,
              List,
              ListStatusEvent,
              ListItem,
              ListSuggestion,
              ListItemAlternative,
            ],
            synchronize: true,
          }
        }

        const dbHost = config.get('DB_HOST')
        console.log('Connecting to DB at:', dbHost)

        return {
          type: 'postgres',
          host: dbHost ?? 'localhost',
          port: config.get<number>('DB_PORT') ?? 5432,
          username: config.get<string>('DB_USER') ?? 'postgres',
          password: config.get<string>('DB_PASSWORD') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'shopalong',
          autoLoadEntities: true,
          synchronize: true,
          retryAttempts: 5,
          retryDelay: 3000,
          logging: ['error'],
        }
      },
    }),
    PingModule,
    HealthModule,
    OcrModule,
    UsersModule,
    ListsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
