import { Controller, Get, UseGuards, Request, Headers } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get("stats")
  async getStats(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.dashboardService.getStats(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("activity")
  async getActivity(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.dashboardService.getRecentActivity(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("funnel")
  async getFunnel(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.dashboardService.getFunnelData(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("upcoming")
async getUpcoming(
  @Request() req,
  @Headers() headers?: Record<string, any>,
) {
  return this.dashboardService.getUpcomingTasks(
    req.user.userId,
    this.vertical(headers || {}),
  );
}
}