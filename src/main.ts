import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',    // Vite
      'http://localhost:3001',    // React dev server
      'http://localhost:3000',    // Backend itself
      'http://127.0.0.1:5173',
      'https://career-pipeline-835ee.web.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Vertical-Slug'],
    credentials: true,
  });
  
  console.log('🚀 CORS enabled for frontend origins');
  
  await app.listen(3000);
  console.log(`✅ Server running on http://localhost:3000`);
}
bootstrap();