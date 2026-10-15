import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  Request, HttpStatus, HttpCode, Query, Headers,
} from "@nestjs/common";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("folder") folder?: string,
    @Query("tag") tag?: string,
    @Headers() headers?: Record<string, any>,
  ) {
    const slug = this.vertical(headers || {});
    if (folder) {
      return this.notesService.findByFolder(folder, req.user.userId, slug);
    }
    if (tag) {
      return this.notesService.findByTag(tag, req.user.userId, slug);
    }
    return this.notesService.findAll(req.user.userId, slug);
  }

  @Get("folders")
  async getFolders(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.notesService.getFolders(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get("tags")
  async getTags(
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.notesService.getTags(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return this.notesService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.notesService.create(
      createNoteDto,
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req,
  ) {
    return this.notesService.update(id, req.user.userId, updateNoteDto);
  }

  @Put(":id/pin")
  async togglePinned(@Param("id") id: string, @Request() req) {
    return this.notesService.togglePinned(id, req.user.userId);
  }

  @Put(":id/star")
  async toggleStarred(@Param("id") id: string, @Request() req) {
    return this.notesService.toggleStarred(id, req.user.userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Request() req) {
    return this.notesService.remove(id, req.user.userId);
  }
}