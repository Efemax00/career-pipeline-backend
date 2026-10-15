import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String })
  initials: string;

  @Prop({ type: String })
  color: string;

  @Prop({ type: String })
  industry: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  size: string;

  @Prop({ type: Boolean, default: false })
  remote: boolean;

  @Prop({ 
    type: String, 
    enum: ['Critical', 'High', 'Medium', 'Low'], 
    default: 'Medium' 
  })
  priority: string;

  @Prop({ 
    type: String,
    enum: ['New Target', 'Researching', 'Contact Found', 'Outreach Sent', 'Conversation', 'Applied', 'Assessment', 'Interview', 'Offer', 'Hired', 'Closed Lost'],
    default: 'New Target'
  })
  status: string;

  @Prop({ type: String })
  lastContact: string;

  @Prop({ type: String })
  role: string;

  @Prop({ type: String })
  salary: string;

  @Prop({ type: String })
  nextAction: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String })
  website: string;

  @Prop({ type: String })
  contact: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, default: "career", index: true })
  verticalSlug: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  whatsapp: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  ownerName: string;

  @Prop({ type: Number })
  roomCount: number;

  @Prop({ type: String })
  priceRange: string;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: String })
  notes: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);