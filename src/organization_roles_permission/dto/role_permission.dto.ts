export class CreateRoleWithPermissionsDto {
    roleName: string;
    roledescription: string;
    permissions: any[]; // Accepts the array of JSON objects as it is
    role_type:any;
    is_compulsary: boolean;
    is_outside_organization: boolean;
  
  }
  

  