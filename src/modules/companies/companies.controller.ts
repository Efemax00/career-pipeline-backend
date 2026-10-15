import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  Request, HttpStatus, HttpCode, Query, Headers,
} from "@nestjs/common";
import { CompaniesService } from "./companies.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("companies")
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("status") status?: string,
    @Headers() headers?: Record<string, any>,
  ) {
    const slug = this.vertical(headers || {});
    if (status) {
      return this.companiesService.findByStatus(status, req.user.userId, slug);
    }
    return this.companiesService.findAll(req.user.userId, slug);
  }

  @Get("pipeline")
  async getPipeline(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.companiesService.getPipelineStages(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("pipeline/stats")
  async getPipelineStats(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.companiesService.getPipelineStats(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

    @Get("export")
  async getExport(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.companiesService.getExport(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return this.companiesService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.companiesService.create(
      createCompanyDto,
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req,
  ) {
    return this.companiesService.update(
      id,
      req.user.userId,
      updateCompanyDto,
    );
  }

  @Put(":id/move")
  async moveToStage(
    @Param("id") id: string,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.companiesService.moveToStage(id, body.status, req.user.userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Request() req) {
    return this.companiesService.remove(id, req.user.userId);
  }
}