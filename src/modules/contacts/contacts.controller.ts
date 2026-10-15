import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  Request, HttpStatus, HttpCode, Query, Headers,
} from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("contacts")
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  private vertical(headers: Record<string, any>): string {
    return (headers["x-vertical-slug"] as string) || "career";
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("companyId") companyId?: string,
    @Headers() headers?: Record<string, any>,
  ) {
    if (companyId) {
      return this.contactsService.findByCompany(companyId, req.user.userId);
    }
    return this.contactsService.findAll(
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return this.contactsService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createContactDto: CreateContactDto,
    @Request() req,
    @Headers() headers?: Record<string, any>,
  ) {
    return this.contactsService.create(
      createContactDto,
      req.user.userId,
      this.vertical(headers || {}),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Request() req,
  ) {
    return this.contactsService.update(id, req.user.userId, updateContactDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Request() req) {
    return this.contactsService.remove(id, req.user.userId);
  }
}