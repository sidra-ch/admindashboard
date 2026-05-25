import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger = pino({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          }
        : undefined,
  });

  log(message: unknown, ...optionalParams: unknown[]) {
    this.logger.info({ optionalParams }, String(message));
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error({ optionalParams }, String(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.logger.warn({ optionalParams }, String(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.logger.debug({ optionalParams }, String(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.logger.trace({ optionalParams }, String(message));
  }
}
