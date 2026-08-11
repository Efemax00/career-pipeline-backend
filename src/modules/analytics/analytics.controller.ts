import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Request() req) {
    return this.analyticsService.getOverview(req.user.userId);
  }

  @Get('funnel')
  async getPipelineFunnel(@Request() req) {
    return this.analyticsService.getPipelineFunnel(req.user.userId);
  }

  @Get('trends')
  async getMonthlyTrends(@Request() req) {
    return this.analyticsService.getMonthlyTrends(req.user.userId);
  }

  @Get('top-companies')
  async getTopCompanies(@Request() req) {
    return this.analyticsService.getTopCompanies(req.user.userId);
  }

  @Get('heatmap')
  async getActivityHeatmap(@Request() req) {
    return this.analyticsService.getActivityHeatmap(req.user.userId);
  }
}