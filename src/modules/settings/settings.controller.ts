import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('settings')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SettingsController {
  @Get() @Roles('admin', 'user') async getSettings() { return { message: 'Get settings - Admin or User' }; }
  @Post() @Roles('admin') async createSettings(@Body() dto: any) { return { message: 'Create settings - Admin only' }; }
  @Put() @Roles('admin') async updateSettings(@Body() dto: any) { return { message: 'Update settings - Admin only' }; }
}