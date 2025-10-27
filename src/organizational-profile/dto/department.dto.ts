// department.dto.ts
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
class DepartmentPayload {
  @IsString()
  @IsNotEmpty()
  value: string; // Department ID
  @IsString()
  @IsNotEmpty()
  label: string; // Department Name
}
export class CreateDepartmentsDto {
  @IsArray()
  @IsNotEmpty()
  @IsObject({ each: true })
  departmentIds: DepartmentPayload[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  newDepartmentNames?: string[];

   @IsArray()
  @IsString({ each: true })
  @IsOptional()
  existingDepartmentNames?: string[];
}