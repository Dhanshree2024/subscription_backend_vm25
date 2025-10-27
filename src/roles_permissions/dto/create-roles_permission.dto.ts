
import { IsEnum } from "class-validator";
import { RoleType } from "../entities/roles_permission.entity"; 

export class CreateRolesPermissionDto {
    role_name: string;
  
    permissions: any[]; // Accepts the array of JSON objects as it is

    is_compulsary: boolean;

    role_description: string;
    
    is_outside_organization: boolean;

     @IsEnum(RoleType)
    item_type: RoleType;
}
