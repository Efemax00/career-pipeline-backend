import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  companyId: string; // Reference to Company

  @Prop()
  companyName: string;

  @Prop()
  contactId: string; // Reference to Contact

  @Prop()
  contactName: string;

  @Prop({ default: 'To Do' })
  status: string; // To Do, In Progress, Done

  @Prop({ default: 'Medium' })
  priority: string; // Low, Medium, High, Critical

  @Prop()
  dueDate: string;

  @Prop()
  reminder: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  completedAt: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  userId: string; // Firebase UID
}

export const TaskSchema = SchemaFactory.createForClass(Task);