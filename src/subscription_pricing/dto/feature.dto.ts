// dto/feature.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateFeatureDto {
  @IsString()
  feature_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  default_value?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

    @IsOptional()
  @IsBoolean()
  set_limit?: boolean;

}

export class UpdateFeatureDto {
  @IsNumber()
  feature_id: number;   // <-- important change

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  default_value?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  product_id?: number;

    @IsOptional()
  @IsBoolean()
  set_limit?: boolean;

}
