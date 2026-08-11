import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  @Get()
  async check() {
    const dbState = this.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus[dbState] || 'unknown',
        readyState: dbState,
        name: this.connection.db?.databaseName || 'unknown',
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}