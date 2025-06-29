import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule)
    const config = app.get(ConfigService)
    const port = config.get<number>('PORT') || 3000
    console.log('Before listen')
    await app.listen(port)
    console.log(`🚀 Application is running on: http://localhost:${port}`)
  } catch (err) {
    console.error('❌ Bootstrap error:', err)
    process.exit(1)
  }
}
bootstrap()
