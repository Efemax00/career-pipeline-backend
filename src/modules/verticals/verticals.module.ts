import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerticalsController } from './verticals.controller';
import { VerticalsService } from './verticals.service';
import { Vertical, VerticalSchema } from './schemas/vertical.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vertical.name, schema: VerticalSchema },
    ]),
  ],
  controllers: [VerticalsController],
  providers: [VerticalsService],
  exports: [VerticalsService, MongooseModule],
})
export class VerticalsModule {}
