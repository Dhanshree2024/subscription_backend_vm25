import { PartialType } from '@nestjs/mapped-types';
import { CreateRolesPermissionDto } from './create-roles_permission.dto';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateRolesPermissionDto extends PartialType(CreateRolesPermissionDto) {
    @IsNumber()
    role_id: number;  // Role ID to be updated
  
    @IsString()
    role_name: string;  // Role name to be updated
  
    @IsArray()
    permissions: { [key: string]: any }[]; // Permissions array (JSON structure)
  
    @IsOptional()
    is_deleted?: boolean;  // Optional: Whether role is deleted or not
  
    @IsOptional()
    is_compulsary?: boolean;  // Optional: Whether role is deleted or not
  
    @IsOptional()
    is_outside_organization?:boolean;
}
