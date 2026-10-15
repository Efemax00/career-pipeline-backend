import {
  IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsObject,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  industry?: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  size?: string;

  @IsOptional() @IsBoolean()
  remote?: boolean;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  role?: string;

  @IsOptional() @IsString()
  salary?: string;

  @IsOptional() @IsString()
  nextAction?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsString()
  website?: string;

  @IsOptional() @IsString()
  contact?: string;

  // ─── Hotel-specific fields ──────────────────────────────
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsNumber() roomCount?: number;
  @IsOptional() @IsString() priceRange?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
  @IsOptional() @IsString() notes?: string;

  // ─── Auto-linked sub-records ────────────────────────────
  @IsOptional() @IsObject() contactInfo?: Record<string, any>;
  @IsOptional() @IsObject() task?: Record<string, any>;
  @IsOptional() @IsObject() event?: Record<string, any>;
  @IsOptional() @IsObject() note?: Record<string, any>;
}