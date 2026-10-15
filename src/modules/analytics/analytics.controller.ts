import { Controller, Get, UseGuards, Request, Headers } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get("overview")
  async getOverview(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.analyticsService.getOverview(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("funnel")
  async getPipelineFunnel(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.analyticsService.getPipelineFunnel(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("trends")
  async getMonthlyTrends(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.analyticsService.getMonthlyTrends(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("top-companies")
  async getTopCompanies(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.analyticsService.getTopCompanies(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("heatmap")
  async getActivityHeatmap(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.analyticsService.getActivityHeatmap(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }
}