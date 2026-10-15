import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  Request, HttpStatus, HttpCode, Query, Headers,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("companyId") companyId?: string,
    @Query("contactId") contactId?: string,
    @Headers() headers?: Record<string, any>,
  ) {
    if (companyId) {
      return this.tasksService.findByCompany(companyId, req.user.userId);
    }
    if (contactId) {
      return this.tasksService.findByContact(contactId, req.user.userId);
    }
    return this.tasksService.findAll(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.tasksService.create(
      createTaskDto,
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.update(id, req.user.userId, updateTaskDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.userId);
  }
}