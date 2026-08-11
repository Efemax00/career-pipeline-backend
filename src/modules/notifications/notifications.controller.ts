import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class NotificationsController {
  @Get() @Roles('admin', 'user') async findAll() { return { message: 'Get all notifications' }; }
  @Get(':id') @Roles('admin', 'user') async findOne(@Param('id') id: string) { return { message: `Get notification ${id}` }; }
  @Post() @Roles('admin') async create(@Body() dto: any) { return { message: 'Create notification - Admin only' }; }
  @Put(':id') @Roles('admin') async update(@Param('id') id: string, @Body() dto: any) { return { message: `Update notification ${id}` }; }
  @Delete(':id') @Roles('admin') async remove(@Param('id') id: string) { return { message: `Delete notification ${id}` }; }
}