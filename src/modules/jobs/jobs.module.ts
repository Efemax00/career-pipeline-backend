import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobSearchService } from './job-search.service';
import { Job, JobSchema } from './schemas/job.schema';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobSearchService],
  exports: [JobsService, JobSearchService],
})
export class JobsModule {}