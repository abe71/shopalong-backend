import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { AppLogger } from './app-logger/app-logger.service'

async function bootstrap() {
  let logger: AppLogger | undefined

  try {
    const app = await NestFactory.create(AppModule)
    logger = app.get(AppLogger)!
    app.useLogger(logger) // ✅ replace built-in Nest logger

    const config = app.get(ConfigService)
    const port = config.get<number>('PORT') || 3000

    console.log('Before listen')
    await app.listen(port)

    logger.log(`🚀 Application is running on: http://localhost:${port}`)
  } catch (err) {
    if (logger) {
      logger.error('❌ Bootstrap error:', err)
    } else {
      console.error('❌ Bootstrap error (no logger available):', err)
    }
    process.exit(1)
  }
}

bootstrap()
