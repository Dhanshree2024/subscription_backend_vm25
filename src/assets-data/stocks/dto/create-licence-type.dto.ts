import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateItemLicenceTypeDto {
  @IsInt()
  licence_id: number;

  @IsOptional()
  @IsInt()
  is_active?: number = 1;

  @IsOptional()
  @IsInt()
  is_delete?: number = 0;

  @IsBoolean()
  licence_key_type: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licence_type?: string;
}
