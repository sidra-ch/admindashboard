import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const sentryDsn = configService.get<string>('SENTRY_DSN', '');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('NODE_ENV', 'development'),
      tracesSampleRate: 0.2,
    });
  }

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const allowedOrigins = (configService.get<string>('APP_URL', '') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const isVercelPreviewOrigin = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin ?? '');
      const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin ?? '');
      if (!origin || isLocalDevOrigin || isVercelPreviewOrigin) {
        callback(null, true);
      } else if (allowedOrigins.some((o) => origin === o)) {
        callback(null, true);
      } else {
        // Do not throw from CORS callback; returning false avoids 500 on preflight.
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  Logger.log(`FleetRent API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
