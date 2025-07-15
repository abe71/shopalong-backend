import { DataSource } from 'typeorm'
import { config } from 'dotenv'

config() // Load .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  entities: [__dirname + '/**/*.entity.{ts,js}'],
})
