import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobSearchService } from './job-search.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    private jobsService: JobsService,
    private jobSearchService: JobSearchService,
  ) {}

  @Get('search')
  async searchJobs(@Query() searchDto: SearchJobsDto) {
    const results = await this.jobSearchService.searchJobs(
      searchDto.query,
      searchDto.location,
      searchDto.page,
    );
    return {
      total: results.length,
      jobs: results,
      source: results.length > 0 ? results[0]?.source || 'multiple' : 'none',
    };
  }

  @Get('search/suggestions')
  async getSuggestions(@Query('q') query: string) {
    return this.jobSearchService.getSuggestions(query);
  }

  @Get('search/boards')
  async getJobBoards() {
    return this.jobSearchService.getJobBoards();
  }

  @Get('search/popular')
  async getPopularSearches() {
    return this.jobSearchService.getPopularSearches();
  }

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.jobsService.findByStatus(status, req.user.userId);
    }
    return this.jobsService.findAll(req.user.userId);
  }

  @Get('saved')
  async findSaved(@Request() req) {
    return this.jobsService.findSaved(req.user.userId);
  }

  @Get('applied')
  async findApplied(@Request() req) {
    return this.jobsService.findApplied(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.jobsService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.jobsService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createJobDto: CreateJobDto, @Request() req) {
    return this.jobsService.create(createJobDto, req.user.userId);
  }

  @Post('save')
  @HttpCode(HttpStatus.CREATED)
  async saveJob(@Body() jobData: any, @Request() req) {
    return this.jobsService.saveJob(jobData, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Request() req,
  ) {
    return this.jobsService.update(id, req.user.userId, updateJobDto);
  }

  @Put(':id/apply')
  async markApplied(@Param('id') id: string, @Request() req) {
    return this.jobsService.markApplied(id, req.user.userId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.jobsService.updateStatus(id, req.user.userId, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    return this.jobsService.remove(id, req.user.userId);
  }
}