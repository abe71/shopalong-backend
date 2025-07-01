import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PingModule } from './ping/ping.module'
import { Ping } from './ping/ping.entity'
import { HealthModule } from './health/health.module'
import { AppLoggerModule } from './app-logger/app-logger.module'

@Module({
  imports: [
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
        const dbHost = config.get('DB_HOST')
        console.log('Connecting to DB at:', dbHost)

        const opts: TypeOrmModuleOptions = {
          type: 'postgres',
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: config.get<number>('DB_PORT') ?? 5432,
          username: config.get<string>('DB_USERNAME') ?? 'postgres',
          password: config.get<string>('DB_PASSWORD') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'shopalong',
          entities: [Ping],
          autoLoadEntities: true,
          synchronize: true,
          retryAttempts: 5,
          retryDelay: 3000,
          logging: 'all',
        }

        console.log('TypeORM options prepared:', opts)
        return opts
      },
    }),
    PingModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
