import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  uid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  picture: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;

  // Active vertical selection
  @Prop({ type: Types.ObjectId, ref: 'Vertical', default: null })
  activeVerticalId: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
