import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document as DocumentEntity, DocumentDocument } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private uploadDir = './uploads';

  constructor(
    @InjectModel(DocumentEntity.name) private documentModel: Model<DocumentDocument>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(createDocumentDto: CreateDocumentDto, userId: string): Promise<DocumentDocument> {
    const document = new this.documentModel({
      ...createDocumentDto,
      userId,
    });
    return document.save();
  }

  async createWithFile(file: any, createDocumentDto: CreateDocumentDto, userId: string): Promise<DocumentDocument> {
    const filePath = path.join(this.uploadDir, `${Date.now()}-${file.originalname}`);
    fs.writeFileSync(filePath, file.buffer);

    const document = new this.documentModel({
      ...createDocumentDto,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: filePath,
      userId,
    });
    return document.save();
  }

  async findAll(userId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findByFolder(folder: string, userId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ folder, userId }).sort({ createdAt: -1 }).exec();
  }

  async getFolders(userId: string): Promise<string[]> {
    const result = await this.documentModel.distinct('folder', { userId });
    return result.filter((f: string) => f && f.length > 0);
  }

  async findOne(id: string, userId: string): Promise<DocumentDocument> {
    const document = await this.documentModel.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async update(id: string, userId: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentDocument> {
    const document = await this.documentModel.findOneAndUpdate(
      { _id: id, userId },
      updateDocumentDto,
      { new: true, runValidators: true }
    );
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async toggleStarred(id: string, userId: string): Promise<DocumentDocument> {
    const document = await this.documentModel.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    document.starred = !document.starred;
    return document.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const document = await this.documentModel.findOne({ _id: id, userId });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    await this.documentModel.deleteOne({ _id: id, userId });
  }
}