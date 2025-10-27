// department.dto.ts
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
class DesignationPayload {
  @IsString()
  @IsNotEmpty()
  value: string; // Department ID
  @IsString()
  @IsNotEmpty()
  label: string; // Department Name
}
export class CreateDesignationDto {

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  newDesignationNames?: string[];

@IsArray()
  @IsString({ each: true })
  @IsOptional()
  existingDesignationNames?:string[];

   @IsNumber()
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  desg_description?: string;
}