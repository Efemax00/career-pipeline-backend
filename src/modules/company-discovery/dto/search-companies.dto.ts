import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCompaniesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  foundedYear?: number;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @IsOptional()
  @IsString()
  fundingStage?: string;

  @IsOptional()
  @IsString()
  hiringStatus?: string;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  technologies?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string;
}
