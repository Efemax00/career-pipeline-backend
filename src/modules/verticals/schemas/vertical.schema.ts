import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type VerticalDocument = Vertical & Document;

// ─── Sub-Schemas ─────────────────────────────────────────────────
@Schema({ _id: false })
class ExtraField {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  type: string;
}
const ExtraFieldSchema = SchemaFactory.createForClass(ExtraField);

@Schema({ _id: false })
class PipelineStage {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  color: string;
}
const PipelineStageSchema = SchemaFactory.createForClass(PipelineStage);

@Schema({ _id: false })
class DiscoveryConfig {
  @Prop({ required: true })
  source: string;

  @Prop({ type: [String], default: [] })
  searchTypes: string[];

  @Prop({ default: '' })
  defaultCountry: string;

  @Prop({ default: '' })
  defaultRegion: string;
}
const DiscoveryConfigSchema = SchemaFactory.createForClass(DiscoveryConfig);

@Schema({ _id: false })
class MessageTemplate {
  @Prop({ default: '' })
  systemPrompt: string;

  @Prop({ default: '' })
  userPromptTemplate: string;

  @Prop({ type: [String], default: [] })
  valueProps: string[];
}
const MessageTemplateSchema = SchemaFactory.createForClass(MessageTemplate);

// ─── Main Schema ─────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Vertical {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: 'Briefcase' })
  icon: string;

  @Prop({ default: false })
  isSystem: boolean;

  @Prop({ type: String, default: null })
  userId: string | null;

  @Prop({ type: DiscoveryConfigSchema, required: true })
  discovery: DiscoveryConfig;

  @Prop({ type: [ExtraFieldSchema], default: [] })
  extraFields: ExtraField[];

  @Prop({ type: [String], default: ['Manager'] })
  contactRoles: string[];

  @Prop({ type: MessageTemplateSchema, default: () => ({}) })
  messageTemplate: MessageTemplate;

  @Prop({ type: [PipelineStageSchema], default: [] })
  pipelineStages: PipelineStage[];
}

export const VerticalSchema = SchemaFactory.createForClass(Vertical);
