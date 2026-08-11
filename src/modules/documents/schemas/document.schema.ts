import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

export type DocumentDocument = Document & MongooseDocument;

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  fileName: string;

  @Prop()
  fileType: string;

  @Prop()
  fileSize: number;

  @Prop()
  filePath: string;

  @Prop()
  folder: string;

  @Prop({ default: false })
  starred: boolean;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  description: string;

  @Prop()
  version: string;

  @Prop({ required: true })
  userId: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);