import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('pipeline')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PipelineController {
  
  @Get()
  @Roles('admin', 'user')
  async findAll() {
    return { message: 'Get all pipeline stages - Admin or User' };
  }

  @Get(':id')
  @Roles('admin', 'user')
  async findOne(@Param('id') id: string) {
    return { message: `Get pipeline stage ${id} - Admin or User` };
  }

  @Post()
  @Roles('admin')
  async create(@Body() createPipelineDto: any) {
    return { message: 'Create pipeline stage - Admin only' };
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updatePipelineDto: any) {
    return { message: `Update pipeline stage ${id} - Admin only` };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return { message: `Delete pipeline stage ${id} - Admin only` };
  }
}