import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { CalendarEvent, CalendarEventSchema } from '../calendar/schemas/calendar-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Task.name, schema: TaskSchema },
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}