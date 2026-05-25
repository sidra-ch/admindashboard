import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception, {
        tags: {
          layer: 'http-exception-filter',
        },
        contexts: {
          request: {
            method: request.method,
            url: request.url,
          },
        },
        extra: {
          statusCode: status,
        },
      });
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      error: payload,
    });
  }
}
