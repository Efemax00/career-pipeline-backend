import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  title: string;

  @Prop()
  company: string;

  @Prop()
  companyLogo: string;

  @Prop()
  location: string;

  @Prop()
  description: string;

  @Prop()
  requirements: string;

  @Prop()
  salary: string;

  @Prop()
  jobType: string; // full-time, part-time, contract, internship

  @Prop()
  experienceLevel: string; // entry, associate, senior, director

  @Prop()
  industry: string;

  @Prop()
  postedDate: string;

  @Prop()
  applicationDeadline: string;

  @Prop()
  jobUrl: string;

  @Prop()
  companyUrl: string;

  @Prop()
  source: string; // linkedin, indeed, glassdoor, etc.

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isSaved: boolean;

  @Prop({ default: false })
  isApplied: boolean;

  @Prop()
  appliedDate: string;

  @Prop()
  status: string; // saved, applied, interview, offer, rejected

  @Prop()
  notes: string;

  @Prop({ required: true })
  userId: string; // Firebase UID
}

export const JobSchema = SchemaFactory.createForClass(Job);