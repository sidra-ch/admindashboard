// import { BullModule } from '@nestjs/bullmq'; // requires Redis
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { CarsModule } from './modules/cars/cars.module';
import { CarCategoriesModule } from './modules/car-categories/car-categories.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { StorageModule } from './modules/storage/storage.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TasksModule } from './modules/tasks/tasks.module';
// import { JobsModule } from './modules/jobs/jobs.module'; // requires Redis
import { PrismaModule } from './prisma/prisma.module';

import { AppLoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // BullModule disabled — Redis not running locally
    // BullModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     connection: {
    //       url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    //     },
    //   }),
    // }),
    AppLoggerModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    AuditModule,
    DashboardModule,
    CarsModule,
    CustomersModule,
    RentalsModule,
    PaymentsModule,
    MaintenanceModule,
    DocumentsModule,
    PdfModule,
    StorageModule,
    TrackingModule,
    NotificationsModule,
    TasksModule,
    // JobsModule, // requires Redis
    CarCategoriesModule,
  ],
})
export class AppModule {}
