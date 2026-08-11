import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('applications')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ApplicationsController {
  
  @Get()
  @Roles('admin', 'user')
  async findAll() {
    return { message: 'Get all applications - Admin or User' };
  }

  @Get(':id')
  @Roles('admin', 'user')
  async findOne(@Param('id') id: string) {
    return { message: `Get application ${id} - Admin or User` };
  }

  @Post()
  @Roles('admin', 'user')
  async create(@Body() createApplicationDto: any) {
    return { message: 'Create application - Admin or User' };
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateApplicationDto: any) {
    return { message: `Update application ${id} - Admin only` };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return { message: `Delete application ${id} - Admin only` };
  }
}