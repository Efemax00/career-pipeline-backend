import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request,
  HttpStatus, HttpCode,
} from '@nestjs/common';
import { VerticalsService } from './verticals.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('verticals')
@UseGuards(JwtAuthGuard)
export class VerticalsController {
  constructor(private verticalsService: VerticalsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.verticalsService.findAll(req.user.userId);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.verticalsService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.verticalsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @Request() req) {
    return this.verticalsService.createCustom(body, req.user.userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.verticalsService.update(id, body, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    return this.verticalsService.remove(id, req.user.userId);
  }
}
