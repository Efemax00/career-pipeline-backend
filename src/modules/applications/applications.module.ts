import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';

@Module({
  imports: [],
  controllers: [ApplicationsController],
  providers: [],
  exports: [],
})
export class ApplicationsModule {}