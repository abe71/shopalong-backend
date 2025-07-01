// src/app-logger/app-logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common'
import * as winston from 'winston'
import fetch from 'node-fetch' // node-fetch@2

@Injectable()
export class AppLogger implements LoggerService {
  private winstonLogger: winston.Logger
  private lokiUrl: string | undefined
  private lokiToken: string | undefined

  constructor() {
    this.lokiUrl = process.env.LOKI_URL
    this.lokiToken = process.env.LOKI_API_KEY

    if (!this.lokiUrl || !this.lokiToken) {
      console.error('LOKI_URL or LOKI_API_KEY not set')
    }

    this.winstonLogger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(
              ({ level, message, timestamp, context }) =>
                `${timestamp} [${level}]${context ? ' [' + context + ']' : ''}: ${message}`,
            ),
          ),
        }),
      ],
    })
  }

  private async sendToLoki(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ) {
    if (!this.lokiUrl || !this.lokiToken) return

    const logLine =
      typeof message === 'string' ? message : JSON.stringify(message)
    const timestamp = `${Date.now()}000000` // nanoseconds required by Loki
    const body = {
      streams: [
        {
          stream: {
            app: 'shopalong',
            env: process.env.NODE_ENV || 'development',
            level,
            context: context || '',
          },
          values: [[timestamp, logLine]],
        },
      ],
    }

    try {
      await fetch(this.lokiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.lokiToken}`,
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error('Failed to send log to Loki:', err)
    }
  }

  log(message: any, context?: string) {
    this.winstonLogger.info(message, { context })
    this.sendToLoki('info', message, context)
  }

  error(message: any, trace?: string, context?: string) {
    this.winstonLogger.error(message, { context, trace })
    this.sendToLoki('error', message, context, trace)
  }

  warn(message: any, context?: string) {
    this.winstonLogger.warn(message, { context })
    this.sendToLoki('warn', message, context)
  }

  debug(message: any, context?: string) {
    this.winstonLogger.debug(message, { context })
    this.sendToLoki('debug', message, context)
  }

  verbose(message: any, context?: string) {
    this.winstonLogger.verbose(message, { context })
    this.sendToLoki('verbose', message, context)
  }
}
