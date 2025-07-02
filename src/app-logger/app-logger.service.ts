// src/app-logger/app-logger.service.ts

import { Injectable, LoggerService } from '@nestjs/common'
import * as winston from 'winston'
import fetch from 'node-fetch'
import { RequestContextService } from '../app-context/request-context.service'
import { RequestContext } from '../app-context/request-context'

@Injectable()
export class AppLogger implements LoggerService {
  private readonly winstonLogger: winston.Logger

  constructor(private readonly contextService: RequestContextService) {
    this.winstonLogger = winston.createLogger({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, context }) => {
              return `${timestamp} [${level}]${context ? ' [' + context + ']' : ''}: ${message}`
            }),
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
    const lokiUrl = process.env.LOKI_URL
    const lokiToken = process.env.LOKI_API_KEY
    if (!lokiUrl || !lokiToken) return

    const ctx: RequestContext = this.contextService.getContext()
    const timestamp = `${Date.now()}000000`

    const logPayload = {
      streams: [
        {
          stream: {
            app: ctx.app || 'shopalong',
            env: process.env.NODE_ENV || 'development',
            service_name: ctx.service_name || 'shopalong',
            level,
            ...Object.entries(ctx).reduce(
              (acc, [key, value]) => {
                acc[key] =
                  typeof value === 'string' ? value : JSON.stringify(value)
                return acc
              },
              {} as Record<string, string>,
            ),
          },
          values: [
            [
              timestamp,
              typeof message === 'string' ? message : JSON.stringify(message),
            ],
          ],
        },
      ],
    }

    try {
      await fetch(lokiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lokiToken}`,
        },
        body: JSON.stringify(logPayload),
      })
    } catch (error) {
      this.winstonLogger.warn(`Failed to send log to Loki: ${error.message}`)
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

  verbose?(message: any, context?: string) {
    this.winstonLogger.verbose(message, { context })
    this.sendToLoki('verbose', message, context)
  }
}
