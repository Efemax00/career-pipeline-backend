import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AiModule } from './modules/ai/ai.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CompanyDiscoveryModule } from './modules/company-discovery/company-discovery.module';
import { VerticalsModule } from './modules/verticals/verticals.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    LoggerModule,
    AuthModule,
    HealthModule,
    VerticalsModule,
    UsersModule,
    CompaniesModule,
    ContactsModule,
    TasksModule,
    NotesModule,
    CalendarModule,
    DocumentsModule,
    AnalyticsModule,
    DashboardModule,
    AiModule,
    JobsModule,
    CompanyDiscoveryModule,
  ],
})
export class AppModule {}
