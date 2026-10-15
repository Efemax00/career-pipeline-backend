import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true })
  name: string;

  @Prop()
  title: string;

  @Prop()
  department: string;

  @Prop()
  company: string;

  @Prop()
  companyId: string; // Reference to Company

  @Prop()
  country: string;

  @Prop()
  email: string;

  @Prop()
  linkedin: string;

  @Prop()
  phone: string;

  @Prop({ default: 'Cold' })
  relationship: string; // Cold, Warm, Active

  @Prop()
  lastContacted: string;

  @Prop()
  notes: string;

  @Prop({ required: true })
  userId: string; // Firebase UID

  @Prop({ type: String, default: "career", index: true })
  verticalSlug: string;

}

export const ContactSchema = SchemaFactory.createForClass(Contact);