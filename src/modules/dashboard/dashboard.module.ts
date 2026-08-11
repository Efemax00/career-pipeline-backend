import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Note, NoteSchema } from '../notes/schemas/note.schema';
import { CalendarEvent, CalendarEventSchema } from '../calendar/schemas/calendar-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Note.name, schema: NoteSchema },
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}