import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  Request, HttpStatus, HttpCode, Query, Headers,
} from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CreateCalendarEventDto } from "./dto/create-calendar-event.dto";
import { UpdateCalendarEventDto } from "./dto/update-calendar-event.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("calendar")
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("month") month?: string,
    @Query("year") year?: string,
    @Query("companyId") companyId?: string,
    @Headers() headers?: Record<string, any>,
  ) {
    const slug = this.vertical(headers || {});
    if (companyId) {
      return this.calendarService.findByCompany(companyId, req.user.userId);
    }
    if (month && year) {
      return this.calendarService.findByMonth(
        month,
        year,
        req.user.userId,
        slug,
      );
    }
    return this.calendarService.findAll(req.user.userId, slug);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return this.calendarService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateCalendarEventDto,
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.calendarService.create(
      createDto,
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateCalendarEventDto,
    @Request() req,
  ) {
    return this.calendarService.update(id, req.user.userId, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Request() req) {
    return this.calendarService.remove(id, req.user.userId);
  }
}