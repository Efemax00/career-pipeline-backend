import { Module } from '@nestjs/common';
import { PipelineController } from './pipeline.controller';

@Module({
  imports: [],
  controllers: [PipelineController],
  providers: [],
  exports: [],
})
export class PipelineModule {}