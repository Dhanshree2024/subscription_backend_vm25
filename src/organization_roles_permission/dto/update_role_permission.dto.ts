import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';

export class UpdateRoleWithPermissionsDto {
  @IsNumber()
  role_id: number;  // Role ID to be updated

  @IsString()
  roleName: string;  // Role name to be updated

  @IsString()
  roledescription: string;  // Role name to be updated

  @IsArray()
  permissions: { [key: string]: any }[]; // Permissions array (JSON structure)

  @IsOptional()
  is_deleted?: boolean;  // Optional: Whether role is deleted or not

  @IsOptional()
  is_compulsary?: boolean;  // Optional: Whether role is deleted or not

  @IsOptional()
  is_outside_organization?:boolean;
}


export class BulkUpdateRolesWithPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRoleWithPermissionsDto)
  roles: UpdateRoleWithPermissionsDto[];
}