import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company, CompanySchema } from './schemas/company.schema';
import { ContactsModule } from '../contacts/contacts.module';
import { TasksModule } from '../tasks/tasks.module';
import { NotesModule } from '../notes/notes.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    ContactsModule,
    TasksModule,
    NotesModule,
    CalendarModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
