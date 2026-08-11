import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NoteDocument = Note & Document;

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true })
  title: string;

  @Prop()
  content: string;

  @Prop()
  folder: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  pinned: boolean;

  @Prop({ default: false })
  starred: boolean;

  @Prop({ default: 'plain' })
  format: string; // 'plain' | 'markdown'

  @Prop({ default: 'personal' })
  type: string; // 'personal' | 'interview' | 'research' | 'strategy'

  @Prop({ required: true })
  userId: string; // Firebase UID
}

export const NoteSchema = SchemaFactory.createForClass(Note);