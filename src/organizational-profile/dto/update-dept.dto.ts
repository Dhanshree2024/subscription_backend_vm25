import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class EditDepartmentDto {
  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  dept_description?: string;

  @IsOptional()
  @IsString()
  departmentHeadId?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
}
