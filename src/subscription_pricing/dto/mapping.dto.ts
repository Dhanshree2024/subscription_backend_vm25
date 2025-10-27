import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FeatureDto {
  @IsInt()
  @IsNotEmpty()
  feature_id: number; // feature_id

  @IsString()
  @IsOptional()
  limit: string;
}

export class CreateMappingDto {
  @IsInt()
  @IsOptional()
  product_id: number; 

  @IsInt()
  @IsNotEmpty()
  plan_id: number;

  @IsString()
  @IsOptional()
  status?: string = 'Active'; // default Active

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features: FeatureDto[];

    @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  trial_features?: FeatureDto[];
}

export class UpdateMappingDto {
  @IsInt()
  @IsNotEmpty()
  mapping_id: number;

  @IsInt()
  @IsOptional()
  product_id: number; 

  @IsInt()
  @IsOptional()
  plan_id?: number;

  @IsInt()
  @IsOptional()
  feature_id?: number;

  @IsString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
