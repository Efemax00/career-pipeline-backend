import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CalendarEventDocument = CalendarEvent & Document;

@Schema({ timestamps: true })
export class CalendarEvent {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  date: string;

  @Prop()
  time: string;

  @Prop({ default: 'interview' })
  type: string; // 'interview' | 'deadline' | 'followup' | 'task' | 'meeting'

  @Prop()
  companyId: string;

  @Prop()
  companyName: string;

  @Prop()
  contactId: string;

  @Prop()
  contactName: string;

  @Prop()
  location: string;

  @Prop()
  meetingLink: string;

  @Prop({ default: false })
  isAllDay: boolean;

  @Prop({ default: '#2563eb' })
  color: string;

  @Prop({ required: true })
  userId: string; // Firebase UID

  @Prop({ type: String, default: "career", index: true })
  verticalSlug: string;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);