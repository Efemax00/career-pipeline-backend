import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, HttpStatus, HttpCode, Query, UseInterceptors, UploadedFile, NotFoundException, Header, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  async findAll(@Request() req, @Query('folder') folder?: string) {
    if (folder) {
      return this.documentsService.findByFolder(folder, req.user.userId);
    }
    return this.documentsService.findAll(req.user.userId);
  }

  @Get('folders')
  async getFolders(@Request() req) {
    return this.documentsService.getFolders(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.documentsService.create(createDocumentDto, req.user.userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.createWithFile(file, createDocumentDto, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.update(id, req.user.userId, updateDocumentDto);
  }

  @Put(':id/star')
  async toggleStarred(@Param('id') id: string, @Request() req) {
    return this.documentsService.toggleStarred(id, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    return this.documentsService.remove(id, req.user.userId);
  }

  @Get(':id/file')
@Header('Content-Type', 'application/octet-stream')
async getFile(@Param('id') id: string, @Request() req, @Res() res) {
  const document = await this.documentsService.findOne(id, req.user.userId);
  
  if (!document.filePath || !fs.existsSync(document.filePath)) {
    throw new NotFoundException('File not found');
  }
  
  // Set appropriate content type based on file type
  const contentType = document.fileType || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${document.name}"`);
  
  const stream = fs.createReadStream(document.filePath);
  stream.pipe(res);
}

@Get(':id/download')
@Header('Content-Type', 'application/octet-stream')
async downloadFile(@Param('id') id: string, @Request() req, @Res() res) {
  const document = await this.documentsService.findOne(id, req.user.userId);
  
  if (!document.filePath || !fs.existsSync(document.filePath)) {
    throw new NotFoundException('File not found');
  }
  
  res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
  
  const stream = fs.createReadStream(document.filePath);
  stream.pipe(res);
}
}