import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'backend-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-sentry')
  testSentry() {
    throw new Error('Backend Sentry Test Error');
  }
}
