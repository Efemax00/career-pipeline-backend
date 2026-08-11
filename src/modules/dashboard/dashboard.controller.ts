import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Request() req) {
    return this.dashboardService.getStats(req.user.userId);
  }

  @Get('activity')
  async getActivity(@Request() req) {
    return this.dashboardService.getRecentActivity(req.user.userId);
  }

  @Get('funnel')
  async getFunnel(@Request() req) {
    return this.dashboardService.getFunnelData(req.user.userId);
  }

  @Get('upcoming')
  async getUpcoming(@Request() req) {
    return this.dashboardService.getUpcomingTasks(req.user.userId);
  }
}