import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
  Request, HttpStatus, HttpCode,
} from '@nestjs/common';
import { CompanyDiscoveryService } from './company-discovery.service';
import { HotelHunterService } from './hotel-hunter.service';
import { SearchCompaniesDto } from './dto/search-companies.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('company-discovery')
@UseGuards(JwtAuthGuard)
export class CompanyDiscoveryController {
  constructor(
    private discoveryService: CompanyDiscoveryService,
    private hunter: HotelHunterService,
  ) {}

  @Get('search')
  async searchCompanies(@Query() searchDto: SearchCompaniesDto) {
    return this.discoveryService.searchCompanies(searchDto);
  }

  @Get('filters')
  async getFilterOptions() {
    return this.discoveryService.getFilterOptions();
  }

  // ─── NEW: Hunt leads ─────────────────────────────────────
  @Post('hunt')
  @HttpCode(HttpStatus.CREATED)
  async hunt(
    @Body() dto: { query: string; region?: string; country?: string; verticalSlug?: string; limit?: number },
    @Request() req,
  ) {
    return this.hunter.hunt(dto.query, req.user.userId, {
      verticalSlug: dto.verticalSlug,
      region: dto.region,
      country: dto.country,
      limit: dto.limit,
    });
  }

  @Get(':id')
  async getCompanyDetails(@Param('id') id: string) {
    return this.discoveryService.getCompanyDetails(id);
  }

  @Get(':id/check-pipeline')
  async checkPipeline(@Param('id') id: string, @Request() req) {
    return this.discoveryService.checkCompanyInPipeline(id, req.user.userId);
  }

  @Post(':id/add-to-pipeline')
  @HttpCode(HttpStatus.CREATED)
  async addToPipeline(@Param('id') id: string, @Request() req) {
    return this.discoveryService.addToPipeline(id, req.user.userId);
  }
}