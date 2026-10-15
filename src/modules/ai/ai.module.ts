import { Module, Global } from '@nestjs/common';
import { GroqProvider } from './providers/groq.provider';

@Global()
@Module({
  providers: [GroqProvider],
  exports: [GroqProvider],
})
export class AiModule {}
