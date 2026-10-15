import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyIntelligenceDocument = CompanyIntelligence & Document;

@Schema({ timestamps: true })
export class CompanyIntelligence {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  logo: string;

  @Prop()
  description: string;

  @Prop()
  website: string;

  @Prop()
  linkedin: string;

  @Prop({
    type: {
      country: { type: String, required: true },
      city: String,
      region: String,
    },
  })
  location: {
    country: string;
    city?: string;
    region?: string;
  };

  @Prop()
  industry: string;

  @Prop()
  companySize: string;

  @Prop()
  foundedYear: number;

  @Prop()
  businessModel: string;

  @Prop()
  stage: string;

  @Prop({
    type: {
      total: Number,
      stage: String,
      lastRound: String,
      lastAmount: Number,
      lastDate: Date,
      investors: [String],
      history: [
        {
          round: String,
          amount: Number,
          date: Date,
          investors: [String],
        },
      ],
    },
  })
  funding: {
    total?: number;
    stage?: string;
    lastRound?: string;
    lastAmount?: number;
    lastDate?: Date;
    investors?: string[];
    history?: Array<{
      round: string;
      amount: number;
      date: Date;
      investors: string[];
    }>;
  };

  @Prop({ default: false })
  remote: boolean;

  // Simplified hiring - use nested object
  @Prop({
    type: {
      status: { type: String, default: 'Unknown' },
      positions: { type: [Object], default: [] },
    },
    _id: false,
  })
  hiring: {
    status: string;
    positions?: Array<{
      title: string;
      location: string;
      type: string;
      postedDate: Date;
      url: string;
      source: string;
    }>;
  };

  @Prop({ type: [String], default: [] })
  technology: string[];

  @Prop({ type: [String], default: [] })
  competitors: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  source: string;

  @Prop()
  sourceId: string;

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export const CompanyIntelligenceSchema = SchemaFactory.createForClass(CompanyIntelligence);
